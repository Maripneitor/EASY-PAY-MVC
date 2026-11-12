import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, BellDot, X, Check, Trash2, Clock, DollarSign, Megaphone, UserPlus, UserX, Users, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthContext } from '../../context/AuthContext';
import { httpClient } from '../../../infrastructure/api/http-client';
import { groupRepository } from '../../../infrastructure/api/repositories';
import { ROUTES } from '../../../infrastructure/routes';
import { toast } from 'sonner';
import { cn } from '../../../infrastructure/utils';

// Helper simple para tiempo relativo sin dependencias externas
const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'hace un momento';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `hace ${diffInMinutes} min`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `hace ${diffInHours} h`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `hace ${diffInDays} d`;
    
    return date.toLocaleDateString();
};

export const NotificationBell = () => {
    const navigate = useNavigate();
    const { user } = useAuthContext();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [rejectingId, setRejectingId] = useState<string | null>(null);

    const fetchNotifications = async () => {
        if (!user?.id) return;
        try {
            const res = await httpClient.get(`/notifications/${user.id}`);
            const notifs = Array.isArray(res.data) 
                ? res.data 
                : (res.data.notifications || []);
            setNotifications(notifs);
            // Si el backend envía unread_count usamos ese, sino filtramos las que no tienen read: true
            const unread = res.data.unread_count !== undefined 
                ? res.data.unread_count 
                : notifs.filter((n: any) => !n.read).length;
            setUnreadCount(unread);
        } catch (error) {
            console.error("Error fetching notifications:", error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 10000); // Polling cada 10s
        return () => clearInterval(interval);
    }, [user?.id]);

    const handleApproveSettlement = async (notif: any) => {
        const { settlement_id, group_id } = notif.data || {};
        if (!settlement_id || !group_id || !user?.id) return;
        
        try {
            setLoading(true);
            await httpClient.post(`/groups/${group_id}/settlements/${settlement_id}/approve`, null, {
                params: { current_user_id: user.id }
            });
            await markAsRead(notif._id || notif.id);
        } catch (error) {
            console.error("Error approving settlement from notification:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptInvitation = async (notif: any) => {
        const notifId = notif._id || notif.id;
        const invitationId = notif.invitation_id || notif.data?.invitation_id;
        const groupId = notif.group_id || notif.data?.group_id;
        if (!invitationId) return;

        try {
            setLoading(true);
            const res = await groupRepository.acceptInvitation(invitationId);
            toast.success("¡Te has unido al grupo exitosamente!");
            // Eliminar de base de datos y estado local para que no quede duplicada ni reaparezca
            try {
                await httpClient.delete(`/notifications/${notifId}`);
            } catch {}
            setNotifications(prev => prev.filter(n => (n._id || n.id) !== notifId));
            if (!notif.read) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
            setIsOpen(false);
            const targetGroupId = res?.group_id || groupId;
            if (targetGroupId) {
                navigate(ROUTES.GROUP_DETAIL(targetGroupId));
            }
        } catch (error: any) {
            toast.error(error.message || "Error al aceptar la invitación");
        } finally {
            setLoading(false);
        }
    };

    const handleRejectInvitation = async (notif: any) => {
        const notifId = notif._id || notif.id;
        const invitationId = notif.invitation_id || notif.data?.invitation_id;
        if (!invitationId && !notifId) return;

        try {
            setRejectingId(notifId);
            if (invitationId) {
                await groupRepository.rejectInvitation(invitationId);
            }
            toast.info("Invitación rechazada");

            // Asegurar eliminación definitiva en base de datos
            try {
                await httpClient.delete(`/notifications/${notifId}`);
            } catch {}

            // Filtrar del estado local para disparar la animación de salida fluida de AnimatePresence
            setNotifications(prev => prev.filter(n => (n._id || n.id) !== notifId));

            // Actualizar dinámicamente el contador numérico de notificaciones del header bajando en 1
            if (!notif.read) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error: any) {
            const errStr = (error?.message || error?.detail || "").toLowerCase();
            // Si ya no estaba pendiente o no se encontró la invitación, aún así limpiarla sin dejar al usuario atrapado
            if (errStr.includes("pendiente") || errStr.includes("encontrada") || errStr.includes("not found")) {
                toast.info("Invitación descartada");
                try {
                    await httpClient.delete(`/notifications/${notifId}`);
                } catch {}
                setNotifications(prev => prev.filter(n => (n._id || n.id) !== notifId));
                if (!notif.read) {
                    setUnreadCount(prev => Math.max(0, prev - 1));
                }
            } else {
                toast.error(error.message || "Error al rechazar invitación");
            }
        } finally {
            setRejectingId(null);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await httpClient.patch(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Error marking as read:", error);
        }
    };

    const markAllRead = async () => {
        if (!user?.id) return;
        try {
            await httpClient.patch(`/notifications/${user.id}/read-all`);
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error("Error marking all as read:", error);
        }
    };

    const deleteNotif = async (id: string) => {
        try {
            await httpClient.delete(`/notifications/${id}`);
            const notif = notifications.find(n => (n._id || n.id) === id);
            setNotifications(prev => prev.filter(n => (n._id || n.id) !== id));
            // Si no estaba leída, bajar el contador
            if (notif && !notif.read) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error("Error deleting notification:", error);
        }
    };

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="p-3 bg-white/10 hover:bg-white/20 dark:bg-slate-800/60 dark:hover:bg-slate-800/90 rounded-2xl transition-all relative group border border-black/5 dark:border-white/10 backdrop-blur-sm shadow-sm"
                title="Notificaciones"
                aria-label={unreadCount > 0 ? `Tienes ${unreadCount} notificaciones no leídas` : "Ver notificaciones"}
            >
                {unreadCount > 0 ? (
                    <>
                        <BellDot size={20} className="text-amber-500 animate-pulse" />
                        <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-[var(--bg-body)] shadow-md animate-bounce">
                            {unreadCount > 9 ? '+9' : unreadCount}
                        </span>
                    </>
                ) : (
                    <Bell size={20} className="text-[var(--text-secondary)] group-hover:text-[var(--primary)] transition-colors" />
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 z-[100]"
                        />
                        <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 mt-4 w-80 md:w-96 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2rem] shadow-2xl z-[101] overflow-hidden"
                        >
                            <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between bg-gradient-to-r from-[var(--primary)]/5 to-transparent">
                                <div>
                                    <h3 className="text-sm font-black uppercase tracking-tight text-[var(--text-primary)]">Notificaciones</h3>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Tienes {unreadCount} mensajes nuevos</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {unreadCount > 0 && (
                                        <button 
                                            onClick={markAllRead}
                                            className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-all"
                                            title="Marcar todo como leído"
                                        >
                                            <Check size={16} />
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => setIsOpen(false)}
                                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                {notifications.length === 0 ? (
                                    <div className="py-12 px-6 text-center">
                                        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                                            <Bell size={24} />
                                        </div>
                                        <p className="text-xs font-black uppercase tracking-widest text-[var(--text-primary)]">No hay notificaciones</p>
                                        <p className="text-[11px] text-[var(--text-secondary)] mt-1">Te avisaremos cuando haya actividad o cobros en tus grupos</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-[var(--border-color)] overflow-hidden">
                                        <AnimatePresence initial={false} mode="popLayout">
                                            {notifications.map((n) => {
                                                const notifId = n._id || n.id;
                                                const isRejecting = rejectingId === notifId;

                                                return (
                                                    <motion.div 
                                                        key={notifId}
                                                        layout
                                                        initial={{ opacity: 0, y: 8 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ 
                                                            opacity: 0, 
                                                            height: 0, 
                                                            marginBottom: 0, 
                                                            scale: 0.95,
                                                            overflow: 'hidden'
                                                        }}
                                                        transition={{ 
                                                            type: "spring", 
                                                            stiffness: 300, 
                                                            damping: 30 
                                                        }}
                                                        className={cn(
                                                            "p-5 transition-colors relative group overflow-hidden",
                                                            !n.read ? "bg-[var(--primary)]/5 border-l-4 border-l-[var(--primary)]" : "hover:bg-[var(--hover-bg)]"
                                                        )}
                                                    >
                                                        <div className="flex gap-4">
                                                            <div className={cn(
                                                                "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                                                                n.type === 'GROUP_INVITATION' ? "bg-blue-600 text-white shadow-md shadow-blue-600/30" : 
                                                                n.type === 'INVITATION_REJECTED' ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" : (
                                                                    !n.read ? "bg-[var(--primary)] text-white shadow-md shadow-[var(--primary)]/20" : "bg-[var(--hover-bg)] text-[var(--text-secondary)]"
                                                                )
                                                            )}>
                                                                {n.type === 'GROUP_INVITATION' ? (
                                                                    <UserPlus size={18} />
                                                                ) : n.type === 'INVITATION_REJECTED' ? (
                                                                    <UserX size={18} />
                                                                ) : n.type === 'payment_received' ? (
                                                                    <DollarSign size={18} />
                                                                ) : n.type === 'reminder' ? (
                                                                    <Clock size={18} />
                                                                ) : (
                                                                    <Megaphone size={18} />
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-tight mb-1">{n.title}</p>
                                                                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed mb-2">{n.message || n.body}</p>
                                                                
                                                                {/* Acciones para Invitación a Grupo */}
                                                                {n.type === 'GROUP_INVITATION' && (
                                                                    n.status === 'rejected' ? (
                                                                        <div className="mb-2 mt-1">
                                                                            <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full inline-block">
                                                                                Invitación declinada
                                                                            </span>
                                                                        </div>
                                                                    ) : n.status === 'accepted' ? (
                                                                        <div className="mb-2 mt-1">
                                                                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full inline-block">
                                                                                Invitación aceptada
                                                                            </span>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex items-center gap-2 mb-2 mt-1">
                                                                            <button
                                                                                onClick={() => handleAcceptInvitation(n)}
                                                                                disabled={loading || isRejecting}
                                                                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm transition-transform disabled:opacity-50"
                                                                            >
                                                                                <Check size={12} strokeWidth={3} />
                                                                                <span>Aceptar</span>
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleRejectInvitation(n)}
                                                                                disabled={loading || isRejecting}
                                                                                className="px-3 py-1.5 bg-[var(--hover-bg)] hover:bg-slate-200 dark:hover:bg-slate-800 active:scale-95 text-[var(--text-primary)] rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-1.5 border border-[var(--border-color)]"
                                                                            >
                                                                                {isRejecting ? (
                                                                                    <>
                                                                                        <Loader2 size={11} className="animate-spin text-current" />
                                                                                        <span>Rechazando...</span>
                                                                                    </>
                                                                                ) : (
                                                                                    <span>Rechazar</span>
                                                                                )}
                                                                            </button>
                                                                        </div>
                                                                    )
                                                                )}

                                                                <div className="flex items-center gap-3 text-[9px] font-medium text-[var(--text-secondary)] uppercase tracking-widest">
                                                                    <span className="flex items-center gap-1">
                                                                        <Clock size={10} />
                                                                        {n.created_at ? formatRelativeTime(new Date(n.created_at)) : 'reciente'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            {!n.read && (
                                                                <button 
                                                                    onClick={() => n.data?.type === 'settlement_request' ? handleApproveSettlement(n) : markAsRead(notifId)}
                                                                    className={cn(
                                                                        "p-1.5 bg-[var(--bg-surface)] shadow-sm border border-[var(--border-color)] rounded-lg hover:bg-emerald-500/10 transition-all",
                                                                        n.data?.type === 'settlement_request' ? "text-amber-500 hover:text-emerald-500" : "text-emerald-500"
                                                                    )}
                                                                    title={n.data?.type === 'settlement_request' ? "Aprobar Pago" : "Leída"}
                                                                    disabled={loading || isRejecting}
                                                                >
                                                                    <Check size={12} className={cn(loading && "animate-spin")} />
                                                                </button>
                                                            )}
                                                            <button 
                                                                onClick={() => deleteNotif(notifId)}
                                                                className="p-1.5 bg-[var(--bg-surface)] shadow-sm border border-[var(--border-color)] text-rose-500 rounded-lg hover:bg-rose-500/10 transition-all"
                                                                title="Eliminar"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </div>
                            
                            {notifications.length > 0 && (
                                <div className="p-4 bg-slate-50 dark:bg-black/20 text-center border-t border-[var(--border-color)]">
                                    <button className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--primary)] hover:underline">
                                        Ver todas las notificaciones
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};
