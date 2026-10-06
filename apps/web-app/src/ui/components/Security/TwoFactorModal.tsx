import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { userRepository } from '../../../infrastructure/api/repositories';

interface TwoFactorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onVerified: (code: string) => void;
    userId: string;
    actionTitle?: string;
    actionDescription?: string;
}

export const TwoFactorModal: React.FC<TwoFactorModalProps> = ({
    isOpen,
    onClose,
    onVerified,
    userId,
    actionTitle = "Verificación de Seguridad",
    actionDescription = "Por favor ingresa el código 2FA enviado a tu correo para autorizar esta acción."
}) => {
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [verifying, setVerifying] = useState(false);
    const [timer, setTimer] = useState(0);
    const [resendCount, setResendCount] = useState(0);

    useEffect(() => {
        let interval: any;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const getPenaltyTime = (count: number) => {
        if (count < 3) return 5;
        if (count < 6) return 10;
        return 15 + (count - 6) * 5; // Escalamiento de 5s adicionales por cada intento extra
    };

    const handleResend = async () => {
        if (timer > 0) return;

        const toastId = toast.loading("Enviando nuevo código...");
        try {
            await userRepository.setupTwoFactor(userId);
            toast.success("Código reenviado con éxito", { id: toastId });
            const nextCount = resendCount + 1;
            setResendCount(nextCount);
            setTimer(getPenaltyTime(nextCount));
        } catch (error: any) {
            toast.error(error.message || "Error al reenviar", { id: toastId });
        }
    };

    useEffect(() => {
        if (isOpen) {
            setCode(['', '', '', '', '', '']);
            // Focus first input
            setTimeout(() => document.getElementById(`2fa-digit-0`)?.focus(), 100);
            
            // Auto-enviar código al abrir
            if (timer === 0) {
                handleResend();
            }
        }
    }, [isOpen]);

    const handleVerify = async () => {
        const fullCode = code.join('');
        if (fullCode.length < 6) {
            return toast.warning("Ingresa el código completo");
        }

        setVerifying(true);
        const toastId = toast.loading("Verificando...");

        try {
            const res = await userRepository.verifyTwoFactor(userId, fullCode);
            if (res.status === "success" || res.verified) {
                toast.success("Seguridad verificada", { id: toastId });
                onVerified(fullCode);
                onClose();
            } else {
                toast.error("Código incorrecto", { id: toastId });
            }
        } catch (error: any) {
            toast.error(error.message || "Error de verificación", { id: toastId });
        } finally {
            setVerifying(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => !verifying && onClose()}
                    className="absolute inset-0 bg-black/60 backdrop-blur-md"
                />
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2.5rem] shadow-2xl p-8 flex flex-col items-center text-center overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 opacity-[0.05] blur-3xl rounded-full" />
                    
                    <button 
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 hover:bg-black/5 rounded-full transition-all"
                        disabled={verifying}
                    >
                        <X size={20} className="text-slate-400" />
                    </button>

                    <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 mb-6 border border-blue-500/10 shadow-inner">
                        <ShieldCheck size={32} />
                    </div>

                    <h3 className="text-2xl font-black text-[var(--text-primary)] uppercase tracking-tight mb-2">{actionTitle}</h3>
                    <p className="text-sm text-[var(--text-secondary)] mb-8 max-w-[280px]">
                        {actionDescription}
                    </p>

                    <div className="flex gap-2 mb-8">
                        {code.map((digit, i) => (
                            <input
                                key={i}
                                id={`2fa-digit-${i}`}
                                type="text"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/[^0-9]/g, '');
                                    if (!val && e.target.value) return;
                                    const newCode = [...code];
                                    newCode[i] = val.slice(-1);
                                    setCode(newCode);
                                    if (val && i < 5) document.getElementById(`2fa-digit-${i+1}`)?.focus();
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Backspace' && !digit && i > 0) {
                                        document.getElementById(`2fa-digit-${i-1}`)?.focus();
                                    }
                                }}
                                onPaste={(e) => {
                                    e.preventDefault();
                                    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
                                    if (!pastedData) return;
                                    
                                    const newCode = [...code];
                                    for (let j = 0; j < pastedData.length; j++) {
                                        if (i + j < 6) {
                                            newCode[i + j] = pastedData[j];
                                        }
                                    }
                                    setCode(newCode);
                                    
                                    // Enfocar el último input correspondiente
                                    const nextIndex = Math.min(5, i + pastedData.length - 1);
                                    document.getElementById(`2fa-digit-${nextIndex}`)?.focus();
                                }}
                                className="w-12 h-14 bg-black/5 border border-[var(--border-color)] rounded-xl text-center text-xl font-black focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-[var(--text-primary)]"
                            />
                        ))}
                    </div>

                    <button
                        onClick={handleVerify}
                        disabled={verifying || code.some(d => !d)}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
                    >
                        {verifying ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <span>Confirmar Acción</span>
                                <ShieldCheck size={18} />
                            </>
                        )}
                    </button>

                    <div className="mt-6 pt-6 border-t border-white/5 w-full">
                        {timer > 0 ? (
                            <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 animate-pulse">
                                <div className="w-1 h-1 bg-slate-500 rounded-full" />
                                <span>Reenviar en {timer}s...</span>
                            </div>
                        ) : (
                            <button
                                onClick={handleResend}
                                className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 hover:text-blue-400 transition-all flex items-center gap-2 mx-auto group"
                            >
                                <span className="group-hover:mr-1 transition-all">Volver a enviar código</span>
                                <AlertCircle size={12} className="opacity-50" />
                            </button>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
