from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.ocr_router import ocr_router
from core.cors_config import get_allowed_cors_origins, get_allowed_cors_headers

app = FastAPI(title="Easy-Pay OCR Service (MVC)", version="2.0.0")
origins = get_allowed_cors_origins()
allowed_headers = get_allowed_cors_headers()

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=allowed_headers,
)

app.include_router(ocr_router)

@app.get("/")
def read_root():
    return {"service": "OCR Service (MVC)", "status": "active"}

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

import logging
logger = logging.getLogger(__name__)

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    import traceback
    logger.error(f"Global exception in OCR Service: {str(exc)}")
    logger.error(traceback.format_exc())
    from fastapi.responses import JSONResponse
    return JSONResponse(
        status_code=500,
        content={"detail": "Ha ocurrido un error interno en el servidor. Por favor intente más tarde.", "code": "INTERNAL_SERVER_ERROR"}
    )
