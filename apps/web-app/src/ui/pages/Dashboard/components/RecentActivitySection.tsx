import React from 'react';
import { 
    Clock, 
    ArrowUpRight, 
    Coffee, 
    Utensils, 
    ShoppingCart, 
    Car, 
    Film, 
    Receipt, 
    ArrowDownLeft,
    Tag
} from 'lucide-react';
import { cn } from '@infrastructure/utils';

interface Transaction {
    id: string;
    title: string;
    date?: string;
    amount: number;
    type?: 'paid' | 'consumed';
    category?: string;
}

interface RecentActivitySectionProps {
    transactions: Transaction[];
    isLoading?: boolean;
    onViewAll?: () => void;
}

const getCategoryIcon = (category: string = '') => {
    const cat = category.toLowerCase();
    if (cat.includes('comida') || cat.includes('restaurante')) return <Utensils size={16} />;
    if (cat.includes('cafe') || cat.includes('cafeter')) return <Coffee size={16} />;
    if (cat.includes('super') || cat.includes('despensa') || cat.includes('compra')) return <ShoppingCart size={16} />;
    if (cat.includes('transporte') || cat.includes('gasolina') || cat.includes('uber')) return <Car size={16} />;
    if (cat.includes('entretenimiento') || cat.includes('cine') || cat.includes('salida')) return <Film size={16} />;
    return <Receipt size={16} />;
};

const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Reciente';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return 'Reciente';
        return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
    } catch {
        return 'Reciente';
    }
};

export const RecentActivitySection: React.FC<RecentActivitySectionProps> = ({
    transactions = [],
    isLoading = false,
    onViewAll
}) => {
    const recentItems = transactions.slice(0, 5);

    return (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2.5rem] p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-[var(--primary)]/10 text-[var(--primary)] rounded-xl">
                        <Clock size={16} />
                    </div>
                    <div>
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--text-primary)]">
                            Últimos Movimientos
                        </h3>
                        <p className="text-[10px] font-bold text-[var(--text-secondary)]">
                            Tus gastos y consumos recientes
                        </p>
                    </div>
                </div>
                {onViewAll && recentItems.length > 0 && (
                    <button 
                        onClick={onViewAll}
                        className="text-[10px] font-black uppercase tracking-widest text-[var(--primary)] hover:underline flex items-center gap-1"
                    >
                        Ver más <ArrowUpRight size={12} />
                    </button>
                )}
            </div>

            {isLoading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-14 rounded-2xl bg-black/5 dark:bg-white/5 animate-pulse" />
                    ))}
                </div>
            ) : recentItems.length > 0 ? (
                <div className="divide-y divide-[var(--border-color)]">
                    {recentItems.map((tx) => {
                        const isPaid = tx.type === 'paid';
                        return (
                            <div 
                                key={tx.id} 
                                className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4 group transition-colors"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className={cn(
                                        "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
                                        isPaid 
                                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                                            : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                    )}>
                                        {getCategoryIcon(tx.category)}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-[var(--text-primary)] truncate">
                                            {tx.title}
                                        </p>
                                        <div className="flex items-center gap-2 text-[10px] font-semibold text-[var(--text-secondary)] mt-0.5">
                                            <span className="capitalize">{tx.category || 'Varios'}</span>
                                            <span>•</span>
                                            <span>{formatDate(tx.date)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-right shrink-0">
                                    <p className={cn(
                                        "text-sm font-black",
                                        isPaid ? "text-emerald-600 dark:text-emerald-400" : "text-[var(--text-primary)]"
                                    )}>
                                        ${Number(tx.amount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                    <span className="text-[9px] font-black uppercase tracking-wider text-[var(--text-secondary)] opacity-70">
                                        {isPaid ? 'Pagaste' : 'Tu parte'}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="py-8 text-center">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center text-[var(--text-secondary)] mb-3">
                        <Tag size={20} />
                    </div>
                    <p className="text-xs font-bold text-[var(--text-primary)]">Sin movimientos aún</p>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-1">
                        Los gastos en los que participes aparecerán aquí automáticamente.
                    </p>
                </div>
            )}
        </div>
    );
};

