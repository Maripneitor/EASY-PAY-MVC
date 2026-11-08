import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, Hash, PlusCircle, UserPlus, Info, Loader2, Sparkles, Check, AlertCircle } from 'lucide-react';
import { PageHeader } from '@ui/components/PageHeader';
import { cn } from '@infrastructure/utils';
import { useCreateGroup } from './useCreateGroup';

export const CreateGroup = () => {
    const {
        activeTab,
        setActiveTab,
        groupName,
        setGroupName,
        groupDesc,
        setGroupDesc,
        currency,
        setCurrency,
        joinCode,
        setJoinCode,
        joinError,
        setJoinError,
        handleCreateGroup,
        handleJoinGroup,
        loading,
        goBack
    } = useCreateGroup();

    return (
        <div className="min-h-screen bg-[var(--bg-body)] text-[var(--text-primary)] font-display antialiased">
            <PageHeader
                title={activeTab === 'create' ? "Crear un Grupo" : "Unirse a un Grupo"}
                subtitle={activeTab === 'create' ? "Comienza a dividir gastos con tu equipo o amigos" : "Ingresa el código compartido por tu anfitrión"}
                onBack={goBack}
            />

            <main className="max-w-xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
                {/* Sistema de Pestañas (Tabs) con indicador deslizante Emil-style */}
                <div className="bg-[var(--bg-card)] p-1.5 rounded-2xl border border-[var(--border-color)] shadow-sm">
                    <div className="grid grid-cols-2 gap-1 relative">
                        {/* Pestaña: Crear un Grupo */}
                        <button
                            type="button"
                            onClick={() => setActiveTab('create')}
                            className={cn(
                                "relative py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors duration-200 z-10 active:scale-[0.98]",
                                activeTab === 'create'
                                    ? "text-white"
                                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                            )}
                        >
                            {activeTab === 'create' && (
                                <motion.div
                                    layoutId="groupActiveTabIndicator"
                                    className="absolute inset-0 bg-blue-600 rounded-xl shadow-md shadow-blue-600/30 -z-10"
                                    transition={{ type: "spring", stiffness: 450, damping: 32 }}
                                />
                            )}
                            <PlusCircle size={16} strokeWidth={2.5} />
                            <span>Crear Grupo</span>
                        </button>

                        {/* Pestaña: Unirse a un Grupo */}
                        <button
                            type="button"
                            onClick={() => setActiveTab('join')}
                            className={cn(
                                "relative py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors duration-200 z-10 active:scale-[0.98]",
                                activeTab === 'join'
                                    ? "text-white"
                                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                            )}
                        >
                            {activeTab === 'join' && (
                                <motion.div
                                    layoutId="groupActiveTabIndicator"
                                    className="absolute inset-0 bg-blue-600 rounded-xl shadow-md shadow-blue-600/30 -z-10"
                                    transition={{ type: "spring", stiffness: 450, damping: 32 }}
                                />
                            )}
                            <UserPlus size={16} strokeWidth={2.5} />
                            <span>Unirse a Grupo</span>
                        </button>
                    </div>
                </div>

                {/* Contenido Dinámico de las Pestañas */}
                <AnimatePresence mode="wait">
                    {activeTab === 'create' ? (
                        /* ── VISTA DE CREACIÓN DE GRUPO ── */
                        <motion.div
                            key="tab-create"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.18, ease: "easeOut" }}
                            className="space-y-6"
                        >
                            <div className="bg-[var(--bg-card)] p-6 sm:p-8 rounded-3xl border border-[var(--border-color)] shadow-xl space-y-6">
                                {/* Campo: Nombre del Grupo */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">
                                        Nombre del Grupo
                                    </label>
                                    <input
                                        type="text"
                                        value={groupName}
                                        onChange={(e) => setGroupName(e.target.value)}
                                        placeholder="Ej. Viaje a Cancún, Roomies, etc."
                                        autoFocus
                                        className="w-full bg-transparent text-xl sm:text-2xl font-black focus:outline-none placeholder:text-slate-400/40 text-[var(--text-primary)]"
                                    />
                                </div>

                                <div className="h-px bg-[var(--border-color)]" />

                                {/* Campo: Descripción */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                                        Descripción (Opcional)
                                    </label>
                                    <input
                                        type="text"
                                        value={groupDesc}
                                        onChange={(e) => setGroupDesc(e.target.value)}
                                        placeholder="¿Para qué es este grupo de gastos?"
                                        className="w-full bg-transparent text-sm font-medium focus:outline-none placeholder:text-slate-400/40 text-[var(--text-primary)]"
                                    />
                                </div>

                                <div className="h-px bg-[var(--border-color)]" />

                                {/* Campo: Selector de Moneda */}
                                <div className="space-y-2.5">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                                        Moneda Principal
                                    </label>
                                    <div className="grid grid-cols-3 gap-2.5">
                                        {[
                                            { code: 'MXN', label: 'MXN ($)', name: 'Peso Mexicano' },
                                            { code: 'USD', label: 'USD ($)', name: 'Dólar USA' },
                                            { code: 'EUR', label: 'EUR (€)', name: 'Euro' },
                                        ].map((c) => (
                                            <button
                                                key={c.code}
                                                type="button"
                                                onClick={() => setCurrency(c.code as 'MXN' | 'USD' | 'EUR')}
                                                className={cn(
                                                    "py-3 px-2 rounded-2xl text-xs font-black transition-all flex flex-col items-center justify-center gap-0.5 border active:scale-95",
                                                    currency === c.code
                                                        ? "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/30 scale-[1.02]"
                                                        : "bg-black/5 dark:bg-white/5 border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-black/10 hover:text-[var(--text-primary)]"
                                                )}
                                            >
                                                <span className="font-black text-sm">{c.label}</span>
                                                <span className="text-[9px] opacity-75 font-normal">{c.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Aviso informativo */}
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex gap-3 text-left">
                                <Info className="text-blue-500 shrink-0 mt-0.5" size={18} />
                                <p className="text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed font-medium">
                                    Al confirmar la creación, se generará un código de acceso único de 8 caracteres y un código QR que podrás compartir con tus amigos.
                                </p>
                            </div>

                            {/* Botón de Confirmación */}
                            <button
                                type="button"
                                onClick={handleCreateGroup}
                                disabled={!groupName.trim() || loading}
                                className="w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white py-4 sm:py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-600/30 hover:shadow-blue-600/50 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        <span>Creando Grupo...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={16} />
                                        <span>Confirmar y Crear Grupo</span>
                                    </>
                                )}
                            </button>
                        </motion.div>
                    ) : (
                        /* ── VISTA DE UNIRSE A UN GRUPO ── */
                        <motion.div
                            key="tab-join"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.18, ease: "easeOut" }}
                            className="space-y-6 text-center"
                        >
                            <div className="bg-[var(--bg-card)] p-6 sm:p-8 rounded-3xl border border-[var(--border-color)] shadow-xl space-y-6">
                                <div className="w-14 h-14 bg-blue-600/10 text-blue-500 rounded-2xl flex items-center justify-center mx-auto border border-blue-500/20">
                                    <Hash size={28} />
                                </div>
                                
                                <div>
                                    <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight">
                                        Código de Invitación
                                    </h3>
                                    <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
                                        Ingresa el código alfanumérico que te compartió el administrador
                                    </p>
                                </div>

                                <AnimatePresence>
                                    {joinError && (
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
                                                    {joinError}
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        maxLength={8}
                                        value={joinCode}
                                        onChange={(e) => {
                                            setJoinCode(e.target.value.toUpperCase());
                                            if (joinError) setJoinError(null);
                                        }}
                                        placeholder="00000000"
                                        autoFocus
                                        className="w-full bg-black/5 dark:bg-black/30 border-2 border-[var(--border-color)] focus:border-blue-500 rounded-2xl py-5 text-center text-3xl sm:text-4xl font-mono font-black tracking-[0.35em] text-[var(--text-primary)] placeholder:text-slate-400/20 focus:outline-none transition-all"
                                    />
                                    <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider block">
                                        {joinCode.length} / 8 caracteres
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleJoinGroup}
                                    disabled={joinCode.trim().length < 4 || loading}
                                    className="w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-600/30 hover:shadow-blue-600/50 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            <span>Verificando Código...</span>
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus size={16} />
                                            <span>Unirme Ahora</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Tarjeta de Escaneo QR Informativa */}
                            <div className="bg-[var(--bg-card)]/60 border border-[var(--border-color)] rounded-3xl p-6 flex flex-col items-center justify-center gap-3">
                                <div className="p-3 bg-blue-600/10 text-blue-500 rounded-2xl border border-blue-500/20">
                                    <QrCode size={36} />
                                </div>
                                <div>
                                    <h4 className="text-xs font-black uppercase tracking-widest text-[var(--text-primary)]">
                                        ¿Estás con el administrador?
                                    </h4>
                                    <p className="text-[11px] text-[var(--text-secondary)] mt-1 font-medium max-w-sm mx-auto">
                                        Pídele que muestre el código QR desde el detalle de su grupo para unirte instantáneamente con la cámara de tu móvil.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};
