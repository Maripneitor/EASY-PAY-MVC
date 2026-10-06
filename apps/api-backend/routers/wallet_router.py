from fastapi import APIRouter, HTTPException, Depends
from controllers.wallet_controller import WalletController
from schemas.wallet_schema import BankCardCreate
from utils.security import get_current_user_id

wallet_router = APIRouter(prefix="/api/wallet", tags=["Wallet"])
controller = WalletController()

@wallet_router.get("/cards/{user_id}")
async def get_cards(user_id: str, current_user_id: str = Depends(get_current_user_id)):
    if user_id != current_user_id:
        raise HTTPException(status_code=403, detail="No puedes consultar tarjetas de otro usuario")
    return await controller.get_user_cards(user_id)

@wallet_router.get("/cards/{user_id}/default")
async def get_default_card(user_id: str, current_user_id: str = Depends(get_current_user_id)):
    if user_id != current_user_id:
        raise HTTPException(status_code=403, detail="No puedes consultar tarjetas de otro usuario")
    result = await controller.get_default_card(user_id)
    if controller.is_error(result):
        raise HTTPException(status_code=404, detail=result.get("message"))
    return result

@wallet_router.post("/cards/{user_id}")
async def add_card(user_id: str, card: BankCardCreate, current_user_id: str = Depends(get_current_user_id)):
    if user_id != current_user_id:
        raise HTTPException(status_code=403, detail="No puedes agregar tarjetas a otro usuario")
    result = await controller.add_card(user_id, card)
    return result

@wallet_router.delete("/cards/{user_id}/{card_id}")
async def delete_card(user_id: str, card_id: str, current_user_id: str = Depends(get_current_user_id)):
    if user_id != current_user_id:
        raise HTTPException(status_code=403, detail="No puedes eliminar tarjetas de otro usuario")
    result = await controller.delete_card(user_id, card_id)
    if controller.is_error(result):
        raise HTTPException(status_code=404, detail=result.get("message"))
    return result

@wallet_router.patch("/cards/{user_id}/{card_id}/default")
async def set_default_card(user_id: str, card_id: str, current_user_id: str = Depends(get_current_user_id)):
    if user_id != current_user_id:
        raise HTTPException(status_code=403, detail="No puedes modificar tarjetas de otro usuario")
    result = await controller.set_default_card(user_id, card_id)
    if controller.is_error(result):
        raise HTTPException(status_code=404, detail=result.get("message"))
    return result
