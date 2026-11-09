from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request
from services.auth_service import AuthService
from models.audit_model import AuditModel
from utils.user_agent_parser import extract_client_ip
import asyncio
import logging

logger = logging.getLogger("RBACMiddleware")

class RBACAuthorizationMiddleware(BaseHTTPMiddleware):
    """
    Middleware de autorización RBAC y registro de auditoría inmutable en el servidor.
    - Intercepta cada petición a la API.
    - Extrae y valida el JWT del encabezado Authorization: Bearer <token>.
    - Valida firma, expiración y tipo de token en el servidor (cero confianza en el cliente).
    - Asocia la identidad verificada al estado de la petición (request.state).
    - Registra de forma inmutable todas las operaciones mutantes (POST, PUT, PATCH, DELETE),
      intentos de acceso denegado (401, 403) y eventos administrativos en AuditLogs.
    """
    def __init__(self, app):
        super().__init__(app)
        self.auth_service = AuthService()
        self.audit_model = AuditModel()

    async def dispatch(self, request: Request, call_next):
        client_host = request.client.host if request.client else "127.0.0.1"
        ip = extract_client_ip(dict(request.headers), client_host)
        ua = request.headers.get("user-agent", "Unknown")

        request.state.client_ip = ip
        request.state.user_agent = ua
        request.state.user = None
        request.state.user_id = None
        request.state.user_email = None

        # 1. Interceptar encabezado Authorization
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            try:
                claims = self.auth_service.decode_access_token(token)
                if claims:
                    request.state.user = claims
                    request.state.user_id = claims.get("sub")
                    request.state.user_email = claims.get("email")
            except Exception as e:
                logger.debug(f"[RBACMiddleware] Error decodificando token: {e}")

        # 2. Procesar la petición
        response = await call_next(request)

        # 3. Registro de Auditoría Inmutable para acciones del sistema
        path = request.url.path
        method = request.method
        if path.startswith("/api/") and not path.endswith("/ping") and not path.endswith("/health"):
            # Auditar mutaciones (POST, PUT, PATCH, DELETE), accesos denegados (401, 403) y módulo de administración
            should_audit = (
                method in ("POST", "PUT", "PATCH", "DELETE") or
                response.status_code in (401, 403) or
                "/admin" in path
            )
            if should_audit:
                parts = path.strip("/").split("/")
                resource = parts[1] if len(parts) > 1 else "api"
                action_name = f"{method}:{path}"
                user_id = getattr(request.state, "user_id", None)
                user_email = getattr(request.state, "user_email", None)

                try:
                    # Encolar inserción inmutable en MongoDB AuditLogs
                    asyncio.create_task(
                        self.audit_model.log_event(
                            action=action_name,
                            resource=resource,
                            user_id=user_id,
                            user_email=user_email,
                            details={
                                "method": method,
                                "path": path,
                                "status_code": response.status_code
                            },
                            ip_address=ip,
                            user_agent=ua
                        )
                    )
                except Exception as log_err:
                    logger.warning(f"[RBACMiddleware] No se pudo escribir en log de auditoría: {log_err}")

        return response
