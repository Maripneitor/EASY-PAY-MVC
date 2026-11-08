import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, UserPlus, Loader2, CheckCircle2, Info, Mail, Send, Clock } from 'lucide-react';
import { userRepository } from '../../../../infrastructure/api/repositories/UserRepository';
import { groupRepository } from '../../../../infrastructure/api/repositories/GroupRepository';
import { toast } from 'sonner';
import { cn } from '../../../../infrastructure/utils';

interface AddMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    groupId: string;
    onSuccess: () => void;
    existingMemberIds: string[];
    pendingInvitations?: any[];
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({ 
    isOpen, 
    onClose, 
    groupId, 
    onSuccess,
    existingMemberIds,
    pendingInvitations = []
}) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isAdding, setIsAdding] = useState<string | null>(null);
    const [isInvitingEmail, setIsInvitingEmail] = useState(false);

    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(query.trim());

    useEffect(() => {
        if (!query.trim() || query.length < 2) {
            setResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const users = await userRepository.searchUsers(query);
                setResults(users);
            } catch (error) {
                console.error("Search error:", error);
            } finally {
                setIsSearching(false);
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [query]);

    const handleAddMember = async (userId: string, userName?: string) => {
        setIsAdding(userId);
        try {
            await groupRepository.addMember(groupId, userId);
            toast.success(`Invitación enviada a ${userName || 'usuario'}. Estará en estado pendiente hasta que la acepte.`);
            onSuccess();
        } catch (error: any) {
            toast.error(error.message || "Error al enviar invitación");
        } finally {
            setIsAdding(null);
        }
    };

    const handleInviteByEmail = async () => {
        if (!isEmailValid) return;
        setIsInvitingEmail(true);
        try {
            await groupRepository.inviteMember(groupId, query.trim());
            toast.success(`Invitación enviada por correo y notificación a ${query.trim()}`);
            setQuery('');
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.message || "Error al enviar invitación");
        } finally {
            setIsInvitingEmail(false);
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
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />
                
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 16 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="relative w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2.5rem] shadow-2xl overflow-hidden"
                >
                    <div className="p-8 border-b border-[var(--border-color)] flex justify-between items-center bg-gradient-to-r from-[var(--primary)]/5 to-transparent">
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tight text-[var(--text-primary)]">Invitar Integrante</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Busca un usuario registrado o invita por email</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors text-slate-400 hover:text-slate-200">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-8 space-y-6">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                autoFocus
                                type="text"
                                placeholder="Escribe un correo o nombre de usuario..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-black/5 dark:bg-white/5 border-2 border-transparent focus:border-[var(--primary)]/40 rounded-2xl outline-none text-sm font-bold text-[var(--text-primary)] transition-colors placeholder:text-slate-500"
                            />
                        </div>

                        {/* Botón de Invitación por Email si parece un correo */}
                        {isEmailValid && (
                            <motion.div
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-4 bg-[var(--primary)]/10 border border-[var(--primary)]/30 rounded-2xl flex items-center justify-between gap-3 shadow-sm"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-9 h-9 rounded-xl bg-[var(--primary)] text-white flex items-center justify-center shrink-0">
                                        <Mail size={16} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[11px] font-black uppercase tracking-tight text-[var(--text-primary)] truncate">Enviar invitación formal</p>
                                        <p className="text-[10px] font-semibold text-slate-400 truncate">{query.trim()}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleInviteByEmail}
                                    disabled={isInvitingEmail}
                                    className="px-3.5 py-2 bg-[var(--primary)] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:opacity-90 active:scale-95 disabled:opacity-50 transition-transform flex items-center gap-1.5 shrink-0"
                                >
                                    {isInvitingEmail ? (
                                        <Loader2 size={13} className="animate-spin" />
                                    ) : (
                                        <Send size={13} />
                                    )}
                                    <span>Invitar</span>
                                </button>
                            </motion.div>
                        )}

                        <div className="space-y-3 max-h-[260px] overflow-y-auto pr-2 custom-scrollbar">
                            {isSearching ? (
                                <div className="py-8 text-center">
                                    <Loader2 className="mx-auto text-[var(--primary)] animate-spin mb-2" size={24} />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Buscando usuarios...</p>
                                </div>
                            ) : results.length > 0 ? (
                                results.map((user) => {
                                    const isAlreadyIn = existingMemberIds.includes(user.id);
                                    const isPending = pendingInvitations?.some(
                                        (inv: any) => (inv.invited_email && user.email && inv.invited_email.toLowerCase() === user.email.toLowerCase())
                                    );
                                    return (
                                        <div 
                                            key={user.id}
                                            className="flex items-center justify-between p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-transparent hover:border-[var(--primary)]/20 transition-colors"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-black text-slate-700 dark:text-slate-200 shrink-0">
                                                    {user.nombre?.charAt(0)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-black uppercase tracking-tight text-[var(--text-primary)] truncate">{user.nombre}</p>
                                                    <p className="text-[9px] font-bold text-slate-400 truncate">{user.email}</p>
                                                </div>
                                            </div>
                                            
                                            {isAlreadyIn ? (
                                                <div className="flex items-center gap-1 text-emerald-500 text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 px-3 py-1.5 rounded-xl shrink-0">
                                                    <CheckCircle2 size={14} /> En Grupo
                                                </div>
                                            ) : isPending ? (
                                                <div className="flex items-center gap-1 text-amber-500 text-[10px] font-black uppercase tracking-widest bg-amber-500/10 px-3 py-1.5 rounded-xl shrink-0">
                                                    <Clock size={13} /> Pendiente
                                                </div>
                                            ) : (
                                                <button 
                                                    disabled={!!isAdding}
                                                    onClick={() => handleAddMember(user.id, user.nombre)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 active:scale-95 disabled:opacity-50 transition-transform shrink-0"
                                                >
                                                    {isAdding === user.id ? (
                                                        <Loader2 size={14} className="animate-spin" />
                                                    ) : (
                                                        <UserPlus size={14} />
                                                    )}
                                                    Invitar
                                                </button>
                                            )}
                                        </div>
                                    );
                                })
                            ) : query.length >= 2 ? (
                                <div className="py-8 text-center opacity-50">
                                    <Search className="mx-auto mb-2 text-slate-400" size={28} />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No se encontraron coincidencias directas</p>
                                    <p className="text-[9px] text-slate-400 mt-1">Si ingresas su correo completo podrás invitarlo directamente arriba.</p>
                                </div>
                            ) : (
                                <div className="py-8 text-center opacity-40">
                                    <Info className="mx-auto mb-2 text-slate-400" size={28} />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Escribe para buscar o invitar por correo</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-6 bg-black/5 dark:bg-white/5 flex justify-end">
                        <button 
                            onClick={onClose}
                            className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-200 transition-colors"
                        >
                            Listo
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
