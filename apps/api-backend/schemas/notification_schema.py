from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from enum import Enum
from datetime import datetime

class NotificationType(str, Enum):
    user_joined = "user_joined"
    group_closed = "group_closed"
    item_assigned = "item_assigned"
    payment_due = "payment_due"
    payment_received = "payment_received"
    invitation = "invitation"
    reminder = "reminder"

class NotificationCreate(BaseModel):
    user_id: str
    type: NotificationType
    title: str
    body: str
    group_id: Optional[str] = None
    amount: Optional[float] = None
    from_user_id: Optional[str] = None
    from_user_name: Optional[str] = None
    data: Optional[dict] = None

class DebtCreate(BaseModel):
    group_id: str
    group_name: str
    from_user_id: str
    from_user_name: str
    to_user_id: str
    to_user_name: str
    amount: float
    description: Optional[str] = None
