import React, { useState, useEffect } from 'react';
import { X, Check, DollarSign, Receipt, PieChart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@infrastructure/utils';

interface EditItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: any;
    onSave: (itemId: string, data: any) => Promise<void>;
}

export const EditItemModal: React.FC<EditItemModalProps> = ({ isOpen, onClose, item, onSave }) => {
    const [nombre, setNombre] = useState('');
    const [precio, setPrecio] = useState('');
    const [categoria, setCategoria] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (item) {
            setNombre(item.nombre || '');
            setPrecio(String(item.monto || item.precio || ''));
            setCategoria(item.categoria || 'Otros');
        }
    }, [item]);

    const handleSave = async () => {
        if (!nombre || !precio) return;
        setLoading(true);
        try {
            await onSave(item.id, {
                nombre,
                precio: parseFloat(precio),
                categoria
            });
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
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
                        className="relative w-full max-w-lg bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2.5rem] shadow-2xl overflow-hidden"
                    >
                        <div className="p-8 space-y-8">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-black uppercase tracking-tight">Editar Gasto</h3>
                                <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-xl transition-all">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Concepto</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                            <Receipt size={18} />
                                        </div>
                                        <input
                                            type="text"
                                            value={nombre}
                                            onChange={(e) => setNombre(e.target.value)}
                                            className="w-full bg-black/5 border border-transparent focus:border-[var(--primary)] focus:bg-white rounded-2xl py-4 pl-12 pr-4 font-bold outline-none transition-all"
                                            placeholder="Ej. Cena"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Monto</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--primary)]">
                                            <DollarSign size={18} />
                                        </div>
                                        <input
                                            type="number"
                                            value={precio}
                                            onChange={(e) => setPrecio(e.target.value)}
                                            className="w-full bg-black/5 border border-transparent focus:border-[var(--primary)] focus:bg-white rounded-2xl py-4 pl-12 pr-4 font-bold outline-none transition-all"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoría</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['Comida', 'Transporte', 'Entretenimiento', 'Otros'].map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => setCategoria(cat)}
                                                className={cn(
                                                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                                                    categoria === cat
                                                        ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-lg shadow-[var(--primary)]/20"
                                                        : "bg-black/5 text-slate-400 border-transparent hover:border-slate-300"
                                                )}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={loading || !nombre || !precio}
                                className="w-full py-5 bg-[var(--primary)] text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] shadow-xl shadow-[var(--primary)]/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale disabled:scale-100 flex items-center justify-center gap-3"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Check size={20} /> Guardar Cambios
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
