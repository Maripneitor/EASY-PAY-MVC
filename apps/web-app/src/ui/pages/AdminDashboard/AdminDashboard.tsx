import React, { useState, useEffect } from 'react';
import { 
    Users, Shield, FileText, CheckCircle2, XCircle, AlertTriangle, 
    Search, Plus, RefreshCw, Key, ShieldCheck, UserCheck, Lock, ChevronRight 
} from 'lucide-react';
import { adminService, type AdminUser, type AdminRole, type AuditLogItem, type SystemMeta } from '@services/adminService';
import { useAuthContext } from '@ui/context/AuthContext';

export const AdminDashboard: React.FC = () => {
    const { user } = useAuthContext();
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

    // New role modal/form
    const [showNewRoleModal, setShowNewRoleModal] = useState<boolean>(false);
    const [newRoleName, setNewRoleName] = useState<string>('');
    const [newRoleDesc, setNewRoleDesc] = useState<string>('');

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
            setMessage({ type: 'error', text: 'Error al conectar con el servidor de administración.' });
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
        if (!selectedRole) return;
        setRolePermissions(prev => 
            prev.includes(permissionKey)
                ? prev.filter(p => p !== permissionKey)
                : [...prev, permissionKey]
        );
    };

    const handleSaveRolePermissions = async () => {
        if (!selectedRole) return;
        setIsSavingPermissions(true);
        try {
            await adminService.updateRole(selectedRole.id, {
                permissions: rolePermissions
            });
            setMessage({ type: 'success', text: `Permisos del rol '${selectedRole.name}' actualizados correctamente.` });
            const updatedRoles = await adminService.getRoles();
            setRoles(updatedRoles);
        } catch (error: any) {
            setMessage({ type: 'error', text: 'No se pudieron actualizar los permisos del rol.' });
        } finally {
            setIsSavingPermissions(false);
        }
    };

    const handleCreateRole = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRoleName.trim()) return;

        try {
            await adminService.createRole({
                name: newRoleName.trim(),
                description: newRoleDesc.trim(),
                permissions: ["groups:read", "expenses:read"]
            });
            setMessage({ type: 'success', text: `Rol '${newRoleName}' creado exitosamente.` });
            setShowNewRoleModal(false);
            setNewRoleName('');
            setNewRoleDesc('');
            const updatedRoles = await adminService.getRoles();
            setRoles(updatedRoles);
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.detail || 'Error al crear el rol.' });
        }
    };

    const handleChangeUserRole = async (userId: string, newRole: string) => {
        try {
            await adminService.assignUserRoles(userId, [newRole]);
            setMessage({ type: 'success', text: 'Rol asignado correctamente.' });
            const updatedUsers = await adminService.getUsers();
            setUsers(updatedUsers);
        } catch (error: any) {
            setMessage({ type: 'error', text: 'Error al cambiar rol del usuario.' });
        }
    };

    // Filtered lists
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
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[var(--bg-surface)] p-6 rounded-2xl border border-[var(--border-color)] shadow-sm">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500 font-bold">
                            <Shield size={22} />
                        </span>
                        <h1 className="text-2xl font-black text-[var(--text-primary)]">
                            Panel de Administración y RBAC
                        </h1>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                        Control de acceso basado en roles, matriz de permisos dinámicos e historial de accesos
                    </p>
                </div>

                <button 
                    onClick={fetchData} 
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--hover-bg)] hover:bg-[var(--border-color)] rounded-xl text-sm font-semibold text-[var(--text-primary)] transition-all"
                >
                    <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                    Actualizar Datos
                </button>
            </div>

            {/* Notification alert */}
            {message && (
                <div className={`p-4 rounded-xl flex items-center justify-between text-sm font-semibold ${
                    message.type === 'success' 
                        ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' 
                        : 'bg-red-500/10 text-red-600 border border-red-500/20'
                }`}>
                    <span>{message.text}</span>
                    <button onClick={() => setMessage(null)} className="text-xs opacity-70 hover:opacity-100">✕</button>
                </div>
            )}

            {/* Metrics overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-500">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-xs uppercase font-black tracking-wider text-[var(--text-secondary)]">Total Usuarios</p>
                        <h3 className="text-2xl font-black text-[var(--text-primary)]">{users.length}</h3>
                    </div>
                </div>

                <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
                        <Key size={24} />
                    </div>
                    <div>
                        <p className="text-xs uppercase font-black tracking-wider text-[var(--text-secondary)]">Roles Definidos</p>
                        <h3 className="text-2xl font-black text-[var(--text-primary)]">{roles.length}</h3>
                    </div>
                </div>

                <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
                        <FileText size={24} />
                    </div>
                    <div>
                        <p className="text-xs uppercase font-black tracking-wider text-[var(--text-secondary)]">Eventos en Auditoría</p>
                        <h3 className="text-2xl font-black text-[var(--text-primary)]">{auditLogs.length}</h3>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-[var(--border-color)] gap-2">
                <button
                    onClick={() => setActiveTab('users')}
                    className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 transition-all ${
                        activeTab === 'users'
                            ? 'border-indigo-500 text-indigo-500'
                            : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                >
                    <UserCheck size={18} />
                    Gestión de Usuarios ({users.length})
                </button>

                <button
                    onClick={() => setActiveTab('roles')}
                    className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 transition-all ${
                        activeTab === 'roles'
                            ? 'border-indigo-500 text-indigo-500'
                            : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                >
                    <ShieldCheck size={18} />
                    Roles y Permisos Dinámicos ({roles.length})
                </button>

                <button
                    onClick={() => setActiveTab('audit')}
                    className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 transition-all ${
                        activeTab === 'audit'
                            ? 'border-indigo-500 text-indigo-500'
                            : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                >
                    <FileText size={18} />
                    Historial de Accesos y Auditoría
                </button>
            </div>

            {/* TAB 1: GESTIÓN DE USUARIOS */}
            {activeTab === 'users' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar por nombre o correo..."
                                value={userSearch}
                                onChange={(e) => setUserSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-[var(--text-primary)]"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-color)] shadow-sm">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-[var(--hover-bg)] text-xs uppercase font-black text-[var(--text-secondary)] border-b border-[var(--border-color)]">
                                <tr>
                                    <th className="py-3 px-4">Usuario</th>
                                    <th className="py-3 px-4">Correo</th>
                                    <th className="py-3 px-4">Rol Asignado</th>
                                    <th className="py-3 px-4">Estado</th>
                                    <th className="py-3 px-4 text-right">Asignar Rol</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-color)]">
                                {filteredUsers.map((u) => {
                                    const currentRole = u.roles?.[0] || 'Usuario Regular';
                                    return (
                                        <tr key={u.id} className="hover:bg-[var(--hover-bg)] transition-colors">
                                            <td className="py-3 px-4 font-bold text-[var(--text-primary)]">
                                                {u.nombre}
                                            </td>
                                            <td className="py-3 px-4 text-[var(--text-secondary)]">
                                                {u.email}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                                                    currentRole === 'Administrador' 
                                                        ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                                                        : currentRole === 'Editor'
                                                        ? 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20'
                                                        : 'bg-slate-500/10 text-slate-600 border border-slate-500/20'
                                                }`}>
                                                    {currentRole}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                {u.is_verified ? (
                                                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-bold">
                                                        <CheckCircle2 size={14} /> Verificado
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-bold">
                                                        <AlertTriangle size={14} /> Pendiente
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <select
                                                    value={currentRole}
                                                    onChange={(e) => handleChangeUserRole(u.id, e.target.value)}
                                                    className="px-3 py-1.5 text-xs font-bold rounded-lg border border-[var(--border-color)] bg-[var(--bg-body)] text-[var(--text-primary)] focus:ring-2 focus:ring-indigo-500"
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

            {/* TAB 2: ROLES Y PERMISOS DINÁMICOS */}
            {activeTab === 'roles' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Lista de Roles */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-black text-lg text-[var(--text-primary)]">Roles del Sistema</h3>
                            <button
                                onClick={() => setShowNewRoleModal(true)}
                                className="flex items-center gap-1 text-xs font-bold px-3 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all"
                            >
                                <Plus size={14} /> Nuevo Rol
                            </button>
                        </div>

                        <div className="space-y-2">
                            {roles.map(r => {
                                const isSelected = selectedRole?.id === r.id;
                                return (
                                    <div
                                        key={r.id}
                                        onClick={() => handleSelectRole(r)}
                                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                                            isSelected
                                                ? 'bg-indigo-500/10 border-indigo-500 shadow-sm'
                                                : 'bg-[var(--bg-surface)] border-[var(--border-color)] hover:border-slate-400'
                                        }`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <h4 className="font-bold text-[var(--text-primary)]">{r.name}</h4>
                                            {r.is_system && (
                                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                                    Sistema
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-[var(--text-secondary)] mt-1">{r.description || 'Sin descripción'}</p>
                                        <p className="text-[11px] font-semibold text-indigo-500 mt-2">
                                            {r.permissions?.length || 0} permisos asignados
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Matriz de Permisos */}
                    <div className="lg:col-span-2 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-6 space-y-6">
                        {selectedRole ? (
                            <>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-xl font-black text-[var(--text-primary)]">
                                            Matriz de Permisos: <span className="text-indigo-500">{selectedRole.name}</span>
                                        </h3>
                                        <p className="text-xs text-[var(--text-secondary)] mt-1">
                                            Marca las casillas para otorgar o revocar permisos específicos por recurso y acción.
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleSaveRolePermissions}
                                        disabled={isSavingPermissions}
                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition-all"
                                    >
                                        {isSavingPermissions ? 'Guardando...' : 'Guardar Permisos'}
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {meta.resources.map(res => (
                                        <div key={res.id} className="p-4 rounded-xl bg-[var(--bg-body)] border border-[var(--border-color)]">
                                            <h4 className="font-bold text-sm text-[var(--text-primary)] mb-3">
                                                {res.name} <span className="text-xs text-slate-400">({res.id})</span>
                                            </h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                {meta.actions.map(act => {
                                                    const permKey = `${res.id}:${act.id}`;
                                                    const isChecked = rolePermissions.includes(permKey);
                                                    return (
                                                        <label
                                                            key={act.id}
                                                            className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)] cursor-pointer hover:text-[var(--text-primary)]"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                onChange={() => handleTogglePermission(permKey)}
                                                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                                                            />
                                                            <span>{act.name}</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <p className="text-center py-12 text-slate-400">Selecciona un rol para ver y configurar sus permisos.</p>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 3: REGISTRO DE AUDITORÍA Y ACCESOS */}
            {activeTab === 'audit' && (
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Filtrar por correo de usuario..."
                                value={auditSearchEmail}
                                onChange={(e) => setAuditSearchEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-[var(--text-primary)]"
                            />
                        </div>

                        <select
                            value={auditFilterAction}
                            onChange={(e) => setAuditFilterAction(e.target.value)}
                            className="px-4 py-2 text-sm font-semibold rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
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
                        <table className="w-full text-left text-sm">
                            <thead className="bg-[var(--hover-bg)] text-xs uppercase font-black text-[var(--text-secondary)] border-b border-[var(--border-color)]">
                                <tr>
                                    <th className="py-3 px-4">Fecha y Hora</th>
                                    <th className="py-3 px-4">Usuario</th>
                                    <th className="py-3 px-4">Acción</th>
                                    <th className="py-3 px-4">Área / Recurso</th>
                                    <th className="py-3 px-4">Dirección IP</th>
                                    <th className="py-3 px-4">Detalles</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-color)] font-mono text-xs">
                                {filteredAudit.map((log) => {
                                    const isSuccess = log.action.includes('SUCCESS') || log.action.includes('ASSIGNED') || log.action.includes('REGISTER');
                                    const isFail = log.action.includes('FAILED');
                                    return (
                                        <tr key={log.id} className="hover:bg-[var(--hover-bg)] transition-colors">
                                            <td className="py-3 px-4 text-slate-400">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </td>
                                            <td className="py-3 px-4 font-bold text-[var(--text-primary)]">
                                                {log.user_email || 'Anónimo'}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2 py-0.5 rounded font-black ${
                                                    isSuccess
                                                        ? 'bg-emerald-500/10 text-emerald-600'
                                                        : isFail
                                                        ? 'bg-red-500/10 text-red-600'
                                                        : 'bg-indigo-500/10 text-indigo-600'
                                                }`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-slate-400">
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

            {/* Modal para Crear Rol */}
            {showNewRoleModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl animate-scale-in">
                        <h3 className="text-lg font-black text-[var(--text-primary)]">Crear Nuevo Rol</h3>
                        <form onSubmit={handleCreateRole} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-[var(--text-secondary)]">Nombre del Rol</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej. Auditor de Finanzas"
                                    value={newRoleName}
                                    onChange={(e) => setNewRoleName(e.target.value)}
                                    className="w-full mt-1 p-2 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-primary)]"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-[var(--text-secondary)]">Descripción</label>
                                <textarea
                                    placeholder="Descripción de responsabilidades..."
                                    value={newRoleDesc}
                                    onChange={(e) => setNewRoleDesc(e.target.value)}
                                    className="w-full mt-1 p-2 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-primary)]"
                                    rows={3}
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowNewRoleModal(false)}
                                    className="px-4 py-2 text-sm font-semibold rounded-xl text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
                                >
                                    Crear Rol
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
