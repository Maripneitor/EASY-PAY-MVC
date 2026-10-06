import re
import os
import httpx
from datetime import datetime
from typing import Dict, Any, List, Optional
from core.base_controller import BaseController
from models.ocr_model import OcrModel
from models.group_model import GroupModel
from models.item_model import ItemModel

OCR_API_KEY = os.getenv("OCR_API_KEY", "K88694858788957")

class OcrController(BaseController):
    """
    Controlador OOP para el procesamiento y extracción de tickets por OCR.
    Hereda de BaseController.
    """
    def __init__(self):
        super().__init__()
        self._ocr_model = OcrModel()
        self._group_model = GroupModel()
        self._item_model = ItemModel()

    @staticmethod
    def clean_price(text: str) -> float:
        text = re.sub(r"[^\d.,]", "", text)
        if "," in text and "." in text:
            text = text.replace(",", "")
        elif "," in text:
            text = text.replace(",", ".")
        try:
            return float(text)
        except Exception:
            return 0.0

    def parse_ticket_text(self, raw_text: str) -> Dict[str, Any]:
        lines = [l.strip() for l in raw_text.split("\n") if l.strip()]
        items: List[Dict[str, Any]] = []
        total = 0.0

        for line in lines:
            # Buscar patrones de precio al final de la línea: ej. "Hamburguesa 120.00"
            match = re.search(r"(\$?\s*\d+[\.,]\d{2})\s*$", line)
            if match:
                price_str = match.group(1)
                price = self.clean_price(price_str)
                name = line[:match.start()].strip()
                name = re.sub(r"^\d+\s*x?\s*", "", name).strip()
                if name and price > 0:
                    items.append({
                        "name": name.capitalize(),
                        "price": price,
                        "quantity": 1
                    })
                    total += price

        return {
            "restaurant": "Comercio Detectado",
            "items": items,
            "total": round(total, 2),
            "raw_text": raw_text
        }

    async def call_ocr_space(self, image_base64: str) -> str:
        """Llama al motor OCR Space externo"""
        url = "https://api.ocr.space/parse/image"
        payload = {
            "apikey": OCR_API_KEY,
            "language": "spa",
            "isOverlayRequired": False,
            "base64Image": f"data:image/jpeg;base64,{image_base64}" if not image_base64.startswith("data:") else image_base64
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, data=payload)
            data = resp.json()
            if data.get("IsErroredOnProcessing"):
                raise ValueError(data.get("ErrorMessage", ["Error en OCR"])[0])
            parsed_results = data.get("ParsedResults", [])
            if not parsed_results:
                return ""
            return parsed_results[0].get("ParsedText", "")

    async def process_ticket(self, image_base64: str, group_id: Optional[str] = None, user_id: Optional[str] = None) -> Dict[str, Any]:
        """Procesa una imagen de ticket y persiste los resultados"""
        try:
            raw_text = await self.call_ocr_space(image_base64)
            parsed = self.parse_ticket_text(raw_text)

            # Guardar en base de datos
            ticket_doc = {
                **parsed,
                "group_id": group_id,
                "user_id": user_id,
                "created_at": datetime.utcnow()
            }
            ticket_id = await self._ocr_model.save_ticket(ticket_doc)

            return self.success(
                "Ticket procesado correctamente",
                ticket_id=ticket_id,
                data=parsed
            )
        except Exception as e:
            return self.error(f"Error procesando OCR: {str(e)}", code="OCR_FAILED")
