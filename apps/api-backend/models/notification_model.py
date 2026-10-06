from core.base_repository import BaseRepository
from database import db_instance
from bson import ObjectId
from datetime import datetime
from typing import List, Optional, Dict, Any

class NotificationModel(BaseRepository):
    """
    Modelo OOP de Notificaciones y Recordatorios.
    Gestiona las colecciones 'notificaciones' y 'deudas'.
    """
    db_name = "easypay"
    collection_name = "notificaciones"

    def __init__(self):
        super().__init__()
        self._debts_collection = self._db.get_collection("deudas") if self._db is not None else None

    @property
    def debts_collection(self):
        if self._debts_collection is None and self._db is not None:
            self._debts_collection = self._db.get_collection("deudas")
        return self._debts_collection

    async def _ensure_indexes(self):
        if not self._indexes_created:
            try:
                await self.collection.create_index([("user_id", 1), ("created_at", -1)])
                await self.debts_collection.create_index([("to_user_id", 1), ("status", 1)])
                self._indexes_created = True
            except Exception as e:
                print(f"⚠️ [NotificationModel] Índice ya existe: {e}")

    async def create_notification(self, notif_data: Dict[str, Any]) -> str:
        await self._ensure_indexes()
        notif_data["created_at"] = datetime.utcnow()
        notif_data["read"] = False
        result = await self.collection.insert_one(notif_data)
        return str(result.inserted_id)

    async def get_user_notifications(self, user_id: str, unread_only: bool = False, limit: int = 50) -> List[Dict[str, Any]]:
        query: Dict[str, Any] = {"user_id": user_id}
        if unread_only:
            query["read"] = False
        cursor = self.collection.find(query).sort("created_at", -1).limit(limit)
        notifs = await cursor.to_list(length=limit)
        for n in notifs:
            n["id"] = str(n["_id"])
            del n["_id"]
        return notifs

    async def mark_as_read(self, notif_id: str, user_id: str) -> bool:
        if not self.is_valid_id(notif_id):
            return False
        result = await self.collection.update_one(
            {"_id": self.to_object_id(notif_id), "user_id": user_id},
            {"$set": {"read": True}}
        )
        return result.modified_count > 0

    async def mark_all_as_read(self, user_id: str) -> int:
        result = await self.collection.update_many(
            {"user_id": user_id, "read": False},
            {"$set": {"read": True}}
        )
        return result.modified_count

    # --- Deudas y Recordatorios ---
    async def create_debt(self, debt_data: Dict[str, Any]) -> str:
        await self._ensure_indexes()
        debt_data["status"] = "pending"
        debt_data["created_at"] = datetime.utcnow()
        debt_data["reminders_sent"] = 0
        debt_data["last_reminder_at"] = None
        result = await self.debts_collection.insert_one(debt_data)
        return str(result.inserted_id)

    async def get_pending_debts(self) -> List[Dict[str, Any]]:
        cursor = self.debts_collection.find({"status": "pending"})
        return await cursor.to_list(length=200)

    async def update_debt_reminder(self, debt_id: str) -> bool:
        if not self.is_valid_id(debt_id):
            return False
        result = await self.debts_collection.update_one(
            {"_id": self.to_object_id(debt_id)},
            {
                "$set": {"last_reminder_at": datetime.utcnow()},
                "$inc": {"reminders_sent": 1}
            }
        )
        return result.modified_count > 0
