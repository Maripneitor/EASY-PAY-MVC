import React from 'react';
import { CreditCard, AlertCircle, ArrowRight, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CardAlert = () => {
    const navigate = useNavigate();

    return (
        <div className="bg-gradient-to-br from-rose-500/10 to-rose-600/5 border border-rose-500/20 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center gap-8 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="w-20 h-20 rounded-3xl bg-rose-500/20 flex items-center justify-center text-rose-500 flex-shrink-0">
                <CreditCard size={40} />
            </div>
            
            <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                    <AlertCircle size={16} className="text-rose-500" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500">Configuración Pendiente</span>
                </div>
                <h3 className="text-2xl font-black text-[var(--text-primary)] uppercase tracking-tighter mb-2">Terminar de configurar perfil financiero</h3>
                <p className="text-sm text-[var(--text-secondary)] font-medium max-w-xl">
                    Sin un perfil financiero completo, no podrás registrar gastos, participar en la liquidación de grupos ni recibir reembolsos de tus amigos. 
                    Configura tu cuenta para desbloquear todas las funciones de gestión de pagos de forma segura.
                </p>
            </div>

            <button 
                onClick={() => navigate('/my-payments')}
                className="px-8 py-5 bg-rose-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-rose-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 whitespace-nowrap"
            >
                <Plus size={20} />
                Agregar Tarjeta
                <ArrowRight size={20} />
            </button>
        </div>
    );
};
