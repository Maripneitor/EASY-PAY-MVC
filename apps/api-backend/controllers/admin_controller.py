import os
from core.base_controller import BaseController
from models.user_model import UserModel
from models.role_model import RoleModel
from models.audit_model import AuditModel
from schemas.role_schema import RoleCreate, RoleUpdate
from services.audit_service import AuditService
from typing import Dict, Any, List, Optional

PRIMARY_SUPERADMIN_EMAIL = (os.getenv("SUPERADMIN_EMAIL") or "mariomoguel05@gmail.com").strip().lower()
SUPERADMIN_EMAILS = {PRIMARY_SUPERADMIN_EMAIL} | {
    e.strip().lower() for e in os.getenv("SUPERADMIN_EMAILS", "").split(",") if e.strip()
} | {
    e.strip().lower() for e in os.getenv("ADMIN_EMAILS", "").split(",") if e.strip()
}

class AdminController(BaseController):
    """
    Controlador OOP de Administración.
    Maneja el panel administrativo: usuarios, asignación de roles,
    creación y edición dinámica de roles y permisos, y consulta de auditoría.
    """
    def __init__(self):
        super().__init__()
        self._user_model = UserModel()
        self._role_model = RoleModel()
        self._audit_model = AuditModel()
        self._audit_service = AuditService()

    async def list_users(self, limit: int = 100, skip: int = 0) -> List[Dict[str, Any]]:
        """Obtiene el listado de todos los usuarios registrados"""
        return await self._user_model.get_all_users(limit=limit, skip=skip)

    async def assign_user_roles(
        self,
        target_user_id: str,
        new_roles: List[str],
        admin_email: str,
        admin_id: str,
        ip_address: str = "127.0.0.1"
    ) -> Dict[str, Any]:
        """Asigna o revoca roles a un usuario específico con reglas estrictas de seguridad"""
        target_user = await self._user_model.get_user_by_id(target_user_id)
        if not target_user:
            return self.error("Usuario objetivo no encontrado", code="USER_NOT_FOUND")

        target_email = (target_user.get("email") or "").strip().lower()

        # Blindaje inmutable obligatorio para el superadministrador principal
        if target_email == PRIMARY_SUPERADMIN_EMAIL or target_email in SUPERADMIN_EMAILS:
            if "Administrador" not in new_roles:
                new_roles.append("Administrador")

        old_roles = target_user.get("roles", ["Usuario Regular"])
        old_roles_lower = [r.strip().lower() for r in old_roles]
        new_roles_lower = [r.strip().lower() for r in new_roles]

        was_admin = "administrador" in old_roles_lower or "admin" in old_roles_lower
        will_be_admin = "administrador" in new_roles_lower or "admin" in new_roles_lower

        # 1. Regla de Seguridad: Protección contra Auto-degradación (Self-Demotion)
        # Un administrador activo no puede revocarse a sí mismo el rol de Administrador.
        if str(target_user_id) == str(admin_id) and was_admin and not will_be_admin:
            await self._audit_service.log_access(
                action="SELF_DEMOTION_BLOCKED",
                user_id=admin_id,
                user_email=admin_email,
                resource="roles",
                details={
                    "reason": "Intento bloqueado de auto-degradación del rol de Administrador.",
                    "target_user_id": target_user_id,
                    "target_email": target_email,
                    "attempted_roles": new_roles
                },
                ip_address=ip_address
            )
            return self.error(
                "Operación denegada: No puedes revocar tu propio rol de Administrador para prevenir pérdida irreversible de acceso.",
                code="SELF_DEMOTION_BLOCKED"
            )

        # 2. Regla de Seguridad: Protección del Superadministrador Principal
        # La cuenta de Superadministrador no puede ser despojada del rol de Administrador por nadie.
        is_superadmin = target_email == PRIMARY_SUPERADMIN_EMAIL or target_email in SUPERADMIN_EMAILS
        if is_superadmin and not will_be_admin:
            await self._audit_service.log_access(
                action="SUPERADMIN_DEMOTION_BLOCKED",
                user_id=admin_id,
                user_email=admin_email,
                resource="roles",
                details={
                    "reason": "Intento bloqueado de revocar el rol de Administrador al Superadministrador protegido.",
                    "target_user_id": target_user_id,
                    "target_email": target_email,
                    "attempted_roles": new_roles
                },
                ip_address=ip_address
            )
            return self.error(
                "Operación denegada: La cuenta del Superadministrador principal está protegida por política de seguridad y no puede perder el rol de Administrador.",
                code="SUPERADMIN_PROTECTED"
            )

        success = await self._user_model.update_roles(target_user_id, new_roles)

        if not success:
            return self.error("No se pudieron actualizar los roles", code="UPDATE_FAILED")

        # Registrar en auditoría
        await self._audit_service.log_access(
            action="ROLE_ASSIGNED",
            user_id=admin_id,
            user_email=admin_email,
            resource="roles",
            details={
                "target_user_id": target_user_id,
                "target_email": target_user.get("email"),
                "previous_roles": old_roles,
                "assigned_roles": new_roles
            },
            ip_address=ip_address
        )

        return self.success(
            f"Roles asignados correctamente a {target_user.get('email')}",
            roles=new_roles
        )

    async def list_roles(self) -> List[Dict[str, Any]]:
        """Devuelve todos los roles y sus permisos"""
        return await self._role_model.get_all_roles()

    async def create_new_role(
        self,
        data: RoleCreate,
        admin_email: str,
        admin_id: str,
        ip_address: str = "127.0.0.1"
    ) -> Dict[str, Any]:
        """Crea un nuevo rol dinámico con su lista de permisos"""
        existing = await self._role_model.find_by_name(data.name)
        if existing:
            return self.error(f"El rol '{data.name}' ya existe", code="ROLE_EXISTS")

        role_id = await self._role_model.create_role(data.dict())

        # Registrar en auditoría
        await self._audit_service.log_access(
            action="ROLE_CREATED",
            user_id=admin_id,
            user_email=admin_email,
            resource="roles",
            details={"role_name": data.name, "permissions": data.permissions},
            ip_address=ip_address
        )

        return self.success(f"Rol '{data.name}' creado exitosamente", role_id=role_id)

    async def update_role(
        self,
        role_id: str,
        data: RoleUpdate,
        admin_email: str,
        admin_id: str,
        ip_address: str = "127.0.0.1"
    ) -> Dict[str, Any]:
        """Actualiza permisos o descripción de un rol existente"""
        role = await self._role_model.find_by_id(role_id)
        if not role:
            return self.error("Rol no encontrado", code="NOT_FOUND")

        clean_data = data.dict(exclude_unset=True)
        success = await self._role_model.update_role(role_id, clean_data)

        if not success:
            return self.error("No se pudo actualizar el rol", code="UPDATE_FAILED")

        await self._audit_service.log_access(
            action="ROLE_UPDATED",
            user_id=admin_id,
            user_email=admin_email,
            resource="roles",
            details={"role_id": role_id, "changes": clean_data},
            ip_address=ip_address
        )

        return self.success(f"Rol actualizado correctamente")

    async def get_audit_logs(
        self,
        user_email: Optional[str] = None,
        action: Optional[str] = None,
        resource: Optional[str] = None,
        limit: int = 100,
        skip: int = 0
    ) -> List[Dict[str, Any]]:
        """Consulta el historial de auditoría de usuarios y acciones"""
        return await self._audit_service.get_audit_trail(
            user_email=user_email,
            action=action,
            resource=resource,
            limit=limit,
            skip=skip
        )
