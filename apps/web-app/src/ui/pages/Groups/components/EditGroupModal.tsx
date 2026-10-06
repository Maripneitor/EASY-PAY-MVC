import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGroups } from '../useGroups';
import { toast } from 'sonner';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    group: any;
    onSuccess?: () => void;
}

export const EditGroupModal: React.FC<ModalProps> = ({ isOpen, onClose, group, onSuccess }) => {
    const { updateGroup } = useGroups();
    const [name, setName] = useState('');
    const [desc, setDesc] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && group) {
            setName(group.nombre || '');
            setDesc(group.descripcion || '');
        }
    }, [isOpen, group?.id]); // Solo sincronizar cuando se abre el modal

    const handleUpdate = async () => {
        if (!name) return;
        const toastId = toast.loading("Guardando cambios...");
        setLoading(true);
        try {
            await updateGroup(group.id, name, desc);
            toast.success("Grupo actualizado con éxito", { id: toastId });
            if (onSuccess) onSuccess();
            onClose();
        } catch (e: any) {
            toast.error(e.message || "No se pudieron guardar los cambios", { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !group) return null;

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
                    className="relative w-full max-w-xl bg-[var(--bg-body)] rounded-[3rem] border border-[var(--border-color)] shadow-2xl overflow-hidden"
                >
                    <div className="p-8 space-y-8">
                        <div className="flex justify-between items-center">
                            <h3 className="text-2xl font-black uppercase tracking-tighter">Editar Grupo</h3>
                            <button onClick={onClose} className="p-3 hover:bg-black/5 rounded-2xl transition-all"><X size={24} /></button>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Nombre del Grupo</label>
                                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-8 py-5 bg-[var(--bg-card)] border-2 border-transparent focus:border-[var(--primary)]/30 rounded-3xl outline-none font-bold text-lg transition-all" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Descripción</label>
                                <input type="text" value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full px-8 py-5 bg-[var(--bg-card)] border-2 border-transparent focus:border-[var(--primary)]/30 rounded-3xl outline-none font-bold transition-all" />
                            </div>
                            <button onClick={handleUpdate} disabled={!name || loading} className="w-full py-5 bg-[var(--primary)] text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-xl shadow-[var(--primary)]/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30">{loading ? 'Guardando...' : 'Guardar Cambios'}</button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
