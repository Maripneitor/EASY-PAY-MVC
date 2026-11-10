import re
import asyncio
import logging
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request
from services.auth_service import AuthService
from models.audit_model import AuditModel
from utils.user_agent_parser import extract_client_ip

logger = logging.getLogger("RBACMiddleware")

# Mapeo de rutas sensibles a acciones específicas de auditoría
SENSITIVE_ROUTE_ACTIONS = [
    (re.compile(r"^/api/auth/login/?$"), "POST", "AUTH_LOGIN", "auth"),
    (re.compile(r"^/api/auth/register/?$"), "POST", "USER_REGISTER", "users"),
    (re.compile(r"^/api/auth/logout/?$"), "POST", "AUTH_LOGOUT", "auth"),
    (re.compile(r"^/api/auth/change-password/?$"), "POST", "PASSWORD_CHANGE", "auth"),
    (re.compile(r"^/api/auth/request-password-reset/?$"), "POST", "PASSWORD_RESET_REQUEST", "auth"),
    (re.compile(r"^/api/auth/reset-password/?$"), "POST", "PASSWORD_RESET_CONFIRM", "auth"),
    (re.compile(r"^/api/auth/verify-email/?$"), "POST", "EMAIL_VERIFICATION", "auth"),
    (re.compile(r"^/api/auth/2fa/verify/?$"), "POST", "2FA_VERIFY", "auth"),
    (re.compile(r"^/api/admin/users/[^/]+/roles/?$"), "PUT", "ROLE_CHANGE", "roles"),
    (re.compile(r"^/api/admin/users/[^/]+/?$"), "DELETE", "USER_DELETED", "users"),
    (re.compile(r"^/api/admin/users/?$"), "POST", "USER_CREATED", "users"),
    (re.compile(r"^/api/admin/roles/[^/]+/?$"), "PUT", "ROLE_UPDATED", "roles"),
    (re.compile(r"^/api/admin/roles/[^/]+/?$"), "DELETE", "ROLE_DELETED", "roles"),
    (re.compile(r"^/api/admin/roles/?$"), "POST", "ROLE_CREATED", "roles"),
    (re.compile(r"^/api/groups/create/?$"), "POST", "GROUP_CREATED", "groups"),
    (re.compile(r"^/api/groups/[^/]+/?$"), "DELETE", "GROUP_DELETED", "groups"),
    (re.compile(r"^/api/expenses/create/?$"), "POST", "EXPENSE_CREATED", "expenses"),
    (re.compile(r"^/api/expenses/[^/]+/?$"), "DELETE", "EXPENSE_DELETED", "expenses"),
]

def resolve_sensitive_action(path: str, method: str):
    """Identifica si una petición corresponde a una acción sensible conocida"""
    for pattern, meth, action_name, resource in SENSITIVE_ROUTE_ACTIONS:
        if meth == method and pattern.match(path):
            return action_name, resource
    return None, None

class RBACAuthorizationMiddleware(BaseHTTPMiddleware):
    """
    Middleware Global de Autorización RBAC y Captura de Auditoría Inmutable.
    
    Responsabilidades:
    1. Extrae la IP real del cliente analizando cabeceras X-Forwarded-For, X-Real-IP o fallback a client.host.
    2. Extrae el User-Agent para trazabilidad y geolocalización.
    3. Valida e intercepta el JWT del encabezado Authorization: Bearer <token>.
    4. Almacena los claims autenticados en request.state.user, request.state.user_id y request.state.user_email.
    5. Captura automáticamente en la colección 'audit_logs' todas las acciones sensibles del sistema:
       - Autenticación (Login, Registro, Recuperación y Cambio de contraseña, 2FA).
       - Modificación y asignación de roles.
       - Creación y eliminación de usuarios.
       - Acceso denegado o intentos de intrusión (HTTP 401, 403).
       - Toda operación mutante (POST, PUT, PATCH, DELETE) y accesos al módulo /admin.
    """
    def __init__(self, app):
        super().__init__(app)
        self.auth_service = AuthService()
        self.audit_model = AuditModel()

    async def dispatch(self, request: Request, call_next):
        # 1. Extracción de IP del cliente (con soporte X-Forwarded-For) y User-Agent
        client_host = request.client.host if request.client else "127.0.0.1"
        ip = extract_client_ip(dict(request.headers), client_host)
        ua = request.headers.get("user-agent", "Unknown")

        request.state.client_ip = ip
        request.state.user_agent = ua
        request.state.user = None
        request.state.user_id = None
        request.state.user_email = None

        # 2. Interceptar y validar JWT del encabezado Authorization
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1].strip()
            try:
                claims = self.auth_service.decode_access_token(token)
                if claims:
                    request.state.user = claims
                    request.state.user_id = claims.get("sub")
                    request.state.user_email = claims.get("email")
            except Exception as e:
                logger.debug(f"[RBACMiddleware] Error decodificando token: {e}")

        # 3. Procesar la petición en el pipeline
        response = await call_next(request)

        # 4. Captura Automática de Auditoría para Acciones Sensibles
        path = request.url.path
        method = request.method

        # Ignorar endpoints auxiliares de ping / health check para no saturar el log
        if path.startswith("/api/") and not path.endswith("/ping") and not path.endswith("/health"):
            sensitive_action, sensitive_res = resolve_sensitive_action(path, method)

            should_audit = (
                sensitive_action is not None or
                method in ("POST", "PUT", "PATCH", "DELETE") or
                response.status_code in (401, 403) or
                "/admin" in path
            )

            if should_audit:
                parts = path.strip("/").split("/")
                default_resource = parts[1] if len(parts) > 1 else "api"
                resource = sensitive_res or default_resource

                if sensitive_action:
                    action_name = sensitive_action
                elif response.status_code == 401:
                    action_name = "UNAUTHORIZED_ACCESS_ATTEMPT"
                elif response.status_code == 403:
                    action_name = "FORBIDDEN_ACCESS_ATTEMPT"
                else:
                    action_name = f"{method}:{path}"

                # Extraer user_id validado del JWT (o enriquecido en el state durante la petición)
                user_id = getattr(request.state, "user_id", None) or getattr(request.state, "audit_user_id", None)
                user_email = getattr(request.state, "user_email", None) or getattr(request.state, "audit_user_email", None)

                # Metadatos del evento
                query_str = None
                try:
                    if "query_string" in request.scope and request.query_params:
                        query_str = str(request.query_params)
                except Exception:
                    pass

                metadata = {
                    "method": method,
                    "path": path,
                    "status_code": response.status_code,
                    "query": query_str
                }

                try:
                    # Encolar registro asíncrono e inmutable en audit_logs
                    asyncio.create_task(
                        self.audit_model.log_event(
                            action=action_name,
                            resource=resource,
                            user_id=user_id,
                            ip_address=ip,
                            user_agent=ua,
                            metadata=metadata,
                            user_email=user_email,
                            details=metadata
                        )
                    )
                except Exception as log_err:
                    logger.warning(f"[RBACMiddleware] No se pudo escribir en audit_logs: {log_err}")

        return response
