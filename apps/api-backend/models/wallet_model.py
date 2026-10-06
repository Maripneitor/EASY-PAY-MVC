from core.base_repository import BaseRepository
from datetime import datetime
from typing import List, Optional, Dict, Any

class WalletModel(BaseRepository):
    """
    Modelo OOP para la gestión de tarjetas y cuentas bancarias en MongoDB.
    Hereda de BaseRepository.
    """
    db_name = "EasyPay_Wallet"
    collection_name = "Cards"

    async def _ensure_indexes(self):
        if not self._indexes_created:
            try:
                await self.collection.create_index("user_id")
                self._indexes_created = True
            except Exception as e:
                print(f"⚠️ [WalletModel] Índice ya existe: {e}")

    async def get_cards(self, user_id: str) -> List[Dict[str, Any]]:
        cursor = self.collection.find({"user_id": user_id})
        cards = await cursor.to_list(length=50)
        for c in cards:
            c["id"] = str(c["_id"])
            del c["_id"]
        return cards

    async def add_card(self, card_data: Dict[str, Any]) -> str:
        await self._ensure_indexes()
        existing = await self.get_cards(card_data["user_id"])
        if len(existing) == 0:
            card_data["is_default"] = True

        card_data["created_at"] = datetime.utcnow()
        result = await self.collection.insert_one(card_data)
        return str(result.inserted_id)

    async def delete_card(self, user_id: str, card_id: str) -> bool:
        if not self.is_valid_id(card_id):
            return False
        result = await self.collection.delete_one(
            {"_id": self.to_object_id(card_id), "user_id": user_id}
        )
        return result.deleted_count > 0

    async def set_default(self, user_id: str, card_id: str) -> bool:
        if not self.is_valid_id(card_id):
            return False
        await self.collection.update_many(
            {"user_id": user_id},
            {"$set": {"is_default": False}}
        )
        result = await self.collection.update_one(
            {"_id": self.to_object_id(card_id), "user_id": user_id},
            {"$set": {"is_default": True}}
        )
        return result.modified_count > 0

    async def get_default_card(self, user_id: str) -> Optional[Dict[str, Any]]:
        card = await self.collection.find_one(
            {"user_id": user_id, "is_default": True}
        )
        if card:
            card["id"] = str(card["_id"])
            del card["_id"]
        return card
