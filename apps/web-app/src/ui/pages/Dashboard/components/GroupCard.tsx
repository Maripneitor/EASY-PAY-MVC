import React from 'react';
import { motion } from 'framer-motion';
import { Trash2, Pencil } from 'lucide-react';
import { cn } from '../../../../infrastructure/utils';
import { MemberAvatars } from './MemberAvatars';
import { BalanceBadge } from './BalanceBadge';
import type { Member } from '../../../../types';

interface GroupProps {
    id: string;
    name: string;
    lastAct?: string;
    members?: (Member | string)[];
    extraMembers?: number;
    total?: number;
    userBalance?: number;
    isAdmin?: boolean;
}

interface GroupCardProps {
    group: GroupProps;
    onClick: (e: React.MouseEvent) => void;
    onDelete?: (e: React.MouseEvent) => void;
    onEdit?: (e: React.MouseEvent) => void;
    appearance: { icon: React.ReactNode; bg: string; color: string; };
    className?: string;
    isSelectionMode?: boolean;
    isSelected?: boolean;
    onToggleSelection?: (id: string) => void;
}

export const GroupCard: React.FC<GroupCardProps> = ({ 
    group, onClick, onDelete, onEdit, appearance, className,
    isSelectionMode = false,
    isSelected = false,
    onToggleSelection
}) => {
    const hasDebt = (group.userBalance || 0) < 0;
    const hasCredit = (group.userBalance || 0) > 0;

    const handleCardClick = (e: React.MouseEvent) => {
        if (isSelectionMode) {
            onToggleSelection?.(group.id);
            return;
        }
        // Evita la navegación si se hizo clic en un botón de acción (Editar/Eliminar)
        if ((e.target as HTMLElement).closest('button')) {
            return;
        }
        onClick?.(e);
    };

    const currencyFormatter = (val: number, compact = false) => {
        const numVal = isNaN(val) ? 0 : val;
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            notation: compact && Math.abs(numVal) >= 100000 ? 'compact' : 'standard',
            maximumFractionDigits: compact && Math.abs(numVal) >= 100000 ? 1 : 2,
        }).format(numVal);
    };

    const getFontSizeClass = (val: string) => {
        if (val.length > 15) return "text-[11px]";
        if (val.length > 12) return "text-[13px]";
        if (val.length > 10) return "text-sm";
        return "text-base";
    };

    const totalStr = currencyFormatter(group.total || 0, true);
    const balanceStr = currencyFormatter(group.userBalance || 0, true);

    return (
        <motion.div
            whileHover={isSelectionMode ? { scale: 1.02 } : { y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCardClick}
            className={cn(
                "group relative w-full overflow-hidden rounded-[2.5rem] border p-6 shadow-md backdrop-blur-3xl transition-all duration-300 cursor-pointer",
                isSelected 
                    ? "border-[var(--primary)] bg-[var(--primary)]/10 ring-2 ring-[var(--primary)]/20" 
                    : "border-white/20 bg-white/40 dark:bg-slate-900/40 hover:bg-white/60 dark:hover:bg-slate-800/60 shadow-md hover:shadow-lg",
                className
            )}
        >
            {/* Selection Checkmark */}
            {isSelectionMode && (
                <div className={cn(
                    "absolute top-4 right-4 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all",
                    isSelected 
                        ? "bg-[var(--primary)] border-[var(--primary)] text-white" 
                        : "border-slate-300 dark:border-slate-600 bg-white/20"
                )}>
                    {isSelected && (
                        <motion.svg 
                            initial={{ scale: 0 }} 
                            animate={{ scale: 1 }} 
                            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
                        >
                            <polyline points="20 6 9 17 4 12" />
                        </motion.svg>
                    )}
                </div>
            )}

            {/* Subtle Accent Glow */}
            <div className={cn(
                "absolute -right-12 -top-12 h-32 w-32 rounded-full blur-[80px] opacity-[0.08] transition-opacity duration-500 group-hover:opacity-15",
                appearance.bg
            )} />

            <div className="flex flex-col gap-6">
                {/* Header: Name (Left) | Actions + Admin (Right) */}
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black shadow-sm border border-white/40 dark:border-slate-700/40",
                            appearance.bg,
                            appearance.color
                        )}>
                            {group.name.charAt(0).toUpperCase()}
                        </div>
                        <h3 className="truncate text-lg font-bold text-slate-800 dark:text-white tracking-tight">
                            {group.name}
                        </h3>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {!isSelectionMode && group.isAdmin && (
                            <span className="px-2 py-0.5 bg-slate-200 dark:bg-white/10 rounded-md text-[8px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">
                                ADMIN
                            </span>
                        )}
                        <div className="flex items-center gap-1">
                            {!isSelectionMode && group.isAdmin && onEdit && (
                                <button 
                                    onClick={(e) => { 
                                        e.stopPropagation(); 
                                        e.preventDefault();
                                        e.nativeEvent.stopImmediatePropagation();
                                        onEdit(e); 
                                    }}
                                    className="p-2 text-slate-400 hover:text-[var(--primary)] hover:bg-[var(--primary)]/5 rounded-xl transition-all"
                                    title="Editar grupo"
                                >
                                    <Pencil size={16} />
                                </button>
                            )}
                            {!isSelectionMode && group.isAdmin && onDelete && (
                                <button 
                                    onClick={(e) => { 
                                        e.stopPropagation(); 
                                        e.preventDefault();
                                        e.nativeEvent.stopImmediatePropagation();
                                        onDelete(e); 
                                    }}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all"
                                    title="Eliminar grupo"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Body: Financial Summary centered with no wrap */}
                <div className="flex gap-3 min-w-0">
                    <div className="flex-1 bg-white/10 dark:bg-white/5 rounded-2xl p-3 flex flex-col justify-center border border-white/5 min-w-0 overflow-hidden">
                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5 truncate">Total grupo</p>
                        <p 
                            title={totalStr}
                            className={cn(
                                "font-bold text-slate-900 dark:text-white font-mono whitespace-nowrap overflow-hidden text-ellipsis leading-tight",
                                getFontSizeClass(totalStr)
                            )}
                        >
                            {totalStr}
                        </p>
                    </div>

                    <div className={cn(
                        "flex-1 rounded-2xl p-3 flex flex-col justify-center transition-all border border-transparent min-w-0 overflow-hidden",
                        hasDebt ? "bg-red-500/10 border-red-500/5" : 
                        hasCredit ? "bg-emerald-500/10 border-emerald-500/5" : 
                        "bg-white/10"
                    )}>
                        <p className={cn(
                            "text-[8px] font-black uppercase tracking-widest mb-0.5 truncate",
                            hasDebt ? "text-rose-400" : hasCredit ? "text-emerald-400" : "text-slate-400"
                        )}>
                            {hasDebt ? "Debes" : (hasCredit ? "A Favor" : "Tu Parte")}
                        </p>
                        <p 
                            title={`${group.userBalance && group.userBalance > 0 ? "+" : ""}${balanceStr}`}
                            className={cn(
                                "font-bold font-mono whitespace-nowrap overflow-hidden text-ellipsis leading-tight",
                                hasDebt ? "text-rose-600 dark:text-rose-400" : 
                                hasCredit ? "text-emerald-600 dark:text-emerald-400" : 
                                "text-slate-500",
                                getFontSizeClass(balanceStr)
                            )}
                        >
                            {group.userBalance && group.userBalance > 0 ? "+" : ""}{balanceStr}
                        </p>
                    </div>
                </div>

                {/* Footer: Avatars (Left) | Status (Right) */}
                <div className="flex items-center justify-between pt-1">
                    <MemberAvatars members={group.members || []} extraMembers={group.extraMembers} />
                    
                    <div className="flex items-center gap-1.5 shrink-0">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                            Activo ahora
                        </span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};