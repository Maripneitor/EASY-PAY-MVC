import React, { useState } from 'react';
import { 
    CheckCircle2, 
    X, 
    ArrowRight, 
    ArrowLeft, 
    Zap, 
    Percent, 
    Calculator, 
    Table,
    AlertCircle,
    Landmark,
    Check,
    CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../../infrastructure/utils';
import { httpClient } from '../../../../infrastructure/api/http-client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { groupRepository } from '../../../../infrastructure/api/repositories';
import { useAuthContext } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface SettlementWizardProps {
    isOpen: boolean;
    onClose: () => void;
    groupId: string;
    activities: any[];
    members: any[];
    totalSpent: number;
    membersData: any[];
}

export const SettlementWizard: React.FC<SettlementWizardProps> = ({ 
    isOpen, onClose, groupId, activities, members, totalSpent, membersData 
}) => {
    const { user } = useAuthContext();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [tipPercentage, setTipPercentage] = useState(10);
    const [customTip, setCustomTip] = useState('');
    const [isClosing, setIsClosing] = useState(false);
    const [localActivities, setLocalActivities] = useState(activities || []);

    const handleUpdateItem = (itemId: string, updates: any) => {
        setLocalActivities(prev => prev.map(item => 
            item.id === itemId ? { ...item, ...updates } : item
        ));
    };

    const safeMembers = membersData || [];

    const unassignedItems = localActivities.filter(item => 
        !item.nombres_participantes || item.nombres_participantes.length === 0
    );

    const subtotalLocal = localActivities.reduce((acc, item) => 
        acc + (Number(item.monto || item.precio || 0) * (item.cantidad || 1)), 0);
    
    const perItemTaxes = localActivities.reduce((acc, item) => {
        const base = Number(item.monto || item.precio || 0) * (item.cantidad || 1);
        return acc + (base * (item.impuesto_porcentaje || 0) / 100);
    }, 0);

    const perItemTips = localActivities.reduce((acc, item) => {
        const base = Number(item.monto || item.precio || 0) * (item.cantidad || 1);
        return acc + (base * (item.propina_porcentaje || 0) / 100);
    }, 0);

    const tipAmount = tipPercentage === -1 ? Number(customTip) || 0 : (subtotalLocal * tipPercentage) / 100;
    const finalTotal = subtotalLocal + perItemTaxes + perItemTips + tipAmount;

    // --- CÁLCULO DE RESUMEN POR INTEGRANTE ---
    const summary = safeMembers.map(member => {
        const spent = localActivities
            .filter(item => {
                const pIds = item.participantes_ids || [];
                return pIds.includes(member.id);
            })
            .reduce((acc, item) => {
                const base = Number(item.monto || item.precio || 0) * (item.cantidad || 1);
                const participantsCount = Math.max((item.participantes_ids || []).length, 1);
                const extra = (item.impuesto_porcentaje || 0) / 100 + (item.propina_porcentaje || 0) / 100;
                const totalItem = base * (1 + extra);
                return acc + (totalItem / participantsCount);
            }, 0);
        
        const shareOfGlobalTip = tipAmount / (safeMembers.length || 1);
        return {
            name: member.nombre || 'Usuario',
            subtotal: spent,
            tip: shareOfGlobalTip,
            total: spent + shareOfGlobalTip
        };
    });

    const [selectedAccounts, setSelectedAccounts] = useState<string[]>(
        (user?.bank_accounts || []).filter((a: any) => a.is_default).map((a: any) => a.id)
    );

    const handleNext = () => setStep(s => s + 1);
    const handleBack = () => setStep(s => s - 1);

    const queryClient = useQueryClient();

    const handleStartSettlement = async () => {
        if (selectedAccounts.length === 0) {
            return toast.error("Debes seleccionar al menos una cuenta bancaria");
        }
        setIsClosing(true);
        try {
            const accountsToShow = (user?.bank_accounts || []).filter((a: any) => selectedAccounts.includes(a.id));
            
            // Paso 1: Notificar inicio de liquidación con cuentas bancarias
            await groupRepository.startSettlement(groupId, accountsToShow);
            
            // Paso 2: Actualizar items si cambiaron impuestos/propinas individuales (opcional pero mantenido)
            await Promise.all(localActivities.map(item => 
                httpClient.put(`/groups/${groupId}/items/${item.id}`, {
                    impuesto_porcentaje: item.impuesto_porcentaje,
                    propina_porcentaje: item.propina_porcentaje
                })
            ));

            // Paso 3: Cerrar el grupo con montos finales
            await groupRepository.closeGroup(groupId, tipAmount, finalTotal);
            
            toast.success("Liquidación iniciada y grupo actualizado");
            queryClient.invalidateQueries({ queryKey: ['group', groupId] });
            onClose();
            setTimeout(() => window.location.reload(), 500);
        } catch (error) {
            toast.error("Error al iniciar la liquidación");
        } finally {
            setIsClosing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                />
                
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-2xl bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="px-8 py-6 border-b border-[var(--border-color)] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                <Zap size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black uppercase tracking-tighter text-[var(--text-primary)]">Liquidación Paso a Paso</h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Paso {step} de 4</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-[var(--hover-bg)] rounded-xl transition-colors">
                            <X size={20} className="text-slate-400" />
                        </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1 bg-black/5">
                        <motion.div 
                            className="h-full bg-emerald-500"
                            animate={{ width: `${(step / 4) * 100}%` }}
                        />
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
                        {step === 1 && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                <div className="flex flex-col items-center text-center mb-8">
                                    <div className="w-20 h-20 rounded-[2.5rem] bg-blue-500/10 flex items-center justify-center text-blue-500 mb-4">
                                        <CheckCircle2 size={40} />
                                    </div>
                                    <h3 className="text-2xl font-black text-[var(--text-primary)] uppercase tracking-tight">Paso 1: Validación</h3>
                                    <p className="text-sm text-[var(--text-secondary)] mt-2">Todos los items deben tener un responsable asignado.</p>
                                </div>

                                {unassignedItems.length > 0 ? (
                                    <div className="bg-rose-500/10 border border-rose-500/20 rounded-3xl p-6 flex items-start gap-4">
                                        <AlertCircle className="text-rose-500 mt-0.5" size={24} />
                                        <div>
                                            <p className="text-rose-500 font-black text-sm uppercase">Items sin asignar detectados</p>
                                            <p className="text-rose-500/60 text-xs mt-1 font-bold">Hay {unassignedItems.length} items pendientes. Asígnalos antes de continuar.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-8 flex flex-col items-center text-center">
                                        <CheckCircle2 className="text-emerald-500 mb-4" size={48} />
                                        <p className="text-emerald-500 font-black uppercase tracking-widest text-sm">¡Validación Correcta!</p>
                                        <p className="text-emerald-200/60 text-xs mt-2 font-bold">Todos los consumos tienen un responsable.</p>
                                    </div>
                                )}

                                <div className="space-y-3 mt-8">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Lista de Items</p>
                                    <div className="grid gap-3">
                                        {localActivities.map((item, i) => (
                                            <div key={i} className="bg-black/5 border border-[var(--border-color)] p-4 rounded-3xl flex justify-between items-center group hover:border-[var(--primary)]/30 transition-all">
                                                <div>
                                                    <p className="text-sm font-black uppercase tracking-tight text-[var(--text-primary)]">{item.nombre || item.description}</p>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {(item.nombres_participantes || item.participants || []).map((p: string, j: number) => (
                                                            <span key={j} className="text-[8px] font-black uppercase px-1.5 py-0.5 bg-black/10 rounded-md text-slate-400">
                                                                {p.split(' ')[0]}
                                                            </span>
                                                        ))}
                                                        {!(item.nombres_participantes || item.participants || []).length && (
                                                            <span className="text-[8px] font-black uppercase px-1.5 py-0.5 bg-rose-500/10 rounded-md text-rose-500">Sin asignar</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className="text-sm font-black font-mono text-[var(--primary)]">${Number(item.monto || item.precio).toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-20 h-20 rounded-[2.5rem] bg-amber-500/10 flex items-center justify-center text-amber-500 mb-4">
                                        <Percent size={40} />
                                    </div>
                                    <h3 className="text-2xl font-black text-[var(--text-primary)] uppercase tracking-tight">Paso 2: Propina</h3>
                                    <p className="text-sm text-[var(--text-secondary)] mt-2">Selecciona el porcentaje para el servicio.</p>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    {[5, 10, 15, -1].map((val) => (
                                        <button
                                            key={val}
                                            onClick={() => setTipPercentage(val)}
                                            className={cn(
                                                "py-6 rounded-3xl border-2 transition-all font-black text-xl",
                                                tipPercentage === val 
                                                    ? "bg-[var(--primary)] border-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20" 
                                                    : "bg-[var(--bg-body)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--primary)]/50"
                                            )}
                                        >
                                            {val === -1 ? 'Otro' : `${val}%`}
                                        </button>
                                    ))}
                                </div>

                                {tipPercentage === -1 && (
                                    <div className="bg-[var(--bg-body)] border border-[var(--border-color)] rounded-3xl p-6">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Monto Personalizado ($)</label>
                                        <input 
                                            type="number" 
                                            className="w-full bg-transparent border-none outline-none text-2xl font-black text-[var(--text-primary)]"
                                            placeholder="0.00"
                                            value={customTip}
                                            onChange={(e) => setCustomTip(e.target.value)}
                                        />
                                    </div>
                                )}

                                <div className="bg-black/5 rounded-[2.5rem] p-8 space-y-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400 font-bold uppercase tracking-widest">Subtotal Consumo</span>
                                        <span className="text-[var(--text-primary)] font-black font-mono">${subtotalLocal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400 font-bold uppercase tracking-widest">Propina</span>
                                        <span className="text-emerald-500 font-black font-mono">+${tipAmount.toLocaleString()}</span>
                                    </div>
                                    <div className="pt-4 border-t border-dashed border-[var(--border-color)] flex justify-between items-center">
                                        <span className="text-sm font-black uppercase tracking-[0.2em] text-[var(--text-primary)]">Total Actualizado</span>
                                        <span className="text-3xl font-black text-[var(--text-primary)] font-mono tracking-tighter">${finalTotal.toLocaleString()}</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-20 h-20 rounded-[2.5rem] bg-indigo-500/10 flex items-center justify-center text-indigo-500 mb-4">
                                        <CreditCard size={40} />
                                    </div>
                                    <h3 className="text-2xl font-black text-[var(--text-primary)] uppercase tracking-tight">Paso 3: Cuentas Bancarias</h3>
                                    <p className="text-sm text-[var(--text-secondary)] mt-2">Selecciona las cuentas para recibir transferencias.</p>
                                </div>

                                <div className="space-y-4">
                                    {(!user?.bank_accounts || user.bank_accounts.length === 0) ? (
                                        <div className="p-8 border-2 border-dashed border-rose-500/20 rounded-[2rem] text-center">
                                            <p className="text-rose-500 font-black uppercase tracking-widest text-xs">Sin cuentas registradas</p>
                                            <p className="text-slate-400 text-[10px] mt-2 font-bold">Debes agregar al menos una cuenta en tu perfil.</p>
                                            <button 
                                                onClick={() => navigate('/profile/personal-data')}
                                                className="mt-4 px-6 py-2 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                                            >
                                                Configurar Perfil
                                            </button>
                                        </div>
                                    ) : (
                                        user.bank_accounts.map((acc: any) => (
                                            <button
                                                key={acc.id}
                                                onClick={() => {
                                                    if (selectedAccounts.includes(acc.id)) {
                                                        setSelectedAccounts(selectedAccounts.filter(id => id !== acc.id));
                                                    } else {
                                                        setSelectedAccounts([...selectedAccounts, acc.id]);
                                                    }
                                                }}
                                                className={cn(
                                                    "w-full p-6 rounded-[2rem] border-2 transition-all flex items-center justify-between",
                                                    selectedAccounts.includes(acc.id)
                                                        ? "bg-indigo-500/5 border-indigo-500"
                                                        : "bg-[var(--bg-body)] border-[var(--border-color)] opacity-60"
                                                )}
                                            >
                                                <div className="flex items-center gap-4 text-left">
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-xl flex items-center justify-center",
                                                        selectedAccounts.includes(acc.id) ? "bg-indigo-500 text-white" : "bg-slate-200 text-slate-400"
                                                    )}>
                                                        <Landmark size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-sm uppercase text-[var(--text-primary)]">{acc.entidad_financiera}</p>
                                                        <p className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest">{acc.clabe}</p>
                                                    </div>
                                                </div>
                                                <div className={cn(
                                                    "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                                                    selectedAccounts.includes(acc.id) ? "bg-indigo-500 border-indigo-500" : "border-slate-300"
                                                )}>
                                                    {selectedAccounts.includes(acc.id) && <Check size={14} className="text-white" />}
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {step === 4 && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                        <Table size={24} />
                                    </div>
                                    <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight">Paso 4: Resumen Final</h3>
                                </div>

                                <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl overflow-hidden shadow-sm">
                                    <table className="w-full text-left">
                                        <thead className="bg-black/5">
                                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                <th className="px-6 py-4">Integrante</th>
                                                <th className="px-6 py-4 text-right">Consumo</th>
                                                <th className="px-6 py-4 text-right">Propina</th>
                                                <th className="px-6 py-4 text-right text-[var(--primary)]">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[var(--border-color)]">
                                            {summary.map((row, i) => (
                                                <tr key={i} className="text-xs font-bold text-[var(--text-secondary)]">
                                                    <td className="px-6 py-4 text-[var(--text-primary)] uppercase">{row.name}</td>
                                                    <td className="px-6 py-4 text-right font-mono">${row.subtotal.toFixed(2)}</td>
                                                    <td className="px-6 py-4 text-right font-mono text-emerald-500">${row.tip.toFixed(2)}</td>
                                                    <td className="px-6 py-4 text-right font-mono text-[var(--text-primary)] font-black">${row.total.toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                
                                <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-6 flex items-start gap-4">
                                    <Calculator size={20} className="text-blue-500 mt-1" />
                                    <p className="text-[10px] text-blue-500 font-black uppercase leading-relaxed tracking-wider">
                                        Al confirmar, el grupo se cerrará y se enviará la cuenta a cada miembro con {selectedAccounts.length} cuentas bancarias disponibles.
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Footer / Navigation */}
                    <div className="px-8 py-6 border-t border-[var(--border-color)] bg-black/5 flex justify-between items-center">
                        <button 
                            onClick={step === 1 ? onClose : handleBack}
                            className="flex items-center gap-2 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-[var(--text-primary)] transition-colors"
                        >
                            <ArrowLeft size={16} /> {step === 1 ? 'Cancelar' : 'Anterior'}
                        </button>

                        <button 
                            onClick={step === 4 ? handleStartSettlement : handleNext}
                            disabled={(step === 1 && unassignedItems.length > 0) || (step === 3 && selectedAccounts.length === 0) || isClosing}
                            className={cn(
                                "flex items-center gap-2 px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg active:scale-95",
                                step === 4 
                                    ? "bg-emerald-600 text-white shadow-emerald-600/20 hover:bg-emerald-500" 
                                    : "bg-[var(--primary)] text-white shadow-[var(--primary)]/20 hover:brightness-110 disabled:opacity-50 disabled:grayscale"
                            )}
                        >
                            {isClosing ? 'Procesando...' : step === 4 ? 'Confirmar y Cerrar' : 'Siguiente'}
                            {!isClosing && <ArrowRight size={16} />}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
