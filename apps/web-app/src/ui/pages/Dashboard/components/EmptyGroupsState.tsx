import React from 'react';
import { Users, UserPlus, Plus, Sparkles } from 'lucide-react';

interface EmptyGroupsStateProps {
    canCreateGroup?: boolean;
    onCreateGroup: () => void;
    onJoinGroup: () => void;
}

export const EmptyGroupsState: React.FC<EmptyGroupsStateProps> = ({
    canCreateGroup = true,
    onCreateGroup,
    onJoinGroup,
}) => {
    return (
        <div className="col-span-full bg-gradient-to-br from-[var(--bg-card)] via-[var(--bg-card)] to-[var(--primary)]/5 border-2 border-dashed border-[var(--border-color)] rounded-[3rem] p-8 sm:p-12 text-center relative overflow-hidden">
            {/* Elemento de brillo sutil de fondo */}
            <div className="pointer-events-none absolute -top-12 -right-12 w-48 h-48 bg-[var(--primary)]/10 rounded-full blur-3xl" />
            <div className="pointer-events-none absolute -bottom-12 -left-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl" />

            <div className="relative z-10 max-w-xl mx-auto space-y-6">
                <div className="inline-flex p-4 bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary)]/5 text-[var(--primary)] rounded-3xl shadow-sm border border-[var(--primary)]/20">
                    <Users size={40} strokeWidth={2} />
                </div>

                <div>
                    <h3 className="text-xl sm:text-2xl font-black text-[var(--text-primary)] tracking-tight">
                        Aún no tienes grupos activos
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)] mt-2 font-medium">
                        Crea un grupo con tus amigos, compañeros de viaje o de departamento para empezar a dividir gastos de manera automática.
                    </p>
                </div>

                {/* Paso a paso visual interactivo */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-left">
                    <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 backdrop-blur-sm">
                        <div className="flex items-center gap-2 text-xs font-black text-[var(--primary)] mb-1">
                            <span className="w-5 h-5 rounded-full bg-[var(--primary)]/20 flex items-center justify-center text-[10px]">1</span>
                            Crea tu Grupo
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)] font-medium">
                            Ponle un nombre y define la moneda.
                        </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 backdrop-blur-sm">
                        <div className="flex items-center gap-2 text-xs font-black text-emerald-500 mb-1">
                            <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px]">2</span>
                            Invita Amigos
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)] font-medium">
                            Comparte el código o link de invitación.
                        </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 backdrop-blur-sm">
                        <div className="flex items-center gap-2 text-xs font-black text-violet-500 mb-1">
                            <span className="w-5 h-5 rounded-full bg-violet-500/20 flex items-center justify-center text-[10px]">3</span>
                            Divide Gastos
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)] font-medium">
                            Sube tickets con IA o ingresa manual.
                        </p>
                    </div>
                </div>

                {/* Botones de acción */}
                <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                    <button
                        onClick={onCreateGroup}
                        className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 hover:scale-[1.02] transition-all duration-200 flex items-center gap-2"
                    >
                        <Plus size={16} strokeWidth={2.5} />
                        + Crear Grupo
                    </button>
                    <button
                        onClick={onJoinGroup}
                        className="px-6 py-3.5 bg-black/5 dark:bg-white/10 text-[var(--text-primary)] hover:bg-black/10 dark:hover:bg-white/15 font-black text-xs uppercase tracking-widest rounded-2xl transition-all duration-200 flex items-center gap-2 border border-[var(--border-color)] active:scale-95"
                    >
                        <UserPlus size={16} />
                        Unirme con código
                    </button>
                </div>
            </div>
        </div>
    );
};

