import React from 'react';
import { useOutletContext, useNavigate, useParams } from 'react-router-dom';
import {
    DollarSign,
    Check,
    User,
    Users,
    ArrowLeft,
    Receipt,
    Pencil,
    PieChart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@infrastructure/utils';
import { PageHeader } from '@ui/components/PageHeader';
import { useRegisterExpense } from './useRegisterExpense';
import { toast } from 'sonner';
import OcrService from '../../../infrastructure/services/OcrService';

export const RegisterExpense = () => {
    const { itemId, groupId } = useParams();
    const isEditing = Boolean(itemId);
    const { toggleSidebar } = useOutletContext<{ toggleSidebar: () => void }>();
    const navigate = useNavigate();
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const {
        formData,
        setFormData,
        members,
        handleSubmit,
        loading,
        toggleParticipant
    } = useRegisterExpense();

    const handleOcr = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        toast.promise(OcrService.extractTicketData(file), {
            loading: 'Analizando ticket...',
            success: (data: any) => {
                setFormData(prev => ({
                    ...prev,
                    nombre: data.restaurantName || prev.nombre,
                    precio: data.total.toString()
                }));
                return 'Ticket analizado con éxito';
            },
            error: 'No se pudo leer el ticket'
        });
    };

    const currentBuyer = members.find(i => i.id === formData.comprador_id);

    const parsedPrice = parseFloat(formData.precio);
    const isPriceValid = formData.precio !== '' && !isNaN(parsedPrice) && parsedPrice > 0;
    const isNameValid = formData.nombre.trim() !== '';
    const isFormValid = !loading && formData.participantes_ids.length > 0 && isPriceValid && isNameValid;

    return (
        <div className="min-h-screen flex flex-col bg-[var(--bg-body)] font-display text-[var(--text-primary)] antialiased overflow-x-hidden">
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleOcr} 
            />
            
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-[var(--primary)] opacity-[0.03] blur-[120px] rounded-full" />
                <div className="absolute bottom-[-5%] left-[-5%] w-[300px] h-[300px] bg-blue-500 opacity-[0.03] blur-[100px] rounded-full" />
            </div>

            <div className="flex-1 flex flex-col min-w-0 relative pb-20 md:pb-0 z-10">
                <PageHeader
                    onMenuClick={toggleSidebar}
                    title={isEditing ? "Editar Gasto" : "Nuevo Gasto"}
                    onBack={() => navigate(-1)}
                    rightSlot={
                        <button
                            className="p-2.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded-xl hover:bg-[var(--primary)] transition-all hover:text-white"
                            onClick={() => fileInputRef.current?.click()}
                            title="Escanear Ticket"
                        >
                            <Receipt size={22} />
                        </button>
                    }
                />

                <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-12">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                        {/* Columna Izquierda: Datos del Gasto */}
                        <div className="space-y-10">

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col items-start space-y-3 px-4"
                            >
                                <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.3em] opacity-60">Monto del Gasto</p>
                                <div className="relative flex items-center group w-full">
                                    <div className="absolute left-0 text-5xl font-black text-[var(--primary)] opacity-40 group-focus-within:opacity-100 transition-opacity duration-500">
                                        $
                                    </div>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={formData.precio}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/,/g, '.');
                                            setFormData({ ...formData, precio: val });
                                        }}
                                        placeholder="0.00"
                                        className="bg-transparent text-7xl md:text-8xl font-black text-slate-800 dark:text-white text-left w-full focus:outline-none placeholder:opacity-10 tracking-tighter pl-12"
                                        autoFocus={!isEditing}
                                    />
                                </div>
                                {formData.precio !== '' && (!isPriceValid) && (
                                    <motion.p 
                                        initial={{ opacity: 0, height: 0 }} 
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="text-red-500 text-[11px] font-black mt-2 uppercase tracking-widest px-4"
                                    >
                                        Monto inválido (debe ser mayor a 0)
                                    </motion.p>
                                )}
                            </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="space-y-4"
                    >
                        <div className="bg-[var(--bg-card)]/60 backdrop-blur-xl border border-[var(--border-color)] rounded-[2.5rem] p-6 shadow-2xl shadow-black/5 space-y-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary)] opacity-[0.02] blur-3xl rounded-full" />

                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-[var(--primary)]/5 flex items-center justify-center text-[var(--primary)] border border-[var(--primary)]/10 shadow-inner group-focus-within:bg-[var(--primary)]/10 transition-all">
                                    <Receipt size={24} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1 opacity-50">Concepto</p>
                                    <input
                                        type="text"
                                        value={formData.nombre}
                                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                        placeholder="Ej. Cena en el centro"
                                        className="w-full bg-transparent text-xl font-bold placeholder:text-slate-400 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="h-px bg-gradient-to-r from-transparent via-[var(--border-color)] to-transparent" />

                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-indigo-500/5 flex items-center justify-center text-indigo-500 border border-indigo-500/10">
                                    <PieChart size={24} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2 opacity-50">Categoría</p>
                                    <div className="flex flex-wrap gap-2">
                                        {['Comida', 'Transporte', 'Entretenimiento', 'Súper', 'Hogar', 'Salud', 'Viajes', 'Otros'].map(cat => (
                                            <button
                                                key={cat} // Logical reference
                                                onClick={() => setFormData({...formData, categoria: cat})} // Logical reference
                                                className={cn(
                                                    "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                                                    formData.categoria === cat // Logical reference
                                                        ? "bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/20"
                                                        : "bg-black/5 text-slate-400 border-transparent hover:border-slate-300"
                                                )}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="h-px bg-gradient-to-r from-transparent via-[var(--border-color)] to-transparent" />

                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/5 flex items-center justify-center text-emerald-500 border border-emerald-500/10">
                                        <User size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.3em] mb-4 opacity-50">Pagado por</p>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                            {members.map(user => {
                                                const isSelected = formData.comprador_id === user.id; // Logical reference
                                                return (
                                                    <button
                                                        key={user.id} // Logical reference
                                                        onClick={() => setFormData({...formData, comprador_id: user.id})} // Logical reference
                                                        className={cn(
                                                            "p-4 rounded-2xl border transition-all flex flex-col items-center gap-3 relative overflow-hidden group/payer",
                                                            isSelected 
                                                                ? "bg-emerald-500 border-emerald-500 shadow-xl shadow-emerald-500/20"
                                                                : "bg-black/5 border-transparent hover:bg-white hover:border-emerald-500/30 dark:hover:bg-slate-800"
                                                        )}
                                                    >
                                                        {isSelected && (
                                                            <div className="absolute top-1.5 right-1.5 text-white/80">
                                                                <Check size={12} strokeWidth={4} />
                                                            </div>
                                                        )}
                                                        <div className={cn(
                                                            "w-10 h-10 rounded-full flex items-center justify-center text-xs font-black shadow-inner transition-transform group-hover/payer:scale-110",
                                                            isSelected ? "bg-white/20 text-white" : "bg-slate-200 text-slate-500"
                                                        )}>
                                                            {user.nombre.charAt(0)}
                                                        </div>
                                                        <span className={cn(
                                                            "text-[10px] font-black uppercase tracking-widest truncate w-full text-center px-1",
                                                            isSelected ? "text-white" : "text-slate-500"
                                                        )}>
                                                            {user.nombre.split(' ')[0]}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="hidden lg:block pt-6"
                            >
                                <button
                                    className={cn(
                                        "w-full h-20 text-white rounded-[2rem] shadow-2xl flex items-center justify-center gap-4 active:scale-[0.97] transition-all overflow-hidden relative group",
                                        (!isFormValid)
                                            ? "bg-slate-300 dark:bg-slate-800 cursor-not-allowed shadow-none"
                                            : "bg-[var(--primary)] shadow-[var(--primary)]/30 hover:scale-[1.02]"
                                    )}
                                    onClick={handleSubmit}
                                    disabled={!isFormValid}
                                >
                                    {loading ? (
                                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/30 border-t-white" />
                                    ) : (
                                        isEditing ? <Pencil size={24} /> : <Check size={28} className="stroke-[3]" />
                                    )}
                                    <span className="uppercase tracking-[0.2em] font-black text-sm">
                                        {loading ? 'Guardando...' : (isEditing ? 'Actualizar Gasto' : 'Confirmar Gasto')}
                                    </span>
                                </button>
                            </motion.div>
                        </div>

                        {/* Columna Derecha: Participantes */}
                        <div className="space-y-6">
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                                className="space-y-6"
                            >
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.25em] flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
                                Dividir entre
                            </h3>
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={() => setFormData({...formData, participantes_ids: members.map(m => m.id)})}
                                        className="text-[9px] font-black uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors px-3 py-1 bg-black/5 rounded-lg border border-transparent hover:border-[var(--primary)]/20"
                                    >
                                        Todos
                                    </button>
                                    <button 
                                        onClick={() => setFormData({...formData, participantes_ids: [formData.comprador_id]})}
                                        className="text-[9px] font-black uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors px-3 py-1 bg-black/5 rounded-lg border border-transparent hover:border-[var(--primary)]/20"
                                    >
                                        Solo Yo
                                    </button>
                                    <div className="w-px h-4 bg-slate-200 mx-1" />
                                    <div className="flex items-center gap-2 text-[var(--primary)] bg-[var(--primary)]/10 px-4 py-1.5 rounded-full border border-[var(--primary)]/20 shadow-sm">
                                        <Users size={14} />
                                        <span className="text-[10px] font-black uppercase tracking-tighter">
                                            {formData.participantes_ids.length} Seleccionados
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-3 max-h-[60vh] overflow-y-auto pr-2 overflow-x-hidden no-scrollbar">
                            <AnimatePresence mode="popLayout">
                                {members.map((user, index) => {
                                    const isSelected = formData.participantes_ids.includes(user.id); // Logical reference
                                    const initial = user.nombre?.charAt(0).toUpperCase() || '?';

                                    return (
                                        <motion.div
                                            key={user.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            onClick={() => toggleParticipant(user.id)}
                                            className={cn(
                                                "group flex items-center justify-between p-6 rounded-[2.5rem] border transition-all cursor-pointer active:scale-[0.98] relative overflow-hidden",
                                                isSelected
                                                    ? "bg-[var(--bg-card)] border-[var(--primary)] shadow-2xl shadow-[var(--primary)]/5"
                                                    : "bg-transparent border-[var(--border-color)] opacity-40 grayscale hover:opacity-100 hover:grayscale-0"
                                            )}
                                        >
                                            {isSelected && (
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--primary)] shadow-[0_0_15px_var(--primary)]" />
                                            )}
                                                <div className="flex items-center gap-5">
                                                    <div className={cn(
                                                        "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm transition-all duration-500",
                                                        isSelected ? "bg-[var(--primary)] text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                                                    )}>
                                                        {initial}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className={cn("font-bold text-base", isSelected ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]")}>
                                                            {user.nombre || 'Usuario'}
                                                        </span>
                                                        <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Participante</span>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-4">
                                                    {isSelected && formData.precio && parseFloat(formData.precio) > 0 && ( // Logical reference
                                                        <motion.div 
                                                            initial={{ opacity: 0, scale: 0.8 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            className="text-right"
                                                        >
                                                            <div className="flex items-center gap-2 justify-end mb-1">
                                                                <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                                                                    {Math.round(100 / formData.participantes_ids.length)}%
                                                                </span>
                                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Le toca</p>
                                                            </div>
                                                            <p className="text-lg font-black text-[var(--primary)] font-mono leading-none">
                                                                ${(parseFloat(formData.precio) / formData.participantes_ids.length).toFixed(2)}
                                                            </p>
                                                        </motion.div>
                                                    )}
                                                    <div className={cn(
                                                        "w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-500",
                                                        isSelected ? "bg-[var(--primary)] border-[var(--primary)] shadow-lg" : "border-[var(--border-color)]"
                                                    )}>
                                                        {isSelected && <Check size={16} className="text-white stroke-[4]" />}
                                                    </div>
                                                </div>
                                            </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    </motion.div>

                        </div>

                        {/* Botón Flotante para Móvil (Oculto en Escritorio) */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="lg:hidden pt-6"
                        >
                            <button
                                className={cn(
                                    "w-full h-20 text-white rounded-[2rem] shadow-2xl flex items-center justify-center gap-4 active:scale-[0.97] transition-all overflow-hidden relative group",
                                    (!isFormValid)
                                        ? "bg-slate-300 dark:bg-slate-800 cursor-not-allowed shadow-none"
                                        : "bg-[var(--primary)] shadow-[var(--primary)]/30"
                                )}
                                onClick={handleSubmit}
                                disabled={!isFormValid}
                            >
                                {loading ? (
                                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/30 border-t-white" />
                                ) : (
                                    isEditing ? <Pencil size={24} /> : <Check size={28} className="stroke-[3]" />
                                )}
                                <span className="uppercase tracking-[0.2em] font-black text-sm">
                                    {loading ? 'Guardando...' : (isEditing ? 'Actualizar Gasto' : 'Confirmar Gasto')}
                                </span>
                            </button>
                        </motion.div>
                    </div>
                </main>
            </div>
        </div>
    );
};