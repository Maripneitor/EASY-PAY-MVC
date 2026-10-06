import React, { useState } from 'react';
import { X, Info, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../../infrastructure/utils';
import { useGroups } from '../useGroups';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CreateGroupModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
    const { createGroup, joinGroup } = useGroups();
    const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
    const [name, setName] = useState('');
    const [desc, setDesc] = useState('');
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!name) return;
        setLoading(true);
        try {
            await createGroup(name, desc);
            onClose();
        } catch (e) { } finally { setLoading(false); }
    };

    const handleJoin = async () => {
        if (code.length < 4) return;
        setLoading(true);
        try {
            await joinGroup(code);
            onClose();
        } catch (e) { } finally { setLoading(false); }
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
                    className="relative w-full max-w-xl bg-[var(--bg-body)] rounded-[3rem] border border-[var(--border-color)] shadow-2xl overflow-y-auto no-scrollbar max-h-[90vh]"
                >
                    <div className="p-8 space-y-8">
                        <div className="flex justify-between items-center">
                            <h3 className="text-2xl font-black uppercase tracking-tighter">
                                {activeTab === 'create' ? 'Nuevo Grupo' : 'Unirse a Grupo'}
                            </h3>
                            <button onClick={onClose} className="p-3 hover:bg-black/5 rounded-2xl transition-all"><X size={24} /></button>
                        </div>
                        <div className="flex p-1.5 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-inner">
                            <button onClick={() => setActiveTab('create')} className={cn("flex-1 py-3 rounded-xl text-xs font-black transition-all tracking-widest", activeTab === 'create' ? "bg-[var(--primary)] text-white shadow-lg" : "text-slate-400")}>CREAR</button>
                            <button onClick={() => setActiveTab('join')} className={cn("flex-1 py-3 rounded-xl text-xs font-black transition-all tracking-widest", activeTab === 'join' ? "bg-[var(--primary)] text-white shadow-lg" : "text-slate-400")}>UNIRSE</button>
                        </div>
                        {activeTab === 'create' ? (
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Nombre del Grupo</label>
                                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Cena de Navidad" className="w-full px-8 py-5 bg-[var(--bg-card)] border-2 border-transparent focus:border-[var(--primary)]/30 rounded-3xl outline-none font-bold text-lg transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Descripción (Opcional)</label>
                                    <input type="text" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="¿Cuál es el motivo?" className="w-full px-8 py-5 bg-[var(--bg-card)] border-2 border-transparent focus:border-[var(--primary)]/30 rounded-3xl outline-none font-bold transition-all" />
                                </div>
                                <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-4 flex gap-3"><Info className="text-blue-500 shrink-0" size={18} /><p className="text-[11px] text-blue-600 font-medium leading-tight">Se generará un código de invitación único para que otros puedan unirse.</p></div>
                                <button onClick={handleCreate} disabled={!name || loading} className="w-full py-5 bg-[var(--primary)] text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-xl shadow-[var(--primary)]/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30">{loading ? 'Creando...' : 'Confirmar y Crear'}</button>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                <div className="space-y-6">
                                    <div className="w-16 h-16 bg-orange-500/10 text-orange-500 rounded-full flex items-center justify-center mx-auto"><Hash size={32} /></div>
                                    <input type="text" maxLength={8} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="CÓDIGO" className="w-full bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-3xl py-8 text-center text-5xl font-black tracking-[0.4em] focus:border-[var(--primary)] focus:outline-none transition-all placeholder:opacity-10" />
                                </div>
                                <button onClick={handleJoin} disabled={code.length < 4 || loading} className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all disabled:opacity-20">{loading ? 'Verificando...' : 'Unirse ahora'}</button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
