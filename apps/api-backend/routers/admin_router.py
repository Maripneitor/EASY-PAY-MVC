from fastapi import APIRouter, HTTPException, Depends, Request, Query
from typing import List, Optional

from controllers.admin_controller import AdminController
from schemas.role_schema import RoleCreate, RoleUpdate, UserRoleUpdate, AVAILABLE_RESOURCES, AVAILABLE_ACTIONS
from core.permissions import require_role
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

# ── 3. REGISTRO DE AUDITORÍA Y ACCESOS ───────────────────────────────────────
@admin_router.get("/audit-logs")
async def get_audit_logs(
    user_email: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    resource: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    skip: int = Query(0, ge=0)
):
    """Consultar el registro de auditoría e historial de accesos de todos los usuarios"""
    logs = await controller.get_audit_logs(
        user_email=user_email,
        action=action,
        resource=resource,
        limit=limit,
        skip=skip
    )
    return logs
