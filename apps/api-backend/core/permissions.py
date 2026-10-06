from fastapi import Header, HTTPException, Depends
from services.auth_service import AuthService
from models.user_model import UserModel
from models.role_model import RoleModel
from typing import List, Dict, Any, Optional

auth_service = AuthService()
user_model = UserModel()
role_model = RoleModel()

async def get_current_user_claims(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """
    Extrae y decodifica el token JWT enviado en el header Authorization: Bearer <token>.
    Valida firma, expiración y verifica que sea de tipo 'access'.
    """
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Se requiere token de autenticación en el encabezado Authorization."
        )

    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Formato de token inválido. Use 'Bearer <token>'")

    token = authorization.split(" ")[1]
    claims = auth_service.decode_access_token(token)

    if not claims:
        raise HTTPException(status_code=401, detail="Sesión expirada o token no válido.")

    return claims

async def get_current_user_id(claims: Dict[str, Any] = Depends(get_current_user_claims)) -> str:
    """Extrae el user_id (claim 'sub') del token verificado"""
    user_id = claims.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token no contiene identificador de usuario válido.")
    return user_id

async def get_current_user_with_permissions(claims: Dict[str, Any] = Depends(get_current_user_claims)) -> Dict[str, Any]:
    """
    Obtiene la entidad del usuario actualizada desde la base de datos
    junto con sus permisos calculados dinámicamente según sus roles en tiempo real.
    """
    user_id = claims.get("sub")
    user = await user_model.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado en el sistema.")

    user_roles = user.get("roles", ["Usuario Regular"])
    permissions = await role_model.get_permissions_for_roles(user_roles)

    user["id"] = str(user["_id"])
    user["resolved_permissions"] = list(permissions)
    return user

def require_role(*allowed_roles: str):
    """
    Dependency factory que restringe el acceso según el rol del usuario.
    """
    async def role_checker(user: Dict[str, Any] = Depends(get_current_user_with_permissions)) -> Dict[str, Any]:
        user_roles = [r.lower() for r in user.get("roles", [])]
        allowed = [r.lower() for r in allowed_roles]

        # El Administrador siempre tiene acceso global
        if "administrador" in user_roles or "admin" in user_roles:
            return user

        has_role = any(r in allowed for r in user_roles)
        if not has_role:
            raise HTTPException(
                status_code=403,
                detail=f"Acceso denegado. Se requiere uno de los siguientes roles: {', '.join(allowed_roles)}"
            )
        return user

    return role_checker

def require_permission(required_permission: str):
    """
    Dependency factory que evalúa permisos específicos (ej. 'groups:read', 'groups:write', 'groups:delete', 'audit:read').
    Permite control granular dinámico en el backend.
    """
    async def permission_checker(user: Dict[str, Any] = Depends(get_current_user_with_permissions)) -> Dict[str, Any]:
        user_roles = [r.lower() for r in user.get("roles", [])]
        
        # Administrador tiene bypass de permisos
        if "administrador" in user_roles or "admin" in user_roles:
            return user

        user_perms = user.get("resolved_permissions", [])
        if required_permission not in user_perms:
            raise HTTPException(
                status_code=403,
                detail=f"Acceso denegado. No cuentas con el permiso requerido: '{required_permission}'"
            )
        return user

    return permission_checker
