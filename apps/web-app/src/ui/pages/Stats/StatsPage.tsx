import React, { useState, useMemo, useEffect } from 'react';
import { 
    BarChart3, 
    TrendingUp, 
    TrendingDown, 
    PieChart, 
    Calendar,
    ArrowLeft,
    Wallet,
    ArrowUpRight,
    ArrowDownLeft,
    ShoppingBag,
    Utensils,
    Car,
    Gamepad2,
    Briefcase,
    Ghost,
    Activity,
    Cake,
    Plane,
    CheckCircle,
    RotateCw,
    AlertCircle,
    Download,
    FileText,
    CreditCard,
    Clock,
    Film
} from 'lucide-react';
import { generateFinancialReport } from '../../../infrastructure/services/PdfService';
import { useAuthContext } from '../../context/AuthContext';
import { 
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as ReTooltip,
    ResponsiveContainer,
    PieChart as RePieChart,
    Pie,
    Cell,
    AreaChart,
    Area
} from 'recharts';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useProfileStats } from '../Profile/useProfileStats';
import { Loader } from '../../components/Loader/Loader';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../infrastructure/utils';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import styles from './StatsPage.module.css';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];
const EMPTY_COLOR = '#e2e8f0'; // Light gray for empty states

// --- Sub-componentes Semánticos ---

const EmptyStateOverlay = () => (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[var(--bg-card)]/40 backdrop-blur-[2px] rounded-[2.5rem]">
        <div className="p-4 bg-white/10 rounded-full mb-3 shadow-sm border border-white/5">
            <AlertCircle size={24} className="text-slate-400" />
        </div>
        <p className="text-xs font-black uppercase tracking-widest text-slate-500 text-center px-4">
            Aún no hay transacciones para analizar
        </p>
    </div>

);

const CategoryDonutChart = ({ data }: { data: any[] }) => {
    const isEmpty = !data || data.length === 0;
    const chartData = isEmpty ? [{ category: 'Sin datos', amount: 1 }] : data;

    return (
        <div className="min-h-[300px] h-[300px] w-full relative">
            {isEmpty && <EmptyStateOverlay />}
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
                <RePieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={100}
                        paddingAngle={isEmpty ? 0 : 8}
                        dataKey="amount"
                        nameKey="category"
                        stroke="none"
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={isEmpty ? EMPTY_COLOR : COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    {!isEmpty && (
                        <ReTooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                            itemStyle={{ color: 'var(--text-primary)', fontWeight: 'bold' }}
                            formatter={(value: any) => `$${Number(value || 0).toLocaleString('es-MX')}`}
                        />
                    )}
                </RePieChart>
            </ResponsiveContainer>
        </div>
    );
};

const IncomeExpenseChart = ({ data }: { data: any[] }) => {
    const isEmpty = !data || data.length === 0;
    const fallbackData = [
        { month: 'Ene', ingresos: 0, gastos: 0 },
        { month: 'Feb', ingresos: 0, gastos: 0 },
        { month: 'Mar', ingresos: 0, gastos: 0 },
        { month: 'Abr', ingresos: 0, gastos: 0 },
        { month: 'May', ingresos: 0, gastos: 0 },
        { month: 'Jun', ingresos: 0, gastos: 0 }
    ];
    const chartData = isEmpty ? fallbackData : data;

    return (
        <div className="min-h-[300px] h-[300px] w-full pt-4 relative">
            {isEmpty && <EmptyStateOverlay />}
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis 
                        dataKey="month" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    {!isEmpty && (
                        <ReTooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                        />
                    )}
                    <Bar dataKey="ingresos" fill={isEmpty ? EMPTY_COLOR : "#10b981"} radius={[4, 4, 0, 0]} name="Ingresos" barSize={32} />
                    <Bar dataKey="gastos" fill={isEmpty ? "#cbd5e1" : "#ef4444"} radius={[4, 4, 0, 0]} name="Gastos" barSize={32} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

const ExpenseLineChart = ({ data }: { data: any[] }) => {
    const isEmpty = !data || data.length === 0;
    const fallbackData = [
        { month: 'Ene', total: 0 },
        { month: 'Feb', total: 0 },
        { month: 'Mar', total: 0 },
        { month: 'Abr', total: 0 },
        { month: 'May', total: 0 },
        { month: 'Jun', total: 0 }
    ];
    const chartData = isEmpty ? fallbackData : data;

    return (
        <div className="min-h-[300px] h-[300px] w-full pt-4 relative">
            {isEmpty && <EmptyStateOverlay />}
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
                <AreaChart data={chartData}>
                    <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={isEmpty ? EMPTY_COLOR : "var(--primary)"} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={isEmpty ? EMPTY_COLOR : "var(--primary)"} stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis 
                        dataKey="month" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                    />
                    <YAxis hide />
                    {!isEmpty && (
                        <ReTooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                            cursor={{ stroke: 'var(--primary)', strokeWidth: 2 }}
                        />
                    )}
                    <Area 
                        type="monotone" 
                        dataKey="total" 
                        stroke={isEmpty ? EMPTY_COLOR : "var(--primary)"} 
                        strokeWidth={4}
                        fillOpacity={1} 
                        fill="url(#colorTotal)" 
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export const StatsPage = () => {
    const { toggleSidebar } = useOutletContext<{ toggleSidebar: () => void }>();
    const navigate = useNavigate();
    const { user } = useAuthContext();
    const { stats, loading, refresh } = useProfileStats();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);
    
    // Transactions from hook
    const transactions = stats?.transactions || [];
    
    if (loading) return <Loader />;
    
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { 
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    // Ensure we have data structure even if backend is empty
    const incomeVsExpenses = stats?.income_vs_expenses || [];
    const categories = stats?.categories || [];
    const monthlyTrend = stats?.monthly_trend || [];
    
    // Always show the dashboard, even if "empty"
    const hasAnyData = (stats?.total_spent > 0) || (incomeVsExpenses.length > 0) || (categories.length > 0);

    return (
        <div className="w-full space-y-8 animate-in fade-in duration-500">
            <PageHeader
                title="ESTADÍSTICAS"
                subtitle="Análisis detallado de tus finanzas"
                onMenuClick={toggleSidebar}
                onBack={() => navigate(-1)}
                rightSlot={
                    <button 
                        onClick={() => refresh()}
                        className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/10 text-[var(--text-primary)]"
                        title="Actualizar"
                    >
                        <RotateCw size={24} className={loading ? "animate-spin" : ""} />
                    </button>
                }
            />

            <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-8 md:space-y-12"
                >


                    {/* --- Summary Cards (KPIs) --- */}
                    <section className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                        <motion.div variants={itemVariants} className="p-6 md:p-8 bg-[var(--bg-card)] rounded-[2rem] md:rounded-[2.5rem] border border-[var(--border-color)] shadow-sm group hover:border-[var(--primary)]/30 transition-all backdrop-blur-xl relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                                <Wallet size={64} />
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Total Transaccionado</span>
                            <h2 className="text-3xl md:text-4xl font-black mt-2 tracking-tighter text-[var(--text-primary)]">
                                ${Number(stats?.total_spent || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </h2>
                            <div className="mt-3 flex items-center gap-2 text-[10px] font-bold text-slate-500">
                                <Activity size={14} className="text-[var(--primary)]" /> Historial acumulado
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants} className="p-6 md:p-8 bg-[var(--bg-card)] rounded-[2rem] md:rounded-[2.5rem] border border-[var(--border-color)] shadow-sm group hover:border-emerald-500/30 transition-all backdrop-blur-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                                <ArrowUpRight size={64} />
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">A favor (Por cobrar)</span>
                            <h2 className="text-3xl md:text-4xl font-black mt-2 tracking-tighter text-emerald-500">
                                ${Number(stats?.owed_to_user || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-3 flex items-center gap-2">
                                <ArrowUpRight size={14} className="text-emerald-500" /> Dinero que te deben
                            </p>
                        </motion.div>

                        <motion.div variants={itemVariants} className="p-6 md:p-8 bg-[var(--bg-card)] rounded-[2rem] md:rounded-[2.5rem] border border-[var(--border-color)] shadow-sm group hover:border-rose-500/30 transition-all backdrop-blur-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                                <ArrowDownLeft size={64} />
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Deudas (Por pagar)</span>
                            <h2 className="text-3xl md:text-4xl font-black mt-2 tracking-tighter text-rose-500">
                                ${Number(stats?.user_owes || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-3 flex items-center gap-2">
                                <ArrowDownLeft size={14} className="text-rose-500" /> Dinero que debes
                            </p>
                        </motion.div>
                    </section>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
                        {/* --- Comparison Chart --- */}
                        <motion.section variants={itemVariants} className="p-6 md:p-10 bg-[var(--bg-card)] rounded-[2rem] md:rounded-[3rem] border border-[var(--border-color)] shadow-sm backdrop-blur-xl flex flex-col min-h-[450px]">
                            <div className="flex items-center justify-between mb-8 md:mb-10">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500">
                                        <Activity size={24} />
                                    </div>
                                    <h3 className="text-lg md:text-xl font-black uppercase tracking-tighter">Balance Mensual</h3>
                                </div>
                                <span className="text-[9px] font-black bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full uppercase tracking-widest hidden sm:inline-block">Ingresos vs Gastos</span>
                            </div>
                            
                            {isMounted && <IncomeExpenseChart data={incomeVsExpenses} />}
                        </motion.section>

                        {/* --- Category Breakdown --- */}
                        <motion.section variants={itemVariants} className="p-6 md:p-10 bg-[var(--bg-card)] rounded-[2rem] md:rounded-[3rem] border border-[var(--border-color)] shadow-sm backdrop-blur-xl flex flex-col min-h-[450px]">
                            <div className="flex items-center justify-between mb-8 md:mb-10">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-violet-500/10 rounded-2xl text-violet-500">
                                        <PieChart size={24} />
                                    </div>
                                    <h3 className="text-lg md:text-xl font-black uppercase tracking-tighter">Categorías</h3>
                                </div>
                                <span className="text-[9px] font-black bg-violet-500/10 text-violet-500 px-3 py-1 rounded-full uppercase tracking-widest hidden sm:inline-block">Distribución</span>
                            </div>
                            
                            <div className="flex flex-col items-center flex-1">
                                {isMounted && <CategoryDonutChart data={categories} />}
                                
                                {categories.length > 0 ? (
                                    <div className="grid grid-cols-2 w-full gap-3 mt-6">
                                        {categories.slice(0, 4).map((cat: any, index: number) => (
                                            <div key={index} className="flex items-center gap-3 p-3 md:p-4 bg-black/5 rounded-2xl border border-white/5">
                                                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                                <div className="min-w-0">
                                                    <p className="text-[9px] md:text-[10px] font-black uppercase tracking-tight text-slate-500 truncate">{cat.category || cat.name}</p>
                                                    <p className="text-xs font-bold text-[var(--text-primary)]">${Number(cat.amount || 0).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="mt-auto py-8 text-center opacity-30">
                                        <ShoppingBag size={48} className="mx-auto mb-2" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Sin categorías registradas</p>
                                    </div>
                                )}
                            </div>
                        </motion.section>
                    </div>

                    {/* --- Monthly Trend --- */}
                    <motion.section variants={itemVariants} className="p-6 md:p-10 bg-[var(--bg-card)] rounded-[2rem] md:rounded-[3rem] border border-[var(--border-color)] shadow-sm backdrop-blur-xl flex flex-col min-h-[400px]">
                        <div className="flex items-center justify-between mb-8 md:mb-10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
                                    <BarChart3 size={24} />
                                </div>
                                <h3 className="text-lg md:text-xl font-black uppercase tracking-tighter">Tendencia de Gasto</h3>
                            </div>
                        </div>
                        
                        {isMounted && <ExpenseLineChart data={monthlyTrend} />}
                        
                        <div className="mt-8 pt-8 border-t border-white/5 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Calendar size={14} className="text-slate-400" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Análisis de tiempo</span>
                            </div>
                            <span className={cn("text-[10px] font-black uppercase tracking-widest", monthlyTrend.length > 0 ? "text-emerald-500" : "text-slate-500")}>
                                {monthlyTrend.length > 0 ? 'Activo' : 'Sin datos'}
                            </span>
                        </div>
                    </motion.section>

                    {/* --- Análisis General (Insights) --- */}
                    <motion.section variants={itemVariants} className="p-8 md:p-12 bg-gradient-to-br from-[#0f172a] via-[#1e3a8a] to-[#1e40af] rounded-[2rem] md:rounded-[3rem] text-white relative overflow-hidden shadow-2xl border border-white/10">
                        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                            <Activity size={180} strokeWidth={1} />
                        </div>
                        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 md:gap-10">
                            <div className="flex-1 space-y-6 w-full">
                                <div className="flex items-center gap-3">
                                    <Calendar size={20} className="text-blue-200" />
                                    <h3 className="text-lg md:text-xl font-black uppercase tracking-tighter">Análisis General</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-white/10 backdrop-blur-md rounded-[1.25rem] p-5 md:p-6 border border-white/10 flex items-center gap-4 group hover:bg-white/20 transition-all">
                                        <div className="p-3 bg-white/10 rounded-xl group-hover:scale-110 transition-transform">
                                            <ShoppingBag size={24} className="text-blue-100 shrink-0" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-blue-100/70 mb-1">Categoría Mayoritaria</p>
                                            <p className="text-sm font-black tracking-tight text-white">
                                                {categories.length > 0 ? (
                                                    <span className="uppercase">{categories[0]?.category}</span>
                                                ) : (
                                                    <span className="opacity-50 italic">SIN DATOS</span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-md rounded-[1.25rem] p-5 md:p-6 border border-white/10 flex items-center gap-4 group hover:bg-white/20 transition-all">
                                        <div className="p-3 bg-white/10 rounded-xl group-hover:scale-110 transition-transform">
                                            <TrendingUp size={24} className="text-blue-100 shrink-0" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-blue-100/70 mb-1">Balance de Flujo</p>
                                            <p className="text-sm font-black tracking-tight text-white">
                                                ${Math.abs(Number(stats?.owed_to_user || 0) - Number(stats?.user_owes || 0)).toLocaleString('es-MX')}
                                                <span className="text-[10px] ml-2 opacity-70">
                                                    {(Number(stats?.owed_to_user || 0) - Number(stats?.user_owes || 0)) >= 0 ? 'A FAVOR' : 'EN DEUDA'}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="w-full lg:w-auto flex flex-col items-center gap-2 p-8 md:p-10 bg-black/10 rounded-[2rem] md:rounded-[2.5rem] border border-white/5 backdrop-blur-md">
                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-200">Total Transaccionado</span>
                                <h4 className="text-4xl md:text-5xl font-black tracking-tighter text-white">
                                    ${Number(stats?.total_spent || 0).toLocaleString('es-MX')}
                                </h4>
                                <div className="flex items-center gap-2 mt-2 px-3 py-1 bg-emerald-500/20 rounded-full border border-emerald-500/20">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-200">Actualizado</span>
                                </div>
                            </div>
                        </div>
                    </motion.section>

                    {/* --- Payment History (Migrated from MyPayments) --- */}
                    <motion.section variants={itemVariants} className="space-y-6">
                        <div className="flex justify-between items-center mb-6 px-2">
                            <h2 className="text-sm font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] flex items-center gap-3">
                                <Clock size={18} className="text-[var(--primary)]" />
                                Historial de Pagos
                            </h2>
                            <button className="text-[10px] font-black text-[var(--primary)] hover:underline tracking-widest uppercase transition-colors">Ver todos</button>
                        </div>
                        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[3rem] overflow-hidden shadow-xl backdrop-blur-xl">
                            {transactions.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-[var(--border-color)] text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] bg-black/5">
                                                <th className="px-10 py-6">Transacción</th>
                                                <th className="px-6 py-5">Fecha</th>
                                                <th className="px-6 py-5">Estado</th>
                                                <th className="px-8 py-5 text-right">Monto</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[var(--border-color)] text-sm">
                                            {transactions.map((tx: any) => (
                                                <tr 
                                                    key={tx.id} 
                                                    className="group hover:bg-[var(--hover-bg)] transition-all cursor-pointer"
                                                >
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-2xl bg-[var(--bg-body)] flex items-center justify-center border border-[var(--border-color)] group-hover:border-[var(--primary)]/30 transition-all shadow-sm">
                                                                {tx.icon === 'shopping-bag' ? (
                                                                    <ShoppingBag className="text-[var(--primary)]" size={20} />
                                                                ) : tx.icon === 'car' ? (
                                                                    <Car className="text-[var(--primary)]" size={20} />
                                                                ) : tx.icon === 'film' ? (
                                                                    <Film size={20} className="text-[var(--primary)]" />
                                                                ) : (
                                                                    <CreditCard className="text-[var(--primary)]" size={20} />
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="font-black text-[var(--text-primary)] uppercase tracking-tight">{tx.description || tx.group_name}</p>
                                                                <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest opacity-60">
                                                                    {tx.category || (tx.is_incoming ? 'Ingreso' : 'Gasto')} • {tx.group_name}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5 text-xs font-bold text-[var(--text-secondary)] uppercase">{tx.date}</td>
                                                    <td className="px-6 py-5">
                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${tx.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${tx.status === 'completed' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-pulse'}`}></span>
                                                            {tx.status === 'completed' ? 'Aprobado' : 'Pendiente'}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-5 text-right font-black text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors font-mono text-lg">
                                                        {tx.amount < 0 ? '-' : ''}${Math.abs(tx.amount).toFixed(2)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="py-20 text-center flex flex-col items-center justify-center opacity-40">
                                    <div className="w-16 h-16 rounded-full bg-black/5 flex items-center justify-center mb-4">
                                        <ShoppingBag size={32} />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">No hay transacciones recientes</p>
                                </div>
                            )}
                        </div>
                    </motion.section>
                </motion.div>
            </main>
        </div>
    );
};
