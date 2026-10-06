from routers.user_router import user_router
from routers.admin_router import admin_router
from routers.wallet_router import wallet_router
from routers.group_router import group_router
from routers.stats_router import stats_router
from routers.ocr_router import ocr_router
from routers.notification_router import notification_router, reminder_worker

__all__ = [
    "user_router",
    "admin_router",
    "wallet_router",
    "group_router",
    "stats_router",
    "ocr_router",
    "notification_router",
    "reminder_worker"
]
