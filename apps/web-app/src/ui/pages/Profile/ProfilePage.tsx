import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
    Edit2,
    CreditCard,
    Users,
    CheckCircle,
    BarChart3,
    ChevronRight,
    Smartphone,
    LogOut,
    Palette,
    Type,
    Lock,
    ArrowDownRight,
    ArrowUpRight,
    AlertCircle,
    ShoppingBag,
    PieChart
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { PageHeader } from '@ui/components/PageHeader';
import { useAuthContext } from '../../context/AuthContext';
import { useProfileStats } from './useProfileStats';
import { useDashboard } from '../Dashboard/useDashboard';
import { ROUTES } from '../../../infrastructure/routes';
import { generateFinancialReport } from '../../../infrastructure/services/PdfService';
import { toast } from 'sonner';
import { Download } from 'lucide-react';
import { PieChart as RePieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export const ProfilePage = () => {
    const navigate = useNavigate();
    const { toggleSidebar } = useOutletContext<{ toggleSidebar: () => void }>();
    const { logout, user } = useAuthContext();
    const { stats, loading: statsLoading } = useProfileStats();
    const { allActiveGroups, settledGroups } = useDashboard();
    const [isMounted, setIsMounted] = React.useState(false);

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    // --- Dynamic Calculations ---
    const totalGroups = (allActiveGroups?.length || 0) + (settledGroups?.length || 0);
    const amountIOwe = allActiveGroups?.reduce((acc, g) => {
        const balance = Number(g.mi_balance || 0); // Logical reference
        return acc + (balance < 0 ? Math.abs(balance) : 0);
    }, 0) || 0;
    const amountOwedToMe = allActiveGroups?.reduce((acc, g) => {
        const balance = Number(g.mi_balance || 0); // Logical reference
        return acc + (balance > 0 ? balance : 0);
    }, 0) || 0;
    const activeDebtGroupsCount = allActiveGroups?.filter(g => g.mi_balance !== 0).length || 0; // Logical reference

    const { colorTheme, isDark, setTheme, toggleTheme, fontSize, setFontSize } = useTheme();

    // --- LÓGICA DE DATOS REALES ---
    const userName = user?.nombre || user?.name || "Usuario";
    const userEmail = user?.email || "usuario@easypay.com";

    // CORRECCIÓN: Validamos si el 2FA está activo realmente en la sesión
    const is2FAActive = user?.['2fa_enabled'] || user?.two_factor?.enabled || user?.is_verified;

    const avatarUrl = user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=3b82f6&color=fff&bold=true`;

    const handleThemeChange = (value: string) => {
        if (value === 'light') { // Logical reference
            if (isDark) toggleTheme();
            setTheme('default'); // Logical reference
        } else {
            if (!isDark) toggleTheme();
            setTheme(value as any);
        }
    };

    return (
        <div className="w-full space-y-8 animate-in fade-in duration-500">
            <div className="bg-transparent [&_header]:bg-transparent [&_header]:backdrop-blur-none [&_header]:border-[var(--border-color)]">
                <PageHeader
                    onMenuClick={toggleSidebar}
                    title="MI PERFIL"
                    subtitle="Gestiona tu cuenta"
                    showStats
                    onStatsClick={() => navigate(ROUTES.STATS)}
                />
            </div>

                <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">

                    {/* Tarjeta de Identidad Principal */}
                    <section className="w-full">
                        <div className="bg-[var(--bg-card)] backdrop-blur-xl border border-[var(--border-color)] rounded-2xl p-8 flex flex-col items-center justify-center relative overflow-hidden group shadow-lg dark:shadow-none transition-all">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--primary)]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none transition-colors duration-300"></div>

                            <div className="relative z-10 flex flex-col items-center text-center">
                                <div className="relative mb-6">
                                    <div className="w-28 h-28 rounded-full bg-slate-100 dark:bg-slate-800 p-1 shadow-[0_0_20px_var(--primary)]/20 border-2 border-[var(--primary)]/30 overflow-hidden transition-all duration-300">
                                        <img
                                            alt="Avatar"
                                            className="w-full h-full rounded-full object-cover"
                                            src={avatarUrl}
                                        />
                                    </div>
                                    <div className="absolute bottom-1 right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900"></div>
                                </div>

                                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-1">{userName}</h2>
                                <p className="text-[var(--text-secondary)] text-sm">{userEmail}</p>
                                <p className="text-slate-400 dark:text-slate-500 text-xs mt-2 font-mono uppercase tracking-widest">Miembro desde: Marzo 2026</p>

                                <button
                                    onClick={() => navigate(ROUTES.PERSONAL_DATA)}
                                    className="mt-6 px-6 py-2 rounded-full border border-[var(--primary)] bg-transparent text-[var(--primary)] text-sm font-medium hover:bg-[var(--primary)]/10 transition-all flex items-center gap-2 shadow-sm duration-300"
                                >
                                    <Edit2 size={16} />
                                    Editar Perfil
                                </button>
                            </div>
                        </div>
                    </section>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <section className="lg:col-span-2">
                            <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">Historial</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* 1. Historial de Gastado (Total histórico) */}
                                <div className="bg-[var(--bg-card)] backdrop-blur-md border border-[var(--border-color)] rounded-xl p-5 shadow-sm dark:shadow-none">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[var(--text-secondary)] text-sm font-medium">Total Gastado</span>
                                        <CreditCard className="text-slate-400 dark:text-slate-500" size={20} />
                                    </div>
                                    <div className="text-2xl font-mono font-bold text-[var(--text-primary)]">
                                        ${stats?.total_spent?.toLocaleString('es-MX', { minimumFractionDigits: 2 }) || '0.00'}
                                    </div>
                                </div>

                                {/* 2. Grupos a los que pertenece */}
                                <div className="bg-[var(--bg-card)] backdrop-blur-md border border-[var(--border-color)] rounded-xl p-5 shadow-sm dark:shadow-none">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[var(--text-secondary)] text-sm font-medium">Mis Grupos</span>
                                        <Users className="text-slate-400 dark:text-slate-500" size={20} />
                                    </div>
                                    <div className="text-2xl font-mono font-bold text-[var(--text-primary)]">
                                        {totalGroups}
                                    </div>
                                </div>

                                {/* 3. Lo que se debe (Deudas activas a pagar) */}
                                <div className="bg-[var(--bg-card)] backdrop-blur-md border border-[var(--border-color)] rounded-xl p-5 shadow-sm dark:shadow-none">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[var(--text-secondary)] text-sm font-medium">Lo que debo</span>
                                        <div className="flex items-center gap-1 text-rose-500">
                                            {activeDebtGroupsCount > 0 && <span className="text-[10px] font-bold bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">{activeDebtGroupsCount} activas</span>}
                                            <ArrowDownRight size={20} />
                                        </div>
                                    </div>
                                    <div className="text-2xl font-mono font-bold text-rose-500 dark:text-rose-400">
                                        ${amountIOwe.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                    </div>
                                </div>

                                {/* 4. Lo que le deben (A cobrar) */}
                                <div className="bg-[var(--bg-card)] backdrop-blur-md border border-[var(--border-color)] rounded-xl p-5 shadow-sm dark:shadow-none">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[var(--text-secondary)] text-sm font-medium">Lo que me deben</span>
                                        <ArrowUpRight className="text-emerald-500 dark:text-emerald-400" size={20} />
                                    </div>
                                    <div className="text-2xl font-mono font-bold text-emerald-500 dark:text-emerald-400">
                                        ${amountOwedToMe.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                            </div>

                            {/* Gastos por Categoría */}
                            <div className="mt-8 bg-[var(--bg-card)] backdrop-blur-md border border-[var(--border-color)] rounded-2xl p-6 md:p-8 shadow-sm dark:shadow-none">
                                <h4 className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest mb-6">Desglose de Gastos</h4>
                                
                                {statsLoading ? (
                                    <div className="animate-pulse space-y-4">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
                                        <div className="w-full lg:w-1/2 h-64 md:h-80 relative">
                                            {(!stats?.by_category || stats.by_category.length === 0) && (
                                                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
                                                    <div className="p-4 bg-black/5 rounded-full mb-2">
                                                        <PieChart className="text-slate-300" size={32} />
                                                    </div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sin datos de gastos</p>
                                                </div>
                                            )}
                                            {isMounted && (
                                                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                                    <RePieChart>
                                                        <Pie
                                                            data={(!stats?.by_category || stats.by_category.length === 0) ? [{ category: 'Vacío', amount: 1 }] : stats.by_category}
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={60}
                                                            outerRadius={100}
                                                            paddingAngle={(!stats?.by_category || stats.by_category.length === 0) ? 0 : 5}
                                                            dataKey="amount"
                                                            nameKey="category"
                                                            stroke="none"
                                                        >
                                                            {(!stats?.by_category || stats.by_category.length === 0) ? (
                                                                <Cell fill="#e2e8f0" />
                                                            ) : (
                                                                stats.by_category.map((entry: any, index: number) => (
                                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                                ))
                                                            )}
                                                        </Pie>
                                                        {stats?.by_category?.length > 0 && (
                                                            <Tooltip 
                                                                formatter={(value: any) => `$${Number(value || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
                                                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', background: 'var(--bg-card)' }}
                                                            />
                                                        )}
                                                    </RePieChart>
                                                </ResponsiveContainer>
                                            )}
                                        </div>
                                        
                                        <div className="w-full lg:w-1/2 space-y-4">
                                            {stats?.by_category?.length > 0 ? (
                                                stats.by_category.map((cat: any, idx: number) => (
                                                    <div key={idx} className="flex items-center justify-between p-3 bg-black/5 rounded-2xl border border-white/5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                                                            <span className="font-bold text-sm text-[var(--text-primary)]">{cat.category}</span>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-sm font-mono font-black text-[var(--text-primary)]">
                                                                ${cat.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                                            </div>
                                                            <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                                                                {cat.percentage}%
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="py-12 text-center opacity-30">
                                                    <ShoppingBag size={48} className="mx-auto mb-3" />
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Registra tu primer gasto para ver el desglose</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Columna Derecha: Ajustes y Seguridad */}
                        <section className="lg:col-span-1">
                            <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">Configuración</h3>
                            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-700/50 shadow-sm dark:shadow-none">

                                {/* Selector de Temas */}
                                <div className="p-4 flex flex-col gap-3">
                                    <div className="flex items-center gap-3">
                                        <Palette className="text-[var(--text-secondary)]" size={20} />
                                        <span className="text-sm font-medium text-[var(--text-primary)]">Tema</span>
                                    </div>
                                    <select
                                        value={!isDark ? 'light' : colorTheme} // Logical reference
                                        onChange={(e) => handleThemeChange(e.target.value)}
                                        className="w-full bg-[var(--bg-body)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm rounded-lg p-2.5 outline-none cursor-pointer transition-all"
                                    >
                                        <option value="light">Claro</option>
                                        <option value="default">Oscuro (Original)</option>
                                        <option value="vibrant">Vibrante (Rojo Mate)</option>
                                        <option value="serene">Sereno (Verde Bosque)</option>
                                        <option value="earth">Tierra (Ámbar)</option>
                                        <option value="pink">Rosa (Lomecan)</option>
                                    </select>
                                </div>

                                {/* Tamaño de fuente */}
                                <div className="p-4 flex flex-col gap-3">
                                    <div className="flex items-center gap-3">
                                        <Type className="text-[var(--text-secondary)]" size={20} />
                                        <span className="text-sm font-medium text-[var(--text-primary)]">Tamaño de Texto</span>
                                    </div>
                                    <div className="flex p-1 bg-[var(--bg-body)] rounded-xl border border-[var(--border-color)]">
                                        {['small', 'medium', 'large'].map((size) => ( // Logical reference
                                            <button
                                                key={size} // Logical reference
                                                onClick={() => setFontSize(size as any)} // Logical reference
                                                className={`flex-1 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${fontSize === size ? 'bg-[var(--primary)] text-white' : 'text-slate-500' // Logical reference
                                                    }`}
                                            >
                                                {size === 'small' ? 'Chico' : size === 'medium' ? 'Normal' : 'Grande'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Historial */}
                                <button onClick={() => navigate(ROUTES.STATS)} className="w-full p-4 flex items-center justify-between hover:bg-[var(--hover-bg)] transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <BarChart3 className="text-[var(--text-secondary)]" size={20} />
                                        <span className="text-sm font-medium text-[var(--text-secondary)]">Gráficas y Análisis</span>
                                    </div>
                                    <ChevronRight className="text-slate-400" size={18} />
                                </button>

                                {/* Exportar Reporte PDF (New Location) */}
                                <button 
                                    onClick={() => {
                                        if (stats) {
                                            toast.promise(Promise.resolve().then(() => generateFinancialReport({ user, stats, transactions: stats.transactions })), {
                                                loading: 'Generando Reporte Financiero PDF...',
                                                success: 'Reporte Mensual exportado correctamente',
                                                error: 'Error al generar el PDF'
                                            });
                                        }
                                    }}
                                    className="w-full p-4 flex items-center justify-between hover:bg-[var(--hover-bg)] transition-colors group border-y border-slate-100 dark:border-slate-700/50"
                                >
                                    <div className="flex items-center gap-3">
                                        <Download className="text-[var(--primary)]" size={20} />
                                        <span className="text-sm font-bold text-[var(--text-primary)]">Exportar Reporte (PDF)</span>
                                    </div>
                                    <div className="bg-emerald-500/10 px-2 py-0.5 rounded text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Verificado</div>
                                </button>


                                {/* Cambiar contraseña */}
                                <button onClick={() => navigate(ROUTES.RECOVER_PASSWORD)} className="w-full p-4 flex items-center justify-between hover:bg-[var(--hover-bg)] transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <Lock className="text-[var(--text-secondary)]" size={20} />
                                        <span className="text-sm font-medium text-[var(--text-secondary)]">Cambiar contraseña</span>
                                    </div>
                                    <ChevronRight className="text-slate-400" size={18} />
                                </button>

                                {/* CORRECCIÓN: Seguridad 2FA Dinámica */}
                                <button onClick={() => navigate(ROUTES.TWO_FACTOR_SETUP)} className="w-full p-4 flex items-center justify-between hover:bg-[var(--hover-bg)] transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <Smartphone className="text-[var(--text-secondary)]" size={20} />
                                        <span className="text-sm font-medium text-[var(--text-secondary)]">Seguridad 2FA</span>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-colors ${is2FAActive
                                            ? "text-green-500 bg-green-500/10 border-green-500/20"
                                            : "text-amber-500 bg-amber-500/10 border-amber-500/20"
                                        }`}>
                                        {is2FAActive ? "ACTIVO" : "CONFIGURAR"}
                                    </span>
                                </button>

                                {/* BOTÓN DE CERRAR SESIÓN FINAL */}
                                <button
                                    onClick={logout}
                                    className="w-full p-4 flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors group"
                                >
                                    <LogOut className="text-red-500" size={20} />
                                    <span className="text-sm font-bold text-red-500">Cerrar Sesión</span>
                                </button>
                            </div>
                            <p className="text-center text-slate-400 dark:text-slate-600 text-[10px] mt-6 font-mono uppercase tracking-widest">Easy-Pay v2.4.0 (Build 942)</p>
                        </section>
                    </div>
                </main>
            </div>
    );
};