from core.base_repository import BaseRepository
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any

class InvitationModel(BaseRepository):
    """
    Modelo OOP para la gestión de Invitaciones a Grupos.
    Hereda de BaseRepository y gestiona la colección 'Invitations' en 'EasyPay_Groups'.
    """
    db_name = "EasyPay_Groups"
    collection_name = "Invitations"

    def __init__(self):
        super().__init__()

    async def _ensure_indexes(self):
        if not self._indexes_created:
            try:
                await self.collection.create_index([("group_id", 1), ("invited_email", 1)])
                await self.collection.create_index("invited_email")
                await self.collection.create_index("status")
                await self.collection.create_index("expires_at")
                self._indexes_created = True
            except Exception as e:
                print(f"⚠️ [InvitationModel] Índice ya existe: {e}")

    def _map_invitation(self, inv: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        if inv:
            if "_id" in inv:
                inv["id"] = str(inv["_id"])
                del inv["_id"]
        return inv

    async def create_invitation(self, data: Dict[str, Any]) -> str:
        await self._ensure_indexes()
        now = datetime.utcnow()
        data["created_at"] = now
        data["updated_at"] = now
        if "status" not in data:
            data["status"] = "PENDING"
        if "expires_at" not in data:
            data["expires_at"] = now + timedelta(days=7)
        if "invited_email" in data:
            data["invited_email"] = data["invited_email"].strip().lower()

        result = await self.collection.insert_one(data)
        data["id"] = str(result.inserted_id)
        if "_id" in data:
            del data["_id"]
        return str(result.inserted_id)

    async def find_pending_by_group_and_email(self, group_id: str, email: str) -> Optional[Dict[str, Any]]:
        clean_email = email.strip().lower()
        now = datetime.utcnow()
        inv = await self.collection.find_one({
            "group_id": group_id,
            "invited_email": clean_email,
            "status": "PENDING",
            "expires_at": {"$gt": now}
        })
        return self._map_invitation(inv)

    async def get_invitation_by_id(self, invitation_id: str) -> Optional[Dict[str, Any]]:
        if not self.is_valid_id(invitation_id):
            return None
        inv = await self.collection.find_one({"_id": self.to_object_id(invitation_id)})
        return self._map_invitation(inv)

    async def get_by_group(self, group_id: str, status: Optional[str] = None) -> List[Dict[str, Any]]:
        query: Dict[str, Any] = {"group_id": group_id}
        if status:
            query["status"] = status
        cursor = self.collection.find(query).sort("created_at", -1)
        invitations = await cursor.to_list(length=100)
        return [self._map_invitation(inv) for inv in invitations]

    async def get_pending_by_email(self, email: str) -> List[Dict[str, Any]]:
        clean_email = email.strip().lower()
        now = datetime.utcnow()
        cursor = self.collection.find({
            "invited_email": clean_email,
            "status": "PENDING",
            "expires_at": {"$gt": now}
        }).sort("created_at", -1)
        invitations = await cursor.to_list(length=50)
        return [self._map_invitation(inv) for inv in invitations]

    async def update_status(self, invitation_id: str, status: str) -> bool:
        if not self.is_valid_id(invitation_id):
            return False
        result = await self.collection.update_one(
            {"_id": self.to_object_id(invitation_id)},
            {"$set": {"status": status, "updated_at": datetime.utcnow()}}
        )
        return result.modified_count > 0

    async def update_delivery_status(self, invitation_id: str, delivered: bool, error: Optional[str] = None) -> bool:
        if not self.is_valid_id(invitation_id):
            return False
        update_data = {
            "email_delivered": delivered,
            "email_error": error,
            "delivery_attempted_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        result = await self.collection.update_one(
            {"_id": self.to_object_id(invitation_id)},
            {"$set": update_data}
        )
        return result.modified_count > 0

    async def cancel_invitation(self, invitation_id: str) -> bool:
        if not self.is_valid_id(invitation_id):
            return False
        result = await self.collection.delete_one({"_id": self.to_object_id(invitation_id)})
        return result.deleted_count > 0


