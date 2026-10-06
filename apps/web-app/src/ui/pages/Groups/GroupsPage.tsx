import React, { useState } from 'react';
import { Plus, Search, Users, Filter, LayoutGrid, List as ListIcon, Trash2, X } from 'lucide-react';
import { PageHeader } from '@ui/components/PageHeader';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@infrastructure/utils';
import { useGroups } from './useGroups';
import { ROUTES } from '@infrastructure/routes';
import { GroupCard } from '../Dashboard/components/GroupCard';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { CreateGroupModal } from './components/CreateGroupModal';
import { EditGroupModal } from './components/EditGroupModal';
import { Loader } from '../../components/Loader/Loader';
import { useAuthContext } from '../../context/AuthContext';

import { TwoFactorModal } from '../../components/Security/TwoFactorModal';

export const GroupsPage: React.FC = () => {
    useDocumentTitle('Mis Grupos');
    const { toggleSidebar } = useOutletContext<{ toggleSidebar: () => void }>();
    const { user } = useAuthContext();
    const { 
        groups, 
        isLoading, 
        deleteGroup, 
        confirmDeleteGroup,
        is2FAModalOpen,
        setIs2FAModalOpen,
        userId,
        navigate,
        deletedGroups,
        isSelectionMode,
        toggleSelectionMode,
        selectedIds,
        toggleIdSelection,
        deleteSelectedGroups
    } = useGroups();

    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<any>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [activeTab, setActiveTab] = useState<'activos' | 'borrados'>('activos');

    const filteredGroups = groups.filter(g => 
        g.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredDeleted = deletedGroups.filter(g => 
        g.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getAppearance = (name: string) => {
        const hash = name.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
        const colors = [
            { bg: 'bg-blue-500/10', text: 'text-blue-600' },
            { bg: 'bg-emerald-500/10', text: 'text-emerald-600' },
            { bg: 'bg-violet-500/10', text: 'text-violet-600' },
            { bg: 'bg-amber-500/10', text: 'text-amber-600' },
            { bg: 'bg-rose-500/10', text: 'text-rose-600' },
            { bg: 'bg-cyan-500/10', text: 'text-cyan-600' },
        ];
        const style = colors[hash % colors.length];
        return {
            icon: <span className="text-xl font-black">{name.charAt(0).toUpperCase()}</span>,
            bg: style.bg,
            color: style.text
        };
    };

    const handleDelete = async (e: React.MouseEvent, groupId: string, groupName: string) => {
        e.stopPropagation();
        e.preventDefault();
        await deleteGroup(groupId);
    };

    const handleEdit = (e: React.MouseEvent, group: any) => {
        e.stopPropagation();
        e.preventDefault();
        setEditingGroup(group);
    };

    return (
        <div className="min-h-screen bg-[var(--bg-body)] pb-20 font-display">
            <PageHeader
                title="MIS GRUPOS"
                subtitle="Gestiona tus cuentas compartidas"
                onMenuClick={toggleSidebar}
            />




            <main className="max-w-[1600px] mx-auto px-4 py-8 md:px-8 space-y-8">
                {/* Tabs */}
                <div className="flex gap-8 border-b border-[var(--border-color)] pb-1 px-4">
                    {[
                        { id: 'activos', label: 'Mis Grupos', count: groups.length },
                        { id: 'borrados', label: 'Borrados', count: deletedGroups.length }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id as any);
                                if (isSelectionMode) toggleSelectionMode();
                            }}
                            className={cn(
                                "pb-4 text-xs font-black uppercase tracking-[0.2em] relative transition-colors",
                                activeTab === tab.id ? "text-[var(--primary)]" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            <span className="flex items-center gap-2">
                                {tab.label}
                                <span className="text-[10px] bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded-md opacity-60">
                                    {tab.count}
                                </span>
                            </span>
                            {activeTab === tab.id && (
                                <motion.div layoutId="activeGroupTab" className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--primary)] rounded-full" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Batch Actions Bar */}
                <AnimatePresence>
                    {isSelectionMode && selectedIds.length > 0 && (
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 20, opacity: 0 }}
                            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-8 border border-white/10"
                        >
                            <p className="text-sm font-bold whitespace-nowrap">
                                <span className="text-[var(--primary)] font-black">{selectedIds.length}</span> seleccionados
                            </p>
                            <div className="h-4 w-px bg-white/20" />
                            <button
                                onClick={deleteSelectedGroups}
                                className="flex items-center gap-2 text-rose-400 hover:text-rose-300 transition-colors text-xs font-black uppercase tracking-widest"
                            >
                                <Trash2 size={16} /> Eliminar
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Search and Filters */}
                <div className="flex flex-col lg:flex-row gap-6 justify-between items-center bg-[var(--bg-card)] border border-[var(--border-color)] p-6 rounded-[2.5rem] shadow-sm">
                    <div className="flex flex-col md:flex-row items-center gap-4 w-full lg:w-auto">
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar en la lista..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-2xl focus:outline-none focus:border-[var(--primary)] transition-all font-bold text-sm"
                            />
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-[var(--primary)] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-[var(--primary)]/20 hover:scale-105 active:scale-95 transition-all"
                            >
                                <Plus size={16} /> Nuevo
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 w-full lg:w-auto justify-end">
                        <button
                            onClick={toggleSelectionMode}
                            className={cn(
                                "flex items-center gap-2 px-6 py-3 border rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                                isSelectionMode 
                                    ? "bg-slate-800 text-white border-slate-800 shadow-xl" 
                                    : "bg-white border-[var(--border-color)] text-slate-600 hover:border-slate-400"
                            )}
                        >
                            {isSelectionMode ? <X size={16} /> : <Trash2 size={16} />}
                            {isSelectionMode ? "Cerrar" : "Editar"}
                        </button>

                        <div className="flex bg-[var(--bg-body)] p-1 rounded-xl border border-[var(--border-color)]">
                            <button 
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-[var(--primary)] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <LayoutGrid size={16} />
                            </button>
                            <button 
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-[var(--primary)] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <ListIcon size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    <Loader />
                ) : (
                    <motion.div 
                        layout
                        className={viewMode === 'grid' 
                            ? "grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
                            : "space-y-6"
                        }
                    >
                        <AnimatePresence mode="popLayout">
                            {(activeTab === 'activos' ? filteredGroups : filteredDeleted).map((group, index) => {
                                const appearance = getAppearance(group.nombre || "G");
                                const mappedGroup = {
                                    id: group.id,
                                    name: group.nombre || "Sin nombre",
                                    lastAct: group.deletedAt ? `Eliminado el ${new Date(group.deletedAt).toLocaleDateString()}` : (group.descripcion || "Activo ahora"),
                                    members: group.integrantes || [],
                                    total: group.total_gastado || 0,
                                    userBalance: group.mi_balance || 0,
                                    isAdmin: group.admin_id === user?.id
                                };

                                return (
                                    <motion.div
                                        key={`${group.id || index}-${activeTab}`}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        layout
                                    >
                                        <GroupCard
                                            group={mappedGroup}
                                            onClick={() => activeTab === 'activos' && navigate(ROUTES.GROUP_DETAIL(group.id))}
                                            onDelete={activeTab === 'activos' && mappedGroup.isAdmin ? (e) => handleDelete(e, group.id, mappedGroup.name) : undefined}
                                            onEdit={activeTab === 'activos' && mappedGroup.isAdmin ? (e) => handleEdit(e, group) : undefined}
                                            appearance={appearance}
                                            isSelectionMode={activeTab === 'activos' && isSelectionMode}
                                            isSelected={selectedIds.includes(group.id)}
                                            onToggleSelection={toggleIdSelection}
                                            className={activeTab === 'borrados' ? "opacity-75 grayscale-[0.5] grayscale hover:grayscale-0 hover:opacity-100 transition-all pointer-events-none" : ""}
                                        />
                                    </motion.div>
                                );
                            })}
                            {((activeTab === 'activos' ? filteredGroups : filteredDeleted).length === 0) && (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="col-span-full py-32 text-center border-4 border-dashed border-[var(--border-color)] rounded-[4rem] opacity-30"
                                >
                                    <Users size={64} className="mx-auto mb-6" />
                                    <h3 className="text-xl font-black uppercase tracking-widest">No hay nada aquí</h3>
                                    <p className="mt-2 text-sm font-bold opacity-60">
                                        {activeTab === 'activos' 
                                            ? "No se encontraron grupos activos." 
                                            : "No tienes grupos eliminados recientemente."}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </main>

            <CreateGroupModal 
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />

            <EditGroupModal 
                isOpen={!!editingGroup}
                onClose={() => setEditingGroup(null)}
                group={editingGroup}
            />

            <TwoFactorModal
                isOpen={is2FAModalOpen}
                onClose={() => setIs2FAModalOpen(false)}
                onVerified={confirmDeleteGroup}
                userId={userId || ''}
                actionTitle="Eliminar Grupo"
                actionDescription="Esta acción es irreversible y eliminará todos los gastos y saldos asociados. Por favor verifica tu identidad."
            />
        </div>
    );
};
