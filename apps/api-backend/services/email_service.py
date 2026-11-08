from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from fastapi import BackgroundTasks
from dotenv import load_dotenv
import os
import re
import asyncio
import logging
from typing import Optional, Tuple

# Importar excepciones específicas de aiosmtplib si están disponibles
try:
    from aiosmtplib.errors import (
        SMTPAuthenticationError,
        SMTPConnectError,
        SMTPRecipientsRefused,
        SMTPException
    )
except ImportError:
    SMTPAuthenticationError = Exception
    SMTPConnectError = Exception
    SMTPRecipientsRefused = Exception
    SMTPException = Exception

load_dotenv()

logger = logging.getLogger("email_service")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)

def _clean_env(val: Optional[str]) -> str:
    """Limpia cadenas de variables de entorno de comentarios y comillas residuales"""
    if not val:
        return ""
    cleaned = val.split("#")[0].strip()
    return cleaned.strip("\"'")

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")

class EmailService:
    """
    Servicio OOP de Notificaciones por Correo.
    Implementa configuración defensiva SMTP, timeout no bloqueante,
    manejo granular de excepciones y enmascaramiento de credenciales.
    """
    def __init__(self):
        self._raw_user = _clean_env(os.getenv("MAIL_USERNAME")) or _clean_env(os.getenv("MAIL_USER"))
        raw_pass = _clean_env(os.getenv("MAIL_PASSWORD"))
        # Limpiar espacios intermedios en contraseñas de aplicación de Google si aplica
        self._raw_password = raw_pass.replace(" ", "") if raw_pass else ""
        self._mail_from = _clean_env(os.getenv("MAIL_FROM")) or self._raw_user or "noreply@easypay.com"
        
        try:
            self._port = int(_clean_env(os.getenv("MAIL_PORT")) or "587")
        except ValueError:
            self._port = 587

        self._server = _clean_env(os.getenv("MAIL_SERVER")) or "smtp.gmail.com"

        # Deducir protocolo SSL/TLS o STARTTLS según el puerto estándar
        if self._port == 465:
            self._use_ssl = True
            self._use_starttls = False
        else:
            self._use_ssl = False
            self._use_starttls = True

        self._has_credentials = bool(self._raw_user and self._raw_password)

        if self._has_credentials:
            self.config = ConnectionConfig(
                MAIL_USERNAME=self._raw_user,
                MAIL_PASSWORD=self._raw_password,
                MAIL_FROM=self._mail_from,
                MAIL_PORT=self._port,
                MAIL_SERVER=self._server,
                MAIL_STARTTLS=self._use_starttls,
                MAIL_SSL_TLS=self._use_ssl,
                USE_CREDENTIALS=True,
                VALIDATE_CERTS=True,
                TIMEOUT=10
            )
        else:
            self.config = None

    def _get_masked_user(self) -> str:
        """Enmascara el nombre de usuario/correo para registro seguro en logs"""
        if not self._raw_user or "@" not in self._raw_user:
            return "[NO_CONFIGURADO]"
        parts = self._raw_user.split("@")
        name = parts[0]
        domain = parts[1]
        masked_name = name[:2] + "***" if len(name) > 2 else "***"
        return f"{masked_name}@{domain}"

    async def _dispatch_email(self, message: MessageSchema, email_to: str) -> Tuple[bool, Optional[str]]:
        """Ejecuta el envío directo de correo con timeout estricto y captura granular"""
        if not self._has_credentials or not self.config:
            err_msg = f"Credenciales SMTP no configuradas. Servidor: {self._server}:{self._port}"
            logger.warning(
                f"[SMTP Fallback] {err_msg}. Destinatario: {email_to}"
            )
            return False, err_msg

        fm = FastMail(self.config)
        try:
            logger.info(f"📤 [SMTP Conectando] Intentando despacho de correo a {email_to} vía {self._server}:{self._port}...")
            # Limitar la espera a 10 segundos para no congelar la petición HTTP
            await asyncio.wait_for(fm.send_message(message), timeout=10.0)
            logger.info(f"✅ [SMTP Éxito] Correo enviado exitosamente a {email_to} via {self._server}:{self._port}")
            return True, None
        except asyncio.TimeoutError:
            err_msg = f"Tiempo de espera agotado (10s) al conectar con {self._server}:{self._port}"
            logger.error(
                f"❌ [SMTP Timeout] {err_msg} para enviar correo a {email_to}."
            )
            return False, err_msg
        except SMTPAuthenticationError as e:
            err_msg = f"Fallo de autenticación con usuario {self._get_masked_user()} en {self._server}:{self._port}"
            logger.error(
                f"❌ [SMTP Auth Error] {err_msg}. Verifique que la contraseña de aplicación sea válida. Detalle: {e}"
            )
            return False, err_msg
        except SMTPConnectError as e:
            err_msg = f"No se pudo conectar al servidor SMTP {self._server}:{self._port}"
            logger.error(
                f"❌ [SMTP Connect Error] {err_msg}. Verifique conexión de red o bloqueo de puertos. Detalle: {e}"
            )
            return False, err_msg
        except SMTPRecipientsRefused as e:
            err_msg = f"Destinatario rechazado por el servidor ({email_to})"
            logger.error(f"❌ [SMTP Recipient Error] {err_msg}: {e}")
            return False, err_msg
        except SMTPException as e:
            err_msg = f"Error en protocolo SMTP hacia {email_to}: {e}"
            logger.error(f"❌ [SMTP Error] {err_msg}")
            return False, err_msg
        except (ConnectionError, OSError) as e:
            err_msg = f"Error de red o socket hacia {self._server}:{self._port}: {e}"
            logger.error(f"❌ [SMTP Network Error] {err_msg}")
            return False, err_msg
        except Exception as e:
            err_msg = f"Excepción no controlada enviando correo a {email_to}: {e}"
            logger.error(f"❌ [SMTP Unexpected Error] {err_msg}")
            return False, err_msg

    async def send_otp(
        self,
        email_to: str,
        code: str,
        is_recovery: bool = False,
        background_tasks: Optional[BackgroundTasks] = None
    ) -> bool:
        """
        Envía un código OTP de autenticación o recuperación.
        Soporta envío síncrono no bloqueante o despacho mediante BackgroundTasks.
        """
        email_clean = email_to.strip().lower() if email_to else ""
        if not email_clean or not EMAIL_REGEX.match(email_clean):
            logger.warning(f"[SMTP Warning] Intento de envio con direccion de correo no valida: '{email_to}'")
            return False

        subject = "Recuperacion de Contrasena - Easy-Pay" if is_recovery else "Codigo de Seguridad - Easy-Pay"
        title = "Recuperacion de Contrasena" if is_recovery else "Verificacion de Identidad"
        desc = "Tu codigo para restablecer tu contrasena es:" if is_recovery else "Tu codigo de seguridad es:"

        html_body = f"""
            <div style="font-family: Arial, sans-serif; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; max-width: 480px; margin: 0 auto; background-color: #ffffff;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #4f46e5; margin: 0; font-size: 24px; font-weight: 800;">EASY-PAY</h1>
                    <p style="color: #6b7280; font-size: 12px; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px;">Gestion Inteligente de Gastos Compartidos</p>
                </div>
                <h2 style="color: #111827; font-size: 18px; font-weight: 700; margin-bottom: 8px;">{title}</h2>
                <p style="color: #4b5563; font-size: 14px; line-height: 1.5;">{desc}</p>
                <div style="background: #f3f4f6; padding: 16px; text-align: center; font-size: 28px; font-weight: 800; letter-spacing: 6px; color: #1f2937; border-radius: 10px; margin: 20px 0; border: 1px dashed #cbd5e1;">
                    {code}
                </div>
                <p style="color: #6b7280; font-size: 12px; margin-top: 16px;">Este codigo es confidencial y expirara en 10 minutos. Si no realizaste esta solicitud, por favor ignora este mensaje.</p>
                <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 20px 0;" />
                <p style="color: #9ca3af; font-size: 10px; text-align: center; margin: 0;">Easy-Pay Security System &bull; Todos los derechos reservados</p>
            </div>
        """

        message = MessageSchema(
            subject=subject,
            recipients=[email_clean],
            body=html_body,
            subtype=MessageType.html
        )

        if background_tasks:
            background_tasks.add_task(self._dispatch_email, message, email_clean)
            logger.info(f"[SMTP Background] Envio de OTP para {email_clean} encolado en BackgroundTasks.")
            return True

        success, _ = await self._dispatch_email(message, email_clean)
        return success

    async def send_group_invitation(
        self,
        email_to: str,
        group_name: str,
        invited_by_name: str,
        group_code: str,
        invite_url: Optional[str] = None,
        background_tasks: Optional[BackgroundTasks] = None
    ) -> Tuple[bool, Optional[str]]:
        """
        Envía un correo invitando al usuario a unirse a un grupo en Easy-Pay.
        Incluye enlace directo de aceptación y código de grupo alternativo.
        Devuelve tupla (éxito: bool, error_detalle: Optional[str]).
        """
        email_clean = email_to.strip().lower() if email_to else ""
        if not email_clean or not EMAIL_REGEX.match(email_clean):
            err_msg = f"Dirección de correo inválida o malformada: '{email_to}'"
            logger.warning(f"[SMTP Warning] {err_msg}")
            return False, err_msg

        subject = f"Te han invitado a unirte a '{group_name}' en Easy-Pay"
        frontend_base = _clean_env(os.getenv("FRONTEND_URL", "http://localhost:5173")).rstrip("/")
        frontend_url = invite_url or f"{frontend_base}/join?code={group_code}"

        html_body = f"""
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 16px; max-width: 520px; margin: 0 auto; background-color: #ffffff; color: #1e293b;">
                <div style="text-align: center; margin-bottom: 24px;">
                    <span style="display: inline-block; padding: 6px 12px; background: #eef2ff; color: #4f46e5; border-radius: 9999px; font-size: 11px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;">
                        Easy-Pay &bull; Gastos Compartidos
                    </span>
                </div>
                
                <h1 style="color: #0f172a; font-size: 22px; font-weight: 800; text-align: center; margin: 0 0 12px; line-height: 1.3;">
                    ¡Hola! Te invitaron a un grupo
                </h1>
                
                <p style="color: #475569; font-size: 15px; line-height: 1.6; text-align: center; margin: 0 0 24px;">
                    <strong style="color: #0f172a;">{invited_by_name}</strong> te ha invitado a formar parte del grupo de gastos <strong style="color: #4f46e5;">{group_name}</strong>.
                </p>

                <div style="text-align: center; margin: 28px 0;">
                    <a href="{frontend_url}" style="display: inline-block; background: #4f46e5; color: #ffffff; font-weight: 600; font-size: 15px; padding: 12px 28px; border-radius: 10px; text-decoration: none; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);">
                        Aceptar Invitación y Unirse
                    </a>
                </div>

                <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 16px; margin: 24px 0; text-align: center;">
                    <p style="color: #64748b; font-size: 12px; margin: 0 0 6px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em;">
                        O únete manualmente con este código:
                    </p>
                    <span style="font-family: monospace; font-size: 24px; font-weight: 800; letter-spacing: 4px; color: #0f172a;">
                        {group_code}
                    </span>
                </div>

                <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; text-align: center; margin: 24px 0 0;">
                    Si no reconoces a quien te invitó o crees que esto es un error, puedes ignorar este correo con tranquilidad.
                </p>
                <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
                <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">Easy-Pay Platform &bull; División de Pagos Seguros</p>
            </div>
        """

        message = MessageSchema(
            subject=subject,
            recipients=[email_clean],
            body=html_body,
            subtype=MessageType.html
        )

        if background_tasks:
            background_tasks.add_task(self._dispatch_email, message, email_clean)
            logger.info(f"[SMTP Background] Invitación para {email_clean} al grupo '{group_name}' encolada.")
            return True, None

        return await self._dispatch_email(message, email_clean)


