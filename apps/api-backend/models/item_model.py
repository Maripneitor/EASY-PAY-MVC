from core.base_repository import BaseRepository
from database import db_instance
from bson import ObjectId
from typing import List, Optional, Dict, Any

class ItemModel(BaseRepository):
    """
    Modelo OOP para la gestión de ítems y gastos individuales.
    Hereda de BaseRepository y gestiona la colección 'Items'.
    """
    db_name = "EasyPay_Groups"
    collection_name = "Items"

    def __init__(self):
        super().__init__()
        self._auth_db = db_instance.get_db("EasyPay_Auth")

    @property
    def users_collection(self):
        if self._auth_db is None:
            self._auth_db = db_instance.get_db("EasyPay_Auth")
        return self._auth_db.get_collection("Users") if self._auth_db is not None else None

    async def _ensure_indexes(self):
        if not self._indexes_created:
            try:
                await self.collection.create_index("group_id")
                await self.collection.create_index("comprador_id")
                await self.collection.create_index("participantes_ids")
                self._indexes_created = True
            except Exception as e:
                print(f"⚠️ [ItemModel] Índice ya existe: {e}")

    async def save_item(self, item_data: Dict[str, Any]) -> str:
        await self._ensure_indexes()
        result = await self.collection.insert_one(item_data)
        return str(result.inserted_id)

    async def find_by_group(self, group_id: str) -> List[Dict[str, Any]]:
        """Recupera los ítems de un grupo poblando nombres de comprador y participantes"""
        cursor = self.collection.find({"group_id": group_id})
        items = await cursor.to_list(length=200)

        for item in items:
            item["id"] = str(item["_id"])
            del item["_id"]

            # Buscar nombre del comprador
            comprador_id = item.get("comprador_id")
            if comprador_id and self.is_valid_id(comprador_id) and self.users_collection is not None:
                user = await self.users_collection.find_one(
                    {"_id": self.to_object_id(comprador_id)},
                    {"nombre": 1}
                )
                item["nombre_comprador"] = user.get("nombre", "Usuario") if user else "Desconocido"

            # Buscar nombres de participantes
            participantes_ids = item.get("participantes_ids", [])
            if participantes_ids and self.users_collection is not None:
                obj_ids = [self.to_object_id(uid) for uid in participantes_ids if self.is_valid_id(uid)]
                users_cursor = self.users_collection.find(
                    {"_id": {"$in": obj_ids}},
                    {"nombre": 1}
                )
                item["nombres_participantes"] = [u.get("nombre", "Usuario") async for u in users_cursor]
            else:
                item["nombres_participantes"] = []

        return items

    async def find_by_id(self, item_id: str) -> Optional[Dict[str, Any]]:
        item = await super().find_by_id(item_id)
        if item:
            item["id"] = str(item["_id"])
            del item["_id"]
        return item

    async def update_item(self, item_id: str, item_data: Dict[str, Any]) -> bool:
        return await self.update_by_id(item_id, item_data)

    async def delete_item(self, item_id: str) -> bool:
        return await self.delete_by_id(item_id)

    async def has_assigned_items(self, user_id: str, group_id: str) -> bool:
        item = await self.collection.find_one({
            "group_id": group_id,
            "participantes_ids": user_id
        })
        return item is not None
