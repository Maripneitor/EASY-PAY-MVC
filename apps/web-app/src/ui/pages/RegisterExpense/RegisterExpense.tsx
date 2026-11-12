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
    PieChart,
    Utensils,
    Car,
    Gamepad2,
    ShoppingCart,
    Home,
    Activity,
    Plane,
    Tag,
    Loader2,
    Sparkles,
    CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@infrastructure/utils';
import { PageHeader } from '@ui/components/PageHeader';
import { useRegisterExpense } from './useRegisterExpense';
import { toast } from 'sonner';
import OcrService from '../../../infrastructure/services/OcrService';

interface CategoryOption {
    label: string;
    icon: React.ElementType;
}

const CATEGORIES: CategoryOption[] = [
    { label: 'Comida', icon: Utensils },
    { label: 'Transporte', icon: Car },
    { label: 'Entretenimiento', icon: Gamepad2 },
    { label: 'Súper', icon: ShoppingCart },
    { label: 'Hogar', icon: Home },
    { label: 'Salud', icon: Activity },
    { label: 'Viajes', icon: Plane },
    { label: 'Otros', icon: Tag },
];

export const RegisterExpense = () => {
    const { itemId } = useParams();
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
            loading: 'Analizando ticket con OCR...',
            success: (data: any) => {
                setFormData(prev => ({
                    ...prev,
                    nombre: data.restaurantName || prev.nombre,
                    precio: data.total ? data.total.toString() : prev.precio
                }));
                return 'Ticket analizado con éxito';
            },
            error: 'No se pudo leer el ticket'
        });
    };

    const parsedPrice = parseFloat(formData.precio);
    const isPriceValid = formData.precio !== '' && !isNaN(parsedPrice) && parsedPrice > 0;
    const isNameValid = formData.nombre.trim() !== '';
    const selectedCount = formData.participantes_ids.length;
    const isFormValid = !loading && selectedCount > 0 && isPriceValid && isNameValid;

    const sharePerPerson = isPriceValid && selectedCount > 0
        ? (parsedPrice / selectedCount).toFixed(2)
        : '0.00';

    return (
        <div className="min-h-screen flex flex-col bg-[var(--bg-body)] font-display text-[var(--text-primary)] antialiased overflow-x-hidden">
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleOcr} 
            />
            
            {/* Luces difusas de fondo */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-5%] right-[-5%] w-[450px] h-[450px] bg-cyan-500/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-5%] left-[-5%] w-[350px] h-[350px] bg-blue-600/5 blur-[100px] rounded-full" />
            </div>

            <div className="flex-1 flex flex-col min-w-0 relative pb-28 lg:pb-12 z-10">
                <PageHeader
                    onMenuClick={toggleSidebar}
                    title={isEditing ? "Editar Gasto" : "Nuevo Gasto"}
                    onBack={() => navigate(-1)}
                    rightSlot={
                        <button
                            type="button"
                            className="inline-flex items-center gap-2 px-3 py-2 bg-cyan-500/10 text-cyan-400 hover:text-white hover:bg-cyan-600 rounded-xl border border-cyan-500/20 text-xs font-black uppercase tracking-wider active:scale-95 transition-transform duration-150 ease-out shadow-sm"
                            onClick={() => fileInputRef.current?.click()}
                            title="Escanear Ticket OCR"
                        >
                            <Receipt size={16} />
                            <span className="hidden sm:inline">Escanear Ticket</span>
                        </button>
                    }
                />

                <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        
                        {/* ── Columna Izquierda: Monto + Concepto + Categoría + Pagador ── */}
                        <div className="lg:col-span-7 space-y-6">

                            {/* 1. SECCIÓN DE MONTO DESTACADO */}
                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xl shadow-black/5 dark:shadow-black/20 relative overflow-hidden group focus-within:border-cyan-500/50 focus-within:shadow-cyan-500/10 transition-[border-color,box-shadow] duration-200"
                            >
                                <div className="absolute top-0 right-0 w-44 h-44 bg-cyan-500/5 blur-3xl pointer-events-none rounded-full" />
                                
                                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400 block mb-2">
                                    Monto del Gasto
                                </span>
                                
                                <div className="relative flex items-baseline">
                                    <span className="text-4xl sm:text-6xl font-black text-cyan-600 dark:text-cyan-400 mr-2 select-none">
                                        $
                                    </span>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={formData.precio}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/,/g, '.');
                                            if (/^\d*\.?\d*$/.test(val)) {
                                                setFormData({ ...formData, precio: val });
                                            }
                                        }}
                                        placeholder="0.00"
                                        className="w-full bg-transparent text-5xl sm:text-7xl font-black font-mono tracking-tight text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-300 dark:placeholder:text-slate-700"
                                        autoFocus={!isEditing}
                                    />
                                </div>

                                {formData.precio !== '' && !isPriceValid && (
                                    <motion.p 
                                        initial={{ opacity: 0, height: 0 }} 
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="text-rose-500 dark:text-rose-400 text-xs font-bold mt-2.5"
                                    >
                                        Ingresa un monto válido mayor a $0.00
                                    </motion.p>
                                )}
                            </motion.div>

                            {/* 2. CONCEPTO Y CATEGORÍA */}
                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2, delay: 0.05, ease: "easeOut" }}
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 sm:p-7 shadow-xl shadow-black/5 dark:shadow-black/10 space-y-6"
                            >
                                {/* Concepto */}
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400 block mb-2">
                                        Concepto / Descripción
                                    </label>
                                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 focus-within:border-cyan-500/50 rounded-2xl p-3.5 px-4 transition-colors duration-200">
                                        <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                                            <Receipt size={18} />
                                        </div>
                                        <input
                                            type="text"
                                            value={formData.nombre}
                                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                            placeholder="Ej. Cena en restaurante, Uber al aeropuerto..."
                                            className="w-full bg-transparent text-base font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="h-px bg-slate-200 dark:bg-slate-800/60" />

                                {/* Categorías con Iconografía Minimalista */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400 block">
                                            Categoría
                                        </label>
                                        <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400">
                                            {formData.categoria}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                        {CATEGORIES.map(({ label, icon: Icon }) => {
                                            const isSelected = formData.categoria === label;
                                            return (
                                                <button
                                                    key={label}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, categoria: label })}
                                                    className={cn(
                                                        "py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider border flex items-center justify-center gap-2",
                                                        "active:scale-95 transition-transform duration-150 ease-out",
                                                        isSelected
                                                            ? "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-400/60 shadow-sm shadow-cyan-500/20"
                                                            : "bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-slate-200"
                                                    )}
                                                >
                                                    <Icon size={14} className={isSelected ? "text-cyan-600 dark:text-cyan-400" : "text-slate-500 dark:text-slate-400"} />
                                                    <span className="truncate">{label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </motion.div>

                            {/* 3. PAGADO POR */}
                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2, delay: 0.1, ease: "easeOut" }}
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 sm:p-7 shadow-xl shadow-black/5 dark:shadow-black/10"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400 block">
                                        Pagado por
                                    </label>
                                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                        {members.find(m => m.id === formData.comprador_id)?.nombre || 'Selecciona'}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {members.map(user => {
                                        const isPayer = formData.comprador_id === user.id;
                                        return (
                                            <button
                                                key={user.id}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, comprador_id: user.id })}
                                                className={cn(
                                                    "p-3.5 rounded-2xl border flex items-center gap-3 relative overflow-hidden text-left",
                                                    "active:scale-95 transition-transform duration-150 ease-out",
                                                    isPayer
                                                        ? "bg-emerald-500/15 border-emerald-500/50 shadow-sm shadow-emerald-500/20"
                                                        : "bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-10 h-10 rounded-full flex items-center justify-center text-xs font-black shrink-0",
                                                    isPayer 
                                                        ? "bg-emerald-500 text-white shadow-sm" 
                                                        : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                                )}>
                                                    {user.nombre?.charAt(0)?.toUpperCase() || '?'}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className={cn(
                                                        "text-xs font-black uppercase tracking-tight truncate",
                                                        isPayer ? "text-emerald-700 dark:text-emerald-300" : "text-slate-900 dark:text-slate-200"
                                                    )}>
                                                        {user.nombre.split(' ')[0]}
                                                    </p>
                                                    <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">
                                                        {isPayer ? "Comprador" : "Miembro"}
                                                    </span>
                                                </div>
                                                {isPayer && (
                                                    <CheckCircle2 size={16} className="text-emerald-500 dark:text-emerald-400 shrink-0" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </motion.div>

                            {/* Botón de Confirmación para Escritorio */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.15 }}
                                className="hidden lg:block pt-2"
                            >
                                <button
                                    type="button"
                                    disabled={!isFormValid}
                                    onClick={handleSubmit}
                                    className={cn(
                                        "w-full h-16 rounded-2xl text-white font-black uppercase tracking-wider text-xs shadow-xl flex items-center justify-center gap-3",
                                        "active:scale-[0.98] transition-transform duration-150 ease-out",
                                        !isFormValid
                                            ? "bg-slate-800 text-slate-500 cursor-not-allowed shadow-none border border-slate-700/50"
                                            : "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-cyan-500/25"
                                    )}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            <span>Guardando Gasto...</span>
                                        </>
                                    ) : (
                                        <>
                                            {isEditing ? <Pencil size={18} /> : <Check size={20} className="stroke-[3]" />}
                                            <span>{isEditing ? 'Actualizar Gasto' : 'Confirmar Gasto'}</span>
                                        </>
                                    )}
                                </button>
                            </motion.div>
                        </div>

                        {/* ── Columna Derecha: División de Gastos ── */}
                        <div className="lg:col-span-5 space-y-6">
                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2, delay: 0.15, ease: "easeOut" }}
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 sm:p-7 shadow-xl shadow-black/5 dark:shadow-black/10 space-y-6"
                            >
                                <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                                    <div>
                                        <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                                            Dividir Entre
                                        </h3>
                                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                                            {selectedCount} de {members.length} personas
                                        </p>
                                    </div>

                                    {/* Selectores Rápidos en Pastilla */}
                                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/90 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, participantes_ids: members.map(m => m.id) })}
                                            className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 active:scale-95 transition-transform duration-150 ease-out"
                                        >
                                            Todos
                                        </button>
                                        <div className="w-px h-3 bg-slate-300 dark:bg-slate-800" />
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, participantes_ids: [formData.comprador_id] })}
                                            className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 active:scale-95 transition-transform duration-150 ease-out"
                                        >
                                            Solo Yo
                                        </button>
                                    </div>
                                </div>

                                {/* Mini-Avatares Interactivos (Acceso de un toque) */}
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400 block mb-3">
                                        Selección Rápida
                                    </span>
                                    <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                        {members.map(user => {
                                            const isSelected = formData.participantes_ids.includes(user.id);
                                            return (
                                                <button
                                                    key={user.id}
                                                    type="button"
                                                    onClick={() => toggleParticipant(user.id)}
                                                    className={cn(
                                                        "flex flex-col items-center gap-1.5 p-2 rounded-2xl border shrink-0 transition-transform duration-150 ease-out active:scale-90",
                                                        isSelected
                                                            ? "bg-cyan-500/10 border-cyan-400/50 shadow-sm"
                                                            : "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-60 grayscale hover:opacity-100"
                                                    )}
                                                    title={user.nombre}
                                                >
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-full flex items-center justify-center text-xs font-black",
                                                        isSelected
                                                            ? "bg-cyan-500 text-white shadow-sm shadow-cyan-500/30"
                                                            : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                                    )}>
                                                        {user.nombre?.charAt(0)?.toUpperCase() || '?'}
                                                    </div>
                                                    <span className={cn(
                                                        "text-[9px] font-bold truncate max-w-[56px] text-center",
                                                        isSelected ? "text-cyan-700 dark:text-cyan-300 font-black" : "text-slate-500 dark:text-slate-400"
                                                    )}>
                                                        {user.nombre.split(' ')[0]}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Resumen de Cuota */}
                                {isPriceValid && selectedCount > 0 && (
                                    <div className="p-4 bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 rounded-2xl flex items-center justify-between shadow-sm">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-xl bg-cyan-500/15 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                                                <Users size={16} />
                                            </div>
                                            <div>
                                                <span className="text-[9px] font-black uppercase tracking-wider text-cyan-700 dark:text-cyan-400 block">
                                                    Cuota por persona
                                                </span>
                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                    Entre {selectedCount} participantes
                                                </span>
                                            </div>
                                        </div>
                                        <span className="text-xl font-black font-mono text-cyan-700 dark:text-cyan-300">
                                            ${sharePerPerson}
                                        </span>
                                    </div>
                                )}

                                {/* Lista Detallada con Checkboxes Táctiles */}
                                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
                                    <AnimatePresence mode="popLayout">
                                        {members.map((user) => {
                                            const isSelected = formData.participantes_ids.includes(user.id);
                                            const initial = user.nombre?.charAt(0)?.toUpperCase() || '?';

                                            return (
                                                <motion.div
                                                    key={user.id}
                                                    layout
                                                    onClick={() => toggleParticipant(user.id)}
                                                    className={cn(
                                                        "group flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border cursor-pointer",
                                                        "active:scale-[0.98] transition-transform duration-150 ease-out select-none",
                                                        isSelected
                                                            ? "bg-slate-50 dark:bg-slate-900 border-cyan-500/40 shadow-sm"
                                                            : "bg-slate-50/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800/60 opacity-60 hover:opacity-90"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className={cn(
                                                            "w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 transition-colors duration-150",
                                                            isSelected ? "bg-cyan-500 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                                        )}>
                                                            {initial}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <span className={cn(
                                                                "font-black text-xs uppercase tracking-tight truncate block",
                                                                isSelected ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400"
                                                            )}>
                                                                {user.nombre || 'Usuario'}
                                                            </span>
                                                            <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400">
                                                                {isSelected ? `${Math.round(100 / selectedCount)}% del total` : 'No participa'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3 shrink-0">
                                                        {isSelected && isPriceValid && (
                                                            <span className="text-sm font-black font-mono text-cyan-600 dark:text-cyan-300">
                                                                ${sharePerPerson}
                                                            </span>
                                                        )}
                                                        <div className={cn(
                                                            "w-6 h-6 rounded-lg border flex items-center justify-center transition-colors duration-150",
                                                            isSelected 
                                                                ? "bg-cyan-500 border-cyan-400 text-white shadow-sm" 
                                                                : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/40"
                                                        )}>
                                                            {isSelected && <Check size={14} className="stroke-[3]" />}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        </div>

                    </div>
                </main>

                {/* ── Barra de Acción Fija Inferior en Móvil ── */}
                <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800/80 z-40 shadow-2xl">
                    <button
                        type="button"
                        disabled={!isFormValid}
                        onClick={handleSubmit}
                        className={cn(
                            "w-full h-14 rounded-2xl text-white font-black uppercase tracking-wider text-xs shadow-lg flex items-center justify-center gap-2",
                            "active:scale-[0.98] transition-transform duration-150 ease-out",
                            !isFormValid
                                ? "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none border border-slate-300 dark:border-slate-700/50"
                                : "bg-gradient-to-r from-cyan-500 to-blue-600 shadow-cyan-500/25"
                        )}
                    >
                        {loading ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                <span>Guardando...</span>
                            </>
                        ) : (
                            <>
                                {isEditing ? <Pencil size={18} /> : <Check size={18} className="stroke-[3]" />}
                                <span>{isEditing ? 'Actualizar Gasto' : `Confirmar Gasto ${isPriceValid ? `$${formData.precio}` : ''}`}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
