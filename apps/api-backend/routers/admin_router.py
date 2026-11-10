from fastapi import APIRouter, HTTPException, Depends, Request, Query
from typing import List, Optional

from controllers.admin_controller import AdminController
from schemas.role_schema import RoleCreate, RoleUpdate, UserRoleUpdate, AVAILABLE_RESOURCES, AVAILABLE_ACTIONS
from core.permissions import require_role, require_permission
from core.rate_limiter import api_rate_limiter

admin_router = APIRouter(
    prefix="/api/admin",
    tags=["Admin"],
    dependencies=[Depends(require_role("Administrador", "admin")), Depends(api_rate_limiter)]
)

controller = AdminController()

from utils.user_agent_parser import extract_client_ip

def get_client_ip(request: Request) -> str:
    client_host = request.client.host if request.client else "127.0.0.1"
    return extract_client_ip(dict(request.headers), client_host)

@admin_router.get("/meta")
async def get_system_metadata():
    """Retorna los recursos y acciones del sistema para construir la matriz de permisos"""
    return {
        "resources": AVAILABLE_RESOURCES,
        "actions": AVAILABLE_ACTIONS
    }

# ── 1. GESTIÓN DE USUARIOS ──────────────────────────────────────────────────
@admin_router.get("/users")
async def get_all_users(limit: int = 100, skip: int = 0):
    """Ver todos los usuarios registrados en el sistema"""
    users = await controller.list_users(limit=limit, skip=skip)
    return users

@admin_router.put("/users/{user_id}/roles")
async def assign_user_roles(
    user_id: str,
    payload: UserRoleUpdate,
    request: Request,
    admin_user: dict = Depends(require_role("Administrador", "admin"))
):
    """Asignar o revocar roles a un usuario específico"""
    ip = get_client_ip(request)
    result = await controller.assign_user_roles(
        target_user_id=user_id,
        new_roles=payload.roles,
        admin_email=admin_user.get("email", "admin@easypay.com"),
        admin_id=str(admin_user.get("_id") or admin_user.get("id")),
        ip_address=ip
    )
    if controller.is_error(result):
        code = result.get("error_code")
        status_code = 403 if code in ["SUPERADMIN_PROTECTED", "SELF_DEMOTION_BLOCKED", "FORBIDDEN"] else 400
        raise HTTPException(status_code=status_code, detail=result.get("message"))
    return result

@admin_router.delete("/users/{user_id}", dependencies=[Depends(require_permission("users:delete"))])
async def delete_user(
    user_id: str,
    request: Request,
    admin_user: dict = Depends(require_role("Administrador", "admin"))
):
    """
    Elimina un usuario del sistema (requiere rol de Administrador y permiso users:delete).
    Bloquea a usuarios con rol Editor o Usuario Regular con 403.
    """
    admin_id = str(admin_user.get("_id") or admin_user.get("id"))
    admin_email = admin_user.get("email", "admin@easypay.com")
    ip = get_client_ip(request)

    # 1. Regla: Un administrador no puede eliminarse a sí mismo
    if str(user_id) == str(admin_id):
        raise HTTPException(
            status_code=403,
            detail="Operación denegada: No puedes eliminar tu propia cuenta de Administrador."
        )

    # 2. Regla: Protección del Superadministrador Principal
    target_user = await controller._user_model.get_user_by_id(user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    target_email = (target_user.get("email") or "").strip().lower()
    from controllers.admin_controller import PRIMARY_SUPERADMIN_EMAIL, SUPERADMIN_EMAILS
    if target_email == PRIMARY_SUPERADMIN_EMAIL or target_email in SUPERADMIN_EMAILS:
        raise HTTPException(
            status_code=403,
            detail="Operación denegada: La cuenta del Superadministrador principal está protegida contra eliminación."
        )

    success = await controller._user_model.delete_by_id(user_id)
    if not success:
        raise HTTPException(status_code=400, detail="No se pudo eliminar el usuario")

    # Registrar en auditoría inmutable
    await controller._audit_service.log_access(
        action="USER_DELETED",
        user_id=admin_id,
        user_email=admin_email,
        resource="users",
        details={"deleted_user_id": user_id, "deleted_user_email": target_email},
        ip_address=ip
    )

    return {"status": "success", "message": f"Usuario {target_email} eliminado correctamente"}

# ── 2. GESTIÓN DE ROLES Y PERMISOS DINÁMICOS ─────────────────────────────────
@admin_router.get("/roles")
async def get_all_roles():
    """Listar todos los roles y sus permisos dinámicos"""
    return await controller.list_roles()

@admin_router.post("/roles")
async def create_role(
    role_data: RoleCreate,
    request: Request,
    admin_user: dict = Depends(require_role("Administrador", "admin"))
):
    """Crear un nuevo rol y asignarle permisos específicos"""
    ip = get_client_ip(request)
    result = await controller.create_new_role(
        data=role_data,
        admin_email=admin_user.get("email", "admin@easypay.com"),
        admin_id=str(admin_user.get("_id") or admin_user.get("id")),
        ip_address=ip
    )
    if controller.is_error(result):
        code = result.get("error_code")
        status_code = 403 if code in ["SUPERADMIN_PROTECTED", "SELF_DEMOTION_BLOCKED", "FORBIDDEN"] else 400
        raise HTTPException(status_code=status_code, detail=result.get("message"))
    return result

@admin_router.put("/roles/{role_id}")
async def update_role(
    role_id: str,
    role_data: RoleUpdate,
    request: Request,
    admin_user: dict = Depends(require_role("Administrador", "admin"))
):
    """Actualizar permisos o descripción de un rol"""
    ip = get_client_ip(request)
    result = await controller.update_role(
        role_id=role_id,
        data=role_data,
        admin_email=admin_user.get("email", "admin@easypay.com"),
        admin_id=str(admin_user.get("_id") or admin_user.get("id")),
        ip_address=ip
    )
    if controller.is_error(result):
        code = result.get("error_code")
        status_code = 403 if code in ["SUPERADMIN_PROTECTED", "SELF_DEMOTION_BLOCKED", "FORBIDDEN"] else 400
        raise HTTPException(status_code=status_code, detail=result.get("message"))
    return result

# ── 3. REGISTRO DE AUDITORÍA Y ACCESOS (INMUTABLE Y PAGINADO) ───────────────
@admin_router.get(
    "/audit-logs",
    dependencies=[Depends(require_role("Administrador", "admin")), Depends(require_permission("audit:read"))]
)
async def get_audit_logs(
    page: int = Query(1, ge=1, description="Número de página (1-based)"),
    page_size: int = Query(50, ge=1, le=500, description="Cantidad de registros por página"),
    limit: Optional[int] = Query(None, ge=1, le=500, description="Límite alternativo de registros"),
    skip: Optional[int] = Query(None, ge=0, description="Desplazamiento alternativo"),
    user_email: Optional[str] = Query(None, description="Filtrar por correo electrónico del usuario"),
    user_id: Optional[str] = Query(None, description="Filtrar por ID de usuario"),
    action: Optional[str] = Query(None, description="Filtrar por acción ejecutada"),
    resource: Optional[str] = Query(None, description="Filtrar por recurso del sistema"),
    admin_user: dict = Depends(require_role("Administrador", "admin"))
):
    """
    Consulta paginada del Registro de Auditoría Inmutable (audit_logs).
    Exclusivamente accesible para usuarios con rol de Administrador y permiso audit:read.
    Devuelve registros sellados con id, user_id, action, resource, ip_address, user_agent, metadata y created_at.
    """
    effective_limit = limit or page_size
    effective_skip = skip if skip is not None else ((page - 1) * effective_limit)

    result = await controller.get_audit_logs(
        user_email=user_email,
        user_id=user_id,
        action=action,
        resource=resource,
        limit=effective_limit,
        skip=effective_skip,
        page=page if skip is None else ((effective_skip // effective_limit) + 1),
        page_size=effective_limit
    )
    return result
