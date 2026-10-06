from abc import ABC, abstractmethod
from database import db_instance
from bson import ObjectId
from typing import Optional, List, Dict, Any

class BaseRepository(ABC):
    """
    Clase base abstracta (OOP) para todos los repositorios de MongoDB.
    Proporciona operaciones CRUD reutilizables, validaciones de ObjectId
    y estandarización del acceso a base de datos.
    """
    db_name: str = "EasyPay"
    collection_name: str = ""

    def __init__(self):
        self._db = db_instance.get_db(self.db_name)
        if self._db is not None and self.collection_name:
            self._collection = self._db.get_collection(self.collection_name)
        else:
            self._collection = None
        self._indexes_created = False

    @property
    def collection(self):
        if self._collection is None:
            self._db = db_instance.get_db(self.db_name)
            if self._db is not None:
                self._collection = self._db.get_collection(self.collection_name)
        return self._collection

    @staticmethod
    def is_valid_id(id_str: str) -> bool:
        """Valida si un string cumple el formato de ObjectId de MongoDB"""
        return bool(id_str and ObjectId.is_valid(id_str))

    @staticmethod
    def to_object_id(id_str: str) -> ObjectId:
        return ObjectId(id_str)

    async def find_by_id(self, id_str: str) -> Optional[Dict[str, Any]]:
        """Busca un documento por su _id de MongoDB"""
        if not self.is_valid_id(id_str):
            return None
        doc = await self.collection.find_one({"_id": self.to_object_id(id_str)})
        return doc

    async def delete_by_id(self, id_str: str) -> bool:
        """Elimina un documento por su _id de MongoDB"""
        if not self.is_valid_id(id_str):
            return False
        result = await self.collection.delete_one({"_id": self.to_object_id(id_str)})
        return result.deleted_count > 0

    async def update_by_id(self, id_str: str, update_data: Dict[str, Any]) -> bool:
        """Actualiza campos específicos de un documento por su _id"""
        if not self.is_valid_id(id_str):
            return False
        result = await self.collection.update_one(
            {"_id": self.to_object_id(id_str)},
            {"$set": update_data}
        )
        return result.matched_count > 0

    async def find_all(self, filter_query: Optional[Dict[str, Any]] = None, limit: int = 100, skip: int = 0) -> List[Dict[str, Any]]:
        """Obtiene múltiples documentos con paginación"""
        query = filter_query or {}
        cursor = self.collection.find(query).skip(skip).limit(limit)
        return await cursor.to_list(length=limit)

    @abstractmethod
    async def _ensure_indexes(self):
        """Define e inicializa los índices requeridos por la subclase"""
        pass
