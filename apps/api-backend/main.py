import os
import asyncio
import logging
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from routers import (
    user_router,
    admin_router,
    wallet_router,
    group_router,
    stats_router,
    ocr_router,
    notification_router,
    reminder_worker
)
from models.role_model import RoleModel
from core.rbac_middleware import RBACAuthorizationMiddleware

logger = logging.getLogger("EasyPayAPI")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)

app = FastAPI(
    title="Easy-Pay REST API",
    description="API REST segura con arquitectura MVC + POO, autenticación JWT, RBAC dinámico y auditoría inmutable",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# ── Configuración Segura de CORS ──────────────────────────────────────────────
# Solo orígenes explícitamente autorizados
raw_origins = os.getenv("ALLOWED_ORIGINS", "")
custom_origins = [o.strip() for o in raw_origins.split(",") if o.strip()]

default_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "https://localhost:5173",
]

allowed_origins = list(set(default_origins + custom_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "X-Requested-With"],
)

app.add_middleware(RBACAuthorizationMiddleware)

# ── Middleware de Seguridad y Hardening HTTP ─────────────────────────────────
@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    # Inyección de cabeceras de seguridad estrictas
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

# ── Registro de Routers MVC ───────────────────────────────────────────────────
app.include_router(user_router)
app.include_router(admin_router)
app.include_router(wallet_router)
app.include_router(group_router)
app.include_router(stats_router)
app.include_router(ocr_router)
app.include_router(notification_router)

@app.on_event("startup")
async def startup_event():
    # Inicializar roles predeterminados (Administrador, Editor, Usuario Regular)
    try:
        role_model = RoleModel()
        await role_model.seed_default_roles()
        logger.info("[RBAC] Roles predeterminados y permisos dinamicos listos en MongoDB.")
    except Exception as e:
        logger.warning(f"[RBAC] Advertencia inicializando roles: {e}")

    # Iniciar worker de recordatorios en segundo plano
    try:
        asyncio.create_task(reminder_worker())
        logger.info("[EasyPay] Unified API iniciada con worker de recordatorios activo.")
    except Exception as e:
        logger.warning(f"Error iniciando worker de recordatorios: {e}")

@app.get("/")
def read_root():
    return {
        "mensaje": "Bienvenido a la API REST de Easy-Pay (Arquitectura MVC + POO)",
        "docs": "/docs",
        "status": "active",
        "security": "JWT + RBAC + Audit Trail + Rate Limiting + Bcrypt + Security Headers",
        "version": "2.0.0"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "system": "Easy-Pay Backend (MVC)",
        "security_policy": "Enforced",
        "version": "2.0.0"
    }

# ── Manejo de Errores Seguro (Sin fuga de información) ────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    # Registrar traza completa en logs internos del servidor
    logger.error(f"Internal Exception on {request.method} {request.url.path}: {str(exc)}")
    logger.error(traceback.format_exc())

    # Respuesta generica y limpia al cliente sin exponer secretos, codigo ni estructura interna
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Ha ocurrido un error interno en el servidor. Por favor, intente nuevamente mas tarde.",
            "status": "error"
        }
    )