import os
from typing import List

def get_allowed_cors_origins() -> List[str]:
    """
    Retorna la lista blanca de orígenes CORS permitidos para transporte seguro de credenciales.
    Previene el uso inseguro de allow_origins=['*'] con allow_credentials=True.
    """
    origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]
    
    frontend_url = os.getenv("FRONTEND_URL")
    if frontend_url:
        origins.append(frontend_url.rstrip("/"))

    env_origins = os.getenv("CORS_ALLOWED_ORIGINS", "")
    if env_origins:
        for o in env_origins.split(","):
            cleaned = o.strip()
            if cleaned:
                origins.append(cleaned)

    # Eliminar duplicados manteniendo orden
    return list(dict.fromkeys(origins))

