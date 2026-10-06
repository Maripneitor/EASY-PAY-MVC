import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { PageHeader } from '@ui/components/PageHeader';
import {
    ShieldCheck,
    Mail,
    Loader2,
    AlertCircle,
    Send,
    ArrowRight
} from 'lucide-react';
import styles from './TwoFactorSetup.module.css';

import { useAuthContext } from '../../context/AuthContext';
import { userRepository } from '../../../infrastructure/api/repositories';
import { ROUTES } from '../../../infrastructure/routes';
import { toast } from 'sonner';

export const TwoFactorSetup = () => {
    const navigate = useNavigate();
    const { toggleSidebar } = useOutletContext<{ toggleSidebar: () => void }>();
    const { user } = useAuthContext();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [codeSent, setCodeSent] = useState(false);

    const userId = user?.id;
    const userEmail = user?.email || "tu correo";

    useEffect(() => {
        if (!userId) {
            console.error("No se detectó ID de usuario. Regresando...");
            navigate(ROUTES.AUTH);
        }
    }, [userId, navigate]);

    const goBack = () => navigate(-1);

    const handleRequestCode = async () => {
        if (!userId) {
            setError('Error de sesión: No se encontró el ID del usuario.');
            return;
        }

        try {
            setLoading(true);
            setError('');

            await userRepository.setupTwoFactor(userId);

            setCodeSent(true);
            toast.success("Código enviado exitosamente");

            setTimeout(() => {
                navigate(ROUTES.TWO_FACTOR_VERIFY);
            }, 2000);

        } catch (err: any) {
            console.error("Error en Setup 2FA:", err);
            const message = err.message || 'No pudimos enviar el código. Revisa tu conexión.';
            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[#0f172a] text-slate-200 min-h-screen flex flex-col antialiased selection:bg-primary selection:text-white">
            <PageHeader
                title="SEGURIDAD"
                subtitle="Configurar 2FA"
                onBack={goBack}
                onMenuClick={toggleSidebar}
            />

            <main className="flex-grow flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
                {/* Background glow effects - refined to be subtler */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[120px]"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/5 rounded-full blur-[120px]"></div>
                </div>

                <div className="bg-[#111827] border border-white/10 w-full max-w-lg rounded-3xl shadow-[0_32px_64px_-15px_rgba(0,0,0,0.8)] flex flex-col animate-fade-in-up relative z-10">
                    <div className="p-6 sm:p-8 border-b border-white/5">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20">
                                <ShieldCheck size={24} />
                            </div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">
                                {codeSent ? "¡Código Enviado!" : "Verificación en Dos Pasos"}
                            </h1>
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            {codeSent
                                ? `Hemos enviado un código de seguridad a ${userEmail}.`
                                : `Añade una capa extra de seguridad. Te enviaremos un código de 6 dígitos a tu correo para confirmar tu identidad.`
                            }
                        </p>
                    </div>

                    <div className="p-6 sm:p-8 space-y-6">
                        <div className="bg-[#1e293b] border border-white/10 rounded-3xl p-6 flex items-center gap-5 shadow-inner">
                            <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-500/20">
                                <Mail size={28} />
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Correo de verificación</p>
                                <p className="text-white font-bold text-lg truncate drop-shadow-sm">{userEmail}</p>
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-red-400 bg-red-400/10 p-4 rounded-xl text-xs font-bold border border-red-400/20">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}

                        <div className="pt-2">
                            <button
                                onClick={handleRequestCode}
                                disabled={loading || codeSent}
                                className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 shadow-lg ${codeSent
                                    ? "bg-emerald-500 text-white"
                                    : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20"
                                    }`}
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : codeSent ? (
                                    <>Redirigiendo... <ArrowRight size={18} /></>
                                ) : (
                                    <>Enviar código de seguridad</>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="p-6 text-center border-t border-white/5">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
                            © 2026 Easy-Pay Security. Software Engineering.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
};