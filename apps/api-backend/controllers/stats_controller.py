from core.base_controller import BaseController
from models.stats_model import StatsModel
from typing import Dict, Any, List

class StatsController(BaseController):
    """
    Controlador OOP de Estadísticas y Analítica Financiera.
    Hereda de BaseController.
    """
    def __init__(self):
        super().__init__()
        self._model = StatsModel()

    async def get_user_charts(self, user_id: str) -> Dict[str, Any]:
        """Genera series de datos para gráficas (categorías, comparativas)"""
        expenses_by_cat = await self._model.get_user_expenses_by_category(user_id)
        
        # Mapeo a formato de gráficas
        categories = [item.get("category", "Otros") for item in expenses_by_cat]
        amounts = [float(item.get("amount", 0)) for item in expenses_by_cat]

        return {
            "categories": categories,
            "amounts": amounts,
            "breakdown": expenses_by_cat
        }

    async def get_user_stats(self, user_id: str) -> Dict[str, Any]:
        expenses = await self._model.get_user_expenses_by_category(user_id)
        total_spent = sum(float(e.get('amount', 0)) for e in expenses) if expenses else 0.0

        return {
            "total_spent": round(total_spent, 2),
            "by_category": expenses if expenses else []
        }

    async def get_global_stats(self) -> Dict[str, Any]:
        return await self._model.get_global_stats()

    async def get_user_transactions(self, user_id: str) -> List[Dict[str, Any]]:
        return await self._model.get_user_transactions(user_id)
