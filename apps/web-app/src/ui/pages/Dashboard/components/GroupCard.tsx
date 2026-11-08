import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Pencil, MoreVertical, Receipt, Wallet } from 'lucide-react';
import { cn } from '../../../../infrastructure/utils';
import { MemberAvatars } from './MemberAvatars';
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
    const hasDebt = (group.userBalance || 0) < -0.01;
    const hasCredit = (group.userBalance || 0) > 0.01;

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const isActionClickedRef = useRef(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Cierre seguro del dropdown al hacer clic fuera o presionar Escape
    useEffect(() => {
        if (!isMenuOpen) return;
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isMenuOpen]);

    const handleCardClick = (e: React.MouseEvent) => {
        if (isSelectionMode) {
            onToggleSelection?.(group.id);
            return;
        }
        // Bloqueo total si el menú está abierto o si se acaba de interactuar con una acción
        if (isActionClickedRef.current || isMenuOpen) {
            if (isMenuOpen) setIsMenuOpen(false);
            e.stopPropagation();
            e.preventDefault();
            return;
        }
        const target = e.target as HTMLElement | SVGElement | null;
        if (target && typeof target.closest === 'function' && target.closest('button, [data-action-btn]')) {
            e.stopPropagation();
            e.preventDefault();
            return;
        }
        onClick?.(e);
    };

    const handleToggleMenu = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        isActionClickedRef.current = true;
        setTimeout(() => { isActionClickedRef.current = false; }, 400);
        setIsMenuOpen(prev => !prev);
    };

    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        isActionClickedRef.current = true;
        setIsMenuOpen(false);
        setTimeout(() => { isActionClickedRef.current = false; }, 400);
        onEdit?.(e);
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        isActionClickedRef.current = true;
        setIsMenuOpen(false);
        setTimeout(() => { isActionClickedRef.current = false; }, 400);
        onDelete?.(e);
    };

    const currencyFormatter = (val: number, compact = false) => {
        const numVal = isNaN(val) ? 0 : Math.abs(val);
        const shouldCompact = compact || numVal >= 1000000;
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            notation: shouldCompact ? 'compact' : 'standard',
            maximumFractionDigits: shouldCompact ? 1 : 2,
        }).format(numVal);
    };

    const totalStr = currencyFormatter(group.total || 0);
    const balanceStr = currencyFormatter(group.userBalance || 0);

    return (
        <motion.div
            whileHover={isSelectionMode ? { scale: 1.01 } : { y: -3, transition: { duration: 0.2, ease: "easeOut" } }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCardClick}
            className={cn(
                "group relative w-full rounded-2xl p-5 transition-all duration-200 cursor-pointer shadow-md",
                "bg-slate-900/80 hover:bg-slate-900/95 border border-slate-800/80 hover:border-slate-700 hover:shadow-xl hover:shadow-cyan-500/5",
                isSelected && "border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/30",
                className
            )}
        >
            {/* Selection Checkmark */}
            {isSelectionMode && (
                <div className={cn(
                    "absolute top-4 right-4 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all z-20",
                    isSelected 
                        ? "bg-blue-600 border-blue-600 text-white" 
                        : "border-slate-700 bg-slate-800/80"
                )}>
                    {isSelected && (
                        <motion.svg 
                            initial={{ scale: 0 }} 
                            animate={{ scale: 1 }} 
                            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
                        >
                            <polyline points="20 6 9 17 4 12" />
                        </motion.svg>
                    )}
                </div>
            )}

            {/* Subtle Ambient Radial Glow */}
            <div className={cn(
                "pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full blur-[70px] opacity-10 transition-opacity duration-500 group-hover:opacity-20",
                appearance.bg
            )} />

            <div className="flex flex-col gap-4 relative z-10 w-full min-w-0">
                {/* ── Cabecera: Avatar, Nombre del Grupo y Menú de Opciones ── */}
                <div className="flex items-start justify-between gap-3 w-full min-w-0">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-black text-base shadow-sm border border-slate-700/60 transition-transform group-hover:scale-105 duration-200",
                            appearance.bg,
                            appearance.color
                        )}>
                            {group.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-base text-slate-100 truncate leading-snug" title={group.name}>
                                {group.name}
                            </h3>
                            <p className="text-xs text-slate-400 truncate mt-0.5" title={group.lastAct || "Activo ahora"}>
                                {group.lastAct || "Activo ahora"}
                            </p>
                        </div>
                    </div>

                    {/* Menú de Opciones y Badge ADMIN alineados a la derecha */}
                    <div className="flex items-center gap-2 shrink-0 pt-0.5">
                        {!isSelectionMode && group.isAdmin && (
                            <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-blue-500/15 border border-blue-500/30 text-blue-400 rounded-md">
                                ADMIN
                            </span>
                        )}

                        {!isSelectionMode && group.isAdmin && (onEdit || onDelete) && (
                            <div 
                                ref={menuRef}
                                className="relative shrink-0"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                }}
                                onPointerDown={(e) => {
                                    e.stopPropagation();
                                    isActionClickedRef.current = true;
                                }}
                                onMouseDown={(e) => {
                                    e.stopPropagation();
                                    isActionClickedRef.current = true;
                                }}
                            >
                                <button
                                    type="button"
                                    data-action-btn
                                    onClick={handleToggleMenu}
                                    onPointerDown={(e) => {
                                        e.stopPropagation();
                                        isActionClickedRef.current = true;
                                    }}
                                    className={cn(
                                        "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 active:scale-95 border",
                                        isMenuOpen
                                            ? "bg-slate-800 text-white border-slate-700 shadow-sm"
                                            : "bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-white border-slate-800 hover:border-slate-700/80"
                                    )}
                                    title="Opciones de grupo"
                                    aria-label="Opciones de grupo"
                                >
                                    <MoreVertical size={16} />
                                </button>

                                <AnimatePresence>
                                    {isMenuOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                            transition={{ duration: 0.15, ease: "easeOut" }}
                                            className="absolute right-0 top-9 z-40 w-44 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 space-y-1 backdrop-blur-xl"
                                        >
                                            {onEdit && (
                                                <button
                                                    type="button"
                                                    data-action-btn
                                                    onClick={handleEditClick}
                                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-blue-400 hover:bg-slate-800/80 rounded-lg transition-all duration-150 active:scale-[0.98] text-left"
                                                >
                                                    <Pencil size={14} className="text-blue-400 shrink-0" />
                                                    <span>Editar grupo</span>
                                                </button>
                                            )}
                                            {onDelete && (
                                                <button
                                                    type="button"
                                                    data-action-btn
                                                    onClick={handleDeleteClick}
                                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-all duration-150 active:scale-[0.98] text-left"
                                                >
                                                    <Trash2 size={14} className="text-rose-400 shrink-0" />
                                                    <span>Eliminar grupo</span>
                                                </button>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Cuerpo: Métricas Financieras Elásticas ("TOTAL GRUPO" y "TU SALDO") ── */}
                <div className="grid grid-cols-2 gap-3 min-w-0 w-full">
                    {/* Tarjeta: Total Grupo */}
                    <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 flex flex-col justify-center min-w-0 shadow-sm">
                        <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                            <Receipt size={13} className="text-blue-400 shrink-0" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">
                                Total grupo
                            </span>
                        </div>
                        <p 
                            title={totalStr}
                            className="font-mono font-bold text-slate-100 text-sm sm:text-base tracking-tight truncate leading-snug"
                        >
                            {totalStr}
                        </p>
                    </div>

                    {/* Tarjeta: Tu Parte / Balance */}
                    <div className={cn(
                        "rounded-xl p-3 flex flex-col justify-center min-w-0 shadow-sm border transition-colors",
                        hasDebt 
                            ? "bg-rose-500/10 border-rose-500/25 text-rose-400" 
                            : hasCredit 
                            ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400" 
                            : "bg-slate-950/40 border-slate-800/80 text-slate-300"
                    )}>
                        <div className="flex items-center gap-1.5 mb-1">
                            <Wallet size={13} className={cn("shrink-0", hasDebt ? "text-rose-400" : hasCredit ? "text-emerald-400" : "text-slate-400")} />
                            <span className="text-[10px] font-bold uppercase tracking-wider truncate">
                                {hasDebt ? "Tu deuda" : hasCredit ? "A favor" : "Al día"}
                            </span>
                        </div>
                        <p 
                            title={`${hasCredit ? "+" : ""}${balanceStr}`}
                            className={cn(
                                "font-mono font-bold text-sm sm:text-base tracking-tight truncate leading-snug",
                                hasDebt ? "text-rose-400" : hasCredit ? "text-emerald-400" : "text-slate-100"
                            )}
                        >
                            {hasCredit ? "+" : ""}{balanceStr}
                        </p>
                    </div>
                </div>

                {/* ── Pie de Tarjeta: Integrantes a la Izquierda y Estado Activo a la Derecha ── */}
                <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between gap-3 w-full min-w-0">
                    <div className="min-w-0">
                        <MemberAvatars members={group.members || []} extraMembers={group.extraMembers} />
                    </div>
                    
                    <div className="flex items-center gap-1.5 shrink-0 text-slate-400">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Activo ahora
                        </span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
