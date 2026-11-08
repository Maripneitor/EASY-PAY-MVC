import React, { useState } from 'react';
import { Plus, Search, Users, Filter, LayoutGrid, List as ListIcon, Trash2, X, Pencil } from 'lucide-react';
import { PageHeader } from '@ui/components/PageHeader';
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
    const [groupToDeleteConfirm, setGroupToDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
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

    const handleDelete = (e: React.MouseEvent, groupId: string, groupName: string) => {
        e.stopPropagation();
        e.preventDefault();
        setGroupToDeleteConfirm({ id: groupId, name: groupName });
    };

    const handleEdit = (e: React.MouseEvent, group: any) => {
        e.stopPropagation();
        e.preventDefault();
        setEditingGroup(group);
    };

    const userRoles = (user?.roles || ['Usuario Regular']).map((r: string) => r.toLowerCase());
    const isAdminUser = userRoles.includes('administrador') || userRoles.includes('admin');
    const isEditorUser = userRoles.includes('editor');
    const userPermissions = user?.permissions || [];
    const canWriteGroups = isAdminUser || isEditorUser || userRoles.includes('usuario regular') || userRoles.includes('usuario') || userPermissions.includes('groups:write');

    return (
        <div className="min-h-screen bg-[var(--bg-body)] pb-20 font-display">
            <PageHeader
                title="MIS GRUPOS"
                subtitle="Gestiona tus cuentas compartidas"
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
                                "pb-4 text-xs font-black uppercase tracking-[0.2em] relative transition-colors duration-200",
                                activeTab === tab.id ? "text-[var(--primary)]" : "text-slate-400 hover:text-slate-900 dark:hover:text-white"
                            )}
                        >
                            <span className="flex items-center gap-2">
                                {tab.label}
                                <span className="text-[10px] bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded-md opacity-60">
                                    {tab.count}
                                </span>
                            </span>
                            {activeTab === tab.id && (
                                <motion.div 
                                    layoutId="activeGroupTab" 
                                    className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--primary)] rounded-full" 
                                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                                />
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
                                className="flex items-center gap-2 text-rose-400 hover:text-rose-300 active:text-rose-500 transition-colors duration-200 text-xs font-black uppercase tracking-widest"
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
                            {canWriteGroups ? (
                                <button
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-[var(--primary)] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-[var(--primary)]/20 transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95"
                                >
                                    <Plus size={16} /> Nuevo Grupo
                                </button>
                            ) : (
                                <button
                                    onClick={() => navigate(`${ROUTES.CREATE_GROUP}?tab=join`)}
                                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 border border-slate-300 dark:border-slate-700 bg-transparent hover:bg-slate-50 dark:hover:bg-white/5 active:bg-slate-100 dark:active:bg-white/10 active:border-slate-400 dark:active:border-slate-500 text-slate-700 dark:text-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-colors duration-200"
                                >
                                    <Users size={16} /> Unirse a Grupo
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-4 w-full lg:w-auto justify-end">
                        <button
                            onClick={toggleSelectionMode}
                            className={cn(
                                "flex items-center gap-2 px-6 py-3 border rounded-2xl text-[10px] font-black uppercase tracking-widest transition-colors duration-200",
                                isSelectionMode 
                                    ? "bg-slate-800 text-white border-slate-800 shadow-xl active:bg-slate-900" 
                                    : "bg-transparent hover:bg-slate-50 dark:hover:bg-white/5 active:bg-slate-100 dark:active:bg-white/10 active:border-slate-400 dark:active:border-slate-500 border-[var(--border-color)] text-slate-600 dark:text-slate-300"
                            )}
                        >
                            {isSelectionMode ? <X size={16} /> : <Pencil size={16} />}
                            {isSelectionMode ? "Cerrar" : "Editar"}
                        </button>

                        <div className="flex bg-[var(--bg-body)] p-1 rounded-xl border border-[var(--border-color)]">
                            <button 
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-[var(--primary)] text-white shadow-md' : 'text-slate-400 hover:text-slate-600 transition-opacity duration-200 opacity-70 hover:opacity-100'}`}
                            >
                                <LayoutGrid size={16} />
                            </button>
                            <button 
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-[var(--primary)] text-white shadow-md' : 'text-slate-400 hover:text-slate-600 transition-opacity duration-200 opacity-70 hover:opacity-100'}`}
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
                            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
                            : "grid grid-cols-1 gap-4 max-w-4xl mx-auto"
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
                                        className="w-full min-w-0"
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
                                    className="col-span-full py-24 text-center border-2 border-dashed border-[var(--border-color)] rounded-[3rem] bg-[var(--bg-card)]/40 p-8 space-y-4"
                                >
                                    <div className="w-16 h-16 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center mx-auto mb-2">
                                        <Users size={32} />
                                    </div>
                                    <h3 className="text-lg font-black uppercase tracking-widest text-[var(--text-primary)]">
                                        {activeTab === 'activos' 
                                            ? (searchTerm ? "Sin resultados de búsqueda" : "No tienes grupos activos") 
                                            : "No tienes grupos eliminados"}
                                    </h3>
                                    <p className="text-xs font-bold text-slate-400 max-w-sm mx-auto">
                                        {activeTab === 'activos' 
                                            ? (searchTerm ? "Prueba con otro término de búsqueda." : (canWriteGroups ? "Comienza creando tu primer grupo para dividir gastos y coordinar pagos." : "Únete a un grupo usando el código compartido por tu administrador."))
                                            : "Los grupos eliminados aparecerán aquí para referencia histórica."}
                                    </p>
                                    {activeTab === 'activos' && !searchTerm && (
                                        <div className="pt-2">
                                            {canWriteGroups ? (
                                                <button
                                                    onClick={() => setIsCreateModalOpen(true)}
                                                    className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--primary)] text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-[var(--primary)]/20 hover:scale-105 active:scale-95 transition-all"
                                                >
                                                    <Plus size={16} /> Crear Primer Grupo
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => navigate(`${ROUTES.CREATE_GROUP}?tab=join`)}
                                                    className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--primary)] text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-[var(--primary)]/20 hover:scale-105 active:scale-95 transition-all"
                                                >
                                                    <Users size={16} /> Unirse a un Grupo
                                                </button>
                                            )}
                                        </div>
                                    )}
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

            {/* Modal de Confirmación Limpio de Eliminación */}
            <AnimatePresence>
                {groupToDeleteConfirm && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => !isDeleting && setGroupToDeleteConfirm(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 16 }}
                            transition={{ duration: 0.18, ease: "easeOut" }}
                            className="relative w-full max-w-md bg-[#0f172a] rounded-3xl border border-rose-500/30 p-6 sm:p-8 shadow-2xl text-center space-y-6 overflow-hidden"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center mx-auto shadow-sm">
                                <Trash2 size={26} />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-xl font-black text-white uppercase tracking-tight">
                                    ¿Eliminar este grupo?
                                </h3>
                                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                                    Estás a punto de eliminar <span className="text-white font-bold">"{groupToDeleteConfirm.name}"</span>. Esta acción es irreversible y eliminará todos los gastos y balances asociados.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <button
                                    type="button"
                                    disabled={isDeleting}
                                    onClick={() => setGroupToDeleteConfirm(null)}
                                    className="py-3 px-4 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-150 border border-slate-700 disabled:opacity-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    disabled={isDeleting}
                                    onClick={async () => {
                                        setIsDeleting(true);
                                        try {
                                            const id = groupToDeleteConfirm.id;
                                            setGroupToDeleteConfirm(null);
                                            await deleteGroup(id);
                                        } finally {
                                            setIsDeleting(false);
                                        }
                                    }}
                                    className="py-3 px-4 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-rose-600/30 hover:scale-[1.02] transition-all duration-150 disabled:opacity-50"
                                >
                                    Confirmar
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

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
