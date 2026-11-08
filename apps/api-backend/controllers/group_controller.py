from core.base_controller import BaseController
from models.group_model import GroupModel
from models.item_model import ItemModel
from models.invitation_model import InvitationModel
from models.user_model import UserModel
from models.notification_model import NotificationModel
from services.email_service import EmailService
from schemas.group_schema import Group, GroupCreate, ItemCreate, ItemUpdate, SettlementCreate
from datetime import datetime
import re
from typing import Dict, Any, List, Optional
from fastapi import BackgroundTasks

class GroupController(BaseController):
    """
    Controlador OOP para la gestión de Grupos, Gastos, Liquidaciones e Invitaciones.
    Hereda de BaseController.
    """
    def __init__(self):
        super().__init__()
        self._group_model = GroupModel()
        self._item_model = ItemModel()
        self._invitation_model = InvitationModel()
        self._user_model = UserModel()
        self._notification_model = NotificationModel()
        self._email_service = EmailService()

    # ── Gestión de Grupos ─────────────────────────────────────────────────────
    async def create_group(self, data: GroupCreate) -> Dict[str, Any]:
        nuevo_grupo = Group(
            nombre=data.nombre,
            descripcion=data.descripcion,
            admin_id=data.admin_id,
            integrantes=[data.admin_id],
            moneda=getattr(data, "moneda", "MXN") or "MXN"
        )

        group_id = await self._group_model.save_group(nuevo_grupo.model_dump())

        # Guardar ítems si vienen (ej. desde escaneo OCR)
        if data.items:
            for item in data.items:
                item["group_id"] = group_id
                item["comprador_id"] = data.admin_id
                item["participantes_ids"] = [data.admin_id]
                item["fecha_registro"] = datetime.utcnow()
                await self._item_model.save_item(item)

        return self.success(
            "Grupo creado con éxito",
            group_id=group_id,
            invite_code=nuevo_grupo.codigo_invitacion
        )

    async def get_user_groups(self, user_id: str) -> List[Dict[str, Any]]:
        return await self._group_model.find_by_user(user_id)

    async def get_group_details(self, group_id: str) -> Optional[Dict[str, Any]]:
        group = await self._group_model.find_by_id_detailed(group_id)
        if group:
            pending = await self._invitation_model.get_by_group(group_id, status="PENDING")
            group["pending_invitations"] = pending
        return group

    async def invite_member(
        self,
        group_id: str,
        email: str,
        current_user_id: str,
        background_tasks: Optional[BackgroundTasks] = None,
        origin_url: Optional[str] = None
    ) -> Dict[str, Any]:
        clean_email = email.strip().lower() if email else ""
        if not clean_email or "@" not in clean_email:
            return self.error("Correo electrónico no válido", code="INVALID_EMAIL")

        # Validación RFC de formato de correo
        if not re.match(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$", clean_email):
            return self.error("Formato de correo electrónico no válido", code="INVALID_EMAIL_FORMAT")

        group = await self._group_model.find_by_id(group_id)
        if not group:
            return self.error("Grupo no encontrado", code="NOT_FOUND")

        # 1. Validar que el usuario invitado no sea ya miembro activo ni el admin
        invited_user = await self._user_model.find_by_email(clean_email)
        if invited_user:
            invited_uid = str(invited_user["_id"])
            integrantes_raw = [str(m) for m in group.get("integrantes", [])]
            admin_uid = str(group.get("admin_id") or "")
            if invited_uid == admin_uid or invited_uid in integrantes_raw:
                return self.error("El usuario ya es miembro activo de este grupo", code="ALREADY_MEMBER")

        # 2. Validar si ya existe una invitación PENDING vigente
        existing_inv = await self._invitation_model.find_pending_by_group_and_email(group_id, clean_email)
        if existing_inv:
            return self.error("Ya existe una invitación pendiente para este correo", code="INVITATION_ALREADY_PENDING", invitation=existing_inv)

        # Obtener datos del remitente
        inviter = await self._user_model.get_user_by_id(current_user_id)
        inviter_name = inviter.get("nombre", "Un miembro del grupo") if inviter else "Un miembro del grupo"
        group_name = group.get("nombre", "Grupo de Gastos")
        group_code = group.get("codigo_invitacion", "")

        # 3. Crear registro de invitación
        invitation_data = {
            "group_id": group_id,
            "group_name": group_name,
            "invited_email": clean_email,
            "invited_by_user_id": current_user_id,
            "invited_by_name": inviter_name,
            "status": "PENDING"
        }
        invitation_id = await self._invitation_model.create_invitation(invitation_data)
        invitation_data["id"] = invitation_id

        # 4. Canal 1: Correo electrónico (despacho síncrono para verificar transporte)
        base_link = origin_url.rstrip("/") if origin_url else "http://localhost:5173"
        invite_url = f"{base_link}/join?code={group_code}&group={group_id}&invitation={invitation_id}"
        email_sent, email_error = await self._email_service.send_group_invitation(
            email_to=clean_email,
            group_name=group_name,
            invited_by_name=inviter_name,
            group_code=group_code,
            invite_url=invite_url
        )

        await self._invitation_model.update_delivery_status(invitation_id, email_sent, email_error)
        invitation_data["email_delivered"] = email_sent
        invitation_data["email_error"] = email_error

        # 5. Canal 2: Notificación Interna (si el usuario ya está registrado en la plataforma)
        if invited_user:
            target_uid = str(invited_user["_id"])
            await self._notification_model.create_notification({
                "user_id": target_uid,
                "type": "GROUP_INVITATION",
                "title": f"Invitación a {group_name}",
                "message": f"{inviter_name} te ha invitado a unirte al grupo '{group_name}'.",
                "group_id": group_id,
                "invitation_id": invitation_id,
                "group_name": group_name,
                "group_code": group_code,
                "invited_by_name": inviter_name
            })

        # 6. Evaluación honesta del resultado de entrega
        if not email_sent:
            if invited_user:
                return self.error(
                    f"Invitación creada en plataforma, pero falló el envío del correo ({clean_email}): {email_error}",
                    code="EMAIL_DELIVERY_FAILED",
                    invitation=invitation_data,
                    email_error=email_error
                )
            else:
                await self._invitation_model.update_status(invitation_id, "FAILED")
                return self.error(
                    f"No se pudo entregar el correo de invitación a {clean_email}: {email_error}",
                    code="EMAIL_FAILED",
                    email_error=email_error
                )

        return self.success(
            "Invitación enviada con éxito por correo" + (" y notificación interna" if invited_user else ""),
            invitation=invitation_data
        )

    async def accept_invitation(
        self,
        invitation_id: str,
        current_user_id: str,
        current_user_email: Optional[str] = None
    ) -> Dict[str, Any]:
        invitation = await self._invitation_model.get_invitation_by_id(invitation_id)
        if not invitation:
            return self.error("Invitación no encontrada", code="NOT_FOUND")

        if invitation.get("status") != "PENDING":
            return self.error(f"La invitación ya fue {invitation.get('status', '').lower()}", code="INVITATION_NOT_PENDING")

        # Verificar expiración
        expires_at = invitation.get("expires_at")
        if expires_at and expires_at < datetime.utcnow():
            await self._invitation_model.update_status(invitation_id, "EXPIRED")
            return self.error("La invitación ha expirado", code="INVITATION_EXPIRED")

        # Verificar que el usuario corresponda al correo si se proporciona
        if current_user_email:
            invited_email = invitation.get("invited_email", "").strip().lower()
            if invited_email != current_user_email.strip().lower():
                return self.error("Esta invitación fue enviada a otra dirección de correo", code="FORBIDDEN")

        group_id = invitation["group_id"]
        # Añadir al grupo
        await self._group_model.add_member(group_id, current_user_id)
        # Actualizar estado a ACCEPTED
        await self._invitation_model.update_status(invitation_id, "ACCEPTED")

        return self.success(
            "Te has unido exitosamente al grupo",
            group_id=group_id,
            group_name=invitation.get("group_name")
        )

    async def reject_invitation(
        self,
        invitation_id: str,
        current_user_id: str,
        current_user_email: Optional[str] = None
    ) -> Dict[str, Any]:
        invitation = await self._invitation_model.get_invitation_by_id(invitation_id)
        if not invitation:
            return self.error("Invitación no encontrada", code="NOT_FOUND")

        if invitation.get("status") != "PENDING":
            return self.error("La invitación no está pendiente", code="INVITATION_NOT_PENDING")

        if current_user_email:
            invited_email = invitation.get("invited_email", "").strip().lower()
            if invited_email != current_user_email.strip().lower():
                return self.error("Esta invitación no corresponde a tu cuenta", code="FORBIDDEN")

        await self._invitation_model.update_status(invitation_id, "REJECTED")
        return self.success("Invitación rechazada correctamente")

    async def cancel_invitation(
        self,
        invitation_id: str,
        current_user_id: str
    ) -> Dict[str, Any]:
        invitation = await self._invitation_model.get_invitation_by_id(invitation_id)
        if not invitation:
            return self.error("Invitación no encontrada", code="NOT_FOUND")

        group = await self._group_model.find_by_id(invitation.get("group_id"))
        admin_id = str(group.get("admin_id") or "") if group else ""
        inviter_id = str(invitation.get("invited_by_user_id") or "")

        if current_user_id != admin_id and current_user_id != inviter_id:
            return self.error("No tienes permisos para cancelar esta invitación", code="FORBIDDEN")

        success = await self._invitation_model.cancel_invitation(invitation_id)
        if success:
            return self.success("Invitación cancelada correctamente", group_id=invitation.get("group_id"))
        return self.error("No se pudo cancelar la invitación", code="CANCEL_FAILED")

    async def resend_invitation(
        self,
        invitation_id: str,
        current_user_id: str,
        origin_url: Optional[str] = None
    ) -> Dict[str, Any]:
        invitation = await self._invitation_model.get_invitation_by_id(invitation_id)
        if not invitation:
            return self.error("Invitación no encontrada", code="NOT_FOUND")

        if invitation.get("status") != "PENDING":
            return self.error(f"La invitación ya no está pendiente ({invitation.get('status')})", code="INVALID_STATUS")

        group = await self._group_model.find_by_id(invitation.get("group_id"))
        if not group:
            return self.error("Grupo no encontrado", code="NOT_FOUND")

        admin_id = str(group.get("admin_id") or "")
        inviter_id = str(invitation.get("invited_by_user_id") or "")
        if current_user_id != admin_id and current_user_id != inviter_id:
            return self.error("No tienes permisos para reenviar esta invitación", code="FORBIDDEN")

        inviter = await self._user_model.get_user_by_id(current_user_id)
        inviter_name = inviter.get("nombre", "Un miembro del grupo") if inviter else "Un miembro del grupo"
        group_name = group.get("nombre", "Grupo de Gastos")
        group_code = group.get("codigo_invitacion", "")
        clean_email = invitation.get("invited_email")

        base_link = origin_url.rstrip("/") if origin_url else "http://localhost:5173"
        invite_url = f"{base_link}/join?code={group_code}&group={invitation['group_id']}&invitation={invitation_id}"

        email_sent, email_error = await self._email_service.send_group_invitation(
            email_to=clean_email,
            group_name=group_name,
            invited_by_name=inviter_name,
            group_code=group_code,
            invite_url=invite_url
        )

        await self._invitation_model.update_delivery_status(invitation_id, email_sent, email_error)

        if not email_sent:
            return self.error(
                f"Fallo al reenviar correo a {clean_email}: {email_error}",
                code="EMAIL_FAILED",
                email_error=email_error
            )

        return self.success(
            f"Invitación reenviada con éxito a {clean_email}",
            invitation_id=invitation_id,
            email=clean_email
        )

    async def get_group_invitations(self, group_id: str) -> List[Dict[str, Any]]:
        return await self._invitation_model.get_by_group(group_id)

    async def get_user_pending_invitations(self, user_email: str) -> List[Dict[str, Any]]:
        return await self._invitation_model.get_pending_by_email(user_email)

    async def join_group(self, codigo: str, user_id: str) -> Dict[str, Any]:
        if not codigo or not str(codigo).strip():
            return self.error("El código de grupo es requerido", code="INVALID_CODE")

        clean_code = str(codigo).strip().upper()
        group = await self._group_model.find_by_code(clean_code)
        if not group:
            return self.error("Código de grupo no válido o no encontrado", code="NOT_FOUND")

        integrantes = [str(uid) for uid in group.get("integrantes", [])]
        admin_id = str(group.get("admin_id") or group.get("administrador_id") or "")
        current_uid = str(user_id)

        if current_uid == admin_id or current_uid in integrantes:
            return self.error("Ya eres parte de este grupo", code="ALREADY_MEMBER", group_id=group["id"])

        success = await self._group_model.add_member(group["id"], current_uid)
        if success:
            return self.success("Te has unido correctamente", group_id=group["id"], group_name=group.get("nombre"))
        return self.error("No se pudo completar la unión al grupo", code="JOIN_FAILED")

    async def delete_group(self, group_id: str) -> Dict[str, Any]:
        success = await self._group_model.delete_group(group_id)
        if success:
            return self.success("Grupo eliminado correctamente")
        return self.error("No se pudo eliminar el grupo o no existe", code="DELETE_FAILED")

    # ── Gestión de Gastos / Items ─────────────────────────────────────────────
    async def add_item(self, data: ItemCreate) -> Dict[str, Any]:
        group = await self._group_model.find_by_id(data.group_id)
        if not group:
            return self.error("El grupo no existe", code="NOT_FOUND")

        item_dict = data.model_dump()
        item_dict["fecha_registro"] = datetime.utcnow()
        item_id = await self._item_model.save_item(item_dict)

        return self.success(f"Gasto '{data.nombre}' registrado correctamente", item_id=item_id)

    async def get_group_items(self, group_id: str) -> List[Dict[str, Any]]:
        return await self._item_model.find_by_group(group_id)

    async def update_item(self, item_id: str, data: ItemUpdate) -> Dict[str, Any]:
        update_data = {k: v for k, v in data.model_dump().items() if v is not None}
        if not update_data:
            return self.error("No se enviaron datos para actualizar", code="EMPTY_UPDATE")

        success = await self._item_model.update_item(item_id, update_data)
        if success:
            return self.success("Gasto actualizado correctamente")
        return self.error("No se pudo actualizar el gasto", code="UPDATE_FAILED")

    async def delete_item(self, item_id: str) -> Dict[str, Any]:
        success = await self._item_model.delete_item(item_id)
        if success:
            return self.success("Gasto eliminado correctamente")
        return self.error("No se pudo eliminar el gasto", code="DELETE_FAILED")

    # ── Balances y División de Cuentas ────────────────────────────────────────
    async def calculate_balances(self, group_id: str) -> Dict[str, Any]:
        group = await self._group_model.find_by_id(group_id)
        if not group:
            return self.error("Grupo no encontrado", code="NOT_FOUND")

        integrantes = [str(uid) for uid in group.get("integrantes", [])]
        items = await self._item_model.find_by_group(group_id)

        balances_netos = {u_id: 0.0 for u_id in integrantes}
        consumos_individuales = {u_id: 0.0 for u_id in integrantes}
        total_grupo = 0.0

        for item in items:
            precio_base = (item.get("precio") or item.get("monto") or 0)
            cantidad = item.get("cantidad", 1)

            impuesto_val = item.get("impuesto_porcentaje", 0) / 100
            propina_val = item.get("propina_porcentaje", 0) / 100

            precio_con_extra = precio_base * (1 + impuesto_val + propina_val)
            costo_total = precio_con_extra * cantidad

            total_grupo += costo_total

            comprador = str(item.get("comprador_id"))
            participantes = [str(pid) for pid in item.get("participantes_ids", [])]

            if comprador in balances_netos:
                balances_netos[comprador] += costo_total

            if participantes:
                cuota_item = costo_total / len(participantes)
                for p_id in participantes:
                    if p_id in balances_netos:
                        balances_netos[p_id] -= cuota_item
                        consumos_individuales[p_id] += cuota_item

        # Ajuste de liquidaciones aprobadas
        settlements = await self._group_model.get_settlements_by_group(group_id)
        for s in settlements:
            if s.get("status") == "approved":
                p_id = str(s["payer_id"])
                r_id = str(s["receiver_id"])
                amount = s.get("amount", 0.0)

                if p_id in balances_netos:
                    balances_netos[p_id] += amount
                if r_id in balances_netos:
                    balances_netos[r_id] -= amount

        # Propina del grupo
        propina_percent = 0.10 if total_grupo < 3000 else 0.05
        total_propina = total_grupo * propina_percent
        total_con_propina = total_grupo + total_propina

        if integrantes:
            cuota_propina = total_propina / len(integrantes)
            for u_id in integrantes:
                balances_netos[u_id] -= cuota_propina
                consumos_individuales[u_id] += cuota_propina

            admin_id = str(group.get("admin_id") or group.get("administrador_id"))
            if admin_id in balances_netos:
                balances_netos[admin_id] += total_propina

        detalle = []
        for u_id in integrantes:
            balance = balances_netos[u_id]
            detalle.append({
                "usuario_id": u_id,
                "balance": round(balance, 2),
                "cuota_correspondiente": round(consumos_individuales[u_id], 2),
                "estado": "favor" if balance >= 0 else "deuda"
            })

        return self.success(
            "Balances calculados exitosamente",
            total_gastado_en_grupo=round(total_grupo, 2),
            propina_total=round(total_propina, 2),
            total_con_propina=round(total_con_propina, 2),
            balance_detallado=detalle
        )

    # ── Liquidación del Grupo ─────────────────────────────────────────────────
    async def liquidate_group(self, group_id: str, user_id: str) -> Dict[str, Any]:
        group = await self._group_model.find_by_id(group_id)
        if not group:
            return self.error("Grupo no encontrado", code="NOT_FOUND")

        if group.get("admin_id") != user_id and group.get("administrador_id") != user_id:
            return self.error("Solo el administrador puede liquidar el grupo", code="UNAUTHORIZED")

        balances_res = await self.calculate_balances(group_id)
        balance_detallado = balances_res.get("balance_detallado", [])

        total_debt = sum(abs(m['balance']) for m in balance_detallado if m.get('balance', 0) < -0.01)
        if total_debt > 0.01:
            return self.error(
                f"No se puede liquidar. Aún hay deudas pendientes por un total de ${round(total_debt, 2)}",
                code="OUTSTANDING_DEBTS"
            )

        updated_status = {"status": "liquidated", "estado": "liquidated"}
        await self._group_model.update_group(group_id, updated_status)
        return self.success("Grupo liquidado exitosamente", status="liquidated")

    # ── Pagos / Settlements ───────────────────────────────────────────────────
    async def create_settlement(self, data: SettlementCreate) -> Dict[str, Any]:
        settlement_dict = data.model_dump()
        settlement_id = await self._group_model.save_settlement(settlement_dict)
        return self.success("Comprobante de pago enviado para revisión", settlement_id=settlement_id)

    async def get_group_settlements(self, group_id: str) -> List[Dict[str, Any]]:
        return await self._group_model.get_settlements_by_group(group_id)

    async def update_settlement_status(self, settlement_id: str, status: str) -> Dict[str, Any]:
        success = await self._group_model.update_settlement_status(settlement_id, status)
        if success:
            return self.success(f"Pago {status} exitosamente")
        return self.error("No se pudo actualizar el estado del pago", code="UPDATE_FAILED")
