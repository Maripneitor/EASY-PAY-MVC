from fastapi import APIRouter, HTTPException, Depends, Request, Response, Cookie, BackgroundTasks
from typing import Dict, Any, Optional
from pydantic import BaseModel

from controllers.user_controller import UserController
from schemas.user_schema import (
    UserCreate, UserLogin, UserUpdate, PasswordChange, 
    PasswordResetRequest, PasswordResetConfirm
)
from core.permissions import get_current_user_id, get_current_user_claims, get_current_user_with_permissions
from core.rate_limiter import auth_rate_limiter
from utils.user_agent_parser import extract_client_ip

user_router = APIRouter(prefix="/api/auth", tags=["Auth"])
controller = UserController()

class RefreshRequest(BaseModel):
    refresh_token: Optional[str] = None

def get_client_info(request: Request):
    client_host = request.client.host if request.client else "127.0.0.1"
    headers = dict(request.headers)
    ip = extract_client_ip(headers, client_host)
    ua = request.headers.get("user-agent", "Unknown")
    return ip, ua

@user_router.get("/ping")
async def ping():
    return {"status": "ok", "message": "Pong from Easy-Pay Auth Service (MVC + POO)"}

@user_router.post("/register", dependencies=[Depends(auth_rate_limiter)])
async def register(user_data: UserCreate, request: Request, background_tasks: BackgroundTasks):
    ip, ua = get_client_info(request)
    result = await controller.register(user_data, ip_address=ip, user_agent=ua, background_tasks=background_tasks)
    if controller.is_error(result):
        status_code = 409 if result.get("error_code") == "USER_EXISTS" else 400
        raise HTTPException(status_code=status_code, detail=result.get("message"))
    return result

@user_router.post("/login", dependencies=[Depends(auth_rate_limiter)])
async def login(login_data: UserLogin, request: Request, response: Response):
    ip, ua = get_client_info(request)
    result = await controller.login(
        identifier=login_data.identifier,
        password=login_data.password,
        ip_address=ip,
        user_agent=ua
    )
    if result.get("status") == "not_verified":
        return result
    if result.get("status") == "2fa_required":
        return result
    if controller.is_error(result):
        code = result.get("error_code")
        status_code = 429 if code == "ACCOUNT_LOCKED" else 401
        raise HTTPException(status_code=status_code, detail=result.get("message"))

    # Configuración de cookies seguras HttpOnly para mitigar ataques XSS
    if "refresh_token" in result:
        response.set_cookie(
            key="refresh_token",
            value=result["refresh_token"],
            httponly=True,
            secure=True,
            samesite="lax",
            max_age=7 * 24 * 3600
        )
    return result

@user_router.post("/refresh", dependencies=[Depends(auth_rate_limiter)])
async def refresh_token(
    request: Request,
    response: Response,
    body: Optional[RefreshRequest] = None,
    refresh_token_cookie: Optional[str] = Cookie(None, alias="refresh_token")
):
    """
    Endpoint para renovar el Access Token expirado usando un Refresh Token seguro.
    Lee el token desde cookie HttpOnly o desde el cuerpo de la petición.
    """
    ip, ua = get_client_info(request)
    token = (body and body.refresh_token) or refresh_token_cookie

    if not token:
        # Intentar extraer del encabezado Authorization si viene como refresh
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

    if not token:
        raise HTTPException(status_code=401, detail="Refresh token no proporcionado.")

    result = await controller.refresh_session(token, ip_address=ip, user_agent=ua)
    if controller.is_error(result):
        response.delete_cookie(key="refresh_token")
        raise HTTPException(status_code=401, detail=result.get("message"))

    # Actualizar cookie HttpOnly con el nuevo refresh token rotado
    if "refresh_token" in result:
        response.set_cookie(
            key="refresh_token",
            value=result["refresh_token"],
            httponly=True,
            secure=True,
            samesite="lax",
            max_age=7 * 24 * 3600
        )
    return result

@user_router.post("/logout")
async def logout(request: Request, response: Response):
    """Cierra la sesión y limpia cookies HttpOnly"""
    ip, ua = get_client_info(request)
    response.delete_cookie(key="refresh_token")
    return {"status": "success", "message": "Sesión cerrada correctamente."}

@user_router.get("/me")
async def get_my_info(current_user: Dict[str, Any] = Depends(get_current_user_with_permissions)):
    """Retorna los datos del usuario en tiempo real con roles y permisos actualizados desde la base de datos"""
    return {
        "id": current_user["id"],
        "nombre": current_user.get("nombre"),
        "email": current_user.get("email"),
        "phone": current_user.get("phone"),
        "birth_date": current_user.get("birth_date"),
        "address": current_user.get("address"),
        "bank_accounts": current_user.get("bank_accounts", []),
        "roles": current_user.get("roles", ["Usuario Regular"]),
        "permissions": current_user.get("resolved_permissions", []),
        "is_verified": current_user.get("is_verified", False),
        "2fa_enabled": current_user.get("two_factor", {}).get("enabled", False) or current_user.get("is_verified", False),
        "financial_profile": current_user.get("financial_profile") or {}
    }

@user_router.get("/profile/{user_id}")
async def get_user_profile(user_id: str, current_user_id: str = Depends(get_current_user_id)):
    if user_id != current_user_id:
        raise HTTPException(status_code=403, detail="No tienes permiso para ver este perfil")
    profile = await controller.get_profile(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return profile

@user_router.get("/search")
async def search_users(query: str, limit: int = 5, current_user_id: str = Depends(get_current_user_id)):
    if len(query) < 2:
        return []
    return await controller._user_model.search_users(query, limit)

@user_router.put("/update")
async def update_user(data: UserUpdate, user_id: str = Depends(get_current_user_id)):
    update_dict = data.dict(exclude_unset=True)
    result = await controller.update_profile(user_id, update_dict)
    if controller.is_error(result):
        raise HTTPException(status_code=400, detail=result.get("message"))
    return result

@user_router.put("/update/{user_id}")
async def update_user_compat(user_id: str, data: UserUpdate, auth_user_id: str = Depends(get_current_user_id)):
    if user_id != auth_user_id:
        raise HTTPException(status_code=403, detail="No autorizado")
    update_dict = data.dict(exclude_unset=True)
    result = await controller.update_profile(auth_user_id, update_dict)
    if controller.is_error(result):
        raise HTTPException(status_code=400, detail=result.get("message"))
    return result

@user_router.post("/2fa/setup/{user_id}")
async def setup_2fa(
    user_id: str,
    background_tasks: BackgroundTasks,
    current_user_id: str = Depends(get_current_user_id)
):
    if user_id != current_user_id:
        raise HTTPException(status_code=403, detail="No autorizado")
    profile = await controller.get_profile(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    result = await controller.setup_2fa(user_id, profile["email"], background_tasks=background_tasks)
    return result

@user_router.post("/2fa/verify/{user_id}")
async def verify_2fa(user_id: str, data: dict, request: Request, response: Response):
    code = data.get("code")
    if not code:
        raise HTTPException(status_code=400, detail="Código requerido")
    ip, ua = get_client_info(request)
    result = await controller.verify_2fa(user_id, str(code), ip_address=ip, user_agent=ua)
    if controller.is_error(result):
        raise HTTPException(status_code=400, detail=result.get("message"))
    if "token" in result and "access_token" not in result:
        result["access_token"] = result["token"]
    if "refresh_token" in result:
        response.set_cookie(
            key="refresh_token",
            value=result["refresh_token"],
            httponly=True,
            secure=True,
            samesite="lax",
            max_age=7 * 24 * 3600
        )
    return result

@user_router.post("/request-password-reset", dependencies=[Depends(auth_rate_limiter)])
async def request_password_reset(
    data: PasswordResetRequest,
    request: Request,
    background_tasks: BackgroundTasks
):
    ip, _ = get_client_info(request)
    result = await controller.request_password_reset(data.email, ip_address=ip, background_tasks=background_tasks)
    return result

@user_router.post("/reset-password", dependencies=[Depends(auth_rate_limiter)])
async def reset_password_with_code(
    data: PasswordResetConfirm,
    request: Request
):
    """Restablece la contraseña mediante la validación de código OTP"""
    ip, ua = get_client_info(request)
    result = await controller.reset_password_with_code(
        email=data.email,
        code=data.code,
        new_password=data.new_password,
        confirm_password=data.confirm_password,
        ip_address=ip,
        user_agent=ua
    )
    if controller.is_error(result):
        raise HTTPException(status_code=400, detail=result.get("message"))
    return result

@user_router.post("/change-password/{user_id}", dependencies=[Depends(auth_rate_limiter)])
async def change_password(user_id: str, data: PasswordChange, request: Request, current_user_id: str = Depends(get_current_user_id)):
    if user_id != current_user_id:
        raise HTTPException(status_code=403, detail="No autorizado")
    ip, _ = get_client_info(request)
    result = await controller.change_password(user_id, data, ip_address=ip)
    if controller.is_error(result):
        raise HTTPException(status_code=400, detail=result.get("message"))
    return result

# --- Rutas de Tarjetas ---
@user_router.get("/cards/{user_id}")
async def get_user_cards(user_id: str, current_user_id: str = Depends(get_current_user_id)):
    if user_id != current_user_id:
        raise HTTPException(status_code=403, detail="No autorizado")
    return await controller._user_model.get_cards(user_id)

@user_router.post("/cards/{user_id}")
async def add_user_card(user_id: str, card: dict, current_user_id: str = Depends(get_current_user_id)):
    if user_id != current_user_id:
        raise HTTPException(status_code=403, detail="No autorizado")
    success = await controller._user_model.add_card(user_id, card)
    if success:
        return {"message": "Tarjeta agregada", "status": "success"}
    raise HTTPException(status_code=400, detail="No se pudo agregar la tarjeta")

@user_router.delete("/cards/{user_id}/{card_id}")
async def remove_user_card(user_id: str, card_id: str, current_user_id: str = Depends(get_current_user_id)):
    if user_id != current_user_id:
        raise HTTPException(status_code=403, detail="No autorizado")
    success = await controller._user_model.remove_card(user_id, card_id)
    if success:
        return {"message": "Tarjeta eliminada", "status": "success"}
    raise HTTPException(status_code=400, detail="No se pudo eliminar la tarjeta")

@user_router.patch("/cards/{user_id}/{card_id}/default")
async def set_default_card(user_id: str, card_id: str, current_user_id: str = Depends(get_current_user_id)):
    if user_id != current_user_id:
        raise HTTPException(status_code=403, detail="No autorizado")
    success = await controller._user_model.set_default_card(user_id, card_id)
    if success:
        return {"message": "Tarjeta predeterminada actualizada", "status": "success"}
    raise HTTPException(status_code=400, detail="No se pudo actualizar la tarjeta")

# --- Rutas de Gestión de Sesiones Activas en Base de Datos ---
@user_router.get("/sessions")
async def get_my_sessions(
    claims: Dict[str, Any] = Depends(get_current_user_claims)
):
    """Retorna las sesiones activas vinculadas a la cuenta en MongoDB"""
    user_id = claims.get("sub")
    current_jti = claims.get("jti")
    sessions = await controller.get_active_sessions(user_id, current_jti=current_jti)
    return {"status": "success", "sessions": sessions}

@user_router.delete("/sessions/{session_id}")
async def revoke_session(
    session_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Invalida la sesión especificada en la base de datos"""
    success = await controller.revoke_session(user_id, session_id)
    if success:
        return {"status": "success", "message": "Sesión revocada correctamente"}
    raise HTTPException(status_code=404, detail="Sesión no encontrada o ya revocada")

@user_router.delete("/sessions")
async def revoke_all_other_sessions(
    claims: Dict[str, Any] = Depends(get_current_user_claims)
):
    """Invalida todas las demás sesiones remotas excepto la actual"""
    user_id = claims.get("sub")
    current_jti = claims.get("jti")
    revoked_count = await controller.revoke_all_sessions(user_id, current_jti=current_jti)
    return {
        "status": "success",
        "message": f"{revoked_count} sesiones remotas revocadas correctamente"
    }
