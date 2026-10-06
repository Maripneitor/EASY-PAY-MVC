import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QrCode, ArrowLeft, Send, Hash, Info, Loader2 } from 'lucide-react';
import { groupRepository } from '../../../infrastructure/api/repositories';
import { ROUTES } from '../../../infrastructure/routes';
import { toast } from 'sonner';
import { useAuthContext } from '../../context/AuthContext';
import styles from './JoinGroup.module.css';

export const JoinGroup = () => {
    const navigate = useNavigate();
    const { user } = useAuthContext();
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (code.length >= 4) { // Allow flexibility but 8 is standard
            setLoading(true);
            try {
                if (!user?.id) throw new Error("Debes iniciar sesión");
                
                // Unirse al grupo usando el repositorio sincronizado
                const group = await groupRepository.joinGroup(code, { 
                    id: user.id, 
                    name: user.nombre || (user as any).name || "Usuario", 
                    role: 'member' 
                });
                
                toast.success(`Te has unido a: ${group.name}`);
                navigate(ROUTES.GROUP_DETAIL(group.id));
            } catch (error: any) {
                toast.error(error.message || "No se pudo unir al grupo. Verifica el código.");
            } finally {
                setLoading(false);
            }
        }
    };

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
                        {/* Lado Izquierdo: Formulario */}
                        <div className="flex-1 p-8 lg:p-12 border-b md:border-b-0 md:border-r border-white/5">
                            <button 
                                className="mb-8 p-2 hover:bg-white/5 rounded-full transition-colors text-[var(--text-secondary)]"
                                onClick={() => navigate(ROUTES.DASHBOARD)}
                            >
                                <ArrowLeft size={24} />
                            </button>

                            <div className="mb-10">
                                <h1 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase">Unirse a Grupo</h1>
                                <p className="text-[var(--text-secondary)] font-medium">Ingresa el código de 6 dígitos que aparece en el dispositivo del anfitrión.</p>
                            </div>

                            <form onSubmit={handleJoin} className="space-y-6">
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-[var(--primary)]">
                                        <Hash size={24} />
                                    </div>
                                    <input
                                        type="text"
                                        maxLength={8}
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                                        placeholder="EX: ABC123XY"
                                        disabled={loading}
                                        className="w-full bg-black/40 border-2 border-white/10 rounded-2xl py-6 pl-14 pr-6 text-2xl font-mono font-black text-white tracking-[0.5em] placeholder:tracking-normal placeholder:font-sans placeholder:text-white/20 focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/20 transition-all outline-none"
                                    />
                                </div>
                                
                                <button 
                                    type="submit" 
                                    disabled={code.length < 4 || loading}
                                    className="w-full group relative py-6 bg-[var(--primary)] disabled:opacity-30 disabled:grayscale rounded-2xl overflow-hidden transition-all shadow-glow hover:scale-[1.02] active:scale-[0.98]"
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
                                                <Send size={20} className="text-white" />
                                            </>
                                        )}
                                    </div>
                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                </button>
                            </form>

                            <div className="mt-8 p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl flex items-start gap-3">
                                <Info size={18} className="text-blue-400 mt-0.5" />
                                <p className="text-[10px] text-blue-200/60 leading-relaxed font-medium uppercase tracking-wider">
                                    Si eres el anfitrión, puedes mostrar el QR de la derecha para que otros integrantes se unan escaneando desde sus móviles.
                                </p>
                            </div>
                        </div>

                        {/* Lado Derecho: QR Display */}
                        <div className="w-full md:w-[300px] lg:w-[350px] bg-white/5 flex flex-col items-center justify-center p-8 relative">
                            <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--primary) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                            
                            <div className="relative z-10 text-center">
                                <div className="mb-6 inline-block p-6 bg-white rounded-[2rem] shadow-2xl shadow-black/50 border-4 border-[var(--primary)]/20">
                                    <QrCode size={180} className="text-black" />
                                </div>
                                <h3 className="text-white font-black uppercase tracking-widest text-sm mb-1">Código QR de Grupo</h3>
                                <p className="text-[var(--text-secondary)] text-[10px] font-bold uppercase tracking-widest">Escaneo para Móviles</p>
                            </div>

                            <div className="mt-12 flex flex-col items-center gap-2">
                                <div className="flex gap-1">
                                    {[1,2,3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse" style={{ animationDelay: `${i*0.2}s` }} />)}
                                </div>
                                <span className="text-[10px] font-black text-[var(--primary)] uppercase tracking-[0.3em]">Esperando Integrantes</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};
