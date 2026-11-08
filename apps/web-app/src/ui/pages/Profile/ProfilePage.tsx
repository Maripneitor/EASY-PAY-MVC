import React, { useState } from 'react';
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
    PieChart,
    Laptop,
    Globe,
    Shield,
    Trash2,
    Clock
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
import { TwoFactorModal } from '@ui/components/Security/TwoFactorModal';
import { userRepository } from '../../../infrastructure/api/repositories';

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

    const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
    const [activeSessions, setActiveSessions] = useState<any[]>([]);
    const [loadingSessions, setLoadingSessions] = useState(false);

    // Cargar sesiones reales desde MongoDB
    const loadSessions = React.useCallback(async () => {
        if (!user?.id) return;
        setLoadingSessions(true);
        try {
            const data = await userRepository.getActiveSessions();
            setActiveSessions(data);
        } catch (error) {
            console.error("Error al cargar sesiones:", error);
        } finally {
            setLoadingSessions(false);
        }
    }, [user?.id]);

    React.useEffect(() => {
        loadSessions();
    }, [loadSessions]);

    const handleRevokeSession = async (sessionId: string) => {
        try {
            await userRepository.revokeSession(sessionId);
            setActiveSessions(prev => prev.filter(s => s.id !== sessionId));
            toast.success('Sesión remota revocada correctamente', {
                description: 'El token ha sido invalidado en la base de datos.'
            });
        } catch (error: any) {
            toast.error(error.message || 'Error al revocar la sesión');
        }
    };

    const handleRevokeAllOtherSessions = async () => {
        try {
            await userRepository.revokeAllOtherSessions();
            setActiveSessions(prev => prev.filter(s => s.isCurrent));
            toast.success('Todas las sesiones remotas han sido revocadas', {
                description: 'Solo tu dispositivo actual mantiene el acceso activo.'
            });
        } catch (error: any) {
            toast.error(error.message || 'Error al revocar sesiones remotas');
        }
    };

    const handleOpen2FAFlow = async () => {
        if (is2FAActive) {
            toast.info('Doble Factor (2FA) ya se encuentra activo', {
                description: 'Tu cuenta cuenta con protección adicional mediante códigos.'
            });
            return;
        }

        if (!user?.id) {
            navigate(ROUTES.TWO_FACTOR_SETUP);
            return;
        }

        const toastId = toast.loading('Preparando configuración de 2FA...');
        try {
            await userRepository.setupTwoFactor(user.id);
            toast.success('Código de seguridad enviado a tu correo', { id: toastId });
            setIs2FAModalOpen(true);
        } catch (error: any) {
            toast.error(error.message || 'Error al iniciar configuración 2FA', { id: toastId });
            navigate(ROUTES.TWO_FACTOR_SETUP);
        }
    };

    const handleVerify2FASuccess = () => {
        setIs2FAModalOpen(false);
        toast.success('¡Doble Factor de Autenticación (2FA) activado con éxito!', {
            description: 'A partir de ahora tus operaciones críticas estarán protegidas.'
        });
    };

    const { colorTheme, isDark, setTheme, toggleTheme, fontSize, setFontSize } = useTheme();

    // --- LÓGICA DE DATOS REALES ---
    const userName = user?.nombre || user?.name || "Usuario";
    const userEmail = user?.email || "usuario@easypay.com";

    // CORRECCIÓN: Validamos si el 2FA está activo realmente en la sesión
    const is2FAActive = Boolean(user?.['2fa_enabled'] || user?.two_factor?.enabled || user?.is_verified);

    const avatarUrl = user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=3b82f6&color=fff&bold=true`;

    const handleThemeChange = (value: string) => {
        if (value === 'light') {
            if (isDark) toggleTheme();
            setTheme('default');
            toast.success('Tema cambiado a Claro');
        } else {
            if (!isDark) toggleTheme();
            setTheme(value as any);
            toast.success(`Tema actualizado: ${value}`);
        }
    };

    const handleFontSizeChange = (size: 'small' | 'medium' | 'large') => {
        setFontSize(size);
        const labels = { small: 'Chico', medium: 'Normal', large: 'Grande' };
        toast.success(`Tamaño de texto ajustado a ${labels[size]}`);
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
                                        {(['small', 'medium', 'large'] as const).map((size) => (
                                            <button
                                                key={size}
                                                onClick={() => handleFontSizeChange(size)}
                                                className={`flex-1 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                                                    fontSize === size ? 'bg-[var(--primary)] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
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

                                {/* Seguridad 2FA Dinámica */}
                                <button 
                                    onClick={handleOpen2FAFlow} 
                                    className="w-full p-4 flex items-center justify-between hover:bg-[var(--hover-bg)] transition-colors group"
                                    title={is2FAActive ? "2FA Habilitado" : "Configurar verificación en dos pasos"}
                                >
                                    <div className="flex items-center gap-3">
                                        <Smartphone className="text-[var(--text-secondary)] group-hover:text-[var(--primary)] transition-colors" size={20} />
                                        <div className="text-left">
                                            <span className="text-sm font-medium text-[var(--text-primary)] block">Seguridad 2FA</span>
                                            <span className="text-[10px] text-[var(--text-secondary)]">Doble factor de autenticación</span>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border transition-all ${
                                        is2FAActive
                                            ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20 shadow-sm"
                                            : "text-amber-500 bg-amber-500/10 border-amber-500/20 hover:scale-105"
                                    }`}>
                                        {is2FAActive ? "ACTIVADO" : "CONFIGURAR"}
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

                    {/* SECCIÓN 2: Historial de Sesiones Activas (Seguridad de Cuenta) */}
                    <section className="w-full mt-10">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                            <div>
                                <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                                    <Shield className="text-[var(--primary)]" size={18} />
                                    Sesiones Activas
                                </h3>
                                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                                    Dispositivos y navegadores con acceso autorizado a tu cuenta.
                                </p>
                            </div>
                            {activeSessions.length > 1 && (
                                <button
                                    onClick={handleRevokeAllOtherSessions}
                                    className="text-[11px] font-black uppercase tracking-wider text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
                                >
                                    <LogOut size={14} />
                                    Cerrar todas las demás sesiones
                                </button>
                            )}
                        </div>

                        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden divide-y divide-[var(--border-color)] shadow-sm">
                            {activeSessions.map((session) => (
                                <div key={session.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-black/5 dark:hover:bg-white/[0.02]">
                                    <div className="flex items-start sm:items-center gap-3.5">
                                        <div className={`p-2.5 rounded-xl shrink-0 ${
                                            session.isCurrent 
                                                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'
                                        }`}>
                                            {session.type === 'desktop' ? <Laptop size={20} /> : <Smartphone size={20} />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-bold text-sm text-[var(--text-primary)]">{session.device}</span>
                                                {session.isCurrent ? (
                                                    <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                                                        Sesión Actual
                                                    </span>
                                                ) : (
                                                    <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                                                        <Clock size={10} /> {session.lastActive}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] mt-1 flex-wrap">
                                                <span className="flex items-center gap-1"><Globe size={12} /> {session.location}</span>
                                                <span>•</span>
                                                <span className="font-mono text-[11px] opacity-75">IP: {session.ip}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        {session.isCurrent ? (
                                            <span className="text-[11px] font-bold text-emerald-500 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/5">
                                                <CheckCircle size={14} /> Conectado
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => handleRevokeSession(session.id)}
                                                className="px-3.5 py-1.5 rounded-xl border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 active:scale-95 text-xs font-bold transition-all flex items-center gap-1.5 w-full sm:w-auto justify-center"
                                                title="Revocar acceso"
                                            >
                                                <LogOut size={13} />
                                                Cerrar sesión
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </main>

                {/* Modal interactivo de configuración 2FA */}
                <TwoFactorModal
                    isOpen={is2FAModalOpen}
                    onClose={() => setIs2FAModalOpen(false)}
                    onVerified={handleVerify2FASuccess}
                    userId={user?.id || ''}
                    actionTitle="Configurar Doble Factor (2FA)"
                    actionDescription="Ingresa el código numérico de 6 dígitos enviado a tu correo electrónico para habilitar 2FA."
                />
            </div>
    );
};