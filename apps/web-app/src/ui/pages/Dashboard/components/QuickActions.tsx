import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Receipt, UserPlus, X, Sparkles, ChevronUp } from 'lucide-react';
import { ROUTES } from '@infrastructure/routes';
import { cn } from '@infrastructure/utils';

interface QuickActionsProps {
    canCreateGroup: boolean;
    activeGroups?: any[];
}

export const QuickActions: React.FC<QuickActionsProps> = ({ 
    canCreateGroup,
    activeGroups = [] 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isGroupSelectOpen, setIsGroupSelectOpen] = useState(false);
    const navigate = useNavigate();

    const handleNewExpenseClick = () => {
        if (!activeGroups || activeGroups.length === 0) {
            navigate(canCreateGroup ? ROUTES.CREATE_GROUP : `${ROUTES.CREATE_GROUP}?tab=join`);
            setIsOpen(false);
            return;
        }

        if (activeGroups.length === 1) {
            navigate(ROUTES.REGISTER_EXPENSE(activeGroups[0].id));
            setIsOpen(false);
            return;
        }

        // Si tiene múltiples grupos, abrir selector rápido
        setIsGroupSelectOpen(true);
    };

    const handleSelectGroupForExpense = (groupId: string) => {
        setIsGroupSelectOpen(false);
        setIsOpen(false);
        navigate(ROUTES.REGISTER_EXPENSE(groupId));
    };

    return (
        <>
            {/* Modal selector rápido si hay más de 1 grupo para registrar gasto */}
            {isGroupSelectOpen && (
                <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div 
                        className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-black uppercase tracking-tight text-[var(--text-primary)]">
                                Selecciona el Grupo
                            </h4>
                            <button 
                                onClick={() => setIsGroupSelectOpen(false)}
                                className="p-1 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-secondary)]"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)]">
                            ¿A qué grupo deseas añadir el nuevo gasto?
                        </p>
                        <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                            {activeGroups.map((g) => (
                                <button
                                    key={g.id}
                                    onClick={() => handleSelectGroupForExpense(g.id)}
                                    className="w-full text-left p-3 rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-[var(--primary)] hover:text-white transition-all flex items-center justify-between group"
                                >
                                    <span className="font-bold text-sm truncate">{g.nombre || 'Sin nombre'}</span>
                                    <span className="text-[10px] font-black uppercase opacity-60 group-hover:opacity-100">Elegir →</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Backdrop al abrir menú flotante */}
            {isOpen && (
                <div 
                    className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Contenedor flotante en la esquina inferior derecha */}
            <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-[100] flex flex-col items-end gap-3">
                {/* Opciones desplegadas */}
                {isOpen && (
                    <div className="flex flex-col items-end gap-3 animate-in fade-in slide-in-from-bottom-5 duration-200">
                        {/* 1. Nuevo Gasto */}
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xs font-black uppercase tracking-wider text-[var(--text-primary)] shadow-md">
                                + Nuevo Gasto
                            </span>
                            <button
                                onClick={handleNewExpenseClick}
                                className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:scale-110 active:scale-95 transition-all"
                                title="Registrar nuevo gasto"
                            >
                                <Plus size={22} strokeWidth={2.5} />
                            </button>
                        </div>

                        {/* 2. Escanear Ticket (OCR) */}
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xs font-black uppercase tracking-wider text-[var(--text-primary)] shadow-md">
                                Añadir Ticket (IA)
                            </span>
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    navigate(ROUTES.OCR_SCANNER);
                                }}
                                className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 hover:scale-110 active:scale-95 transition-all"
                                title="Escanear ticket con IA"
                            >
                                <Receipt size={22} strokeWidth={2.5} />
                            </button>
                        </div>

                        {/* 3. Crear o Unirse a Grupo */}
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xs font-black uppercase tracking-wider text-[var(--text-primary)] shadow-md">
                                {canCreateGroup ? 'Crear Grupo' : 'Unirse a Grupo'}
                            </span>
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    navigate(canCreateGroup ? ROUTES.CREATE_GROUP : `${ROUTES.CREATE_GROUP}?tab=join`);
                                }}
                                className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-purple-500 text-white flex items-center justify-center shadow-lg shadow-violet-500/30 hover:scale-110 active:scale-95 transition-all"
                                title={canCreateGroup ? 'Crear Grupo' : 'Unirse a Grupo'}
                            >
                                <UserPlus size={20} strokeWidth={2.5} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Botón flotante principal (FAB) */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95",
                        isOpen 
                            ? "bg-rose-500 rotate-45 shadow-rose-500/40" 
                            : "bg-[var(--primary)] shadow-[var(--primary)]/40"
                    )}
                    aria-label="Acciones Rápidas"
                    title="Acciones Rápidas"
                >
                    <Plus size={28} strokeWidth={2.5} />
                </button>
            </div>
        </>
    );
};

