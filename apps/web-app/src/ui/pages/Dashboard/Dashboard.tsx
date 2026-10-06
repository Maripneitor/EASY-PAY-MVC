import React from 'react';
import { useOutletContext } from 'react-router-dom';
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
    ReceiptText 
} from 'lucide-react';
import { cn, toTitleCase } from '@infrastructure/utils';
import { PageHeader } from '@ui/components/PageHeader/PageHeader';
import { GroupCard } from './components/GroupCard';
import { TwoFactorModal } from '@ui/components/Security/TwoFactorModal';
import { generateFinancialReport } from '@infrastructure/services/PdfService';

// ─── Componentes de UI Internos ──────────────────────────────────────────────
const DashboardSkeleton: React.FC = () => {
    return (
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
            <div className="animate-pulse rounded-2xl bg-slate-200/50 dark:bg-slate-800/50 p-6 h-32" />
            <div className="animate-pulse rounded-2xl bg-slate-200/50 dark:bg-slate-800/50 p-6 h-32" />
            <div className="animate-pulse rounded-2xl bg-slate-200/50 dark:bg-slate-800/50 p-6 h-32" />
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
        DESCRIPTION: 'Súbelo ahora y deja que la IA desglosé los gastos por ti en segundos.'
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
    const userName = user?.nombre || I18N_TEXTS.PLACEHOLDERS.USER;
    
    const welcomeTitle = `${I18N_TEXTS.WELCOME_PREFIX} ${toTitleCase(userName)}`;

    const getAppearance = (name: string) => {
        const hash = name.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
        const style = APPEARANCE_COLORS[hash % APPEARANCE_COLORS.length];
        return {
            icon: <span className="text-xl font-black">{name.charAt(0).toUpperCase()}</span>,
            bg: style.bg,
            color: style.text
        };
    };

    const handleDelete = async (e: React.MouseEvent, groupId: string) => {
        e.stopPropagation();
        e.preventDefault();
        await deleteGroup(groupId);
    };

    const formatCurrency = (amount: number) => {
        return amount?.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00';
    };

    return (
        <div className="min-h-screen bg-[var(--bg-body)] pb-20 transition-colors duration-300 font-display text-[var(--text-primary)] md:flex md:pb-0">
            <div className="relative flex min-w-0 flex-1 flex-col">
                <PageHeader
                    onMenuClick={toggleSidebar}
                    title={welcomeTitle}
                    subtitle={I18N_TEXTS.SUBTITLE}
                    showStats
                />

                <main className="relative flex-grow px-4 py-8 md:px-8 max-w-7xl mx-auto w-full">
                    {/* Background decorative elements */}
                    <div className="pointer-events-none absolute -left-[10%] -top-[20%] h-[500px] w-[500px] rounded-full bg-[var(--primary)]/5 blur-[120px]" />
                    <div className="pointer-events-none absolute -right-[10%] bottom-[10%] h-[400px] w-[400px] rounded-full bg-emerald-500/5 blur-[100px]" />

                    <div className="relative z-10 space-y-8">
                        
                        {/* --- DASHBOARD STATS (Expanded Desktop View) --- */}
                        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
                                        <Wallet size={24} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded-full">
                                        <TrendingUp size={12} /> {stats?.groups_count || 0} {I18N_TEXTS.STATS.GROUPS_LABEL}
                                    </span>
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-1">{I18N_TEXTS.STATS.TOTAL_SPENT}</p>
                                <h3 className="text-3xl font-black">${formatCurrency(stats?.total_spent || 0)}</h3>
                            </div>

                            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500">
                                        <TrendingUp size={24} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] opacity-50">{I18N_TEXTS.STATS.SALDOS}</span>
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-1">{I18N_TEXTS.STATS.OWED_TO_USER}</p>
                                <h3 className="text-3xl font-black text-emerald-500">${formatCurrency(stats?.owed_to_user || 0)}</h3>
                            </div>

                            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-rose-500/10 rounded-2xl text-rose-500">
                                        <TrendingDown size={24} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-rose-500 flex items-center gap-1 bg-rose-500/10 px-2 py-1 rounded-full">
                                        {I18N_TEXTS.STATS.PENDING}
                                    </span>
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-1">{I18N_TEXTS.STATS.USER_OWES}</p>
                                <h3 className="text-3xl font-black text-rose-500">${formatCurrency(stats?.user_owes || 0)}</h3>
                            </div>

                            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-violet-500/10 rounded-2xl text-violet-500">
                                        <Users size={24} />
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => navigate('/create-group')} 
                                            className="p-2 bg-[var(--primary)] text-white rounded-xl hover:opacity-90 transition-opacity"
                                            title={I18N_TEXTS.ACTIONS.CREATE_GROUP}
                                        >
                                            <Plus size={18} />
                                        </button>
                                        <button 
                                            onClick={() => navigate('/create-group?tab=join')} 
                                            className="p-2 bg-emerald-500 text-white rounded-xl hover:opacity-90 transition-opacity"
                                            title={I18N_TEXTS.ACTIONS.JOIN_GROUP}
                                        >
                                            <Users size={18} />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-1">{I18N_TEXTS.STATS.ACTIVE_GROUPS}</p>
                                <h3 className="text-3xl font-black">{allActiveGroups.length}</h3>
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
                                        onClick={() => navigate('/create-group')}
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
                                                        onClick={() => navigate(`/grupo/${group.id}`)}
                                                        onDelete={mappedGroup.isAdmin ? (e) => handleDelete(e, group.id) : undefined}
                                                        appearance={appearance}
                                                    />
                                                );
                                            })
                                        ) : (
                                            <div className="col-span-full py-20 text-center border-4 border-dashed border-[var(--border-color)] rounded-[3rem] opacity-30">
                                                <Users size={48} className="mx-auto mb-4" />
                                                <p className="text-sm font-black uppercase tracking-widest">{I18N_TEXTS.GROUPS.NO_GROUPS}</p>
                                                <button 
                                                    onClick={() => navigate('/create-group')}
                                                    className="mt-4 text-[var(--primary)] font-bold text-xs uppercase tracking-widest"
                                                >
                                                    {I18N_TEXTS.ACTIONS.CREATE_FIRST}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
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
                                            className="w-full py-4 bg-black/5 hover:bg-black/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
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
                                        onClick={() => navigate('/ocr-scanner')}
                                        className="bg-white text-[var(--primary)] px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl"
                                    >
                                        {I18N_TEXTS.ACTIONS.UPLOAD_FILE}
                                    </button>
                                </div>
                            </section>
                        </div>
                    </div>
                </main>
            </div>

            <TwoFactorModal
                isOpen={is2FAModalOpen}
                onClose={() => setIs2FAModalOpen(false)}
                onVerified={confirmDeleteGroup}
                userId={userId || ''}
                actionTitle={I18N_TEXTS.DELETE_MODAL.TITLE}
                actionDescription={I18N_TEXTS.DELETE_MODAL.DESCRIPTION}
            />
        </div>
    );
};