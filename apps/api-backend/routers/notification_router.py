from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, List
from controllers.notification_controller import NotificationController
from schemas.notification_schema import NotificationCreate, DebtCreate
from utils.security import get_current_user_id

notification_router = APIRouter(prefix="/api/notifications", tags=["Notifications"])
router = notification_router  # Alias para compatibilidad
controller = NotificationController()

async def reminder_worker():
    """Worker expuesto para ejecución en background al iniciar el servidor"""
    await controller.run_reminder_worker()

@notification_router.post("/")
async def create_notification(data: NotificationCreate):
    result = await controller.create_notification(data)
    return result

@notification_router.get("/{user_id}")
async def get_user_notifications(user_id: str, unread_only: bool = False, current_user_id: str = Depends(get_current_user_id)):
    if user_id != current_user_id:
        raise HTTPException(status_code=403, detail="No puedes ver notificaciones de otro usuario")
    return await controller.get_notifications(user_id, unread_only=unread_only)

@notification_router.patch("/{notif_id}/read")
async def mark_as_read(notif_id: str, current_user_id: str = Depends(get_current_user_id)):
    result = await controller.mark_read(notif_id, current_user_id)
    if controller.is_error(result):
        raise HTTPException(status_code=404, detail=result.get("message"))
    return result

@notification_router.patch("/user/{user_id}/read-all")
async def mark_all_as_read(user_id: str, current_user_id: str = Depends(get_current_user_id)):
    if user_id != current_user_id:
        raise HTTPException(status_code=403, detail="No autorizado")
    return await controller.mark_all_read(user_id)

@notification_router.post("/debts")
async def create_debt(data: DebtCreate):
    return await controller.create_debt(data)
