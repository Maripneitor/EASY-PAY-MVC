from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, WebSocket, WebSocketDisconnect, Request
from typing import Optional, List, Dict, Any
import httpx
import os
import json

from controllers.group_controller import GroupController
from schemas.group_schema import GroupCreate, GroupJoin, ItemCreate, ItemUpdate, SettlementCreate
from schemas.invitation_schema import InvitationCreate, InvitationResponse
from core.permissions import get_current_user_id, require_permission, get_current_user_with_permissions

group_router = APIRouter(prefix="/api/groups", tags=["Groups"], redirect_slashes=False)
controller = GroupController()

NOTIFICATION_SERVICE_URL = os.getenv("NOTIFICATION_SERVICE_URL", "http://notification-service:8000")

# ── WebSocket Connection Manager ──────────────────────────────────────────────
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, group_id: str):
        await websocket.accept()
        if group_id not in self.active_connections:
            self.active_connections[group_id] = []
        self.active_connections[group_id].append(websocket)

    def disconnect(self, websocket: WebSocket, group_id: str):
        if group_id in self.active_connections:
            self.active_connections[group_id].remove(websocket)
            if not self.active_connections[group_id]:
                del self.active_connections[group_id]

    async def broadcast(self, group_id: str, message: dict):
        if group_id in self.active_connections:
            for connection in self.active_connections[group_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    pass

manager = ConnectionManager()

@group_router.websocket("/ws/{group_id}")
async def websocket_endpoint(websocket: WebSocket, group_id: str):
    await manager.connect(websocket, group_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, group_id)
    except Exception:
        manager.disconnect(websocket, group_id)

# ── Rutas de Grupos ───────────────────────────────────────────────────────────
@group_router.post("/create", dependencies=[Depends(require_permission("groups:write"))])
async def create_group(group_data: GroupCreate, user: dict = Depends(get_current_user_with_permissions)):
    current_user_id = user["id"]
    group_data.admin_id = current_user_id
    result = await controller.create_group(group_data)
    return result

@group_router.post("/join", dependencies=[Depends(require_permission("groups:read"))])
async def join_group(data: GroupJoin, current_user_id: str = Depends(get_current_user_id)):
    result = await controller.join_group(data.codigo, current_user_id)
    if controller.is_error(result):
        code = result.get("code")
        status_code = 404 if code == "NOT_FOUND" else (409 if code == "ALREADY_MEMBER" else 400)
        raise HTTPException(
            status_code=status_code, 
            detail={
                "message": result.get("message"), 
                "code": code,
                "group_id": result.get("group_id")
            }
        )

    # Notificar a los integrantes conectados en tiempo real por WebSocket
    group_id = result.get("group_id")
    if group_id:
        await manager.broadcast(group_id, {
            "type": "USER_JOINED", 
            "user_id": current_user_id,
            "group_id": group_id
        })
    return result

@group_router.get("/user/{user_id}", dependencies=[Depends(require_permission("groups:read"))])
async def get_user_groups(user_id: str, current_user_id: str = Depends(get_current_user_id)):
    if user_id != current_user_id:
        raise HTTPException(status_code=403, detail="No autorizado para consultar grupos de otro usuario")
    return await controller.get_user_groups(user_id)

# ── Rutas de Invitaciones a Grupos ───────────────────────────────────────────
@group_router.get("/invitations/pending", dependencies=[Depends(require_permission("groups:read"))])
async def get_my_pending_invitations(user: dict = Depends(get_current_user_with_permissions)):
    user_email = user.get("email", "")
    if not user_email:
        return []
    return await controller.get_user_pending_invitations(user_email)

@group_router.post("/invitations/{invitation_id}/accept", dependencies=[Depends(require_permission("groups:read"))])
async def accept_group_invitation(
    invitation_id: str,
    user: dict = Depends(get_current_user_with_permissions)
):
    current_user_id = user["id"]
    current_user_email = user.get("email")
    result = await controller.accept_invitation(invitation_id, current_user_id, current_user_email)
    if controller.is_error(result):
        code = result.get("code")
        status_code = 404 if code == "NOT_FOUND" else (
            403 if code == "FORBIDDEN" else 400
        )
        raise HTTPException(status_code=status_code, detail=result.get("message"))
    
    group_id = result.get("group_id")
    if group_id:
        await manager.broadcast(group_id, {
            "type": "USER_JOINED",
            "user_id": current_user_id,
            "group_id": group_id
        })
    return result

@group_router.post("/invitations/{invitation_id}/reject", dependencies=[Depends(require_permission("groups:read"))])
async def reject_group_invitation(
    invitation_id: str,
    user: dict = Depends(get_current_user_with_permissions)
):
    current_user_id = user["id"]
    current_user_email = user.get("email")
    result = await controller.reject_invitation(invitation_id, current_user_id, current_user_email)
    if controller.is_error(result):
        code = result.get("code")
        status_code = 404 if code == "NOT_FOUND" else (
            403 if code == "FORBIDDEN" else 400
        )
        raise HTTPException(status_code=status_code, detail=result.get("message"))
    return result

@group_router.delete("/invitations/{invitation_id}", dependencies=[Depends(require_permission("groups:write"))])
@group_router.post("/invitations/{invitation_id}/cancel", dependencies=[Depends(require_permission("groups:write"))])
async def cancel_group_invitation(
    invitation_id: str,
    user: dict = Depends(get_current_user_with_permissions)
):
    current_user_id = user["id"]
    result = await controller.cancel_invitation(invitation_id, current_user_id)
    if controller.is_error(result):
        code = result.get("code")
        status_code = 404 if code == "NOT_FOUND" else (
            403 if code == "FORBIDDEN" else 400
        )
        raise HTTPException(status_code=status_code, detail=result.get("message"))

    group_id = result.get("group_id")
    if group_id:
        await manager.broadcast(group_id, {
            "type": "INVITATION_CANCELLED",
            "invitation_id": invitation_id,
            "group_id": group_id
        })
    return result

@group_router.post("/invitations/{invitation_id}/resend", dependencies=[Depends(require_permission("groups:write"))])
async def resend_group_invitation(
    invitation_id: str,
    request: Request,
    user: dict = Depends(get_current_user_with_permissions)
):
    current_user_id = user["id"]
    origin_header = request.headers.get("origin") or request.headers.get("referer")
    result = await controller.resend_invitation(invitation_id, current_user_id, origin_header)
    if controller.is_error(result):
        code = result.get("code")
        status_code = 404 if code == "NOT_FOUND" else (
            403 if code == "FORBIDDEN" else 400
        )
        raise HTTPException(status_code=status_code, detail=result.get("message"))
    return result

@group_router.get("/{group_id}", dependencies=[Depends(require_permission("groups:read"))])
async def get_group(group_id: str, current_user_id: str = Depends(get_current_user_id)):
    group = await controller.get_group_details(group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Grupo no encontrado")
    return group

@group_router.put("/{group_id}", dependencies=[Depends(require_permission("groups:write"))])
async def update_group(group_id: str, group_data: dict, current_user_id: str = Depends(get_current_user_id)):
    group = await controller._group_model.find_by_id(group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Grupo no encontrado")
    if group.get("admin_id") != current_user_id:
        raise HTTPException(status_code=403, detail="Solo el admin puede editar el grupo")
    success = await controller._group_model.update_group(group_id, group_data)
    if success:
        return {"status": "success", "message": "Grupo actualizado correctamente"}
    raise HTTPException(status_code=400, detail="No se pudo actualizar el grupo")

@group_router.delete("/{group_id}", tags=["Groups"], dependencies=[Depends(require_permission("groups:delete"))])
@group_router.delete("/delete/{group_id}", include_in_schema=False, dependencies=[Depends(require_permission("groups:delete"))])
async def delete_group(group_id: str, current_user_id: str = Depends(get_current_user_id)):
    group = await controller._group_model.find_by_id(group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Grupo no encontrado")
    if group.get("admin_id") != current_user_id:
        raise HTTPException(status_code=403, detail="Solo el administrador puede eliminar el grupo")
    result = await controller.delete_group(group_id)
    if controller.is_error(result):
        raise HTTPException(status_code=400, detail=result.get("message"))
    return result

# ── Rutas de Integrantes e Invitaciones ───────────────────────────────────────
@group_router.post("/{group_id}/invite", dependencies=[Depends(require_permission("groups:write"))])
async def invite_member_to_group(
    group_id: str,
    payload: InvitationCreate,
    background_tasks: BackgroundTasks,
    request: Request,
    user: dict = Depends(get_current_user_with_permissions)
):
    current_user_id = user["id"]
    origin_header = request.headers.get("origin") or request.headers.get("referer")
    result = await controller.invite_member(
        group_id=group_id,
        email=payload.email,
        current_user_id=current_user_id,
        background_tasks=background_tasks,
        origin_url=origin_header
    )
    if controller.is_error(result):
        code = result.get("code")
        status_code = 409 if code in ("ALREADY_MEMBER", "INVITATION_ALREADY_PENDING") else (
            404 if code == "NOT_FOUND" else 400
        )
        raise HTTPException(status_code=status_code, detail=result.get("message"))
    
    await manager.broadcast(group_id, {
        "type": "INVITATION_SENT",
        "email": payload.email,
        "group_id": group_id
    })
    return result

@group_router.get("/{group_id}/invitations", dependencies=[Depends(require_permission("groups:read"))])
async def get_group_invitations(group_id: str, current_user_id: str = Depends(get_current_user_id)):
    return await controller.get_group_invitations(group_id)

@group_router.post("/{group_id}/members", dependencies=[Depends(require_permission("groups:write"))])
async def add_member(
    group_id: str,
    payload: dict,
    background_tasks: BackgroundTasks,
    request: Request,
    user: dict = Depends(get_current_user_with_permissions)
):
    """
    Ruta para agregar integrantes al grupo.
    Por regla de consentimiento, NO inserta de inmediato al usuario en integrantes:
    crea una invitación en estado PENDING y dispara el doble canal (Correo + Notificación).
    """
    target_email = payload.get("email")
    target_user_id = payload.get("user_id")

    if not target_email and target_user_id:
        target_user = await controller._user_model.get_user_by_id(target_user_id)
        if not target_user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        target_email = target_user.get("email")

    if not target_email:
        raise HTTPException(status_code=400, detail="Se requiere user_id o email válido para invitar")

    current_user_id = user["id"]
    origin_header = request.headers.get("origin") or request.headers.get("referer")
    result = await controller.invite_member(
        group_id=group_id,
        email=target_email,
        current_user_id=current_user_id,
        background_tasks=background_tasks,
        origin_url=origin_header
    )
    if controller.is_error(result):
        code = result.get("code")
        status_code = 409 if code in ("ALREADY_MEMBER", "INVITATION_ALREADY_PENDING") else (
            404 if code == "NOT_FOUND" else 400
        )
        raise HTTPException(status_code=status_code, detail=result.get("message"))

    await manager.broadcast(group_id, {
        "type": "INVITATION_SENT",
        "email": target_email,
        "group_id": group_id
    })
    return {
        "status": "success",
        "message": "Invitación enviada. El usuario aparecerá como pendiente hasta que acepte.",
        "data": result.get("invitation")
    }

@group_router.delete("/{group_id}/members/{user_id}")
async def remove_member(group_id: str, user_id: str, current_user_id: str = Depends(get_current_user_id)):
    group = await controller._group_model.find_by_id(group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Grupo no encontrado")
    if group.get("admin_id") != current_user_id and user_id != current_user_id:
        raise HTTPException(status_code=403, detail="No autorizado para eliminar a este integrante")
    success = await controller._group_model.remove_member(group_id, user_id)
    if success:
        return {"status": "success", "message": "Integrante eliminado correctamente"}
    raise HTTPException(status_code=400, detail="No se pudo eliminar el integrante")

# ── Rutas de Items / Gastos ───────────────────────────────────────────────────
@group_router.post("/add-item", dependencies=[Depends(require_permission("expenses:write"))])
async def add_item(item_data: ItemCreate, current_user_id: str = Depends(get_current_user_id)):
    result = await controller.add_item(item_data)
    if controller.is_error(result):
        raise HTTPException(status_code=400, detail=result.get("message"))
    await manager.broadcast(item_data.group_id, {"type": "NEW_EXPENSE", "data": result})
    return result

@group_router.get("/{group_id}/items", dependencies=[Depends(require_permission("expenses:read"))])
async def get_items(group_id: str, current_user_id: str = Depends(get_current_user_id)):
    return await controller.get_group_items(group_id)

@group_router.get("/{group_id}/items/{item_id}", dependencies=[Depends(require_permission("expenses:read"))])
async def get_item_by_id(group_id: str, item_id: str, current_user_id: str = Depends(get_current_user_id)):
    item = await controller._item_model.find_by_id(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
    return item

@group_router.put("/{group_id}/items/{item_id}", dependencies=[Depends(require_permission("expenses:write"))])
async def update_item(group_id: str, item_id: str, item_data: ItemUpdate, current_user_id: str = Depends(get_current_user_id)):
    result = await controller.update_item(item_id, item_data)
    if controller.is_error(result):
        raise HTTPException(status_code=400, detail=result.get("message"))
    await manager.broadcast(group_id, {"type": "UPDATE_EXPENSE", "item_id": item_id})
    return result

@group_router.delete("/{group_id}/items/{item_id}", dependencies=[Depends(require_permission("expenses:delete"))])
async def delete_item(group_id: str, item_id: str, current_user_id: str = Depends(get_current_user_id)):
    result = await controller.delete_item(item_id)
    if controller.is_error(result):
        raise HTTPException(status_code=400, detail=result.get("message"))
    await manager.broadcast(group_id, {"type": "DELETE_EXPENSE", "item_id": item_id})
    return result

# ── Balances y Finiquito ──────────────────────────────────────────────────────
@group_router.get("/{group_id}/balances", dependencies=[Depends(require_permission("expenses:read"))])
async def get_balances(group_id: str, current_user_id: str = Depends(get_current_user_id)):
    result = await controller.calculate_balances(group_id)
    if controller.is_error(result):
        raise HTTPException(status_code=404, detail=result.get("message"))
    return result

@group_router.post("/{group_id}/start-settlement", dependencies=[Depends(require_permission("expenses:write"))])
async def start_settlement(group_id: str, payload: dict, current_user_id: str = Depends(get_current_user_id)):
    group = await controller._group_model.find_by_id(group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Grupo no encontrado")
    if group.get("admin_id") != current_user_id:
        raise HTTPException(status_code=403, detail="Solo el admin puede iniciar el proceso de finiquito")

    bank_accounts = payload.get("bank_accounts", [])
    update_data = {
        "status": "settling",
        "selected_bank_accounts": bank_accounts
    }
    await controller._group_model.update_group(group_id, update_data)
    await manager.broadcast(group_id, {"type": "SETTLEMENT_STARTED", "group_id": group_id})
    return {"status": "success", "message": "Proceso de finiquito iniciado"}

@group_router.post("/{group_id}/close", dependencies=[Depends(require_permission("groups:write"))])
async def close_group(group_id: str, current_user_id: str = Depends(get_current_user_id)):
    group = await controller._group_model.find_by_id(group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Grupo no encontrado")
    if group.get("admin_id") != current_user_id:
        raise HTTPException(status_code=403, detail="Solo el admin puede cerrar el grupo")

    await controller._group_model.update_group(group_id, {"status": "closed"})
    await manager.broadcast(group_id, {"type": "GROUP_CLOSED", "group_id": group_id})
    return {"status": "success", "message": "Grupo cerrado correctamente"}

@group_router.post("/{group_id}/liquidate", dependencies=[Depends(require_permission("expenses:write"))])
async def liquidate_group(group_id: str, current_user_id: str = Depends(get_current_user_id)):
    result = await controller.liquidate_group(group_id, current_user_id)
    if controller.is_error(result):
        status_code = 403 if result.get("error_code") == "UNAUTHORIZED" else 400
        raise HTTPException(status_code=status_code, detail=result.get("message"))
    await manager.broadcast(group_id, {"type": "GROUP_LIQUIDATED", "group_id": group_id})
    return result

# ── Pagos / Settlements ───────────────────────────────────────────────────────
@group_router.post("/{group_id}/settlements", dependencies=[Depends(require_permission("expenses:write"))])
async def register_settlement(group_id: str, data: SettlementCreate, current_user_id: str = Depends(get_current_user_id)):
    data.group_id = group_id
    data.payer_id = current_user_id
    result = await controller.create_settlement(data)
    await manager.broadcast(group_id, {"type": "NEW_SETTLEMENT", "data": result})
    return result

@group_router.get("/{group_id}/settlements/pending", dependencies=[Depends(require_permission("expenses:read"))])
async def get_pending_settlements(group_id: str, current_user_id: str = Depends(get_current_user_id)):
    settlements = await controller.get_group_settlements(group_id)
    return [s for s in settlements if s.get("status") == "pending"]

@group_router.post("/{group_id}/settlements/{settlement_id}/approve", dependencies=[Depends(require_permission("expenses:write"))])
async def approve_settlement(group_id: str, settlement_id: str, current_user_id: str = Depends(get_current_user_id)):
    group = await controller._group_model.find_by_id(group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Grupo no encontrado")
    if group.get("admin_id") != current_user_id:
        raise HTTPException(status_code=403, detail="Solo el admin puede aprobar liquidaciones")
    result = await controller.update_settlement_status(settlement_id, "approved")
    await manager.broadcast(group_id, {"type": "SETTLEMENT_APPROVED", "settlement_id": settlement_id})
    return result

@group_router.post("/{group_id}/settlements/{settlement_id}/reject", dependencies=[Depends(require_permission("expenses:write"))])
async def reject_settlement(group_id: str, settlement_id: str, current_user_id: str = Depends(get_current_user_id)):
    group = await controller._group_model.find_by_id(group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Grupo no encontrado")
    if group.get("admin_id") != current_user_id:
        raise HTTPException(status_code=403, detail="Solo el admin puede rechazar liquidaciones")
    result = await controller.update_settlement_status(settlement_id, "rejected")
    await manager.broadcast(group_id, {"type": "SETTLEMENT_REJECTED", "settlement_id": settlement_id})
    return result
