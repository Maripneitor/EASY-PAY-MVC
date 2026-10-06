from core.base_repository import BaseRepository
from database import db_instance
from bson import ObjectId
from typing import List, Dict, Any

class StatsModel(BaseRepository):
    """
    Modelo OOP de Estadísticas y Analítica.
    Realiza pipelines de agregación sobre grupos e ítems.
    """
    db_name = "EasyPay_Groups"
    collection_name = "Items"

    def __init__(self):
        super().__init__()
        self._groups_collection = self._db.get_collection("Groups") if self._db is not None else None

    @property
    def groups_collection(self):
        if self._groups_collection is None and self._db is not None:
            self._groups_collection = self._db.get_collection("Groups")
        return self._groups_collection

    async def _ensure_indexes(self):
        pass

    async def get_user_expenses_by_category(self, user_id: str) -> List[Dict[str, Any]]:
        pipeline = [
            {"$match": {"participantes_ids": user_id}},
            {"$addFields": {
                "num_participantes": {"$max": [1, {"$size": {"$ifNull": ["$participantes_ids", []]}}]},
                "costo_total_item": {"$multiply": [{"$ifNull": ["$precio", 0]}, {"$ifNull": ["$cantidad", 1]}]},
                "categoria_final": {"$ifNull": ["$categoria", "Otros"]}
            }},
            {"$group": {
                "_id": "$categoria_final",
                "total": {"$sum": {"$divide": ["$costo_total_item", "$num_participantes"]}}
            }},
            {"$project": {
                "category": "$_id",
                "amount": {"$round": ["$total", 2]},
                "_id": 0
            }},
            {"$sort": {"amount": -1}}
        ]
        cursor = self.collection.aggregate(pipeline)
        return await cursor.to_list(length=None)

    async def get_user_transactions(self, user_id: str) -> List[Dict[str, Any]]:
        pipeline = [
            {"$match": {
                "$or": [
                    {"comprador_id": user_id},
                    {"participantes_ids": user_id}
                ]
            }},
            {"$sort": {"fecha_registro": -1}},
            {"$limit": 50}
        ]
        cursor = self.collection.aggregate(pipeline)
        items = await cursor.to_list(length=50)
        transactions = []
        for item in items:
            is_buyer = str(item.get("comprador_id")) == user_id
            parts = item.get("participantes_ids", [])
            num_parts = len(parts) if parts else 1
            cost = (item.get("precio", 0) or 0) * (item.get("cantidad", 1) or 1)
            share = cost / num_parts if num_parts > 0 else cost

            transactions.append({
                "id": str(item["_id"]),
                "title": item.get("nombre", "Gasto"),
                "date": item.get("fecha_registro"),
                "amount": round(cost if is_buyer else share, 2),
                "type": "paid" if is_buyer else "consumed",
                "category": item.get("categoria", "Otros")
            })
        return transactions

    async def get_global_stats(self) -> Dict[str, Any]:
        total_items = await self.collection.count_documents({})
        total_groups = await self.groups_collection.count_documents({}) if self.groups_collection is not None else 0
        return {
            "total_expenses": total_items,
            "total_groups": total_groups
        }
