from fastapi import APIRouter, HTTPException, Depends
from controllers.stats_controller import StatsController
from core.permissions import get_current_user_id, require_permission

stats_router = APIRouter(
    prefix="/api/stats",
    tags=["Statistics"],
    dependencies=[Depends(require_permission("stats:read"))]
)
controller = StatsController()

@stats_router.get("/user/{user_id}/charts")
async def get_user_charts(user_id: str, current_user_id: str = Depends(get_current_user_id)):
    if user_id != current_user_id:
        raise HTTPException(status_code=403, detail="No puedes consultar estadísticas de otro usuario")
    return await controller.get_user_charts(user_id)

@stats_router.get("/user/{user_id}")
async def get_user_stats(user_id: str, current_user_id: str = Depends(get_current_user_id)):
    if user_id != current_user_id:
        raise HTTPException(status_code=403, detail="No puedes consultar estadísticas de otro usuario")
    return await controller.get_user_stats(user_id)

@stats_router.get("/global")
async def get_global_stats(current_user_id: str = Depends(get_current_user_id)):
    return await controller.get_global_stats()

@stats_router.get("/user/{user_id}/transactions")
async def get_user_transactions(user_id: str, current_user_id: str = Depends(get_current_user_id)):
    if user_id != current_user_id:
        raise HTTPException(status_code=403, detail="No puedes consultar transacciones de otro usuario")
    return await controller.get_user_transactions(user_id)
