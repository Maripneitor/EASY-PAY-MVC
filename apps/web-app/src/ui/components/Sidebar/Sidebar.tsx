import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, PlusSquare, CreditCard, BarChart3, Settings, LogOut, Users as LucideUsers, ChevronLeft, Menu, Clock, ShieldAlert } from 'lucide-react';
import { cn, toTitleCase } from '@infrastructure/utils';
import { ROUTES } from '@infrastructure/routes';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onLogout: () => void;
    userName: string;
}

const I18N_TEXTS = {
    COLLAPSE_MENU: 'Colapsar menú',
    EXPAND_MENU: 'Expandir menú',
    APP_NAME: 'Easy-Pay',
    ACTIVE_SESSION: 'Sesión Activa',
    MAIN_MENU_TITLE: 'Menú Principal',
    USER_PLACEHOLDER: 'Usuario',
    SETTINGS: 'Configuración',
    LOGOUT: 'Cerrar Sesión',
    VERSION: 'v1.2.0-BUILD'
} as const;

const ICON_SIZE = 22;

import { useAuthContext } from '@ui/context/AuthContext';

interface MenuItem {
    id: 'dashboard' | 'groups' | 'stats' | 'admin';
    icon: React.ReactNode;
    label: string;
    path: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onLogout, userName }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuthContext();
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    const isAdmin = Boolean(
        user?.roles?.some((r: string) => r.toLowerCase() === 'administrador' || r.toLowerCase() === 'admin')
    );

    const getInitials = (name: string) => {
        if (!name) return 'U';
        return name
            .split(' ')
            .filter(Boolean)
            .map(part => part[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    const menuItems: MenuItem[] = [
        { id: 'dashboard', icon: <Home size={ICON_SIZE} />, label: 'Inicio', path: ROUTES.DASHBOARD },
        { id: 'groups', icon: <PlusSquare size={ICON_SIZE} />, label: 'Mis Grupos', path: ROUTES.GROUPS },
        { id: 'stats', icon: <BarChart3 size={ICON_SIZE} />, label: 'Estadísticas', path: ROUTES.STATS },
        ...(isAdmin ? [{ id: 'admin' as const, icon: <ShieldAlert size={ICON_SIZE} className="text-amber-500" />, label: 'Administración', path: ROUTES.ADMIN }] : []),
    ];

    return (
        <>
            {/* Mobile Backdrop */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[45] md:hidden"
                    />
                )}
            </AnimatePresence>

            <aside className={cn(
                "flex flex-col h-screen bg-[var(--bg-sidebar)] border-r border-[var(--border-color)] transition-all duration-300 relative z-50 overflow-hidden",
                isOpen ? "w-64" : "w-0 md:w-20",
                "fixed md:relative"
            )}>
                {/* Toggle Button - Separated for better layout control */}
                <button 
                    onClick={onClose}
                    aria-label={isOpen ? I18N_TEXTS.COLLAPSE_MENU : I18N_TEXTS.EXPAND_MENU}
                    className={cn(
                        "absolute p-2.5 hover:bg-[var(--hover-bg)] hover:text-[var(--primary)] rounded-xl transition-all text-slate-400 md:flex hidden z-[60]",
                        isOpen ? "right-4 top-6" : "left-1/2 -translate-x-1/2 top-6"
                    )}
                >
                    {isOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
                </button>

                <div className={cn(
                    "p-8 flex-shrink-0 relative flex flex-col items-center transition-all duration-300",
                    !isOpen ? "p-0 mt-20 opacity-0" : "opacity-100",
                    "md:opacity-100",
                    isOpen ? "mt-4" : "mt-24 md:p-6"
                )}>
                    <div className="flex flex-col items-center gap-3 group cursor-pointer w-full" onClick={() => navigate(ROUTES.DASHBOARD)}>
                        <div className={cn(
                            "transition-all duration-300 group-hover:scale-110 flex items-center justify-center",
                            !isOpen ? "w-0 h-0" : "w-20",
                            "md:w-10 md:h-10",
                            isOpen && "md:w-20"
                        )}>
                            <img src="/assets/images/logo-ep.png" alt="Logo" className="max-w-full max-h-full object-contain drop-shadow-md" />
                        </div>
                        {isOpen && <h1 className="text-xl font-black tracking-tighter text-[var(--text-primary)]">{I18N_TEXTS.APP_NAME}</h1>}
                    </div>
                </div>

                <div className={cn(
                    "px-4 mb-6 flex-shrink-0 transition-all duration-300",
                    !isOpen ? "px-0 opacity-0" : "opacity-100",
                    "md:opacity-100",
                    !isOpen && "md:px-2"
                )}>
                    <div onClick={() => navigate(ROUTES.PROFILE)} className={cn(
                        "p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col items-center text-center group cursor-pointer transition-all hover:border-[var(--primary)]/50",
                        !isOpen ? "p-0 border-none bg-transparent" : "",
                        !isOpen && "md:p-1"
                    )}>
                        <div className={cn(
                            "rounded-xl bg-[var(--primary)] flex items-center justify-center text-white font-black shadow-md shadow-[var(--primary)]/20 transition-all",
                            isOpen ? "w-11 h-11 text-lg mb-1.5" : "w-0 h-0",
                            "md:w-10 md:h-10 md:text-sm"
                        )}>
                            {(isOpen || !isMobile) ? getInitials(userName || I18N_TEXTS.USER_PLACEHOLDER) : ""}
                        </div>
                        {isOpen && (
                            <>
                                <span className="text-xs font-black text-[var(--text-primary)] truncate w-full">{toTitleCase(userName || I18N_TEXTS.USER_PLACEHOLDER)}</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase opacity-70">{I18N_TEXTS.ACTIVE_SESSION}</span>
                            </>
                        )}
                    </div>
                </div>

                <nav className={cn(
                    "flex-1 px-4 space-y-2 custom-scrollbar overflow-y-auto overflow-x-hidden min-h-0",
                    !isOpen ? "px-0 opacity-0 pointer-events-none" : "opacity-100",
                    "md:opacity-100 md:pointer-events-auto",
                    !isOpen && "md:px-4"
                )}>
                    {isOpen && <p className="px-4 mb-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{I18N_TEXTS.MAIN_MENU_TITLE}</p>}
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    navigate(item.path);
                                    if (isMobile) onClose();
                                }}
                                title={!isOpen ? item.label : ''}
                                className={cn(
                                    "w-full flex items-center rounded-2xl text-sm font-bold transition-all relative group",
                                    isActive ? "text-[var(--primary)] bg-[var(--hover-bg)]" : "text-slate-500 hover:bg-[var(--hover-bg)]",
                                    isOpen ? "px-4 py-2.5 justify-between" : "p-0 justify-center",
                                    !isOpen && "md:p-3"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    {item.icon}
                                    {isOpen && <span>{item.label}</span>}
                                </div>
                                {!isOpen && (
                                    <div className="absolute left-full ml-4 px-3 py-2 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-[100] whitespace-nowrap shadow-xl md:block hidden">
                                        {item.label}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </nav>

                <div className={cn(
                    "p-4 mt-auto border-t border-[var(--border-color)] flex-shrink-0 transition-all",
                    !isOpen ? "p-0 opacity-0" : "opacity-100",
                    "md:opacity-100",
                    !isOpen && "md:p-2"
                )}>
                    <button 
                        onClick={() => {
                            navigate(ROUTES.PROFILE);
                            if (isMobile) onClose();
                        }}
                        title={!isOpen ? I18N_TEXTS.SETTINGS : ''}
                        className={cn(
                            "w-full flex items-center gap-3 rounded-2xl text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] group transition-all relative",
                            isOpen ? "px-4 py-3" : "p-0 justify-center",
                            !isOpen && "md:p-3"
                        )}
                    >
                        <Settings size={ICON_SIZE} className="group-hover:text-[var(--primary)] transition-all" />
                        {isOpen && <span>{I18N_TEXTS.SETTINGS}</span>}
                    </button>



                    <button
                        onClick={onLogout}
                        title={!isOpen ? I18N_TEXTS.LOGOUT : ''}
                        className={cn(
                            "w-full flex items-center gap-3 mt-2 rounded-2xl text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 group transition-all relative",
                            isOpen ? "px-4 py-3" : "p-0 justify-center",
                            !isOpen && "md:p-3"
                        )}
                    >
                        <LogOut size={ICON_SIZE} />
                        {isOpen && <span>{I18N_TEXTS.LOGOUT}</span>}
                    </button>

                    {isOpen && (
                        <div className="pt-4 pb-2 text-center text-[10px] font-black font-mono text-slate-400 opacity-50">
                            {I18N_TEXTS.VERSION}
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
};