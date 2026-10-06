import React from 'react';
import { Plane } from 'lucide-react';

export const InvitationCard: React.FC = () => {
    return (
        /* CORRECCIÓN: Borde izquierdo adaptable y fondo de tarjeta adaptable */
        <div className="relative overflow-hidden rounded-2xl border border-l-4 border-[var(--border-color)] border-l-[var(--primary)] bg-[var(--bg-card)] p-5 shadow-sm transition-all duration-300">
            
            {/* Background Glow Adaptable */}
            <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-[var(--primary)]/10 blur-3xl pointer-events-none transition-colors duration-300" />

            <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                    {/* Icono y círculo adaptables */}
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[var(--primary)] ring-1 ring-inset ring-[var(--primary)]/20">
                        <Plane size={24} />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-[var(--text-primary)]">
                            Viaje a la playa
                        </h3>
                        <p className="text-sm text-[var(--text-secondary)]">
                            Invitado por <span className="font-medium text-[var(--primary)]">María González</span>
                        </p>
                    </div>
                </div>

                <div className="flex w-full gap-3 md:w-auto">
                    <button className="flex-1 rounded-lg border border-[var(--border-color)] bg-transparent px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)] md:flex-none">
                        Rechazar
                    </button>
                    
                    {/* CORRECCIÓN: Botón Aceptar 100% adaptable */}
                    <button className="flex-1 rounded-lg bg-[var(--primary)] px-6 py-2 text-sm font-bold text-white shadow-sm shadow-[var(--primary)]/30 transition-all hover:brightness-110 hover:shadow-[var(--primary)]/50 hover:-translate-y-0.5 active:scale-95 md:flex-none">
                        Aceptar
                    </button>
                </div>
            </div>
        </div>
    );
};