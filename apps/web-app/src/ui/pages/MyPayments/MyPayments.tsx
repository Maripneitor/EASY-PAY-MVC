import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Lock,
    Edit2,
    Trash2,
    PlusCircle,
    ShoppingBag,
    Film,
    CreditCard
} from 'lucide-react';
import { PageHeader } from '@ui/components/PageHeader';
import { useOutletContext } from 'react-router-dom';
import { cn } from '../../../infrastructure/utils';
import { useMyPayments } from './useMyPayments';
import { TransactionDetailModal } from './components/TransactionDetailModal';
import { AddCardModal } from './components/AddCardModal';
import { PaymentCard } from '../../components/Dashboard/PaymentCard';
import { TwoFactorModal } from '../../components/Security/TwoFactorModal';

const I18N_TEXTS = {
    TITLE: 'MIS PAGOS',
    SECURE_PAYMENTS: 'Pagos Seguros',
    SAVED_METHODS: 'Métodos Guardados',
    ACTIVE_CARDS_SUFFIX: 'tarjetas activas',
    BANK_NAME_DEFAULT: 'PLATINO GLOBAL',
    HOLDER_LABEL: 'TITULAR',
    DEFAULT_BADGE: 'Principal',
    DELETE_CARD: 'Eliminar Tarjeta',
    NO_CARDS_TITLE: 'No hay tarjetas',
    NO_CARDS_DESC: 'Agrega un método de pago para comenzar',
    ADD_NOW: 'Agregar ahora',
    ADD_NEW_METHOD: 'AGREGAR NUEVO MÉTODO DE PAGO',
    HISTORY_TITLE: 'Historial de Pagos',
    VIEW_ALL: 'Ver todos',
    TABLE_HEADER: {
        TRANSACTION: 'Transacción',
        DATE: 'Fecha',
        STATUS: 'Estado',
        AMOUNT: 'Monto'
    },
    STATUS: {
        APPROVED: 'Aprobado',
        PENDING: 'Pendiente'
    },
    NO_HISTORY: 'No hay transacciones recientes',
    DELETE_MODAL: {
        TITLE: 'Eliminar Tarjeta',
        DESCRIPTION: 'Estás a punto de eliminar un método de pago. Por seguridad, verifica tu identidad.'
    }
} as const;

export const MyPayments = () => {
    const { toggleSidebar } = useOutletContext<{ toggleSidebar: () => void }>();
    const { 
        cards, 
        transactions, 
        loading, 
        refreshCards, 
        handleDeleteCard,
        confirmDeleteCard,
        is2FAModalOpen,
        setIs2FAModalOpen,
        userId
    } = useMyPayments();
    
    const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
    const [isAddCardOpen, setIsAddCardOpen] = useState(false);

    return (
        <div className="min-h-screen flex flex-col bg-[var(--bg-body)] font-display text-[var(--text-primary)] antialiased transition-colors duration-300">
            <div className="flex-1 flex flex-col min-w-0 relative pb-20 md:pb-0">
                <PageHeader
                    onMenuClick={toggleSidebar}
                    title={I18N_TEXTS.TITLE}
                    rightSlot={
                        <div className="flex items-center gap-2 text-[var(--primary)] bg-[var(--primary)]/10 px-3 py-1.5 rounded-full border border-[var(--primary)]/20 shadow-sm">
                            <Lock size={14} />
                            <span className="text-xs font-bold tracking-wide hidden sm:inline uppercase">{I18N_TEXTS.SECURE_PAYMENTS}</span>
                        </div>
                    }
                />

                <main className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-8 py-10 space-y-12">
                    {/* Metodos Guardados */}
                    <section>
                        <div className="flex justify-between items-end mb-6">
                            <h2 className="text-sm font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">{I18N_TEXTS.SAVED_METHODS}</h2>
                            <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest opacity-70">{cards.length} {I18N_TEXTS.ACTIVE_CARDS_SUFFIX}</span>
                        </div>
                        
                        {loading ? (
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[1,2].map(i => (
                                    <div key={i} className="h-56 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] animate-pulse" />
                                ))}
                             </div>
                        ) : cards.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {cards.map((card) => (
                                    <PaymentCard 
                                        key={card.id} 
                                        card={card} 
                                        onDelete={handleDeleteCard} 
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="py-12 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2.5rem] flex flex-col items-center justify-center text-center space-y-4 shadow-sm border-dashed">
                                <div className="w-20 h-20 rounded-full bg-[var(--primary)]/5 flex items-center justify-center text-[var(--primary)] mb-2">
                                    <CreditCard size={36} className="opacity-50" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-xl font-black uppercase tracking-tighter text-[var(--text-primary)]">{I18N_TEXTS.NO_CARDS_TITLE}</h3>
                                    <p className="text-[10px] text-[var(--text-secondary)] uppercase font-black tracking-[0.2em]">{I18N_TEXTS.NO_CARDS_DESC}</p>
                                </div>
                                <button 
                                    onClick={() => setIsAddCardOpen(true)}
                                    className="mt-4 px-8 py-3 bg-[var(--primary)] text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-[var(--primary)]/20 hover:scale-105 transition-all"
                                >
                                    {I18N_TEXTS.ADD_NOW}
                                </button>
                            </div>
                        )}
                    </section>

                    {/* Agregar Nuevo Metodo Adaptable */}
                    <section>
                        <motion.button 
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => setIsAddCardOpen(true)} 
                            className="w-full py-8 border-2 border-dashed border-[var(--primary)]/30 rounded-[2.5rem] bg-[var(--primary)]/5 flex flex-col items-center justify-center gap-3 text-[var(--primary)] hover:bg-[var(--primary)]/10 hover:border-[var(--primary)] transition-all group shadow-sm"
                        >
                            <div className="p-4 bg-white dark:bg-white/10 rounded-full shadow-lg group-hover:rotate-90 transition-transform duration-500">
                                <PlusCircle size={32} />
                            </div>
                            <span className="font-black tracking-[0.4em] uppercase text-[11px]">{I18N_TEXTS.ADD_NEW_METHOD}</span>
                        </motion.button>
                    </section>

                    {/* Historial */}
                    <section className="pb-10">
                        <div className="flex justify-between items-center mb-6 px-2">
                            <h2 className="text-sm font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">{I18N_TEXTS.HISTORY_TITLE}</h2>
                            <button className="text-[10px] font-black text-[var(--primary)] hover:underline tracking-widest uppercase transition-colors">{I18N_TEXTS.VIEW_ALL}</button>
                        </div>
                        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[3rem] overflow-hidden shadow-xl">
                            {transactions.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-[var(--border-color)] text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] bg-black/5">
                                                <th className="px-10 py-6">{I18N_TEXTS.TABLE_HEADER.TRANSACTION}</th>
                                                <th className="px-6 py-5">{I18N_TEXTS.TABLE_HEADER.DATE}</th>
                                                <th className="px-6 py-5">{I18N_TEXTS.TABLE_HEADER.STATUS}</th>
                                                <th className="px-8 py-5 text-right">{I18N_TEXTS.TABLE_HEADER.AMOUNT}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[var(--border-color)] text-sm">
                                            {transactions.map((tx) => (
                                                <tr 
                                                    key={tx.id} 
                                                    onClick={() => setSelectedTransaction(tx)}
                                                    className="group hover:bg-[var(--hover-bg)] transition-all cursor-pointer"
                                                >
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-2xl bg-[var(--bg-body)] flex items-center justify-center border border-[var(--border-color)] group-hover:border-[var(--primary)]/30 transition-all shadow-sm">
                                                                {tx.avatarUrl ? (
                                                                    <img src={tx.avatarUrl} className="w-full h-full rounded-2xl" alt="" />
                                                                ) : tx.icon === 'shopping-bag' ? (
                                                                    <ShoppingBag className="text-[var(--primary)]" size={20} />
                                                                ) : tx.icon === 'film' ? (
                                                                    <Film className="text-[var(--primary)]" size={20} />
                                                                ) : (
                                                                    <CreditCard className="text-[var(--primary)]" size={20} />
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="font-black text-[var(--text-primary)] uppercase tracking-tight">{tx.description}</p>
                                                                <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest opacity-60">{tx.category}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5 text-xs font-bold text-[var(--text-secondary)] uppercase">{tx.date}</td>
                                                    <td className="px-6 py-5">
                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${tx.status === 'completed' || tx.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${tx.status === 'completed' || tx.status === 'approved' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-pulse'}`}></span>
                                                            {tx.status === 'completed' || tx.status === 'approved' ? I18N_TEXTS.STATUS.APPROVED : I18N_TEXTS.STATUS.PENDING}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-5 text-right font-black text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors font-mono text-lg">
                                                        {tx.amount < 0 ? '-' : ''}${Math.abs(tx.amount).toFixed(2)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="py-20 text-center flex flex-col items-center justify-center opacity-40">
                                    <div className="w-16 h-16 rounded-full bg-black/5 flex items-center justify-center mb-4">
                                        <ShoppingBag size={32} />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">{I18N_TEXTS.NO_HISTORY}</p>
                                </div>
                            )}
                        </div>
                    </section>
                </main>
            </div>

            <TransactionDetailModal 
                isOpen={!!selectedTransaction}
                onClose={() => setSelectedTransaction(null)}
                transaction={selectedTransaction}
            />

            <AddCardModal 
                isOpen={isAddCardOpen}
                onClose={() => setIsAddCardOpen(false)}
                onSuccess={refreshCards}
                currentCardsCount={cards.length}
            />

            <TwoFactorModal
                isOpen={is2FAModalOpen}
                onClose={() => setIs2FAModalOpen(false)}
                onVerified={confirmDeleteCard}
                userId={userId || ''}
                actionTitle={I18N_TEXTS.DELETE_MODAL.TITLE}
                actionDescription={I18N_TEXTS.DELETE_MODAL.DESCRIPTION}
            />
        </div>
    );
};