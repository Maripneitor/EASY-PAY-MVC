from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.user_router import user_router 
from routers.admin_router import admin_router
from models.role_model import RoleModel
import logging

app = FastAPI(title="Easy-Pay Auth/User Service (OOP-MVC)", version="2.0.0")
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user_router)
app.include_router(admin_router)

@app.on_event("startup")
async def startup_event():
    try:
        await RoleModel().seed_default_roles()
        print("🛡️ [RBAC] Roles predeterminados inicializados")
    except Exception as e:
        print(f"⚠️ [RBAC] {e}")

@app.get("/")
def read_root():
    return {"service": "Auth/User & Admin Service (OOP-MVC)", "status": "active"}

logger = logging.getLogger(__name__)

@app.get("/api/health")
def health_check():
    return {"status": "ok", "system": "Easy Pay Auth & Admin Service"}

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    import traceback
    logger.error(f"Global exception in Auth Service: {str(exc)}")
    logger.error(traceback.format_exc())
    from fastapi.responses import JSONResponse
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "error": str(exc)}
    )
