import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Users, Shield, FileText, CheckCircle2, AlertTriangle, 
    Search, Plus, RefreshCw, Key, ShieldCheck, UserCheck, Lock, 
    ChevronRight, X, Save, Check, Filter, ShieldAlert
} from 'lucide-react';
import { adminService, type AdminUser, type AdminRole, type AuditLogItem, type SystemMeta } from '@services/adminService';
import { useAuthContext } from '@ui/context/AuthContext';
import { toast } from 'sonner';

export const AdminDashboard: React.FC = () => {
    const { user, refreshUserPermissions } = useAuthContext();
    const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'audit'>('users');
    
    // States
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [roles, setRoles] = useState<AdminRole[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
    const [meta, setMeta] = useState<SystemMeta>({ resources: [], actions: [] });
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Filter states
    const [userSearch, setUserSearch] = useState<string>('');
    const [auditFilterAction, setAuditFilterAction] = useState<string>('');
    const [auditSearchEmail, setAuditSearchEmail] = useState<string>('');

    // Selected role for editing permissions
    const [selectedRole, setSelectedRole] = useState<AdminRole | null>(null);
    const [rolePermissions, setRolePermissions] = useState<string[]>([]);
    const [isSavingPermissions, setIsSavingPermissions] = useState<boolean>(false);

    // New role modal
    const [showNewRoleModal, setShowNewRoleModal] = useState<boolean>(false);
    const [newRoleName, setNewRoleName] = useState<string>('');
    const [newRoleDesc, setNewRoleDesc] = useState<string>('');
    const [isCreatingRole, setIsCreatingRole] = useState<boolean>(false);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [usersData, rolesData, logsData, metaData] = await Promise.all([
                adminService.getUsers(),
                adminService.getRoles(),
                adminService.getAuditLogs({ limit: 100 }),
                adminService.getMetadata()
            ]);
            setUsers(usersData);
            setRoles(rolesData);
            setAuditLogs(logsData);
            setMeta(metaData);

            if (rolesData.length > 0 && !selectedRole) {
                setSelectedRole(rolesData[0]);
                setRolePermissions(rolesData[0].permissions || []);
            }
        } catch (error: any) {
            console.error('Error loading admin data:', error);
            const errDetail = error.response?.data?.detail || 'Error al conectar con el servidor de administración.';
            setMessage({ type: 'error', text: errDetail });
            toast.error(errDetail);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSelectRole = (role: AdminRole) => {
        setSelectedRole(role);
        setRolePermissions(role.permissions || []);
    };

    const handleTogglePermission = (permissionKey: string) => {
        if (!selectedRole || selectedRole.name === 'Administrador') return;
        setRolePermissions(prev => 
            prev.includes(permissionKey)
                ? prev.filter(p => p !== permissionKey)
                : [...prev, permissionKey]
        );
    };

    const handleToggleAllResourceActions = (resourceId: string, shouldEnable: boolean) => {
        if (!selectedRole || selectedRole.name === 'Administrador') return;
        const resourcePerms = meta.actions.map(act => `${resourceId}:${act.id}`);
        
        setRolePermissions(prev => {
            const otherPerms = prev.filter(p => !p.startsWith(`${resourceId}:`));
            return shouldEnable ? [...otherPerms, ...resourcePerms] : otherPerms;
        });
    };

    const handleSaveRolePermissions = async () => {
        if (!selectedRole) return;
        setIsSavingPermissions(true);
        try {
            await adminService.updateRole(selectedRole.id, {
                permissions: rolePermissions
            });
            const successMsg = `Permisos del rol '${selectedRole.name}' actualizados correctamente.`;
            setMessage({ type: 'success', text: successMsg });
            toast.success(successMsg);
            
            const updatedRoles = await adminService.getRoles();
            setRoles(updatedRoles);
            
            // Si el usuario actual tiene este rol asignado, refrescar sus capacidades
            if (user?.roles?.includes(selectedRole.name)) {
                await refreshUserPermissions();
            }
        } catch (error: any) {
            const errDetail = error.response?.data?.detail || 'No se pudieron actualizar los permisos del rol.';
            setMessage({ type: 'error', text: errDetail });
            toast.error(errDetail);
        } finally {
            setIsSavingPermissions(false);
        }
    };

    const handleCreateRole = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRoleName.trim()) return;

        setIsCreatingRole(true);
        try {
            await adminService.createRole({
                name: newRoleName.trim(),
                description: newRoleDesc.trim(),
                permissions: ["groups:read", "expenses:read"]
            });
            const successMsg = `Rol '${newRoleName}' creado exitosamente.`;
            setMessage({ type: 'success', text: successMsg });
            toast.success(successMsg);
            setShowNewRoleModal(false);
            setNewRoleName('');
            setNewRoleDesc('');
            const updatedRoles = await adminService.getRoles();
            setRoles(updatedRoles);
        } catch (error: any) {
            const errDetail = error.response?.data?.detail || 'Error al crear el nuevo rol.';
            setMessage({ type: 'error', text: errDetail });
            toast.error(errDetail);
        } finally {
            setIsCreatingRole(false);
        }
    };

    const handleChangeUserRole = async (userId: string, newRole: string) => {
        try {
            await adminService.assignUserRoles(userId, [newRole]);
            const successMsg = 'Rol asignado correctamente.';
            setMessage({ type: 'success', text: successMsg });
            toast.success(successMsg);

            // Refrescar sesión actual si se modificó el propio usuario
            if (user?.id === userId) {
                await refreshUserPermissions();
            }

            const updatedUsers = await adminService.getUsers();
            setUsers(updatedUsers);
        } catch (error: any) {
            const errDetail = error.response?.data?.detail || 'Error al actualizar el rol del usuario.';
            setMessage({ type: 'error', text: errDetail });
            toast.error(errDetail);
        }
    };

    const filteredUsers = users.filter(u => 
        u.nombre?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email?.toLowerCase().includes(userSearch.toLowerCase())
    );

    const filteredAudit = auditLogs.filter(log => {
        const matchesEmail = !auditSearchEmail || log.user_email?.toLowerCase().includes(auditSearchEmail.toLowerCase());
        const matchesAction = !auditFilterAction || log.action === auditFilterAction;
        return matchesEmail && matchesAction;
    });

    return (
        <div className="space-y-6">
            {/* Header del Panel con Jerarquía Visual Operativa */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[var(--bg-surface)] p-6 rounded-2xl border border-[var(--border-color)] shadow-sm">
                <div>
                    <div className="flex items-center gap-2.5">
                        <span className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                            <Shield size={22} />
                        </span>
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                                Control de Acceso y RBAC
                            </h1>
                            <p className="text-xs md:text-sm text-[var(--text-secondary)] mt-0.5">
                                Administración granular de roles, matriz de permisos y trazabilidad de eventos
                            </p>
                        </div>
                    </div>
                </div>

                <motion.button 
                    onClick={fetchData} 
                    disabled={isLoading}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[var(--hover-bg)] hover:bg-[var(--border-color)] rounded-xl text-xs md:text-sm font-semibold text-[var(--text-primary)] transition-colors border border-[var(--border-color)]"
                >
                    <RefreshCw size={15} className={isLoading ? "animate-spin text-indigo-500" : ""} />
                    <span>Actualizar datos</span>
                </motion.button>
            </header>

            {/* Mensajes de feedback reactivo */}
            <AnimatePresence>
                {message && (
                    <motion.div 
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.16 }}
                        className={`p-3.5 rounded-xl flex items-center justify-between text-xs md:text-sm font-semibold border ${
                            message.type === 'success' 
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                        }`}
                    >
                        <span>{message.text}</span>
                        <button 
                            type="button" 
                            onClick={() => setMessage(null)} 
                            className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        >
                            <X size={14} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Métricas Principales del Sistema */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                        <Users size={22} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-[var(--text-secondary)]">Usuarios registrados</p>
                        <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">{users.length}</h2>
                    </div>
                </div>

                <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        <Key size={22} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-[var(--text-secondary)]">Roles configurados</p>
                        <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">{roles.length}</h2>
                    </div>
                </div>

                <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <FileText size={22} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-[var(--text-secondary)]">Eventos en auditoría</p>
                        <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">{auditLogs.length}</h2>
                    </div>
                </div>
            </section>

            {/* Navegación por Pestañas con Spring LayoutId */}
            <div className="flex border-b border-[var(--border-color)] gap-1 relative">
                <button
                    type="button"
                    onClick={() => setActiveTab('users')}
                    className={`relative flex items-center gap-2 px-5 py-3 font-semibold text-xs md:text-sm transition-colors ${
                        activeTab === 'users'
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                >
                    <UserCheck size={16} />
                    <span>Gestión de usuarios ({users.length})</span>
                    {activeTab === 'users' && (
                        <motion.div 
                            layoutId="adminNavPill" 
                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400" 
                            transition={{ type: "spring", stiffness: 450, damping: 35 }}
                        />
                    )}
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('roles')}
                    className={`relative flex items-center gap-2 px-5 py-3 font-semibold text-xs md:text-sm transition-colors ${
                        activeTab === 'roles'
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                >
                    <ShieldCheck size={16} />
                    <span>Roles y permisos ({roles.length})</span>
                    {activeTab === 'roles' && (
                        <motion.div 
                            layoutId="adminNavPill" 
                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400" 
                            transition={{ type: "spring", stiffness: 450, damping: 35 }}
                        />
                    )}
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('audit')}
                    className={`relative flex items-center gap-2 px-5 py-3 font-semibold text-xs md:text-sm transition-colors ${
                        activeTab === 'audit'
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                >
                    <FileText size={16} />
                    <span>Registro de auditoría</span>
                    {activeTab === 'audit' && (
                        <motion.div 
                            layoutId="adminNavPill" 
                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400" 
                            transition={{ type: "spring", stiffness: 450, damping: 35 }}
                        />
                    )}
                </button>
            </div>

            {/* PESTAÑA 1: GESTIÓN DE USUARIOS */}
            {activeTab === 'users' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Filtrar por nombre o correo electrónico..."
                                value={userSearch}
                                onChange={(e) => setUserSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-[var(--text-primary)]"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-color)] shadow-sm">
                        <table className="w-full text-left text-xs md:text-sm">
                            <thead className="bg-[var(--hover-bg)] text-[11px] font-bold text-[var(--text-secondary)] border-b border-[var(--border-color)]">
                                <tr>
                                    <th className="py-3 px-4">Usuario</th>
                                    <th className="py-3 px-4">Correo</th>
                                    <th className="py-3 px-4">Rol activo</th>
                                    <th className="py-3 px-4">Verificación</th>
                                    <th className="py-3 px-4 text-right">Asignar rol</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-color)]">
                                {filteredUsers.map((u) => {
                                    const currentRole = u.roles?.[0] || 'Usuario Regular';
                                    const isSelf = user?.id === u.id;

                                    return (
                                        <tr key={u.id} className="hover:bg-[var(--hover-bg)] transition-colors">
                                            <td className="py-3 px-4 font-semibold text-[var(--text-primary)]">
                                                <div className="flex items-center gap-2">
                                                    <span>{u.nombre}</span>
                                                    {isSelf && (
                                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                                            Tú
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-[var(--text-secondary)]">
                                                {u.email}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${
                                                    currentRole === 'Administrador' 
                                                        ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                                                        : currentRole === 'Editor'
                                                        ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20'
                                                        : 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20'
                                                }`}>
                                                    {currentRole}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                {u.is_verified ? (
                                                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                                                        <CheckCircle2 size={13} /> Verificado
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 font-semibold">
                                                        <AlertTriangle size={13} /> Pendiente
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <select
                                                    value={currentRole}
                                                    onChange={(e) => handleChangeUserRole(u.id, e.target.value)}
                                                    className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-[var(--border-color)] bg-[var(--bg-body)] text-[var(--text-primary)] focus:ring-2 focus:ring-indigo-500"
                                                >
                                                    {roles.map(r => (
                                                        <option key={r.id} value={r.name}>{r.name}</option>
                                                    ))}
                                                </select>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* PESTAÑA 2: ROLES Y MATRIZ DE PERMISOS */}
            {activeTab === 'roles' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    {/* Lista de Roles a la Izquierda */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-base text-[var(--text-primary)]">Roles del sistema</h3>
                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                onClick={() => setShowNewRoleModal(true)}
                                className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                <Plus size={13} /> Nuevo rol
                            </motion.button>
                        </div>

                        <div className="space-y-2">
                            {roles.map(r => {
                                const isSelected = selectedRole?.id === r.id;
                                return (
                                    <div
                                        key={r.id}
                                        onClick={() => handleSelectRole(r)}
                                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                                            isSelected
                                                ? 'bg-indigo-500/10 border-indigo-500 shadow-sm'
                                                : 'bg-[var(--bg-surface)] border-[var(--border-color)] hover:border-slate-400 dark:hover:border-slate-600'
                                        }`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <h4 className="font-semibold text-sm text-[var(--text-primary)]">{r.name}</h4>
                                            {r.is_system && (
                                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                                    Sistema
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-[var(--text-secondary)] mt-1">{r.description || 'Sin descripción'}</p>
                                        <p className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mt-2">
                                            {r.permissions?.length || 0} permisos asignados
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Matriz de Permisos a la Derecha */}
                    <div className="lg:col-span-2 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-6 space-y-6">
                        {selectedRole ? (
                            <>
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-bold text-[var(--text-primary)]">
                                                Matriz de permisos: <span className="text-indigo-600 dark:text-indigo-400">{selectedRole.name}</span>
                                            </h3>
                                            {selectedRole.name === 'Administrador' && (
                                                <span className="p-1 rounded bg-amber-500/10 text-amber-600" title="Acceso total global">
                                                    <Lock size={14} />
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                                            Control dinámico evaluado por el backend en tiempo real
                                        </p>
                                    </div>

                                    {selectedRole.name !== 'Administrador' ? (
                                        <motion.button
                                            whileTap={{ scale: 0.98 }}
                                            onClick={handleSaveRolePermissions}
                                            disabled={isSavingPermissions}
                                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-semibold text-xs transition-colors shadow-sm"
                                        >
                                            {isSavingPermissions ? (
                                                <RefreshCw size={14} className="animate-spin" />
                                            ) : (
                                                <Save size={14} />
                                            )}
                                            <span>Guardar cambios</span>
                                        </motion.button>
                                    ) : (
                                        <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
                                            Permisos inmutables
                                        </div>
                                    )}
                                </div>

                                {/* Cuadrícula de Recursos del Sistema */}
                                <div className="space-y-3">
                                    {meta.resources.map(res => {
                                        const resourcePerms = meta.actions.map(act => `${res.id}:${act.id}`);
                                        const activeCount = resourcePerms.filter(p => rolePermissions.includes(p)).length;
                                        const allChecked = activeCount === meta.actions.length;

                                        return (
                                            <div key={res.id} className="p-4 rounded-xl bg-[var(--bg-body)] border border-[var(--border-color)]">
                                                <div className="flex justify-between items-center mb-3">
                                                    <div>
                                                        <span className="font-semibold text-sm text-[var(--text-primary)]">{res.name}</span>
                                                        <span className="text-[11px] text-slate-400 ml-1.5">({res.id})</span>
                                                    </div>

                                                    {selectedRole.name !== 'Administrador' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleAllResourceActions(res.id, !allChecked)}
                                                            className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                                                        >
                                                            {allChecked ? 'Desmarcar todos' : 'Marcar todos'}
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                                    {meta.actions.map(act => {
                                                        const permKey = `${res.id}:${act.id}`;
                                                        const isChecked = selectedRole.name === 'Administrador' || rolePermissions.includes(permKey);

                                                        return (
                                                            <button
                                                                key={act.id}
                                                                type="button"
                                                                disabled={selectedRole.name === 'Administrador'}
                                                                onClick={() => handleTogglePermission(permKey)}
                                                                className={`flex items-center gap-2 p-2 rounded-lg text-xs font-medium border transition-colors text-left ${
                                                                    isChecked
                                                                        ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-700 dark:text-indigo-300'
                                                                        : 'bg-[var(--bg-surface)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-slate-400'
                                                                }`}
                                                            >
                                                                <span className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[9px] border ${
                                                                    isChecked
                                                                        ? 'bg-indigo-600 border-indigo-600 text-white'
                                                                        : 'border-slate-300 dark:border-slate-600'
                                                                }`}>
                                                                    {isChecked ? <Check size={10} /> : null}
                                                                </span>
                                                                <span>{act.name}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-16 text-slate-400">
                                Selecciona un rol para visualizar y editar su matriz de permisos.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* PESTAÑA 3: AUDITORÍA Y TRAZABILIDAD */}
            {activeTab === 'audit' && (
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Filtrar por correo de usuario..."
                                value={auditSearchEmail}
                                onChange={(e) => setAuditSearchEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-[var(--text-primary)]"
                            />
                        </div>

                        <select
                            value={auditFilterAction}
                            onChange={(e) => setAuditFilterAction(e.target.value)}
                            className="px-3 py-2 text-xs md:text-sm font-semibold rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
                        >
                            <option value="">Todas las acciones</option>
                            <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
                            <option value="LOGIN_FAILED">LOGIN_FAILED</option>
                            <option value="USER_REGISTER">USER_REGISTER</option>
                            <option value="ROLE_ASSIGNED">ROLE_ASSIGNED</option>
                            <option value="ROLE_CREATED">ROLE_CREATED</option>
                            <option value="ROLE_UPDATED">ROLE_UPDATED</option>
                            <option value="PASSWORD_CHANGED">PASSWORD_CHANGED</option>
                        </select>
                    </div>

                    <div className="overflow-x-auto bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-color)] shadow-sm">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-[var(--hover-bg)] text-[11px] font-bold text-[var(--text-secondary)] border-b border-[var(--border-color)]">
                                <tr>
                                    <th className="py-3 px-4">Fecha y hora</th>
                                    <th className="py-3 px-4">Usuario</th>
                                    <th className="py-3 px-4">Acción</th>
                                    <th className="py-3 px-4">Recurso</th>
                                    <th className="py-3 px-4">Dirección IP</th>
                                    <th className="py-3 px-4">Detalles</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-color)] font-mono">
                                {filteredAudit.map((log) => {
                                    const isSuccess = log.action.includes('SUCCESS') || log.action.includes('ASSIGNED') || log.action.includes('REGISTER');
                                    const isFail = log.action.includes('FAILED') || log.action.includes('BLOCKED');

                                    return (
                                        <tr key={log.id} className="hover:bg-[var(--hover-bg)] transition-colors">
                                            <td className="py-3 px-4 text-slate-400">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </td>
                                            <td className="py-3 px-4 font-sans font-semibold text-[var(--text-primary)]">
                                                {log.user_email || 'Anónimo'}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                    isSuccess
                                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                        : isFail
                                                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                                        : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                                                }`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-slate-400 font-sans">
                                                {log.resource}
                                            </td>
                                            <td className="py-3 px-4 text-slate-400">
                                                {log.ip_address}
                                            </td>
                                            <td className="py-3 px-4 text-slate-500 truncate max-w-xs" title={JSON.stringify(log.details)}>
                                                {log.details ? JSON.stringify(log.details) : '-'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal para Crear Rol con Animación Spring Escala 0.96 -> 1 */}
            <AnimatePresence>
                {showNewRoleModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
                            className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl"
                        >
                            <div className="flex justify-between items-center">
                                <h3 className="text-base font-bold text-[var(--text-primary)]">Crear nuevo rol</h3>
                                <button 
                                    type="button" 
                                    onClick={() => setShowNewRoleModal(false)}
                                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <form onSubmit={handleCreateRole} className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-[var(--text-secondary)]">Nombre del rol</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ej. Auditor de Finanzas"
                                        value={newRoleName}
                                        onChange={(e) => setNewRoleName(e.target.value)}
                                        className="w-full mt-1.5 px-3 py-2 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-xs md:text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-[var(--text-secondary)]">Descripción</label>
                                    <textarea
                                        placeholder="Describe las responsabilidades del rol..."
                                        value={newRoleDesc}
                                        onChange={(e) => setNewRoleDesc(e.target.value)}
                                        className="w-full mt-1.5 px-3 py-2 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-xs md:text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        rows={3}
                                    />
                                </div>
                                <div className="flex justify-end gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowNewRoleModal(false)}
                                        className="px-4 py-2 text-xs font-semibold rounded-xl text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]"
                                    >
                                        Cancelar
                                    </button>
                                    <motion.button
                                        whileTap={{ scale: 0.98 }}
                                        type="submit"
                                        disabled={isCreatingRole || !newRoleName.trim()}
                                        className="px-4 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        {isCreatingRole ? 'Creando...' : 'Crear rol'}
                                    </motion.button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
