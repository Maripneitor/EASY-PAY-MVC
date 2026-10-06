from core.base_repository import BaseRepository
from database import db_instance
from bson import ObjectId
from datetime import datetime
from typing import List, Optional, Dict, Any

class GroupModel(BaseRepository):
    """
    Modelo OOP para Grupos y Liquidaciones.
    Hereda de BaseRepository y gestiona las colecciones 'Groups' y 'Settlements'.
    """
    db_name = "EasyPay_Groups"
    collection_name = "Groups"

    def __init__(self):
        super().__init__()
        self._auth_db = db_instance.get_db("EasyPay_Auth")
        self._settlements_collection = self._db.get_collection("Settlements") if self._db is not None else None

    @property
    def users_collection(self):
        if self._auth_db is None:
            self._auth_db = db_instance.get_db("EasyPay_Auth")
        return self._auth_db.get_collection("Users") if self._auth_db is not None else None

    @property
    def settlements_collection(self):
        if self._settlements_collection is None and self._db is not None:
            self._settlements_collection = self._db.get_collection("Settlements")
        return self._settlements_collection

    async def _ensure_indexes(self):
        if not self._indexes_created:
            try:
                await self.collection.create_index("codigo_invitacion", unique=True, sparse=True)
                await self.collection.create_index("integrantes")
                self._indexes_created = True
            except Exception as e:
                print(f"⚠️ [GroupModel] Índice ya existe: {e}")

    def _map_group(self, group: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        if group:
            group["id"] = str(group["_id"])
            del group["_id"]
        return group

    async def save_group(self, group_data: Dict[str, Any]) -> str:
        await self._ensure_indexes()
        result = await self.collection.insert_one(group_data)
        return str(result.inserted_id)

    async def find_by_code(self, codigo: str) -> Optional[Dict[str, Any]]:
        group = await self.collection.find_one({"codigo_invitacion": codigo.upper()})
        return self._map_group(group)

    async def find_by_user(self, user_id: str) -> List[Dict[str, Any]]:
        cursor = self.collection.find({"integrantes": user_id}).sort("fecha_creacion", -1)
        groups = await cursor.to_list(length=100)
        return [self._map_group(g) for g in groups]

    async def find_by_id_detailed(self, group_id: str) -> Optional[Dict[str, Any]]:
        if not self.is_valid_id(group_id):
            return None

        group = await self.collection.find_one({"_id": self.to_object_id(group_id)})
        if not group:
            return None

        integrantes_ids = group.get("integrantes", [])
        valid_uids = [self.to_object_id(uid) for uid in integrantes_ids if self.is_valid_id(uid)]

        miembros_detallados = []
        if self.users_collection is not None:
            usuarios_cursor = self.users_collection.find(
                {"_id": {"$in": valid_uids}},
                {"nombre": 1, "financial_profile": 1}
            )
            async for user in usuarios_cursor:
                miembros_detallados.append({
                    "id": str(user["_id"]),
                    "nombre": user.get("nombre") or "Usuario",
                    "financial_profile": user.get("financial_profile") or {}
                })

        group["id"] = str(group["_id"])
        del group["_id"]
        group["integrantes"] = miembros_detallados
        return group

    async def add_member(self, group_id: str, user_id: str) -> bool:
        if not self.is_valid_id(group_id):
            return False
        result = await self.collection.update_one(
            {"_id": self.to_object_id(group_id)},
            {"$addToSet": {"integrantes": user_id}}
        )
        return result.modified_count > 0

    async def remove_member(self, group_id: str, user_id: str) -> bool:
        if not self.is_valid_id(group_id):
            return False
        result = await self.collection.update_one(
            {"_id": self.to_object_id(group_id)},
            {"$pull": {"integrantes": user_id}}
        )
        return result.modified_count > 0

    async def update_group(self, group_id: str, group_data: Dict[str, Any]) -> bool:
        return await self.update_by_id(group_id, group_data)

    async def delete_group(self, group_id: str) -> bool:
        return await self.delete_by_id(group_id)

    # --- Métodos de Settlements / Pagos ---
    async def save_settlement(self, settlement_data: Dict[str, Any]) -> str:
        settlement_data["created_at"] = datetime.utcnow()
        settlement_data["updated_at"] = datetime.utcnow()
        result = await self.settlements_collection.insert_one(settlement_data)
        return str(result.inserted_id)

    async def get_settlements_by_group(self, group_id: str) -> List[Dict[str, Any]]:
        cursor = self.settlements_collection.find({"group_id": group_id}).sort("created_at", -1)
        settlements = await cursor.to_list(length=100)
        for s in settlements:
            s["id"] = str(s["_id"])
            del s["_id"]
        return settlements

    async def update_settlement_status(self, settlement_id: str, status: str) -> bool:
        if not self.is_valid_id(settlement_id):
            return False
        result = await self.settlements_collection.update_one(
            {"_id": self.to_object_id(settlement_id)},
            {"$set": {"status": status, "updated_at": datetime.utcnow()}}
        )
        return result.modified_count > 0
