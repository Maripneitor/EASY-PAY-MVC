from core.base_controller import BaseController
from models.group_model import GroupModel
from models.item_model import ItemModel
from schemas.group_schema import Group, GroupCreate, ItemCreate, ItemUpdate, SettlementCreate
from datetime import datetime
from typing import Dict, Any, List, Optional

class GroupController(BaseController):
    """
    Controlador OOP para la gestión de Grupos, Gastos y Liquidaciones.
    Hereda de BaseController.
    """
    def __init__(self):
        super().__init__()
        self._group_model = GroupModel()
        self._item_model = ItemModel()

    # ── Gestión de Grupos ─────────────────────────────────────────────────────
    async def create_group(self, data: GroupCreate) -> Dict[str, Any]:
        nuevo_grupo = Group(
            nombre=data.nombre,
            descripcion=data.descripcion,
            admin_id=data.admin_id,
            integrantes=[data.admin_id]
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
        return await self._group_model.find_by_id_detailed(group_id)

    async def join_group(self, codigo: str, user_id: str) -> Dict[str, Any]:
        group = await self._group_model.find_by_code(codigo)
        if not group:
            return self.error("Código de grupo no válido", code="NOT_FOUND")

        if user_id == group.get("admin_id") or user_id in group.get("integrantes", []):
            return self.error("Ya eres parte de este grupo", code="ALREADY_MEMBER", group_id=group["id"])

        success = await self._group_model.add_member(group["id"], user_id)
        if success:
            return self.success("Te has unido correctamente", group_id=group["id"])
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
