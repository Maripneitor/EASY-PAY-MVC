import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userRepository } from '../../../infrastructure/api/repositories';
import { setAuthToken } from '../../../infrastructure/api/http-client';
import { ROUTES } from '../../../infrastructure/routes';
import { toast } from 'sonner';
import { useAuthContext } from '../../context/AuthContext';

export const TwoFactorVerify = () => {
    const navigate = useNavigate();
    const { updateUserSession } = useAuthContext();
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);
    const userId = localStorage.getItem('temp_userId');

    // Countdown logic for resend button
    useEffect(() => {
        let interval: any;
        if (resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [resendTimer]);

    // Auto-submit when all 6 digits are entered
    useEffect(() => {
        if (code.every(digit => digit !== '') && !isVerified && !isVerifying) {
            handleConfirm();
        }
    }, [code]);

    const handleConfirm = async () => {
        if (!userId) {
            toast.error("Sesión expirada. Por favor inicia sesión de nuevo.");
            navigate(ROUTES.AUTH);
            return;
        }

        const fullCode = code.join('');
        if (fullCode.length < 6) {
            toast.warning("Ingresa el código completo de 6 dígitos.");
            return;
        }

        setIsVerifying(true);
        try {
            const result = await userRepository.verifyTwoFactor(userId, fullCode);
            
            if (result.status === 'success') {
                // Si el backend nos da un token, lo guardamos para entrar directo
                if (result.access_token && result.user) {
                    updateUserSession(result.user, result.access_token);
                } else if (result.access_token) {
                    setAuthToken(result.access_token);
                }

                setIsVerified(true);
                toast.success("¡Cuenta verificada exitosamente!");
                
                // Limpiar datos temporales
                localStorage.removeItem('temp_userId');
                localStorage.removeItem('userEmail');

                // Redirigir al dashboard
                navigate(ROUTES.DASHBOARD, { replace: true });
            } else {
                toast.error(result.message || "Código incorrecto");
            }
        } catch (error: any) {
            toast.error(error.message || "Error al verificar el código");
        } finally {
            setIsVerifying(false);
        }
    };

    const handleCancel = () => {
        navigate(ROUTES.AUTH);
    };

    const handleResend = async () => {
        if (!userId || resendTimer > 0) return;
        
        try {
            await userRepository.setupTwoFactor(userId);
            toast.success("Código re-enviado a tu correo");
            setResendTimer(5); // Start 5 second countdown
        } catch (error) {
            toast.error("No se pudo reenviar el código");
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6).split('');
        if (pastedData.length === 0) return;

        const newCode = [...code];
        pastedData.forEach((digit, idx) => {
            newCode[idx] = digit;
        });
        setCode(newCode);

        // Enfocar el siguiente input vacío o el último
        const nextIdx = pastedData.length < 6 ? pastedData.length : 5;
        document.getElementById(`digit-${nextIdx}`)?.focus();
    };

    if (isVerified) {
        return (
            <div className="bg-[var(--bg-body)] min-h-screen flex items-center justify-center p-6 text-center">
                <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-10 rounded-[2.5rem] shadow-2xl max-w-sm animate-bounce-subtle">
                    <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-500">
                        <span className="material-symbols-outlined text-5xl">check_circle</span>
                    </div>
                    <h1 className="text-3xl font-black text-[var(--text-primary)] mb-2 uppercase tracking-tighter">¡Cuenta Verificada!</h1>
                    <p className="text-[var(--text-secondary)] font-medium">Todo listo. Redirigiendo a tu dashboard...</p>
                    <div className="mt-8 flex justify-center">
                        <div className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[var(--bg-body)] text-[var(--text-primary)] min-h-screen flex flex-col antialiased selection:bg-[var(--primary)] selection:text-white">
            {/* Main Content */}
            <main className="flex-grow flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--primary)]/5 rounded-full blur-[120px]"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[var(--primary)]/5 rounded-full blur-[120px]"></div>
                </div>

                <div className="bg-[var(--bg-card)] border border-[var(--border-color)] w-full max-w-lg rounded-[3rem] shadow-[0_32px_64px_-15px_rgba(0,0,0,0.08)] flex flex-col animate-fade-in-up overflow-hidden">
                    <div className="p-8 sm:p-10 border-b border-[var(--border-color)] text-center bg-black/[0.02]">
                        <div className="flex flex-col items-center gap-3 mb-2">
                            <div className="p-4 bg-[var(--primary)]/10 rounded-2xl text-[var(--primary)] mb-2 border border-[var(--primary)]/10">
                                <span className="material-symbols-outlined text-4xl">mark_email_read</span>
                            </div>
                            <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight uppercase">Verifica tu correo</h1>
                        </div>
                        <p className="text-[var(--text-secondary)] text-sm font-medium leading-relaxed max-w-[280px] mx-auto">
                            Ingresa el código de 6 dígitos que enviamos a tu bandeja de entrada.
                        </p>
                    </div>

                    <div className="p-8 sm:p-10 space-y-10">
                        <div className="space-y-6">
                            <div className="flex justify-center gap-2 sm:gap-3">
                                {code.map((digit, i) => (
                                    <React.Fragment key={i}>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            autoFocus={i === 0}
                                            placeholder="•"
                                            value={digit}
                                            disabled={isVerifying}
                                            onPaste={handlePaste}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/[^0-9]/g, '');
                                                if (!val && e.target.value) return; 
                                                const newCode = [...code];
                                                newCode[i] = val.slice(-1);
                                                setCode(newCode);
                                                if (val && i < 5) {
                                                    const nextInput = document.getElementById(`digit-${i + 1}`);
                                                    nextInput?.focus();
                                                }
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Backspace' && !digit && i > 0) {
                                                    const prevInput = document.getElementById(`digit-${i - 1}`);
                                                    prevInput?.focus();
                                                }
                                            }}
                                            id={`digit-${i}`}
                                            className="w-12 h-16 sm:w-16 sm:h-20 bg-black/[0.03] border border-transparent focus:border-[var(--primary)] rounded-2xl text-center text-3xl font-black text-[var(--text-primary)] focus:outline-none focus:ring-8 focus:ring-[var(--primary)]/5 transition-all placeholder-black/10 shadow-sm"
                                        />
                                    </React.Fragment>
                                ))}
                            </div>
                            <div className="flex justify-center mt-2">
                                <button 
                                    onClick={handleResend} 
                                    disabled={resendTimer > 0}
                                    className={`text-[var(--primary)] hover:opacity-80 text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 group ${resendTimer > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <span className={`material-symbols-outlined text-[18px] ${resendTimer === 0 ? 'group-hover:rotate-180 transition-transform duration-500' : ''}`}>refresh</span>
                                    {resendTimer > 0 ? `Reenviar en ${resendTimer}s` : '¿No recibiste el código? Reenviar ahora'}
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4 pt-2">
                            <button 
                                onClick={handleConfirm}
                                disabled={isVerifying}
                                className="w-full py-5 px-4 bg-[var(--primary)] hover:opacity-90 disabled:opacity-50 text-white font-black rounded-2xl shadow-xl shadow-[var(--primary)]/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-sm"
                            >
                                {isVerifying ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <span>Verificar ahora</span>
                                        <span className="material-symbols-outlined">verified</span>
                                    </>
                                )}
                            </button>
                            <button 
                                onClick={handleCancel}
                                className="w-full py-4 px-4 bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-black uppercase tracking-widest transition-all text-[10px]"
                            >
                                Volver al inicio de sesión
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};