import React, { useState, useEffect } from 'react';
import { Bell, BellDot, X, Check, Trash2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthContext } from '../../context/AuthContext';
import { httpClient } from '../../../infrastructure/api/http-client';
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
    const { user } = useAuthContext();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = async () => {
        if (!user?.id) return;
        try {
            const res = await httpClient.get(`/notifications/${user.id}`);
            setNotifications(res.data.notifications || []);
            setUnreadCount(res.data.unread_count || 0);
        } catch (error) {
            console.error("Error fetching notifications:", error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 15000); // Poll every 15s
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
            await markAsRead(notif._id);
        } catch (error) {
            console.error("Error approving settlement from notification:", error);
        } finally {
            setLoading(false);
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
            setNotifications(prev => prev.filter(n => n._id !== id));
            // Si no estaba leída, bajar el contador
            const notif = notifications.find(n => n._id === id);
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
                className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all relative group border border-white/10 backdrop-blur-sm"
                title="Notificaciones"
            >
                {unreadCount > 0 ? (
                    <>
                        <BellDot size={20} className="text-amber-400 animate-pulse" />
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-[var(--bg-body)]">
                            {unreadCount > 9 ? '+9' : unreadCount}
                        </span>
                    </>
                ) : (
                    <Bell size={20} className="text-slate-400 group-hover:text-[var(--primary)]" />
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
                                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">No hay notificaciones</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-[var(--border-color)]">
                                        {notifications.map((n) => (
                                            <div 
                                                key={n._id} 
                                                className={cn(
                                                    "p-5 transition-all relative group",
                                                    !n.read ? "bg-[var(--primary)]/5 border-l-4 border-l-[var(--primary)]" : "hover:bg-black/5"
                                                )}
                                            >
                                                <div className="flex gap-4">
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                                                        !n.read ? "bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20" : "bg-slate-100 text-slate-500"
                                                    )}>
                                                        {n.type === 'payment_received' ? '💰' : (n.type === 'reminder' ? '⏰' : '📢')}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-black text-[var(--text-primary)] uppercase tracking-tight mb-1">{n.title}</p>
                                                        <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed mb-2">{n.body}</p>
                                                        <div className="flex items-center gap-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                            <span className="flex items-center gap-1">
                                                                <Clock size={10} />
                                                                {formatRelativeTime(new Date(n.created_at))}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {!n.read && (
                                                        <button 
                                                            onClick={() => n.data?.type === 'settlement_request' ? handleApproveSettlement(n) : markAsRead(n._id)}
                                                            className={cn(
                                                                "p-1.5 bg-white shadow-sm border border-slate-100 rounded-lg hover:bg-emerald-50 transition-all",
                                                                n.data?.type === 'settlement_request' ? "text-amber-500 hover:text-emerald-600" : "text-emerald-500"
                                                            )}
                                                            title={n.data?.type === 'settlement_request' ? "Aprobar Pago" : "Leída"}
                                                            disabled={loading}
                                                        >
                                                            <Check size={12} className={cn(loading && "animate-spin")} />
                                                        </button>
                                                    )}
                                                    <button 
                                                        onClick={() => deleteNotif(n._id)}
                                                        className="p-1.5 bg-white shadow-sm border border-slate-100 text-rose-500 rounded-lg hover:bg-rose-50 transition-all"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
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
