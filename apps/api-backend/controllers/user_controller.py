import random
import re
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, List

from core.base_controller import BaseController
from models.user_model import UserModel
from models.role_model import RoleModel
from schemas.user_schema import User, UserCreate, PasswordChange
from services.auth_service import AuthService
from services.email_service import EmailService
from services.audit_service import AuditService

def sanitize_string(text: str) -> str:
    """Sanitiza strings para evitar inyecciones XSS y HTML malicioso"""
    if not text:
        return ""
    # Eliminar etiquetas script y HTML potencialmente peligrosas
    clean = re.sub(r'<[^>]*>', '', text)
    return clean.strip()

class UserController(BaseController):
    """
    Controlador OOP para la gestión de usuarios, autenticación y seguridad computacional.
    Hereda de BaseController y orquesta los modelos y servicios,
    garantizando mitigación de fuerza bruta, tokens de corta duración y trazabilidad completa.
    """
    def __init__(self):
        super().__init__()
        self._user_model = UserModel()
        self._role_model = RoleModel()
        self._auth_service = AuthService()
        self._email_service = EmailService()
        self._audit_service = AuditService()

    async def register(self, data: UserCreate, ip_address: str = "127.0.0.1", user_agent: str = "Unknown") -> Dict[str, Any]:
        """Registra un nuevo usuario con rol predeterminado 'Usuario Regular' y validación estricta"""
        nombre = sanitize_string(data.nombre)
        email = data.email.strip().lower()

        if len(data.password) < 8:
            return self.error("La contraseña debe tener al menos 8 caracteres.", code="WEAK_PASSWORD")

        existing = await self._user_model.find_by_identifier(email)
        if existing:
            if not existing.get("is_verified", False):
                # Permitir re-registro si no fue verificado
                await self._user_model.delete_user_by_email(existing["email"])
            else:
                return self.error("Este correo electrónico ya está registrado. Intenta iniciar sesión.", code="USER_EXISTS")

        password_hash = self._auth_service.hash_password(data.password)

        admin_emails = ["mariomoguel05@gmail.com"] + [e.strip().lower() for e in os.getenv("ADMIN_EMAILS", "").split(",") if e.strip()]
        initial_roles = ["Administrador"] if email in admin_emails else ["Usuario Regular"]

        new_user = User(
            nombre=nombre,
            email=email,
            password_hash=password_hash,
            roles=initial_roles
        )

        user_dict = new_user.model_dump()
        user_dict["failed_login_attempts"] = 0
        user_dict["locked_until"] = None

        user_id = await self._user_model.save_user(user_dict)

        # Registrar en auditoría (Inmutable)
        await self._audit_service.log_access(
            action="USER_REGISTER",
            user_id=user_id,
            user_email=email,
            resource="users",
            details={"nombre": nombre, "initial_role": "Usuario Regular"},
            ip_address=ip_address,
            user_agent=user_agent
        )

        # Enviar código de verificación de forma automática
        try:
            await self.setup_2fa(user_id=user_id, email=email)
        except Exception as e:
            self.logger.warning(f"⚠️ Error al auto-enviar código OTP de registro: {e}")

        return self.success(
            "Usuario registrado exitosamente. Se ha enviado un código de verificación.",
            user_id=user_id,
            email=email
        )

    async def login(self, identifier: str, password: str, ip_address: str = "127.0.0.1", user_agent: str = "Unknown") -> Dict[str, Any]:
        """
        Inicia sesión con verificación robusta de contraseñas bcrypt,
        protección contra fuerza bruta (bloqueo tras 5 intentos fallidos)
        y generación de Access Token corto + Refresh Token.
        """
        identifier = identifier.strip()
        user = await self._user_model.find_by_identifier(identifier)

        if not user:
            # Prevención de enumeración de usuarios en logs y respuesta
            await self._audit_service.log_access(
                action="LOGIN_FAILED",
                user_email=identifier,
                resource="auth",
                details={"reason": "Usuario no encontrado"},
                ip_address=ip_address,
                user_agent=user_agent
            )
            return self.error("Credenciales incorrectas.", code="INVALID_CREDENTIALS")

        user_id_str = str(user["_id"])
        user_email = user.get("email")

        # 1. Comprobar si la cuenta está bloqueada por ataques de fuerza bruta
        locked_until = user.get("locked_until")
        if locked_until:
            if locked_until.tzinfo is None:
                locked_until = locked_until.replace(tzinfo=timezone.utc)
            now_utc = datetime.now(timezone.utc)
            if now_utc < locked_until:
                remaining_seconds = int((locked_until - now_utc).total_seconds())
                remaining_minutes = max(1, (remaining_seconds + 59) // 60)
                await self._audit_service.log_access(
                    action="LOGIN_BLOCKED",
                    user_id=user_id_str,
                    user_email=user_email,
                    resource="auth",
                    details={"reason": "Cuenta bloqueada temporalmente por fuerza bruta", "remaining_min": remaining_minutes},
                    ip_address=ip_address,
                    user_agent=user_agent
                )
                return self.error(
                    f"Cuenta bloqueada temporalmente por múltiples intentos fallidos. Intente de nuevo en {remaining_minutes} minuto(s).",
                    code="ACCOUNT_LOCKED"
                )
            else:
                # El tiempo de bloqueo ya expiró, restablecer
                await self._user_model.reset_failed_attempts(user_id_str)

        # 2. Verificar hash de contraseña seguro
        password_hash = user.get("password_hash")
        if not password_hash or not self._auth_service.verify_password(password, password_hash):
            attempts = await self._user_model.increment_failed_attempts(user_id_str)
            if attempts >= 5:
                locked_until_dt = await self._user_model.lock_account(user_id_str, lockout_minutes=15)
                await self._audit_service.log_access(
                    action="ACCOUNT_LOCKED",
                    user_id=user_id_str,
                    user_email=user_email,
                    resource="auth",
                    details={"reason": "5 intentos fallidos consecutivos", "locked_until": str(locked_until_dt)},
                    ip_address=ip_address,
                    user_agent=user_agent
                )
                return self.error(
                    "Demasiados intentos fallidos. Su cuenta ha sido bloqueada temporalmente por 15 minutos por seguridad.",
                    code="ACCOUNT_LOCKED"
                )

            await self._audit_service.log_access(
                action="LOGIN_FAILED",
                user_id=user_id_str,
                user_email=user_email,
                resource="auth",
                details={"reason": "Contraseña incorrecta", "failed_attempts": attempts},
                ip_address=ip_address,
                user_agent=user_agent
            )
            return self.error(f"Credenciales incorrectas. Intentos restantes: {5 - attempts}", code="INVALID_CREDENTIALS")

        # 3. Restablecer contador de fallos tras login exitoso
        await self._user_model.reset_failed_attempts(user_id_str)

        # 4. Validar estado de verificación
        if not user.get("is_verified", False):
            try:
                await self.setup_2fa(user_id_str, user_email)
            except Exception:
                pass
            return {
                "status": "not_verified",
                "message": "Debes verificar tu correo antes de iniciar sesión.",
                "user_id": user_id_str,
                "email": user_email
            }

        # 5. Comprobar 2FA
        two_factor = user.get("two_factor", {})
        if two_factor.get("enabled", False):
            return {
                "status": "2fa_required",
                "message": "Autenticación de dos pasos requerida",
                "user_id": user_id_str
            }

        # 6. Calcular roles y permisos dinámicos
        roles = user.get("roles", ["Usuario Regular"])
        admin_emails = ["mariomoguel05@gmail.com"] + [e.strip().lower() for e in os.getenv("ADMIN_EMAILS", "").split(",") if e.strip()]
        if user_email and user_email.lower() in admin_emails and "Administrador" not in roles:
            roles = ["Administrador"]
            try:
                await self._user_model.update_user(user_id_str, {"roles": ["Administrador"], "role": "Administrador"})
            except Exception:
                pass

        permissions = list(await self._role_model.get_permissions_for_roles(roles))

        # 7. Generar Tokens (Access Token de 15 min + Refresh Token de 7 días)
        access_token = self._auth_service.create_access_token(
            user_id=user_id_str,
            email=user_email,
            nombre=user.get("nombre", ""),
            roles=roles,
            permissions=permissions
        )
        refresh_token = self._auth_service.create_refresh_token(
            user_id=user_id_str,
            email=user_email
        )

        # 8. Registrar acceso exitoso en la auditoría del sistema
        await self._audit_service.log_access(
            action="LOGIN_SUCCESS",
            user_id=user_id_str,
            user_email=user_email,
            resource="auth",
            details={"roles": roles},
            ip_address=ip_address,
            user_agent=user_agent
        )

        return self.success(
            "Login exitoso",
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=self._auth_service.access_expire_minutes * 60,
            user={
                "id": user_id_str,
                "nombre": user.get("nombre"),
                "email": user_email,
                "roles": roles,
                "permissions": permissions,
                "2fa_enabled": two_factor.get("enabled", False) or user.get("is_verified", False)
            }
        )

    async def refresh_session(self, refresh_token_str: str, ip_address: str = "127.0.0.1", user_agent: str = "Unknown") -> Dict[str, Any]:
        """Renueva el Access Token utilizando un Refresh Token válido"""
        if not refresh_token_str:
            return self.error("Refresh token no proporcionado.", code="MISSING_TOKEN")

        claims = self._auth_service.decode_refresh_token(refresh_token_str)
        if not claims:
            return self.error("Refresh token inválido o expirado. Por favor inicie sesión nuevamente.", code="INVALID_REFRESH_TOKEN")

        user_id = claims.get("sub")
        user = await self._user_model.get_user_by_id(user_id)
        if not user:
            return self.error("Usuario no encontrado o dado de baja.", code="USER_NOT_FOUND")

        # Verificar si la cuenta fue bloqueada mientras la sesión estaba activa
        locked_until = user.get("locked_until")
        if locked_until:
            if locked_until.tzinfo is None:
                locked_until = locked_until.replace(tzinfo=timezone.utc)
            if datetime.now(timezone.utc) < locked_until:
                return self.error("Cuenta bloqueada temporalmente.", code="ACCOUNT_LOCKED")

        roles = user.get("roles", ["Usuario Regular"])
        permissions = list(await self._role_model.get_permissions_for_roles(roles))

        new_access_token = self._auth_service.create_access_token(
            user_id=str(user["_id"]),
            email=user.get("email", ""),
            nombre=user.get("nombre", ""),
            roles=roles,
            permissions=permissions
        )
        new_refresh_token = self._auth_service.create_refresh_token(
            user_id=str(user["_id"]),
            email=user.get("email", "")
        )

        await self._audit_service.log_access(
            action="TOKEN_REFRESH",
            user_id=str(user["_id"]),
            user_email=user.get("email"),
            resource="auth",
            details={"roles": roles},
            ip_address=ip_address,
            user_agent=user_agent
        )

        return self.success(
            "Token renovado exitosamente",
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            token_type="bearer",
            expires_in=self._auth_service.access_expire_minutes * 60,
            user={
                "id": str(user["_id"]),
                "nombre": user.get("nombre"),
                "email": user.get("email"),
                "roles": roles,
                "permissions": permissions
            }
        )

    async def setup_2fa(self, user_id: str, email: str, is_recovery: bool = False) -> Dict[str, Any]:
        """Genera un código OTP seguro y lo envía al correo"""
        code = str(random.randint(100000, 999999))
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

        await self._user_model.save_otp_code(user_id, code, expires_at)
        await self._email_service.send_otp(email, code, is_recovery=is_recovery)

        return self.success("Código de verificación enviado", user_id=user_id)

    async def verify_2fa(self, user_id: str, code: str, ip_address: str = "127.0.0.1", user_agent: str = "Unknown") -> Dict[str, Any]:
        """Verifica el código OTP y activa la cuenta / genera sesión"""
        otp_data = await self._user_model.get_otp_data(user_id)
        if not otp_data or not otp_data.get("otp_code"):
            return self.error("No hay un código pendiente de verificación", code="NO_PENDING_OTP")

        saved_code = str(otp_data.get("otp_code"))
        expires_at = otp_data.get("otp_expires")

        if expires_at and expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        if expires_at and datetime.now(timezone.utc) > expires_at:
            return self.error("El código de verificación ha expirado", code="OTP_EXPIRED")

        if saved_code != str(code).strip():
            return self.error("Código de verificación incorrecto", code="INVALID_OTP")

        # Activar usuario y limpiar código OTP
        await self._user_model.enable_2fa(user_id)
        user = await self._user_model.get_user_by_id(user_id)

        roles = user.get("roles", ["Usuario Regular"]) if user else ["Usuario Regular"]
        permissions = list(await self._role_model.get_permissions_for_roles(roles))

        user_id_str = str(user["_id"])
        user_email = user.get("email", "")

        access_token = self._auth_service.create_access_token(
            user_id=user_id_str,
            email=user_email,
            nombre=user.get("nombre", ""),
            roles=roles,
            permissions=permissions
        )
        refresh_token = self._auth_service.create_refresh_token(
            user_id=user_id_str,
            email=user_email
        )

        await self._audit_service.log_access(
            action="OTP_VERIFIED",
            user_id=user_id_str,
            user_email=user_email,
            resource="auth",
            details={"roles": roles},
            ip_address=ip_address,
            user_agent=user_agent
        )

        return self.success(
            "Verificación exitosa",
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=self._auth_service.access_expire_minutes * 60,
            user={
                "id": user_id_str,
                "nombre": user.get("nombre") if user else "",
                "email": user_email,
                "roles": roles,
                "permissions": permissions
            }
        )

    async def request_password_reset(self, email: str, ip_address: str = "127.0.0.1") -> Dict[str, Any]:
        """Solicitud de restablecimiento de contraseña con prevención de enumeración"""
        email_clean = email.strip().lower()
        user = await self._user_model.find_by_identifier(email_clean)
        if not user:
            # Prevenir enumeración de correos
            return self.success("Si el correo está registrado, recibirás un código de recuperación.")

        user_id = str(user["_id"])
        await self.setup_2fa(user_id, email_clean, is_recovery=True)

        await self._audit_service.log_access(
            action="PASSWORD_RESET_REQUESTED",
            user_id=user_id,
            user_email=email_clean,
            resource="auth",
            ip_address=ip_address
        )

        return self.success("Si el correo está registrado, recibirás un código de recuperación.", user_id=user_id)

    async def change_password(self, user_id: str, data: PasswordChange, ip_address: str = "127.0.0.1") -> Dict[str, Any]:
        """Cambio de contraseña con hashing bcrypt y validación de longitud"""
        if data.new_password != data.confirm_password:
            return self.error("Las nuevas contraseñas no coinciden", code="PASSWORD_MISMATCH")

        if len(data.new_password) < 8:
            return self.error("La contraseña debe tener al menos 8 caracteres.", code="WEAK_PASSWORD")

        new_hash = self._auth_service.hash_password(data.new_password)
        success = await self._user_model.update_user(user_id, {"password_hash": new_hash})

        if success:
            await self._audit_service.log_access(
                action="PASSWORD_CHANGED",
                user_id=user_id,
                resource="auth",
                ip_address=ip_address
            )
            return self.success("Contraseña actualizada con éxito")
        return self.error("No se pudo actualizar la contraseña", code="UPDATE_FAILED")

    async def get_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Obtiene los datos del perfil de usuario"""
        user = await self._user_model.get_user_by_id(user_id)
        if not user:
            return None
        roles = user.get("roles", ["Usuario Regular"])
        return {
            "id": str(user["_id"]),
            "nombre": user.get("nombre"),
            "email": user.get("email"),
            "phone": user.get("phone"),
            "birth_date": user.get("birth_date"),
            "address": user.get("address"),
            "bank_accounts": user.get("bank_accounts", []),
            "roles": roles,
            "is_verified": user.get("is_verified", False),
            "2fa_enabled": user.get("two_factor", {}).get("enabled", False) or user.get("is_verified", False),
            "financial_profile": user.get("financial_profile") or {}
        }

    async def update_profile(self, user_id: str, update_dict: Dict[str, Any]) -> Dict[str, Any]:
        """Actualiza la información de perfil con sanitización"""
        update_dict.pop("verification_code", None)
        update_dict.pop("roles", None)  # El usuario no puede auto-cambiarse los roles
        update_dict.pop("password_hash", None)

        if "nombre" in update_dict and update_dict["nombre"]:
            update_dict["nombre"] = sanitize_string(update_dict["nombre"])

        if "bank_accounts" in update_dict and len(update_dict["bank_accounts"]) > 3:
            return self.error("Solo se permiten hasta 3 cuentas bancarias.", code="LIMIT_EXCEEDED")

        success = await self._user_model.update_user(user_id, update_dict)
        if success:
            return self.success("Perfil actualizado correctamente")
        return self.error("Error al actualizar el perfil", code="UPDATE_FAILED")
