from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from controllers.ocr_controller import OcrController
from schemas.ocr_schema import OcrRequest
from utils.security import get_current_user_id

ocr_router = APIRouter(prefix="/api/ocr", tags=["OCR"])
controller = OcrController()

@ocr_router.post("/scan")
async def scan_ticket(request: OcrRequest, current_user_id: str = Depends(get_current_user_id)):
    if request.user_id and request.user_id != current_user_id:
        raise HTTPException(status_code=403, detail="No puedes procesar tickets para otro usuario")

    result = await controller.process_ticket(
        image_base64=request.image_base64,
        group_id=request.group_id,
        user_id=current_user_id
    )

    if controller.is_error(result):
        raise HTTPException(status_code=500, detail=result.get("message"))

    return {
        "success": True,
        "scan_id": result.get("ticket_id"),
        "data": result.get("data")
    }

@ocr_router.get("/history/{group_id}")
async def get_scan_history(group_id: str, current_user_id: str = Depends(get_current_user_id)):
    group = await controller._group_model.find_by_id(group_id)
    if not group or current_user_id not in group.get("integrantes", []):
        raise HTTPException(status_code=403, detail="No tienes acceso a este grupo")

    tickets = await controller._ocr_model.get_recent_tickets(limit=20)
    filtered = [t for t in tickets if t.get("group_id") == group_id]
    return {"group_id": group_id, "scans": filtered}

@ocr_router.get("/scan/{scan_id}")
async def get_scan(scan_id: str, current_user_id: str = Depends(get_current_user_id)):
    doc = await controller._ocr_model.find_by_id(scan_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Escaneo no encontrado.")

    if doc.get("user_id") != current_user_id:
        if doc.get("group_id"):
            group = await controller._group_model.find_by_id(doc["group_id"])
            if not group or current_user_id not in group.get("integrantes", []):
                raise HTTPException(status_code=403, detail="No tienes acceso a este escaneo")
        else:
            raise HTTPException(status_code=403, detail="No tienes acceso a este escaneo")

    doc["id"] = str(doc["_id"])
    del doc["_id"]
    return doc

@ocr_router.delete("/scan/{scan_id}")
async def delete_scan(scan_id: str, current_user_id: str = Depends(get_current_user_id)):
    doc = await controller._ocr_model.find_by_id(scan_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Escaneo no encontrado.")

    if doc.get("user_id") != current_user_id:
        raise HTTPException(status_code=403, detail="No tienes permiso para eliminar este escaneo")

    success = await controller._ocr_model.delete_by_id(scan_id)
    if success:
        return {"success": True, "deleted_id": scan_id}
    raise HTTPException(status_code=400, detail="No se pudo eliminar el escaneo.")
