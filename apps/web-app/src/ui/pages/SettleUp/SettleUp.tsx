import React, { useState, useEffect } from 'react';
import { 
    Banknote, 
    CreditCard as CardIcon, 
    Send, 
    Edit3,
    CheckCircle,
    ArrowLeft,
    Info,
    User,
    Copy,
    Check,
    Landmark,
    Star
} from 'lucide-react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { cn } from '../../../infrastructure/utils';
import { useGroupDetail } from '../GroupDetail/useGroupDetail';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useClipboard } from '../../hooks/useClipboard';
import { httpClient } from '../../../infrastructure/api/http-client';
import { useAuthContext } from '../../context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { userRepository } from '../../../infrastructure/api/repositories/UserRepository';


export const SettleUp = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { toggleSidebar } = useOutletContext<{ toggleSidebar: () => void }>();
    const { userShare, balances, membersData, selectedBankAccounts, status, adminId, isFetchingGroup: loading } = useGroupDetail(id || "");
    const { copyToClipboard, copiedId } = useClipboard();
    
    // Identificar al acreedor (admin del grupo o quien tenga mayor saldo a favor)
    const creditor = React.useMemo(() => {
        // Primero buscamos al admin del grupo directamente
        if (adminId && membersData.length > 0) {
            const adminMember = membersData.find((m: any) => m.id === adminId);
            if (adminMember) return adminMember;
        }
        // Fallback: quien tenga el mayor saldo positivo
        if (!balances || balances.length === 0) return null;
        const positiveBalances = balances.filter((b: any) => (b.balance ?? b.monto ?? 0) > 0.01);
        if (positiveBalances.length === 0) return null;
        const top = [...positiveBalances].sort((a, b) => (b.balance ?? b.monto ?? 0) - (a.balance ?? a.monto ?? 0))[0];
        return membersData.find((m: any) => m.id === top.usuario_id) || null;
    }, [balances, membersData, adminId]);

    // ID real del admin (para cargar su tarjeta)
    const targetUserId = adminId || creditor?.id || null;
    
    const [amount, setAmount] = useState(userShare?.toString() || "0");
    const [method, setMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
    const [note, setNote] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [adminCards, setAdminCards] = useState<any[]>([]);
    const [adminDefaultCard, setAdminDefaultCard] = useState<any>(null);
    const [loadingCards, setLoadingCards] = useState(false);

    // Cargar tarjeta del admin cuando se selecciona transferencia
    useEffect(() => {
        if (method !== 'transfer') return;
        if (!targetUserId) return;

        setLoadingCards(true);
        Promise.allSettled([
            userRepository.getProfile(targetUserId),
            userRepository.getWalletCards(targetUserId).catch(() => []),
            userRepository.getDefaultWalletCard(targetUserId).catch(() => null)
        ]).then(([profileResult, cardsResult, defaultResult]) => {
            // 1. Prioridad: Tarjetas del nuevo servicio Wallet (8006)
            const walletCards = cardsResult.status === 'fulfilled' ? cardsResult.value : [];
            const walletDefault = defaultResult.status === 'fulfilled' ? defaultResult.value : null;

            if (walletDefault) {
                setAdminDefaultCard(walletDefault);
                return;
            } else if (walletCards.length > 0) {
                setAdminDefaultCard(walletCards[0]);
                return;
            }

            // 2. Fallback: Cuentas registradas en el perfil del usuario (8001)
            if (profileResult.status === 'fulfilled' && profileResult.value?.bank_accounts?.length > 0) {
                const profileAccounts = profileResult.value.bank_accounts;
                const defaultAcc = profileAccounts.find((a: any) => a.is_default) || profileAccounts[0];
                setAdminDefaultCard({
                    beneficiario: defaultAcc.beneficiario || profileResult.value.nombre,
                    clabe: defaultAcc.clabe,
                    banco: defaultAcc.entidad_financiera,
                    is_default: true
                });
                return;
            }

            // 3. Fallback: Cuentas seleccionadas explícitamente en el grupo
            if (selectedBankAccounts?.length > 0) {
                const acc = selectedBankAccounts[0];
                setAdminDefaultCard({
                    beneficiario: acc.beneficiario || creditor?.nombre,
                    clabe: acc.clabe,
                    banco: acc.entidad_financiera,
                    is_default: true
                });
            }
        }).finally(() => setLoadingCards(false));
    }, [method, targetUserId]);

    // Actualizar el monto cuando cargue el userShare
    React.useEffect(() => {
        if (!loading && userShare) {
            setAmount(userShare.toString());
        }
    }, [loading, userShare]);

    const { user } = useAuthContext();
    
    const handleSettle = async () => {
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            toast.error('Por favor ingresa un monto válido');
            return;
        }

        if (!id || !creditor || !user) {
            toast.error('No se pudo identificar al acreedor o al usuario');
            return;
        }

        setIsProcessing(true);
        try {
            await httpClient.post(`/groups/${id}/settlements`, {
                group_id: id,
                payer_id: user.id,
                receiver_id: creditor.id,
                amount: numericAmount,
                proof_url: method === 'transfer' ? 'pending_upload' : null
            });


            toast.success('¡Solicitud de liquidación enviada!');
            toast.info(`Se ha notificado a ${creditor.nombre.split(' ')[0]}. Esperando su aprobación.`);
            
            queryClient.invalidateQueries({ queryKey: ['group', id] });
            queryClient.invalidateQueries({ queryKey: ['pending-settlements', id] });
            navigate(-1);
        } catch (error: any) {
            toast.error(error.message || 'Error al procesar la liquidación');
        } finally {
            setIsProcessing(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
             <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--primary)] border-t-transparent" />
        </div>
    );

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10 px-4 md:px-0">
            <PageHeader 
                title="Liquidar Deuda"
                onBack={() => navigate(-1)}
                onMenuClick={toggleSidebar}
            />
            
            {/* Amount Card */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[3rem] p-10 flex flex-col items-center text-center relative overflow-hidden group shadow-xl shadow-black/5">
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                    <Banknote size={120} />
                </div>
                
                <div className="w-16 h-16 bg-[var(--primary)]/10 rounded-2xl flex items-center justify-center mb-6 border border-[var(--primary)]/10">
                    <Banknote size={32} className="text-[var(--primary)]" />
                </div>
                
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-4">Monto a pagar</p>
                
                <div className="flex items-center justify-center gap-3 w-full max-w-xs">
                    <span className="text-3xl font-black text-[var(--text-secondary)]">$</span>
                    <input 
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="text-6xl font-black bg-transparent border-none text-center focus:ring-0 w-full p-0 text-[var(--text-primary)]"
                        placeholder="0.00"
                    />
                </div>
                
                <div className="mt-6 flex items-center gap-2 px-4 py-2 bg-[var(--primary)]/5 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
                    <p className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-wider">Deuda Pendiente: ${userShare.toFixed(2)}</p>
                </div>
            </div>

            {/* Note Field */}
            <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] ml-4 opacity-50">Nota (Opcional)</p>
                <div className="flex items-center gap-4 p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)]/50 focus-within:border-[var(--primary)]/50 transition-colors backdrop-blur-sm">
                    <Edit3 size={20} className="text-[var(--text-secondary)]" />
                    <input 
                        type="text"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Concepto del pago..."
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/30"
                    />
                </div>
            </div>

            {/* Payment Methods */}
            <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] ml-4 opacity-50">Método de Pago</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { id: 'cash', icon: Banknote, label: 'Efectivo', desc: 'Pago manual', color: 'emerald' },
                        { id: 'card', icon: CardIcon, label: 'Tarjeta', desc: 'Débito / Crédito', color: 'purple' },
                        { id: 'transfer', icon: Send, label: 'Transferencia', desc: 'SPEI / CoDi', color: 'blue' }
                    ].map((m) => (
                        <button 
                            key={m.id}
                            onClick={() => setMethod(m.id as any)}
                            className={cn(
                                "flex items-center gap-4 p-5 rounded-3xl border-2 transition-all text-left relative overflow-hidden group/btn",
                                method === m.id 
                                    ? "bg-[var(--primary)]/10 border-[var(--primary)] shadow-lg shadow-[var(--primary)]/5" 
                                    : "bg-[var(--bg-card)] border-[var(--border-color)] hover:border-[var(--primary)]/30 opacity-60 hover:opacity-100"
                            )}
                        >
                            {method === m.id && (
                                <motion.div 
                                    layoutId="selectedMethod"
                                    className="absolute top-2 right-2 text-[var(--primary)]"
                                >
                                    <CheckCircle size={16} />
                                </motion.div>
                            )}
                            
                            <div className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm",
                                method === m.id ? "bg-[var(--primary)] text-white scale-110" : "bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover/btn:bg-slate-200 dark:group-hover/btn:bg-slate-700"
                            )}>
                                <m.icon size={22} />
                            </div>
                            
                            <div>
                                <p className={cn(
                                    "font-black text-sm transition-colors",
                                    method === m.id ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
                                )}>{m.label}</p>
                                <p className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-wider opacity-60">{m.desc}</p>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Info de Transferencia — Tarjeta del Admin */}
                <AnimatePresence>
                    {method === 'transfer' && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="space-y-4"
                        >
                            <div className="flex items-center gap-3 mb-2 px-4">
                                <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500">
                                    <Landmark size={16} />
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Cuenta de Destino</p>
                            </div>

                            {loadingCards ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="w-6 h-6 border-2 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin" />
                                </div>
                            ) : adminDefaultCard ? (
                                <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border border-blue-500/20 rounded-[2rem] p-6 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                {adminDefaultCard.is_default && <Star size={12} className="text-amber-400 fill-amber-400" />}
                                                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">
                                                    {adminDefaultCard.banco || adminDefaultCard.entidad_financiera || 'Banco'}
                                                </p>
                                            </div>
                                            <p className="text-xl font-mono font-black text-[var(--text-primary)] tracking-wider">
                                                {adminDefaultCard.clabe}
                                            </p>
                                        </div>
                                        <button 
                                            onClick={() => copyToClipboard(adminDefaultCard.clabe, 'admin-clabe')}
                                            className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700"
                                        >
                                            {copiedId === 'admin-clabe' ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} className="text-slate-400" />}
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-blue-500/10">
                                        <div>
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">BENEFICIARIO</p>
                                            <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase">{adminDefaultCard.beneficiario || creditor?.nombre}</p>
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">INSTRUCCIONES</p>
                                            <p className="text-[10px] font-black text-[var(--text-secondary)]">Transfiere el monto exacto</p>
                                        </div>
                                    </div>
                                </div>
                            ) : selectedBankAccounts && selectedBankAccounts.length > 0 ? (
                                // Fallback: cuentas seleccionadas por el líder en el grupo
                                <div className="grid gap-3">
                                    {selectedBankAccounts.map((acc: any, index: number) => (
                                        <div key={index} className="bg-blue-500/5 border border-blue-500/10 rounded-[2rem] p-6 space-y-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">{acc.entidad_financiera}</p>
                                                    <p className="text-lg font-mono font-black text-[var(--text-primary)]">{acc.clabe}</p>
                                                </div>
                                                <button 
                                                    onClick={() => copyToClipboard(acc.clabe, `clabe-${index}`)}
                                                    className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700"
                                                >
                                                    {copiedId === `clabe-${index}` ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} className="text-slate-400" />}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 border-2 border-dashed border-[var(--border-color)] rounded-[2rem] flex flex-col items-center text-center opacity-50">
                                    <Landmark size={32} className="mb-3" />
                                    <p className="text-xs font-bold">El administrador no tiene una cuenta registrada aún.</p>
                                    <p className="text-[10px] text-[var(--text-secondary)] mt-1">Contacta al líder del grupo para obtener sus datos bancarios.</p>
                                </div>
                            )}

                            <p className="text-[8px] font-bold text-blue-500/60 uppercase tracking-tighter text-center pt-2">
                                Copia la CLABE y realiza la transferencia por el monto exacto indicado.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>


            </div>

            {/* Confirm Button */}
            <button 
                onClick={handleSettle}
                disabled={isProcessing || parseFloat(amount) <= 0}
                className="w-full bg-[var(--primary)] text-white font-black uppercase tracking-[0.25em] text-xs py-7 rounded-3xl shadow-2xl shadow-[var(--primary)]/30 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-30 disabled:grayscale overflow-hidden relative group"
            >
                 <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                
                {isProcessing ? (
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
