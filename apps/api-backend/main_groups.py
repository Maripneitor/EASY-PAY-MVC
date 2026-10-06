from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.group_router import group_router
import logging

app = FastAPI(
    title="Easy-Pay Group API (MVC)",
    description="Microservicio para la gestión de grupos y saldos en arquitectura MVC",
    version="2.0.0"
)

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(group_router)

@app.get("/")
def read_root():
    return {
        "mensaje": "Bienvenido al Microservicio de Grupos (MVC) 👥",
        "docs": "/docs",
        "status": "active"
    }

logger = logging.getLogger(__name__)

@app.get("/api/health")
def health_check():
    return {"status": "ok", "system": "Easy Pay Group Service"}

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    import traceback
    logger.error(f"Global exception: {str(exc)}")
    logger.error(traceback.format_exc())
    from fastapi.responses import JSONResponse
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "error": str(exc)}
    )