import asyncio
from datetime import datetime, timedelta
from typing import Dict, Any, List
from core.base_controller import BaseController
from models.notification_model import NotificationModel
from schemas.notification_schema import NotificationCreate, DebtCreate

class NotificationController(BaseController):
    """
    Controlador OOP para Notificaciones y Worker de Recordatorios.
    Hereda de BaseController.
    """
    def __init__(self):
        super().__init__()
        self._model = NotificationModel()

    async def create_notification(self, data: NotificationCreate) -> Dict[str, Any]:
        notif_dict = data.dict()
        notif_id = await self._model.create_notification(notif_dict)
        return self.success("Notificación creada", notification_id=notif_id)

    async def get_notifications(self, user_id: str, unread_only: bool = False) -> List[Dict[str, Any]]:
        return await self._model.get_user_notifications(user_id, unread_only=unread_only)

    async def mark_read(self, notif_id: str, user_id: str) -> Dict[str, Any]:
        success = await self._model.mark_as_read(notif_id, user_id)
        if success:
            return self.success("Notificación marcada como leída")
        return self.error("No se pudo marcar como leída", code="NOT_FOUND")

    async def mark_all_read(self, user_id: str) -> Dict[str, Any]:
        count = await self._model.mark_all_as_read(user_id)
        return self.success(f"{count} notificaciones marcadas como leídas")

    async def create_debt(self, data: DebtCreate) -> Dict[str, Any]:
        debt_dict = data.dict()
        debt_id = await self._model.create_debt(debt_dict)
        return self.success("Deuda registrada para recordatorios", debt_id=debt_id)

    async def run_reminder_worker(self):
        """Worker en segundo plano para verificar deudas pendientes y enviar recordatorios automáticos"""
        self.logger.info("⏰ NotificationController: Reminder worker iniciado")
        while True:
            try:
                debts = await self._model.get_pending_debts()
                now = datetime.utcnow()
                for d in debts:
                    last_rem = d.get("last_reminder_at")
                    # Enviar recordatorio cada 24 horas si sigue pendiente
                    if not last_rem or (now - last_rem) > timedelta(hours=24):
                        debt_id = str(d["_id"])
                        await self._model.update_debt_reminder(debt_id)
                        # Crear notificación automática
                        await self._model.create_notification({
                            "user_id": d["from_user_id"],
                            "type": "reminder",
                            "title": "Recordatorio de pago pendiente",
                            "body": f"Tienes un saldo pendiente de ${d['amount']} en el grupo '{d.get('group_name', 'General')}'.",
                            "group_id": d.get("group_id"),
                            "amount": d.get("amount")
                        })
            except Exception as e:
                self.logger.error(f"⚠️ Error en reminder worker: {e}")
            await asyncio.sleep(60)
