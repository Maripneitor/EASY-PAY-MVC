import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Star, Trash2 } from 'lucide-react';
import { cn } from '@infrastructure/utils';

export interface CardProps {
    card: {
        id: string;
        lastFour: string;
        holder: string;
        expiry?: string;
        brand: string;
        colorGradient?: string;
        isDefault?: boolean;
    };
    onSetDefault?: (id: string) => void;
    onDelete?: (id: string) => void;
    interactive?: boolean;
}

export const getBankStyle = (brand: string) => {
    switch ((brand || '').toUpperCase()) {
        case 'BBVA':
            return { gradient: 'from-blue-900 to-indigo-950', text: 'text-white' };
        case 'SANTANDER':
            return { gradient: 'from-red-600 to-rose-900', text: 'text-white' };
        case 'BANAMEX':
        case 'CITIBANAMEX':
            return { gradient: 'from-blue-600 to-cyan-900', text: 'text-white' };
        case 'NU':
            return { gradient: 'from-purple-600 to-indigo-950', text: 'text-white' };
        case 'MERCADO PAGO':
            return { gradient: 'from-sky-400 to-blue-600', text: 'text-white' };
        default:
            return { gradient: 'from-slate-800 to-slate-950', text: 'text-white' };
    }
};

export const PaymentCard: React.FC<CardProps> = ({
    card,
    onSetDefault,
    onDelete,
    interactive = true
}) => {
    // Definición de paletas temáticas ultra modernas
    const getCardTheme = (brand: string, customGradient?: string) => {
        if (customGradient) return { background: customGradient, textColor: 'text-white' };

        switch (brand.toUpperCase()) {
            case 'VISA':
                return {
                    background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
                    textColor: 'text-white',
                    chipColor: 'from-amber-200 to-yellow-400'
                };
            case 'MASTERCARD':
                return {
                    background: 'linear-gradient(135deg, #18181b 0%, #27272a 50%, #3f3f46 100%)',
                    textColor: 'text-white',
                    chipColor: 'from-amber-300 to-amber-500'
                };
            case 'AMEX':
                return {
                    background: 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #059669 100%)',
                    textColor: 'text-white',
                    chipColor: 'from-slate-200 to-slate-400'
                };
            default:
                return {
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
                    textColor: 'text-white',
                    chipColor: 'from-amber-200 to-yellow-500'
                };
        }
    };

    const theme = getCardTheme(card.brand, card.colorGradient);
    const isWhiteText = theme.textColor === 'text-white';

    return (
        <motion.div 
            whileHover={interactive ? { y: -8, scale: 1.02 } : {}}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="relative w-full aspect-[1.586/1] rounded-[2.5rem] p-8 shadow-2xl overflow-hidden cursor-pointer border border-white/20 select-none group"
            style={{ background: theme.background }}
        >
            {/* Holographic Watermark effect */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_70%)] pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-white/5 rounded-full blur-2xl pointer-events-none group-hover:scale-150 transition-transform duration-700" />

            <div className="relative z-10 flex flex-col justify-between h-full">
                <div className="flex justify-between items-start">
                    {/* Chip EMV Premium */}
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-10 rounded-xl bg-gradient-to-tr from-amber-200 via-yellow-400 to-amber-500 border border-amber-300/50 shadow-inner flex items-center justify-around p-1.5 overflow-hidden relative">
                            <div className="absolute inset-0 border border-black/10 rounded-lg" />
                            <div className="w-full h-[1px] bg-black/20 absolute top-1/2" />
                            <div className="h-full w-[1px] bg-black/20 absolute left-1/3" />
                            <div className="h-full w-[1px] bg-black/20 absolute right-1/3" />
                        </div>
                        <ShieldCheck className={cn("opacity-40", isWhiteText ? "text-white" : "text-black")} size={24} />
                    </div>

                    {/* Quick Actions (Hover) */}
                    {interactive && (
                        <div className="flex items-center gap-2">
                            {onSetDefault && !card.isDefault && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSetDefault(card.id);
                                    }}
                                    className="p-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl transition-all opacity-0 group-hover:opacity-100 shadow-xl backdrop-blur-md"
                                    title="Hacer Principal"
                                >
                                    <Star size={18} className={isWhiteText ? "text-white" : "text-slate-900"} />
                                </button>
                            )}
                            {onDelete && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(card.id);
                                    }}
                                    className="p-3 bg-white/10 hover:bg-rose-500 border border-white/10 rounded-2xl transition-all opacity-0 group-hover:opacity-100 shadow-xl backdrop-blur-md"
                                    title="Eliminar Tarjeta"
                                >
                                    <Trash2 size={18} className={isWhiteText ? "text-white" : "text-slate-900"} />
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className={cn("text-2xl font-mono tracking-[0.25em] drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] filter contrast-125", isWhiteText ? "text-white/95" : "text-black/80")}>
                        •••• •••• •••• {card.lastFour}
                    </div>

                    <div className="flex justify-between items-end">
                        <div className="space-y-1">
                            <p className={cn("text-[9px] font-black uppercase tracking-[0.4em]", isWhiteText ? "text-white/50" : "text-black/40")}>Card Holder</p>
                            <p className="text-sm font-black uppercase tracking-widest truncate max-w-[200px] drop-shadow-sm">{card.holder}</p>
                        </div>
                        <div className="flex flex-col items-end">
                            {card.isDefault && (
                                <span className={cn("mb-2 text-[8px] font-black uppercase px-2 py-0.5 rounded border backdrop-blur-sm", isWhiteText ? "bg-white/20 text-white border-white/30" : "bg-black/10 text-black border-black/20")}>
                                    PRINCIPAL
                                </span>
                            )}
                            <div className="h-10 flex items-center">
                                {card.brand?.toUpperCase() === 'VISA' && <span className="text-3xl font-black italic tracking-tighter opacity-90 drop-shadow-lg">VISA</span>}
                                {card.brand?.toUpperCase() === 'MASTERCARD' && (
                                    <div className="flex -space-x-3">
                                        <div className="w-8 h-8 rounded-full bg-rose-500/80 mix-blend-screen" />
                                        <div className="w-8 h-8 rounded-full bg-amber-500/80 mix-blend-screen" />
                                    </div>
                                )}
                                {card.brand?.toUpperCase() === 'AMEX' && <div className="px-3 py-1 bg-cyan-500/20 border border-cyan-400/30 rounded text-xs font-black italic">AMEX</div>}
                                {!['VISA', 'MASTERCARD', 'AMEX'].includes(card.brand?.toUpperCase() || '') && <span className="text-lg font-black uppercase tracking-widest opacity-70">{card.brand}</span>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
