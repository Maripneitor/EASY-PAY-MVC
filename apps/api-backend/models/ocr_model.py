from core.base_repository import BaseRepository
from datetime import datetime
from typing import List, Optional, Dict, Any

class OcrModel(BaseRepository):
    """
    Modelo OOP para el almacenamiento de tickets y escaneos OCR.
    Hereda de BaseRepository y gestiona la colección 'OsrMG'.
    """
    db_name = "easypay"
    collection_name = "OsrMG"

    async def _ensure_indexes(self):
        if not self._indexes_created:
            try:
                await self.collection.create_index([("created_at", -1)])
                self._indexes_created = True
            except Exception as e:
                print(f"⚠️ [OcrModel] Índice ya existe: {e}")

    async def save_ticket(self, ticket_data: Dict[str, Any]) -> str:
        await self._ensure_indexes()
        ticket_data["created_at"] = datetime.utcnow()
        result = await self.collection.insert_one(ticket_data)
        return str(result.inserted_id)

    async def get_recent_tickets(self, limit: int = 50) -> List[Dict[str, Any]]:
        cursor = self.collection.find({}).sort("created_at", -1).limit(limit)
        tickets = await cursor.to_list(length=limit)
        for t in tickets:
            t["id"] = str(t["_id"])
            del t["_id"]
        return tickets
