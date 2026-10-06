import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart3, Bell, Check } from 'lucide-react';
import { ROUTES } from '../../../infrastructure/routes';
import { useAuthContext } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../infrastructure/utils';
import { httpClient } from '../../../infrastructure/api/http-client';
import styles from './PageHeader.module.css';

const USER_AVATAR_URL = 'https://ui-avatars.com/api/?name=Juan&background=3b82f6&color=fff&bold=true';
const DEFAULT_USER_NAME = 'Juan';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    onBack?: () => void;
    rightSlot?: React.ReactNode;
    showAvatar?: boolean;
    onAvatarClick?: () => void;
    showStats?: boolean;
    onStatsClick?: () => void;
    userName?: string;
    onMenuClick?: () => void;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    subtitle,
    onBack,
    onMenuClick,
    rightSlot,
    showAvatar = false,
    onAvatarClick,
    showStats = false,
    onStatsClick,
    userName = DEFAULT_USER_NAME,
}) => {
    const navigate = useNavigate();
    const { user } = useAuthContext();
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const handleAvatarClick = onAvatarClick || (() => navigate(ROUTES.PROFILE));
    const handleStatsClick = onStatsClick || (() => navigate(ROUTES.STATS));

    // Fetch real notifications from backend
    React.useEffect(() => {
        const fetchNotifications = async () => {
            const userId = user?.id || user?._id;
            if (!userId) return;
            try {
                // Usamos httpClient para aprovechar el baseURL (/api) y el proxy de Vite
                const response = await httpClient.get(`/notifications/${userId}`);
                if (response.data) {
                    setNotifications(response.data.notifications || []);
                    setUnreadCount(response.data.unread_count || 0);
                }
            } catch (error) {
                console.error("Error fetching notifications:", error);
            }
        };

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Polling every 30s
        return () => clearInterval(interval);
    }, [user]);

    const markAsRead = async (id: string) => {
        try {
            await httpClient.patch(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Error marking as read:", error);
        }
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffInMs = now.getTime() - date.getTime();
        const diffInMins = Math.floor(diffInMs / (1000 * 60));
        if (diffInMins < 60) return `hace ${diffInMins} min`;
        const diffInHours = Math.floor(diffInMins / 60);
        if (diffInHours < 24) return `hace ${diffInHours} h`;
        return date.toLocaleDateString();
    };

    return (
        <header className={styles.header}>
            <div className={styles.headerContainer}>
                <div className={styles.leftSlot}>
                    <div className="flex items-center gap-1">
                        {onMenuClick && (
                            <button onClick={onMenuClick} className="md:hidden flex items-center justify-center min-w-[44px] min-h-[44px] text-[var(--text-primary)] -ml-2" aria-label="Abrir menú de navegación">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <line x1="3" y1="12" x2="21" y2="12"></line>
                                    <line x1="3" y1="6" x2="21" y2="6"></line>
                                    <line x1="3" y1="18" x2="21" y2="18"></line>
                                </svg>
                            </button>
                        )}
                        
                        {onBack && (
                            <button onClick={onBack} className={styles.backBtn} aria-label="Volver a la página anterior">
                                <ArrowLeft size={18} className={styles.backIcon} aria-hidden="true" />
                                <span className={styles.backText}>Volver</span>
                            </button>
                        )}

                        {/* Notification Bell */}
                        <div className="relative">
                            <button 
                                onClick={() => setIsNotifOpen(!isNotifOpen)}
                                className="p-2.5 bg-black/5 hover:bg-[var(--primary)]/10 text-slate-500 hover:text-[var(--primary)] rounded-xl transition-all relative group"
                                aria-label="Notificaciones"
                            >
                                <Bell size={20} />
                                {unreadCount > 0 && (
                                    <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-[var(--bg-body)] animate-pulse" />
                                )}
                            </button>

                            <AnimatePresence>
                                {isNotifOpen && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute left-0 mt-4 w-80 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl shadow-2xl z-[1000] overflow-hidden backdrop-blur-xl"
                                    >
                                        <div className="p-5 border-b border-[var(--border-color)] flex justify-between items-center bg-black/5">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-primary)]">Notificaciones</h4>
                                            {unreadCount > 0 && (
                                                <span className="text-[9px] font-bold text-[var(--primary)] bg-[var(--primary)]/10 px-2 py-0.5 rounded-full">{unreadCount} Nuevas</span>
                                            )}
                                        </div>
                                        <div className="max-h-80 overflow-y-auto">
                                            {notifications.length === 0 ? (
                                                <div className="p-8 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                                                    No tienes notificaciones
                                                </div>
                                            ) : (
                                                notifications.map(n => (
                                                    <div 
                                                        key={n._id} 
                                                        onClick={() => !n.read && markAsRead(n._id)}
                                                        className={cn("p-4 border-b border-[var(--border-color)] hover:bg-black/5 transition-colors cursor-pointer group", !n.read && "bg-[var(--primary)]/5")}
                                                    >
                                                        <div className="flex gap-3">
                                                            <div className={cn("w-2 h-2 rounded-full mt-2 shrink-0", !n.read ? "bg-[var(--primary)]" : "bg-transparent")} />
                                                            <div className="flex-1">
                                                                <p className="text-xs font-bold text-[var(--text-primary)] leading-relaxed">{n.title || n.text}</p>
                                                                <p className="text-[10px] text-slate-500 mt-0.5">{n.body}</p>
                                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{formatTime(n.created_at)}</p>
                                                            </div>
                                                            {!n.read && <Check size={14} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                        <button className="w-full py-4 text-[9px] font-black uppercase tracking-widest text-[var(--text-secondary)] hover:bg-black/5 transition-all">Ver todas</button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                </div>

                <div className={styles.titleContainer}>
                    {subtitle && <span className={cn(styles.subtitle, "hidden md:block")}>{subtitle}</span>}
                    <h1 className={styles.title}>{title}</h1>
                </div>

                <div className={styles.rightActions}>
                    {/* Se eliminó el ThemeSwitch de aquí para centralizarlo en Ajustes */}
                    {rightSlot}
                    {showStats && (
                        <button className={styles.notifBtn} onClick={handleStatsClick} aria-label="Ver historial">
                            <BarChart3 size={20} aria-hidden="true" />
                        </button>
                    )}
                    {showAvatar && (
                        <div className={styles.avatarGroup} onClick={handleAvatarClick} style={{ cursor: 'pointer' }}>
                            <span className={styles.userNameLabel}>{userName}</span>
                            <div className={styles.avatarWrapper}>
                                <img src={USER_AVATAR_URL} alt={userName} className={styles.avatar} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};