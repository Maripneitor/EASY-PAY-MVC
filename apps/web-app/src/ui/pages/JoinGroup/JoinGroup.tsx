import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, ArrowLeft, Send, Hash, Info, Loader2, AlertCircle, Sparkles, CheckCircle, ShieldCheck } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { groupRepository } from '../../../infrastructure/api/repositories';
import { ROUTES } from '../../../infrastructure/routes';
import { toast } from 'sonner';
import { useAuthContext } from '../../context/AuthContext';
import styles from './JoinGroup.module.css';

export const JoinGroup = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user, isAuthenticated } = useAuthContext();

    const paramCode = searchParams.get('code') || '';
    const paramGroupId = searchParams.get('group') || '';
    const paramInvitationId = searchParams.get('invitation') || '';

    const [code, setCode] = useState(paramCode.toUpperCase());
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Auto-actualizar estado de código si cambia la URL
    useEffect(() => {
        if (paramCode) {
            setCode(paramCode.toUpperCase());
        }
    }, [paramCode]);

    const handleJoin = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setErrorMessage(null);

        const cleanCode = code.trim().toUpperCase();
        if (cleanCode.length < 4) {
            setErrorMessage("Ingresa un código de acceso válido (mínimo 4 caracteres).");
            return;
        }

        if (!isAuthenticated || !user?.id) {
            // Guardar código para después del login
            sessionStorage.setItem('pending_join_code', cleanCode);
            if (paramGroupId) sessionStorage.setItem('pending_join_group', paramGroupId);
            if (paramInvitationId) sessionStorage.setItem('pending_join_invitation', paramInvitationId);

            toast.info("Por favor inicia sesión para unirte al grupo");
            navigate(ROUTES.AUTH);
            return;
        }

        setLoading(true);
        try {
            // Si viene una invitación específica por parámetro, intentamos aceptarla primero
            if (paramInvitationId) {
                try {
                    const invRes = await groupRepository.acceptInvitation(paramInvitationId);
                    const targetGroupId = invRes.group_id || paramGroupId;
                    toast.success("¡Invitación aceptada! Te has unido al grupo exitosamente.");
                    if (targetGroupId) {
                        navigate(ROUTES.GROUP_DETAIL(targetGroupId));
                        return;
                    }
                } catch {
                    // Fallback a unirse por código estándar si falla la invitación
                }
            }

            // Unirse al grupo usando el repositorio
            const group = await groupRepository.joinGroup(cleanCode, { 
                id: user.id, 
                name: user.nombre || (user as any).name || "Usuario", 
                role: 'member' 
            });
            
            toast.success("Te has unido al grupo exitosamente");
            navigate(ROUTES.GROUP_DETAIL(group.id));
        } catch (error: any) {
            const msg = error.message || "Código no válido o ha expirado. Verifica con el anfitrión.";
            setErrorMessage(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const hasDeepLinkParams = Boolean(paramCode || paramGroupId);

    return (
        <div className={styles.page}>
            <div className={styles.overlay} />
            <div className={styles.container}>
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative z-10 w-full max-w-2xl bg-[var(--bg-card)] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden backdrop-blur-xl"
                >
                    <div className="flex flex-col md:flex-row min-h-[500px]">
                        {/* Lado Izquierdo: Formulario / Pre-aprobación */}
                        <div className="flex-1 p-8 lg:p-12 border-b md:border-b-0 md:border-r border-white/5">
                            <button 
                                className="mb-8 p-2 hover:bg-white/5 rounded-full transition-colors text-[var(--text-secondary)]"
                                onClick={() => navigate(ROUTES.DASHBOARD)}
                            >
                                <ArrowLeft size={24} />
                            </button>

                            <div className="mb-8">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full text-xs font-black uppercase tracking-wider mb-3">
                                    <Sparkles size={13} />
                                    <span>Acceso Directo</span>
                                </div>
                                <h1 className="text-3xl sm:text-4xl font-black text-white mb-2 tracking-tighter uppercase">
                                    Unirse a Grupo
                                </h1>
                                <p className="text-[var(--text-secondary)] text-sm font-medium">
                                    {hasDeepLinkParams 
                                        ? "Enlace de invitación detectado. Confirma para unirte al instante." 
                                        : "Ingresa el código que aparece en el dispositivo del anfitrión o escanea su QR."}
                                </p>
                            </div>

                            {/* Tarjeta de Pre-Aprobación rápida cuando hay parámetros de enlace */}
                            {hasDeepLinkParams && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-5 mb-6 bg-gradient-to-br from-indigo-950/60 to-slate-900/60 border border-indigo-500/30 rounded-2xl shadow-lg relative overflow-hidden"
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                                            <ShieldCheck size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Invitación Activa</p>
                                            <p className="text-sm font-bold text-white">Código: <span className="font-mono text-cyan-400 font-black">{code}</span></p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-300 leading-relaxed mb-4">
                                        {isAuthenticated 
                                            ? `Listo para unirte con tu cuenta (${user?.nombre || user?.email}).`
                                            : "Inicia sesión para completar tu ingreso a este grupo."}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => handleJoin()}
                                        disabled={loading}
                                        className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-transform flex items-center justify-center gap-2 shadow-md shadow-indigo-600/30"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
                                                <span>Uniendo...</span>
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle size={16} />
                                                <span>Unirme con 1 Toque</span>
                                            </>
                                        )}
                                    </button>
                                </motion.div>
                            )}

                            <form onSubmit={handleJoin} className="space-y-6">
                                <AnimatePresence>
                                    {errorMessage && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -8, scale: 0.98 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -8, scale: 0.98 }}
                                            transition={{ duration: 0.2, ease: "easeOut" }}
                                            className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-3 text-left shadow-lg backdrop-blur-md"
                                        >
                                            <AlertCircle size={20} className="text-rose-400 shrink-0 mt-0.5" />
                                            <div className="space-y-0.5 flex-1 min-w-0">
                                                <span className="text-xs font-black text-rose-300 uppercase tracking-wider block">
                                                    Código no válido o expirado
                                                </span>
                                                <p className="text-xs text-rose-200/90 font-medium leading-relaxed">
                                                    {errorMessage}
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block pl-1">
                                        Código de Grupo
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-[var(--primary)]">
                                            <Hash size={24} />
                                        </div>
                                        <input
                                            type="text"
                                            maxLength={10}
                                            value={code}
                                            onChange={(e) => {
                                                setCode(e.target.value.toUpperCase());
                                                if (errorMessage) setErrorMessage(null);
                                            }}
                                            placeholder="EX: ABC123XY"
                                            disabled={loading}
                                            className="w-full bg-black/40 border-2 border-white/10 rounded-2xl py-5 pl-14 pr-6 text-xl sm:text-2xl font-mono font-black text-white tracking-[0.3em] placeholder:tracking-normal placeholder:font-sans placeholder:text-white/20 focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/20 transition-all outline-none"
                                        />
                                    </div>
                                </div>
                                
                                {!hasDeepLinkParams && (
                                    <button 
                                        type="submit" 
                                        disabled={code.length < 4 || loading}
                                        className="w-full group relative py-5 bg-[var(--primary)] disabled:opacity-30 disabled:grayscale rounded-2xl overflow-hidden transition-all shadow-glow hover:scale-[1.01] active:scale-[0.98]"
                                    >
                                        <div className="relative z-10 flex items-center justify-center gap-3">
                                            {loading ? (
                                                <>
                                                    <Loader2 size={20} className="text-white animate-spin" />
                                                    <span className="text-white font-black uppercase tracking-widest">Entrando...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="text-white font-black uppercase tracking-widest">Entrar al grupo</span>
                                                    <Send size={18} className="text-white" />
                                                </>
                                            )}
                                        </div>
                                    </button>
                                )}
                            </form>

                            <div className="mt-8 p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl flex items-start gap-3">
                                <Info size={18} className="text-blue-400 mt-0.5 shrink-0" />
                                <p className="text-[10px] text-blue-200/60 leading-relaxed font-medium uppercase tracking-wider">
                                    Los códigos de grupo son de un solo uso o permanentes según la configuración del anfitrión.
                                </p>
                            </div>
                        </div>

                        {/* Lado Derecho: Display QR */}
                        <div className="w-full md:w-[300px] lg:w-[350px] bg-white/5 flex flex-col items-center justify-center p-8 relative">
                            <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--primary) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                            
                            <div className="relative z-10 text-center">
                                <div className="mb-6 inline-block p-6 bg-white rounded-[2rem] shadow-2xl shadow-black/50 border-4 border-[var(--primary)]/20">
                                    {code && code.length >= 4 ? (
                                        <QRCodeSVG value={`${window.location.origin}/join?code=${code}`} size={160} />
                                    ) : (
                                        <QrCode size={160} className="text-slate-900" />
                                    )}
                                </div>
                                <h3 className="text-white font-black uppercase tracking-widest text-sm mb-1">
                                    {code ? `Grupo: ${code}` : "Código QR"}
                                </h3>
                                <p className="text-[var(--text-secondary)] text-[10px] font-bold uppercase tracking-widest">
                                    Escaneo Rápido con Cámara
                                </p>
                            </div>

                            <div className="mt-8 flex flex-col items-center gap-2">
                                <div className="flex gap-1.5">
                                    {[1,2,3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse" style={{ animationDelay: `${i*0.2}s` }} />)}
                                </div>
                                <span className="text-[10px] font-black text-[var(--primary)] uppercase tracking-[0.25em]">Sincronización Lista</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};
