import React, { useState } from 'react';
import { 
    Banknote, 
    CreditCard as CardIcon, 
    Send, 
    Edit3,
    CheckCircle
} from 'lucide-react';
import { cn } from '../../../../infrastructure/utils';
import { GlassCard } from '@ui/components/GlassCard/GlassCard';
import { toast } from 'sonner';

interface SettleViewProps {
    userShare: number;
}

export const SettleView = ({ userShare: rawUserShare }: SettleViewProps) => {
    const userShare = isNaN(rawUserShare) ? 0 : rawUserShare;
    const [amount, setAmount] = useState(userShare.toString());
    const [method, setMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);

    const numericAmount = parseFloat(amount) || 0;

    const handleSettle = () => {
        if (isNaN(numericAmount) || numericAmount <= 0) {
            toast.error('Por favor ingresa un monto válido');
            return;
        }

        setLoading(true);
        // Simulación de delay de red como en mobile
        setTimeout(() => {
            setLoading(false);
            toast.success('¡Deuda liquidada correctamente!');
            // Aquí iría la redirección o actualización de estado real
        }, 2000);
    };

    const handlePayAll = () => {
        setAmount(userShare.toString());
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-black uppercase tracking-widest text-[var(--text-secondary)]">Liquidar Deuda</h2>
                {numericAmount !== userShare && (
                    <button 
                        onClick={handlePayAll}
                        className="text-[10px] font-black uppercase tracking-widest text-[var(--primary)] hover:opacity-80 transition-opacity"
                    >
                        Pagar todo (${userShare.toFixed(2)})
                    </button>
                )}
            </div>
            
            {/* Amount Card */}
            <GlassCard className="p-10 flex flex-col items-center text-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                    <Banknote size={120} />
                </div>
                
                <div className="w-16 h-16 bg-[var(--primary)]/10 rounded-2xl flex items-center justify-center mb-6">
                    <Banknote size={32} className="text-[var(--primary)]" />
                </div>
                
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-4">Monto a pagar</p>
                
                <div className="flex items-center justify-center gap-3 w-full max-w-xs">
                    <span className="text-3xl font-black text-[var(--text-secondary)]">$</span>
                    <input 
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="text-6xl font-black bg-transparent border-none text-center focus:ring-0 w-full p-0"
                        placeholder="0.00"
                    />
                </div>
                
                <div className="mt-6 flex items-center gap-2 px-4 py-2 bg-[var(--primary)]/5 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
                    <p className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-wider">Deuda Pendiente: ${userShare.toFixed(2)}</p>
                </div>
            </GlassCard>

            {/* Note Field */}
            <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] ml-2">Nota (Opcional)</p>
                <div className="flex items-center gap-4 p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] focus-within:border-[var(--primary)]/50 transition-colors">
                    <Edit3 size={20} className="text-[var(--text-secondary)]" />
                    <input 
                        type="text"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Concepto del pago..."
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50"
                    />
                </div>
            </div>

            {/* Payment Methods */}
            <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] ml-2">Método de Pago</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { id: 'cash', icon: Banknote, label: 'Efectivo', desc: 'Pago manual', color: 'emerald' },
                        { id: 'transfer', icon: Send, label: 'Transferencia', desc: 'SPEI / Directo', color: 'blue' },
                        { id: 'card', icon: CardIcon, label: 'Tarjeta', desc: 'Débito / Crédito', color: 'purple' }
                    ].map((m) => (
                        <button 
                            key={m.id}
                            onClick={() => setMethod(m.id as any)}
                            className={cn(
                                "flex items-center gap-4 p-5 rounded-3xl border-2 transition-all text-left relative overflow-hidden",
                                method === m.id 
                                    ? "bg-[var(--primary)]/10 border-[var(--primary)] shadow-lg shadow-[var(--primary)]/5" 
                                    : "bg-[var(--bg-card)] border-[var(--border-color)] hover:border-[var(--primary)]/30"
                            )}
                        >
                            {method === m.id && (
                                <div className="absolute top-2 right-2 text-[var(--primary)]">
                                    <CheckCircle size={16} />
                                </div>
                            )}
                            
                            <div className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shadow-sm",
                                method === m.id ? "bg-[var(--primary)] text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                            )}>
                                <m.icon size={22} />
                            </div>
                            
                            <div>
                                <p className={cn(
                                    "font-black text-sm transition-colors",
                                    method === m.id ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
                                )}>{m.label}</p>
                                <p className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">{m.desc}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Confirm Button */}
            <button 
                onClick={handleSettle}
                disabled={loading || numericAmount <= 0}
                className="w-full bg-[var(--primary)] text-white font-black uppercase tracking-widest py-6 rounded-3xl shadow-xl shadow-[var(--primary)]/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed border-t border-white/10"
            >
                {loading ? (
                    <div className="flex items-center justify-center gap-3">
                        <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Procesando...</span>
                    </div>
                ) : (
                    <span>Confirmar Liquidación</span>
                )}
            </button>
        </div>
    );
};
