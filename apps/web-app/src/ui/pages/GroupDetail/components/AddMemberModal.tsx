import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, UserPlus, Loader2, CheckCircle2, Info } from 'lucide-react';
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
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({ 
    isOpen, 
    onClose, 
    groupId, 
    onSuccess,
    existingMemberIds 
}) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isAdding, setIsAdding] = useState<string | null>(null);

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
        }, 500);

        return () => clearTimeout(timer);
    }, [query]);

    const handleAddMember = async (userId: string) => {
        setIsAdding(userId);
        try {
            await groupRepository.addMember(groupId, userId);
            toast.success("Miembro agregado correctamente");
            onSuccess();
            // Optional: don't close immediately to let them add more
        } catch (error: any) {
            toast.error(error.message || "Error al agregar miembro");
        } finally {
            setIsAdding(null);
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
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2.5rem] shadow-2xl overflow-hidden"
                >
                    <div className="p-8 border-b border-[var(--border-color)] flex justify-between items-center bg-gradient-to-r from-[var(--primary)]/5 to-transparent">
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tight">Agregar Integrante</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Busca usuarios por email o nombre</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-8 space-y-6">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                autoFocus
                                type="text"
                                placeholder="Email o nombre de usuario..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-black/5 border-2 border-transparent focus:border-[var(--primary)]/30 rounded-2xl outline-none text-sm font-bold transition-all"
                            />
                        </div>

                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {isSearching ? (
                                <div className="py-10 text-center">
                                    <Loader2 className="mx-auto text-[var(--primary)] animate-spin mb-2" size={24} />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Buscando usuarios...</p>
                                </div>
                            ) : results.length > 0 ? (
                                results.map((user) => {
                                    const isAlreadyIn = existingMemberIds.includes(user.id);
                                    return (
                                        <div 
                                            key={user.id}
                                            className="flex items-center justify-between p-4 bg-black/5 rounded-2xl border border-transparent hover:border-[var(--primary)]/20 transition-all"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-xs font-black">
                                                    {user.nombre?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black uppercase tracking-tight">{user.nombre}</p>
                                                    <p className="text-[9px] font-bold text-slate-400">{user.email}</p>
                                                </div>
                                            </div>
                                            
                                            {isAlreadyIn ? (
                                                <div className="flex items-center gap-1 text-emerald-500 text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 px-3 py-1.5 rounded-xl">
                                                    <CheckCircle2 size={14} /> En Grupo
                                                </div>
                                            ) : (
                                                <button 
                                                    disabled={!!isAdding}
                                                    onClick={() => handleAddMember(user.id)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 disabled:opacity-50 transition-all"
                                                >
                                                    {isAdding === user.id ? (
                                                        <Loader2 size={14} className="animate-spin" />
                                                    ) : (
                                                        <UserPlus size={14} />
                                                    )}
                                                    Agregar
                                                </button>
                                            )}
                                        </div>
                                    );
                                })
                            ) : query.length >= 2 ? (
                                <div className="py-10 text-center opacity-40">
                                    <Search className="mx-auto mb-2" size={32} />
                                    <p className="text-[10px] font-black uppercase tracking-widest">No se encontraron usuarios</p>
                                </div>
                            ) : (
                                <div className="py-10 text-center opacity-40">
                                    <Info className="mx-auto mb-2" size={32} />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Escribe para buscar</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-8 bg-black/5 flex justify-end">
                        <button 
                            onClick={onClose}
                            className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-700 transition-colors"
                        >
                            Listo
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
