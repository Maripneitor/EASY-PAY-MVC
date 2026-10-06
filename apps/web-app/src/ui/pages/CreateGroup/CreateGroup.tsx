import React from 'react';
import { QrCode, Hash, Plus, Info, Loader2 } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { PageHeader } from '@ui/components/PageHeader';
import { cn } from '@infrastructure/utils';
import { useCreateGroup } from './useCreateGroup';

export const CreateGroup = () => {
    // Extraemos solo lo que el hook realmente ofrece ahora
    const {
        activeTab,
        setActiveTab,
        groupName,
        setGroupName,
        groupDesc,
        setGroupDesc,
        joinCode,
        setJoinCode,
        handleCreateGroup,
        handleJoinGroup,
        loading,
        goBack
    } = useCreateGroup();
    const { toggleSidebar } = useOutletContext<{ toggleSidebar: () => void }>();

    return (
        <div className="min-h-screen bg-[var(--bg-body)] text-[var(--text-primary)] font-display antialiased">
            <PageHeader
                title={activeTab === 'crear' ? "Nuevo Grupo" : "Unirse a Grupo"}
                onBack={goBack}
                onMenuClick={toggleSidebar}
            />

            <main className="max-w-xl mx-auto px-6 py-8 space-y-8">
                {/* Selector de Modo */}
                <div className="flex p-1.5 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-inner">
                    <button
                        onClick={() => setActiveTab('crear')}
                        className={cn(
                            "flex-1 py-3 rounded-xl text-xs font-black transition-all tracking-widest",
                            activeTab === 'crear'
                                ? "bg-[var(--primary)] text-white shadow-lg"
                                : "text-[var(--text-secondary)] opacity-50"
                        )}
                    >
                        CREAR
                    </button>
                    <button
                        onClick={() => setActiveTab('unirse')}
                        className={cn(
                            "flex-1 py-3 rounded-xl text-xs font-black transition-all tracking-widest",
                            activeTab === 'unirse'
                                ? "bg-[var(--primary)] text-white shadow-lg"
                                : "text-[var(--text-secondary)] opacity-50"
                        )}
                    >
                        UNIRSE
                    </button>
                </div>

                {activeTab === 'crear' ? (
                    /* SECCIÓN CREAR */
                    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                        <div className="bg-[var(--bg-card)] p-6 rounded-3xl border border-[var(--border-color)] shadow-xl space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--primary)]">
                                    Nombre del Proyecto
                                </label>
                                <input
                                    type="text"
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                    placeholder="Ej. Gastos de Graduación"
                                    className="w-full bg-transparent text-2xl font-bold focus:outline-none placeholder:opacity-20"
                                />
                            </div>

                            <div className="h-px bg-[var(--border-color)]" />

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                                    Descripción (Opcional)
                                </label>
                                <input
                                    type="text"
                                    value={groupDesc}
                                    onChange={(e) => setGroupDesc(e.target.value)}
                                    placeholder="¿Para qué es este grupo?"
                                    className="w-full bg-transparent text-sm font-medium focus:outline-none placeholder:opacity-20"
                                />
                            </div>
                        </div>

                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex gap-3">
                            <Info className="text-blue-600 shrink-0" size={18} />
                            <p className="text-[11px] text-blue-700 dark:text-blue-300 leading-tight">
                                Al confirmar, se generará un código de acceso único que podrás compartir con tus amigos.
                            </p>
                        </div>

                        <button
                            onClick={handleCreateGroup}
                            disabled={!groupName || loading}
                            className="w-full bg-[var(--primary)] text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    Procesando...
                                </>
                            ) : 'Confirmar y Crear'}
                        </button>
                    </div>
                ) : (
                    /* SECCIÓN UNIRSE */
                    <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300 text-center">
                        <div className="space-y-6">
                            <div className="w-16 h-16 bg-orange-500/10 text-orange-500 rounded-full flex items-center justify-center mx-auto">
                                <Hash size={32} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black">Código de Grupo</h2>
                                <p className="text-xs text-[var(--text-secondary)] mt-1">Ingresa los 8 dígitos de acceso</p>
                            </div>

                            <input
                                type="text"
                                maxLength={8}
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                placeholder="00000000"
                                className="w-full bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-2xl py-6 text-center text-4xl font-black tracking-[0.4em] focus:border-[var(--primary)] focus:outline-none transition-all"
                            />
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-[var(--border-color)]"></span></div>
                            <div className="relative flex justify-center text-[10px] uppercase tracking-widest"><span className="bg-[var(--bg-body)] px-4 font-bold text-[var(--text-secondary)] opacity-40">O escanea</span></div>
                        </div>

                        <button className="w-full h-48 bg-[var(--bg-card)] border-2 border-dashed border-[var(--border-color)] rounded-3xl flex flex-col items-center justify-center gap-3 hover:border-[var(--primary)] transition-colors group">
                            <div className="p-4 bg-[var(--bg-body)] rounded-2xl group-hover:scale-110 transition-transform">
                                <QrCode size={48} className="text-[var(--primary)]" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Escala el QR del Administrador</span>
                        </button>

                        <button
                            onClick={handleJoinGroup}
                            disabled={joinCode.length < 4 || loading}
                            className="w-full bg-[var(--text-primary)] text-[var(--bg-body)] py-5 rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all disabled:opacity-20 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    Verificando...
                                </>
                            ) : 'Unirse ahora'}
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};