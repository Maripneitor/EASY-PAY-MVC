import { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { groupRepository, userRepository } from '@infrastructure/api/repositories';
import { useAuthContext } from '@ui/context/AuthContext';
import { ROUTES } from '@infrastructure/routes';
import { toast } from 'sonner';
import { httpClient } from '@infrastructure/api/http-client';

export const useGroupDetail = (groupId: string) => {
    const [activeTab, setActiveTab] = useState<'actividades' | 'saldos' | 'miembros' | 'ajustes' | 'pagos'>('actividades');
    const { user, token } = useAuthContext();
    const queryClient = useQueryClient();
    const myId = user?.id;

    const normalizeId = (id: any) => {
        if (!id) return "";
        if (typeof id === 'string') return id;
        return id.$oid || id.id || id._id || id.toString();
    };

    const { data, isLoading, refetch, isFetching } = useQuery({
        queryKey: ['group', groupId],
        queryFn: async () => {
            if (!groupId || groupId === ':groupId' || groupId === 'undefined' || groupId === '') {
                return null;
            }

            const [resGroup, resItems, resBalances] = await Promise.all([
                httpClient.get(`/groups/${groupId}`),
                httpClient.get(`/groups/${groupId}/items`),
                httpClient.get(`/groups/${groupId}/balances`)
            ]);

            const gData = resGroup.data || {};
            const itemsData = resItems.data || [];
            const bData = resBalances.data || {};

            if (gData.status === 'error' || bData.status === 'error') {
                throw new Error(gData.message || bData.message || "Error al cargar datos");
            }

            const lId = normalizeId(gData.admin_id || gData.administrador_id);
            if (lId && !leaderProfile) {
                httpClient.get(`/auth/profile/${lId}`).then(res => setLeaderProfile(res.data)).catch(console.error);
            }

            const itemsList = (Array.isArray(itemsData) ? itemsData : (itemsData.items || []))
                .map((item: any) => ({
                    ...item,
                    id: normalizeId(item.id || item._id),
                    comprador_id: normalizeId(item.comprador_id),
                    monto: Number(item.monto || item.precio || 0),
                    participantes_ids: (item.participantes_ids || []).map((pid: any) => normalizeId(pid))
                }));

            const rawMembers = gData.integrantes || gData.participantes || [];
            let membersData: any[] = [];
            let members: any[] = [];

            if (rawMembers.length > 0 && typeof rawMembers[0] === 'object') {
                membersData = rawMembers.map((m: any) => ({
                    ...m,
                    id: normalizeId(m.id || m._id)
                }));
                members = membersData;
            } else {
                members = rawMembers.map((id: string) => ({ id: normalizeId(id), nombre: 'Usuario' }));
                membersData = members;
            }

            const detailedBalances = Array.isArray(bData.balance_detallado) 
                ? bData.balance_detallado.map((b: any) => {
                    const uId = normalizeId(b.usuario_id);
                    const foundUser = membersData.find(i => i.id === uId);
                    return {
                        ...b,
                        usuario_id: uId,
                        persona: foundUser ? (foundUser.nombre || foundUser.name) : (b.nombre || "Usuario")
                    };
                })
                : [];

            return {
                groupName: gData.nombre || gData.name || "Grupo",
                groupDescription: gData.descripcion || "",
                groupCode: gData.codigo_invitacion || gData.codigo || "---",
                adminId: normalizeId(gData.admin_id || gData.administrador_id),
                status: gData.status || "active",
                selectedBankAccounts: gData.selected_bank_accounts || [],
                members,
                membersData,
                activities: itemsList,
                balances: detailedBalances,
                totalSpent: bData.total_gastado_en_grupo || bData.total_gastado || 0
            };
        },
        enabled: !!groupId && groupId !== ':groupId',
        staleTime: 30000 // Aumentar staleTime ya que usaremos WS para invalidar
    });

    // --- WebSocket Logic ---
    useEffect(() => {
        if (!groupId || !token || groupId === ':groupId') return;

        let socket: WebSocket | null = null;
        let reconnectTimer: any = null;

        const connect = () => {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const host = window.location.hostname === 'localhost' ? 'localhost:8001' : window.location.host;
            const wsUrl = `${protocol}//${host}/api/groups/ws/groups/${groupId}?token=${token}`;
            
            console.log(`[WS] Conectando a ${wsUrl}`);
            socket = new WebSocket(wsUrl);

            socket.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    console.log("[WS] Mensaje recibido:", msg);
                    
                    // Invalidar queries para refrescar datos
                    queryClient.invalidateQueries({ queryKey: ['group', groupId] });
                    queryClient.invalidateQueries({ queryKey: ['pending-settlements', groupId] });
                    
                    if (msg.type === 'payment_reported') {
                        toast.info("Un miembro ha reportado un pago");
                    } else if (msg.type === 'settlement_updated') {
                        toast.success("El estado de una liquidación ha cambiado");
                    }
                } catch (e) {
                    console.error("[WS] Error parseando mensaje:", e);
                }
            };

            socket.onclose = () => {
                console.log("[WS] Conexión cerrada. Reintentando en 5s...");
                reconnectTimer = setTimeout(connect, 5000);
            };

            socket.onerror = (err) => {
                console.error("[WS] Error:", err);
                socket?.close();
            };
        };

        connect();

        return () => {
            if (socket) {
                socket.onclose = null;
                socket.close();
            }
            if (reconnectTimer) clearTimeout(reconnectTimer);
        };
    }, [groupId, token, queryClient]);

    const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
    const [leaderProfile, setLeaderProfile] = useState<any>(null);

    const removeMember = async (userId: string) => {
        try {
            await groupRepository.removeMember(groupId, userId);
            toast.success("Miembro eliminado");
            refetch();
        } catch (error: any) {
            toast.error(error.message || "Error al eliminar miembro");
        }
    };

    const deleteGroup = async () => {
        if (!myId) return;
        
        const hasUnsettledBalances = data?.balances.some((b: any) => Math.abs(b.balance) > 0.01);
        
        if (hasUnsettledBalances) {
            toast.error("No se puede eliminar el grupo. Aún hay deudas o saldos pendientes de liquidar.");
            return;
        }

        if (window.confirm("¿Estás seguro de que deseas eliminar permanentemente este grupo? Esta acción borrará todos los gastos e integrantes de forma definitiva.")) {
            await confirmDeleteGroup();
        }
    };

    const confirmDeleteGroup = async () => {
        try {
            await groupRepository.deleteGroup(groupId);
            toast.success("Grupo eliminado correctamente");
            return true;
        } catch (error: any) {
            toast.error(error.message || "Error al eliminar grupo");
            return false;
        }
    };

    const deleteItem = async (itemId: string) => {
        try {
            await groupRepository.removeItem(groupId, itemId);
            toast.success("Gasto eliminado");
            refetch();
        } catch (error: any) {
            toast.error(error.message || "Error al eliminar gasto");
        }
    };

    const stats = useMemo(() => {
        if (!data || !myId) return { userShare: 0, userOwed: 0 };

        let myTotalConsumption = 0;

        data.activities.forEach((item: any) => {
            const amount = parseFloat(item.monto || item.precio || 0);
            const participants = item.participantes_ids || [];
            if (participants.includes(myId)) {
                myTotalConsumption += amount / (participants.length || 1);
            }
        });

        const myBalanceObj = data.balances.find((b: any) => b.usuario_id === myId);
        const realBalance = myBalanceObj ? parseFloat(myBalanceObj.monto || myBalanceObj.balance || 0) : 0;
        
        const realConsumption = myBalanceObj && myBalanceObj.cuota_correspondiente !== undefined 
            ? parseFloat(myBalanceObj.cuota_correspondiente) 
            : myTotalConsumption;

        return {
            userShare: isNaN(realConsumption) ? 0 : realConsumption,
            userOwed: isNaN(realBalance) ? 0 : realBalance
        };
    }, [data, myId]);

    const { data: pendingSettlements, refetch: refetchSettlements } = useQuery({
        queryKey: ['pending-settlements', groupId],
        queryFn: async () => {
            if (!groupId || !data?.adminId || data.adminId !== myId) return [];
            const res = await httpClient.get(`/groups/${groupId}/settlements/pending`);
            return res.data;
        },
        enabled: !!groupId && !!data?.adminId && data.adminId === myId
    });

    const approveSettlement = async (settlementId: string) => {
        try {
            await httpClient.post(`/groups/${groupId}/settlements/${settlementId}/approve`, null, {
                params: { current_user_id: myId }
            });
            toast.success("Liquidación aprobada correctamente");
            refetchSettlements();
            refetch(); 
        } catch (error: any) {
            toast.error(error.message || "Error al aprobar liquidación");
        }
    };
    
    const rejectSettlement = async (settlementId: string, reason: string) => {
        try {
            await httpClient.post(`/groups/${groupId}/settlements/${settlementId}/reject`, { reason }, {
                params: { current_user_id: myId }
            });
            toast.success("Liquidación rechazada");
            refetchSettlements();
        } catch (error: any) {
            toast.error(error.message || "Error al rechazar liquidación");
        }
    };

    return {
        activeTab, setActiveTab,
        groupName: data?.groupName || '',
        groupDescription: data?.groupDescription || '',
        groupCode: data?.groupCode || '',
        members: data?.members || [],
        membersData: data?.membersData || [],
        totalSpent: data?.totalSpent || 0,
        userShare: stats.userShare,
        userOwed: stats.userOwed,
        activities: data?.activities || [],
        balances: data?.balances || [],
        adminId: data?.adminId,
        status: data?.status || 'active',
        selectedBankAccounts: data?.selectedBankAccounts || [],
        currentUserId: normalizeId(myId),
        isFetchingGroup: isLoading,
        isRefreshing: isFetching, 
        refresh: refetch,
        removeMember,
        deleteGroup,
        confirmDeleteGroup,
        deleteItem,
        is2FAModalOpen,
        setIs2FAModalOpen,
        leaderProfile,
        pendingSettlements: pendingSettlements || [],
        approveSettlement,
        rejectSettlement
    };
};