import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboard } from './useDashboard';
import { useAuthContext } from '@ui/context/AuthContext';
import { useDocumentTitle } from '@ui/hooks/useDocumentTitle';
import { 
    Wallet, 
    TrendingUp, 
    TrendingDown, 
    Users, 
    Plus, 
    Clock, 
    BarChart3, 
    ArrowUpRight, 
    ReceiptText,
    UserPlus,
    Check,
    Trash2
} from 'lucide-react';
import { cn, toTitleCase } from '@infrastructure/utils';
import { ROUTES } from '@infrastructure/routes';
import { PageHeader } from '@ui/components/PageHeader/PageHeader';
import { GroupCard } from './components/GroupCard';
import { TwoFactorModal } from '@ui/components/Security/TwoFactorModal';
import { EditGroupModal } from '../Groups/components/EditGroupModal';
import { generateFinancialReport } from '@infrastructure/services/PdfService';
import { RecentActivitySection } from './components/RecentActivitySection';
import { EmptyGroupsState } from './components/EmptyGroupsState';
import { QuickActions } from './components/QuickActions';
import { NotificationBell } from '@ui/components/Notifications/NotificationBell';

// ─── Componente Skeleton Profesional de Carga ────────────────────────────────
const DashboardSkeleton: React.FC = () => {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] p-6 h-48 flex flex-col justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800" />
                            <div className="space-y-2 flex-1">
                                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-3/4" />
                                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/2" />
                            </div>
                        </div>
                        <div className="flex justify-between items-end pt-4 border-t border-[var(--border-color)]">
                            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-lg w-20" />
                            <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg w-24" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const I18N_TEXTS = {
    WELCOME_PREFIX: 'Hola,',
    SUBTITLE: 'Easy-Pay Desktop',
    STATS: {
        TOTAL_SPENT: 'Total Gastado',
        OWED_TO_USER: 'Te deben',
        USER_OWES: 'Debes',
        ACTIVE_GROUPS: 'Grupos Activos',
        GROUPS_LABEL: 'grupos',
        SALDOS: 'Saldos',
        PENDING: 'Pendiente'
    },
    ACTIONS: {
        CREATE_GROUP: 'Crear Grupo',
        JOIN_GROUP: 'Unirse a Grupo',
        VIEW_ALL: 'Ver todos',
        CREATE_FIRST: 'Crear el primero',
        JOIN_FIRST: 'Unirse a un Grupo',
        UPLOAD_FILE: 'Subir Archivo',
        EXPORT_PDF: 'Exportar Reporte (PDF)'
    },
    GROUPS: {
        TITLE: 'Mis Grupos',
        NO_GROUPS: 'No hay grupos activos',
        DEFAULT_NAME: 'Sin nombre',
        DEFAULT_ACT: 'Activo ahora'
    },
    ANALYTICS: {
        TITLE: 'Análisis de Gastos',
        NO_EXPENSES: 'Sin gastos registrados'
    },
    OCR_CARD: {
        TITLE: '¿Tienes un Ticket?',
        DESCRIPTION: 'Súbelo ahora y deja que la IA desglose los gastos por ti en segundos.'
    },
    DELETE_MODAL: {
        TITLE: 'Eliminar Grupo',
        DESCRIPTION: 'Esta acción es irreversible. Por seguridad, verifica tu identidad.'
    },
    PLACEHOLDERS: {
        USER: 'Usuario'
    }
} as const;

const APPEARANCE_COLORS = [
    { bg: 'bg-blue-500/10', text: 'text-blue-600' },
    { bg: 'bg-emerald-500/10', text: 'text-emerald-600' },
    { bg: 'bg-violet-500/10', text: 'text-violet-600' },
    { bg: 'bg-amber-500/10', text: 'text-amber-600' },
    { bg: 'bg-rose-500/10', text: 'text-rose-600' },
    { bg: 'bg-cyan-500/10', text: 'text-cyan-600' },
];

export const Dashboard: React.FC = () => {
    useDocumentTitle('Dashboard');
    const { toggleSidebar } = useOutletContext<{ toggleSidebar: () => void }>();
    const {
        navigate,
        allActiveGroups = [],
        stats,
        transactions,
        isLoading,
        hasCards,
        deleteGroup,
        confirmDeleteGroup,
        is2FAModalOpen,
        setIs2FAModalOpen,
        userId
    } = useDashboard();

    const { user } = useAuthContext();
    
    // Extraer el primer nombre o la porcion previa al @ en el email y capitalizar
    const rawName = user?.nombre?.trim() || (user?.email ? user.email.split('@')[0] : '') || I18N_TEXTS.PLACEHOLDERS.USER;
    const cleanFirstName = rawName.replace(/[._-]/g, ' ').trim().split(' ')[0] || I18N_TEXTS.PLACEHOLDERS.USER;
    const capitalizedFirstName = cleanFirstName.charAt(0).toUpperCase() + cleanFirstName.slice(1).toLowerCase();
    const welcomeTitle = `${I18N_TEXTS.WELCOME_PREFIX} ${capitalizedFirstName}`;
    
    const userRoles = (user?.roles || ['Usuario Regular']).map((r: string) => r.toLowerCase());
    const canCreateGroup = userRoles.includes('administrador') || userRoles.includes('admin') || userRoles.includes('editor') || userRoles.includes('usuario regular') || userRoles.includes('usuario') || (user?.permissions || []).includes('groups:write');

    const [editingGroup, setEditingGroup] = useState<any>(null);
    const [groupToDeleteConfirm, setGroupToDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const getAppearance = (name: string) => {
        const hash = name.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
        const style = APPEARANCE_COLORS[hash % APPEARANCE_COLORS.length];
        return {
            icon: <span className="text-xl font-black">{name.charAt(0).toUpperCase()}</span>,
            bg: style.bg,
            color: style.text
        };
    };

    const handleDelete = (e: React.MouseEvent, groupId: string, groupName: string) => {
        e.stopPropagation();
        e.preventDefault();
        setGroupToDeleteConfirm({ id: groupId, name: groupName });
    };

    const handleEdit = (e: React.MouseEvent, group: any) => {
        e.stopPropagation();
        e.preventDefault();
        setEditingGroup(group);
    };

    const formatCurrency = (amount: number) => {
        return amount?.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00';
    };

    return (
        <div className="flex flex-col flex-1 min-w-0 transition-colors duration-300 font-display text-[var(--text-primary)]">
            <div className="relative flex min-w-0 flex-1 flex-col">
                {/* Header en escritorio (en móvil el layout ya provee el header superior fijo e independiente) */}
                <div className="hidden md:block">
                    <PageHeader
                        onMenuClick={toggleSidebar}
                        title={welcomeTitle}
                        subtitle={I18N_TEXTS.SUBTITLE}
                        rightSlot={<NotificationBell />}
                        showStats
                    />
                </div>

                {/* Saludo específico para móvil, integrado directamente en el flujo del contenido sin competir con barras */}
                <div className="md:hidden mb-2">
                    <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">
                        {welcomeTitle}
                    </h1>
                    <p className="text-xs font-semibold text-[var(--text-secondary)] mt-0.5">
                        Resumen de tus cuentas y movimientos
                    </p>
                </div>

                <div className="relative flex-grow py-4 md:py-8 max-w-7xl mx-auto w-full">
                    {/* Background decorative elements */}
                    <div className="pointer-events-none absolute -left-[10%] -top-[20%] h-[500px] w-[500px] rounded-full bg-[var(--primary)]/5 blur-[120px]" />
                    <div className="pointer-events-none absolute -right-[10%] bottom-[10%] h-[400px] w-[400px] rounded-full bg-emerald-500/5 blur-[100px]" />

                    <div className="relative z-10 space-y-8">
                        
                        {/* --- DASHBOARD STATS (Responsive Grid & Hierarchy) --- */}
                        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-5 sm:p-6 shadow-sm min-w-0">
                                <div className="flex justify-between items-start gap-3 mb-4">
                                    <div className="p-2.5 sm:p-3 bg-blue-500/10 rounded-2xl text-blue-500 shrink-0">
                                        <Wallet size={22} className="sm:w-6 sm:h-6" />
                                    </div>
                                    <span className="hidden xs:inline-flex sm:inline-flex text-[10px] font-black uppercase tracking-widest text-emerald-500 items-center gap-1.5 bg-emerald-500/10 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full shrink-0 ml-auto shadow-sm">
                                        <TrendingUp size={12} /> {stats?.groups_count || 0} {I18N_TEXTS.STATS.GROUPS_LABEL}
                                    </span>
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-1 truncate">{I18N_TEXTS.STATS.TOTAL_SPENT}</p>
                                <h3 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] truncate tracking-tight" title={`$${formatCurrency(stats?.total_spent || 0)}`}>
                                    ${formatCurrency(stats?.total_spent || 0)}
                                </h3>
                            </div>

                            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-5 sm:p-6 shadow-sm min-w-0">
                                <div className="flex justify-between items-start gap-3 mb-4">
                                    <div className="p-2.5 sm:p-3 bg-emerald-500/10 rounded-2xl text-emerald-500 shrink-0">
                                        <TrendingUp size={22} className="sm:w-6 sm:h-6" />
                                    </div>
                                    <span className="hidden xs:inline-flex sm:inline-flex text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] opacity-50 bg-black/5 dark:bg-white/5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full shrink-0 ml-auto">
                                        {I18N_TEXTS.STATS.SALDOS}
                                    </span>
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-1 truncate">{I18N_TEXTS.STATS.OWED_TO_USER}</p>
                                <h3 className="text-2xl sm:text-3xl font-black text-emerald-500 truncate tracking-tight" title={`$${formatCurrency(stats?.owed_to_user || 0)}`}>
                                    ${formatCurrency(stats?.owed_to_user || 0)}
                                </h3>
                            </div>

                            {(() => {
                                const owesDebt = (stats?.user_owes || 0) > 0.009;
                                return (
                                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-5 sm:p-6 shadow-sm min-w-0">
                                        <div className="flex justify-between items-start gap-3 mb-4">
                                            <div className={cn(
                                                "p-2.5 sm:p-3 rounded-2xl shrink-0 transition-colors",
                                                owesDebt ? "bg-rose-500/10 text-rose-500" : "bg-slate-500/10 text-slate-500 dark:text-slate-400"
                                            )}>
                                                {owesDebt ? <TrendingDown size={22} className="sm:w-6 sm:h-6" /> : <Check size={22} className="sm:w-6 sm:h-6" />}
                                            </div>
                                            <span className={cn(
                                                "hidden xs:inline-flex sm:inline-flex text-[10px] font-black uppercase tracking-widest items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full shrink-0 ml-auto shadow-sm",
                                                owesDebt ? "bg-rose-500/10 text-rose-500" : "bg-slate-500/10 text-slate-500 dark:text-slate-400"
                                            )}>
                                                {owesDebt ? (
                                                    <>
                                                        <TrendingDown size={12} /> {I18N_TEXTS.STATS.PENDING}
                                                    </>
                                                ) : (
                                                    <>
                                                        <Check size={12} /> Al día
                                                    </>
                                                )}
                                            </span>
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-1 truncate">{I18N_TEXTS.STATS.USER_OWES}</p>
                                        <h3 className={cn(
                                            "text-2xl sm:text-3xl font-black transition-colors truncate tracking-tight",
                                            owesDebt ? "text-rose-500" : "text-slate-700 dark:text-slate-300"
                                        )} title={`$${formatCurrency(stats?.user_owes || 0)}`}>
                                            ${formatCurrency(stats?.user_owes || 0)}
                                        </h3>
                                    </div>
                                );
                            })()}

                            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-5 sm:p-6 shadow-sm min-w-0">
                                <div className="flex justify-between items-start gap-3 mb-4">
                                    <div className="p-2.5 sm:p-3 bg-violet-500/10 rounded-2xl text-violet-500 shrink-0">
                                        <Users size={22} className="sm:w-6 sm:h-6" />
                                    </div>
                                    <div className="flex gap-2 shrink-0 ml-auto">
                                        {canCreateGroup && (
                                            <button 
                                                onClick={() => navigate(ROUTES.CREATE_GROUP)} 
                                                className="p-2 sm:p-2.5 bg-[var(--primary)] text-white rounded-xl shadow-md shadow-[var(--primary)]/20 transition-transform duration-150 ease-out hover:scale-105 active:scale-95 cursor-pointer"
                                                title={I18N_TEXTS.ACTIONS.CREATE_GROUP}
                                            >
                                                <Plus size={16} />
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => navigate(`${ROUTES.CREATE_GROUP}?tab=join`)} 
                                            className="p-2 sm:p-2.5 bg-emerald-500 text-white rounded-xl shadow-md shadow-emerald-500/20 transition-transform duration-150 ease-out hover:scale-105 active:scale-95 cursor-pointer"
                                            title={I18N_TEXTS.ACTIONS.JOIN_GROUP}
                                        >
                                            <UserPlus size={16} />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-1 truncate">{I18N_TEXTS.STATS.ACTIVE_GROUPS}</p>
                                <h3 className="text-2xl sm:text-3xl font-black truncate tracking-tight" title={allActiveGroups.length.toString()}>
                                    {allActiveGroups.length}
                                </h3>
                            </div>
                        </section>
                        

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* --- GRUPOS LIST (Main Area) --- */}
                            <section className="lg:col-span-2 space-y-6">
                                <div className="flex items-end justify-between">
                                    <h2 className="text-xs font-black uppercase tracking-[0.3em] text-[var(--text-secondary)] flex items-center gap-2">
                                        <Clock size={16} /> {I18N_TEXTS.GROUPS.TITLE}
                                    </h2>
                                    <button 
                                        onClick={() => navigate(ROUTES.GROUPS)}
                                        className="text-[10px] font-black uppercase tracking-widest text-[var(--primary)] hover:underline"
                                    >
                                        {I18N_TEXTS.ACTIONS.VIEW_ALL}
                                    </button>
                                </div>

                                {isLoading ? (
                                    <DashboardSkeleton />
                                ) : (
                                    <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                                        {allActiveGroups.length > 0 ? (
                                            allActiveGroups.map((group: any) => {
                                                const appearance = getAppearance(group.nombre || "G");
                                                const mappedGroup = {
                                                    id: group.id,
                                                    name: group.nombre || I18N_TEXTS.GROUPS.DEFAULT_NAME,
                                                    lastAct: group.descripcion || I18N_TEXTS.GROUPS.DEFAULT_ACT,
                                                    members: group.integrantes || [],
                                                    total: group.total_gastado || 0,
                                                    userBalance: group.mi_balance || 0,
                                                    isAdmin: group.admin_id === user?.id
                                                };

                                                return (
                                                    <GroupCard
                                                        key={group.id}
                                                        group={mappedGroup}
                                                        onClick={() => navigate(ROUTES.GROUP_DETAIL(group.id))}
                                                        onDelete={mappedGroup.isAdmin ? (e) => handleDelete(e, group.id, mappedGroup.name) : undefined}
                                                        onEdit={mappedGroup.isAdmin ? (e) => handleEdit(e, group) : undefined}
                                                        appearance={appearance}
                                                    />
                                                );
                                            })
                                        ) : (
                                            <EmptyGroupsState
                                                canCreateGroup={canCreateGroup}
                                                onCreateGroup={() => navigate(ROUTES.CREATE_GROUP)}
                                                onJoinGroup={() => navigate(`${ROUTES.CREATE_GROUP}?tab=join`)}
                                            />
                                        )}
                                    </div>
                                )}

                                {/* --- RECENT ACTIVITY SECTION (debajo de Mis Grupos) --- */}
                                <div className="mt-8">
                                    <RecentActivitySection 
                                        transactions={transactions} 
                                        isLoading={isLoading}
                                        onViewAll={() => navigate(ROUTES.STATS)}
                                    />
                                </div>
                            </section>

                            {/* --- ACTIVITY & ANALYTICS (Side Area) --- */}
                            <section className="space-y-6">
                                <div className="flex items-end justify-between">
                                    <h2 className="text-xs font-black uppercase tracking-[0.3em] text-[var(--text-secondary)] flex items-center gap-2">
                                        <BarChart3 size={16} /> {I18N_TEXTS.ANALYTICS.TITLE}
                                    </h2>
                                </div>

                                <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2.5rem] p-8 shadow-sm">
                                    <div className="space-y-6">
                                        {stats?.by_category && stats.by_category.length > 0 ? (
                                            stats.by_category.slice(0, 3).map((cat: any, i: number) => {
                                                const total = stats.total_spent || 1;
                                                const percentage = Math.round((cat.amount / total) * 100);
                                                const colors = ['bg-[var(--primary)]', 'bg-emerald-500', 'bg-violet-500'];
                                                return (
                                                    <div key={i}>
                                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                                                            <span>{cat.category}</span>
                                                            <span className={i === 0 ? 'text-[var(--primary)]' : i === 1 ? 'text-emerald-500' : 'text-violet-500'}>
                                                                {percentage}%
                                                            </span>
                                                        </div>
                                                        <div className="w-full h-2 bg-black/10 rounded-full overflow-hidden">
                                                            <div className={cn("h-full", colors[i % colors.length])} style={{ width: `${percentage}%` }} />
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="text-center py-4">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] opacity-50">{I18N_TEXTS.ANALYTICS.NO_EXPENSES}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-10 pt-8 border-t border-[var(--border-color)]">
                                        <button 
                                            onClick={() => generateFinancialReport({ user, stats, transactions })}
                                            disabled={!stats}
                                            className="w-full py-4 bg-black/5 hover:bg-slate-100 dark:hover:bg-white/5 active:bg-slate-200 dark:active:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl text-[10px] font-black uppercase tracking-widest transition-colors duration-200 flex items-center justify-center gap-2 border border-transparent active:border-slate-300 dark:active:border-slate-700"
                                        >
                                            {I18N_TEXTS.ACTIONS.EXPORT_PDF} <ArrowUpRight size={14} />
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-[var(--primary)] rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
                                    <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                                        <ReceiptText size={120} strokeWidth={1} />
                                    </div>
                                    <h3 className="text-xl font-black uppercase tracking-tighter mb-2">{I18N_TEXTS.OCR_CARD.TITLE}</h3>
                                    <p className="text-white/70 text-sm font-medium mb-6">{I18N_TEXTS.OCR_CARD.DESCRIPTION}</p>
                                    <button 
                                        onClick={() => navigate(ROUTES.OCR_SCANNER)}
                                        className="bg-white text-[var(--primary)] px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl transition-transform duration-150 ease-out hover:scale-105 hover:shadow-md active:scale-95 cursor-pointer"
                                    >
                                        {I18N_TEXTS.ACTIONS.UPLOAD_FILE}
                                    </button>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </div>

            <EditGroupModal
                isOpen={!!editingGroup}
                onClose={() => setEditingGroup(null)}
                group={editingGroup}
            />

            {/* Modal de Confirmación Limpio de Eliminación */}
            <AnimatePresence>
                {groupToDeleteConfirm && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => !isDeleting && setGroupToDeleteConfirm(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 16 }}
                            transition={{ duration: 0.18, ease: "easeOut" }}
                            className="relative w-full max-w-md bg-[#0f172a] rounded-3xl border border-rose-500/30 p-6 sm:p-8 shadow-2xl text-center space-y-6 overflow-hidden"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center mx-auto shadow-sm">
                                <Trash2 size={26} />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-xl font-black text-white uppercase tracking-tight">
                                    ¿Eliminar este grupo?
                                </h3>
                                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                                    Estás a punto de eliminar <span className="text-white font-bold">"{groupToDeleteConfirm.name}"</span>. Esta acción es irreversible y eliminará todos los gastos y balances asociados.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <button
                                    type="button"
                                    disabled={isDeleting}
                                    onClick={() => setGroupToDeleteConfirm(null)}
                                    className="py-3 px-4 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 rounded-2xl text-xs font-black uppercase tracking-wider transition-colors duration-150 border border-slate-700 disabled:opacity-50 cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    disabled={isDeleting}
                                    onClick={async () => {
                                        setIsDeleting(true);
                                        try {
                                            const id = groupToDeleteConfirm.id;
                                            setGroupToDeleteConfirm(null);
                                            await deleteGroup(id);
                                        } finally {
                                            setIsDeleting(false);
                                        }
                                    }}
                                    className="py-3 px-4 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-rose-600/30 hover:scale-[1.02] transition-transform duration-150 ease-out disabled:opacity-50 cursor-pointer"
                                >
                                    Confirmar
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <TwoFactorModal
                isOpen={is2FAModalOpen}
                onClose={() => setIs2FAModalOpen(false)}
                onVerified={confirmDeleteGroup}
                userId={userId || ''}
                actionTitle={I18N_TEXTS.DELETE_MODAL.TITLE}
                actionDescription={I18N_TEXTS.DELETE_MODAL.DESCRIPTION}
            />

            {/* Acciones Rápidas (Floating Quick Actions) */}
            <QuickActions 
                canCreateGroup={canCreateGroup}
                activeGroups={allActiveGroups}
            />
        </div>
    );
};