from abc import ABC
from typing import Any, Dict, Optional
import logging

class BaseController(ABC):
    """
    Clase base abstracta (OOP) para todos los controladores MVC.
    Estandariza los formatos de respuesta (status success/error),
    manejo de errores y logging.
    """
    def __init__(self):
        self.logger = logging.getLogger(self.__class__.__name__)

    @staticmethod
    def success(message: str = "Operación exitosa", **kwargs) -> Dict[str, Any]:
        """Genera un diccionario de respuesta exitosa estandarizado"""
        payload = {
            "status": "success",
            "message": message
        }
        payload.update(kwargs)
        return payload

    @staticmethod
    def error(message: str, code: str = "BAD_REQUEST", **kwargs) -> Dict[str, Any]:
        """Genera un diccionario de error estandarizado"""
        payload = {
            "status": "error",
            "error_code": code,
            "message": message
        }
        payload.update(kwargs)
        return payload

    @staticmethod
    def is_success(response: Dict[str, Any]) -> bool:
        return response.get("status") == "success"

    @staticmethod
    def is_error(response: Dict[str, Any]) -> bool:
        return response.get("status") == "error"
