from pydantic import BaseModel
from typing import Optional, List

class TicketItem(BaseModel):
    name: str
    price: float
    quantity: int = 1

class OcrRequest(BaseModel):
    image_base64: str
    group_id: Optional[str] = None
    user_id: Optional[str] = None
