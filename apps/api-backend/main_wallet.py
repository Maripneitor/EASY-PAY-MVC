from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.wallet_router import wallet_router
from core.cors_config import get_allowed_cors_origins, get_allowed_cors_headers

app = FastAPI(
    title="Easy-Pay Wallet Service (MVC)",
    description="Microservicio para gestión de tarjetas/cuentas bancarias en arquitectura MVC",
    version="2.0.0"
)

origins = get_allowed_cors_origins()
allowed_headers = get_allowed_cors_headers()

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=allowed_headers,
)

app.include_router(wallet_router)

@app.get("/")
def read_root():
    return {
        "mensaje": "Easy-Pay Wallet Service (MVC)",
        "docs": "/docs",
        "status": "active",
        "database": "EasyPay_Wallet"
    }

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "wallet-service"}
