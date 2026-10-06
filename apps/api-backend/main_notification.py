from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.notification_router import notification_router, reminder_worker
import asyncio
import logging

app = FastAPI(title="Easy-Pay Notification Service (MVC)", version="2.0.0")
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(notification_router)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(reminder_worker())

@app.get("/")
def read_root():
    return {"service": "Notification Service (MVC)", "status": "active"}

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

logger = logging.getLogger(__name__)

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    import traceback
    logger.error(f"Global exception in Notification Service: {str(exc)}")
    logger.error(traceback.format_exc())
    from fastapi.responses import JSONResponse
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "error": str(exc)}
    )
