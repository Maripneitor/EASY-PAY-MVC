from core.base_controller import BaseController
from models.wallet_model import WalletModel
from schemas.wallet_schema import BankCardCreate
from typing import Dict, Any, List
import uuid

class WalletController(BaseController):
    """
    Controlador OOP para la gestión de billetera y tarjetas bancarias.
    Hereda de BaseController.
    """
    def __init__(self):
        super().__init__()
        self._model = WalletModel()

    async def get_user_cards(self, user_id: str) -> List[Dict[str, Any]]:
        return await self._model.get_cards(user_id)

    async def get_default_card(self, user_id: str) -> Dict[str, Any]:
        card = await self._model.get_default_card(user_id)
        if not card:
            return self.error("No hay tarjeta predeterminada registrada", code="NOT_FOUND")
        return card

    async def add_card(self, user_id: str, card_data: BankCardCreate) -> Dict[str, Any]:
        card_dict = card_data.dict()
        card_dict["user_id"] = user_id
        card_dict["id"] = str(uuid.uuid4())

        card_id = await self._model.add_card(card_dict)
        return self.success("Tarjeta agregada correctamente", id=card_id)

    async def delete_card(self, user_id: str, card_id: str) -> Dict[str, Any]:
        success = await self._model.delete_card(user_id, card_id)
        if not success:
            return self.error("Tarjeta no encontrada o no se pudo eliminar", code="NOT_FOUND")
        return self.success("Tarjeta eliminada correctamente")

    async def set_default_card(self, user_id: str, card_id: str) -> Dict[str, Any]:
        success = await self._model.set_default(user_id, card_id)
        if not success:
            return self.error("No se pudo actualizar la tarjeta predeterminada", code="UPDATE_FAILED")
        return self.success("Tarjeta predeterminada actualizada")
