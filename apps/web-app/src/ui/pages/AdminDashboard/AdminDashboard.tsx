import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Users, Shield, FileText, CheckCircle2, AlertTriangle, 
    Search, Plus, RefreshCw, Key, ShieldCheck, UserCheck, Lock, 
    ChevronRight, ChevronLeft, X, Save, Check, Filter, ShieldAlert, Info,
    Eye, Sparkles, SlidersHorizontal, ArrowUpDown, Copy, Code, List
} from 'lucide-react';
import { adminService, type AdminUser, type AdminRole, type AuditLogItem, type SystemMeta } from '@services/adminService';
import { useAuthContext } from '@ui/context/AuthContext';
import { toast } from 'sonner';
import { RoleBadge } from '@ui/components/RoleBadge';
import { Avatar } from '@ui/components/Avatar';
import { Button } from '@ui/components/Button';

const KNOWN_AUDIT_ACTIONS = [
    'AUTH_LOGIN',
    'USER_REGISTER',
    'AUTH_LOGOUT',
    'PASSWORD_CHANGE',
    'PASSWORD_RESET_REQUEST',
    'PASSWORD_RESET_CONFIRM',
    'EMAIL_VERIFICATION',
    '2FA_VERIFY',
    'ROLE_CHANGE',
    'USER_DELETED',
    'USER_CREATED',
    'ROLE_CREATED',
    'ROLE_UPDATED',
    'ROLE_DELETED',
    'GROUP_CREATED',
    'GROUP_DELETED',
    'EXPENSE_CREATED',
    'EXPENSE_DELETED',
    'UNAUTHORIZED_ACCESS_ATTEMPT',
    'FORBIDDEN_ACCESS_ATTEMPT'
];

const KNOWN_AUDIT_RESOURCES = ['auth', 'users', 'roles', 'groups', 'expenses', 'wallets', 'system'];

interface RoleToggleSwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
}

const RoleToggleSwitch: React.FC<RoleToggleSwitchProps> = ({ checked, onChange, disabled }) => {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={(e) => {
                e.stopPropagation();
                if (!disabled) onChange(!checked);
            }}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${
                checked ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
            } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
            <motion.span
                layout
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md transform ring-0 ${
                    checked ? 'translate-x-5' : 'translate-x-0'
                }`}
            />
        </button>
    );
};

interface AuditMetadataViewerProps {
    metadata: Record<string, any>;
}

const AuditMetadataViewer: React.FC<AuditMetadataViewerProps> = ({ metadata }) => {
    const [viewMode, setViewMode] = useState<'structured' | 'raw'>('structured');
    const [copied, setCopied] = useState<boolean>(false);

    const safeMeta = metadata || {};
    const jsonString = JSON.stringify(safeMeta, null, 2);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(jsonString);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error('No se pudo copiar al portapapeles');
        }
    };

    const highlightJson = (code: string) => {
        const escaped = code
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        return escaped.replace(
            /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
            (match) => {
                let cls = 'text-amber-400 font-semibold';
                if (/^"/.test(match)) {
                    if (/:$/.test(match)) {
                        cls = 'text-indigo-400 font-bold';
                    } else {
                        cls = 'text-emerald-400';
                    }
                } else if (/true|false/.test(match)) {
                    cls = 'text-cyan-400 font-bold';
                } else if (/null/.test(match)) {
                    cls = 'text-slate-500 italic';
                }
                return `<span class="${cls}">${match}</span>`;
            }
        );
    };

    const entries = Object.entries(safeMeta);
    const isEmpty = entries.length === 0;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="inline-flex items-center gap-1 p-1 bg-[var(--bg-body)] rounded-xl border border-[var(--border-color)] text-[11px] font-bold">
                    <button
                        type="button"
                        onClick={() => setViewMode('structured')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                            viewMode === 'structured'
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                    >
                        <List size={13} />
                        <span>Vista Estructurada</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode('raw')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                            viewMode === 'raw'
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                    >
                        <Code size={13} />
                        <span>JSON Formateado</span>
                    </button>
                </div>

                <motion.button
                    whileTap={{ scale: 0.94 }}
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-body)] hover:bg-[var(--hover-bg)] text-[11px] font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all shadow-sm"
                >
                    {copied ? (
                        <>
                            <Check size={13} className="text-emerald-400" />
                            <span className="text-emerald-400">¡Copiado!</span>
                        </>
                    ) : (
                        <>
                            <Copy size={13} />
                            <span>Copiar Payload</span>
                        </>
                    )}
                </motion.button>
            </div>

            {viewMode === 'structured' ? (
                isEmpty ? (
                    <div className="p-4 rounded-xl bg-[var(--bg-body)] border border-[var(--border-color)] text-center text-slate-400 text-xs italic">
                        No hay metadatos adicionales registrados en este evento.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {entries.map(([key, val]) => {
                            const isStatus = key.toLowerCase().includes('status');
                            const isMethod = key.toLowerCase() === 'method';
                            const isPath = key.toLowerCase() === 'path';

                            let displayVal: React.ReactNode = String(val);
                            if (isStatus) {
                                const num = Number(val);
                                const is2xx = num >= 200 && num < 300;
                                const is4xx = num >= 400 && num < 500;
                                displayVal = (
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-bold text-xs ${
                                        is2xx
                                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                                            : is4xx
                                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                                            : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                                    }`}>
                                        HTTP {val}
                                    </span>
                                );
                            } else if (isMethod) {
                                displayVal = (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md font-bold text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                        {String(val).toUpperCase()}
                                    </span>
                                );
                            } else if (isPath) {
                                displayVal = (
                                    <span className="font-mono text-indigo-300 text-xs break-all">
                                        {String(val)}
                                    </span>
                                );
                            } else if (typeof val === 'object' && val !== null) {
                                displayVal = (
                                    <pre className="text-[11px] text-slate-300 overflow-x-auto whitespace-pre-wrap font-mono">
                                        {JSON.stringify(val, null, 2)}
                                    </pre>
                                );
                            } else if (typeof val === 'boolean') {
                                displayVal = (
                                    <span className={`font-bold ${val ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {val ? 'true' : 'false'}
                                    </span>
                                );
                            }

                            return (
                                <div
                                    key={key}
                                    className="p-3 rounded-xl bg-[var(--bg-body)] border border-[var(--border-color)] flex flex-col justify-between gap-1 shadow-xs"
                                >
                                    <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                                        {key}
                                    </span>
                                    <div className="text-xs font-mono text-[var(--text-primary)]">
                                        {displayVal}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )
            ) : (
                <div className="relative rounded-2xl bg-[#0d1117] border border-[var(--border-color)] overflow-hidden shadow-inner">
                    <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900/80 border-b border-slate-800 text-[10px] text-slate-400 font-mono">
                        <span>payload.json</span>
                        <span>application/json</span>
                    </div>
                    <pre
                        className="p-4 overflow-x-auto text-xs font-mono leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: highlightJson(jsonString) }}
                    />
                </div>
            )}
        </div>
    );
};

export const AdminDashboard: React.FC = () => {
    const { user, refreshUserPermissions } = useAuthContext();
    const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'audit'>('users');
    
    // States
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [roles, setRoles] = useState<AdminRole[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
    const [auditTotal, setAuditTotal] = useState<number>(0);
    const [auditTotalPages, setAuditTotalPages] = useState<number>(1);
    const [auditPage, setAuditPage] = useState<number>(1);
    const [auditPageSize, setAuditPageSize] = useState<number>(15);
    const [isAuditLoading, setIsAuditLoading] = useState<boolean>(false);

    const [meta, setMeta] = useState<SystemMeta>({ resources: [], actions: [] });
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Filter states
    const [userSearch, setUserSearch] = useState<string>('');
    const [auditFilterAction, setAuditFilterAction] = useState<string>('');
    const [auditSearchEmail, setAuditSearchEmail] = useState<string>('');
    const [auditFilterResource, setAuditFilterResource] = useState<string>('');

    // Selected role for editing permissions in Tab 2
    const [selectedRole, setSelectedRole] = useState<AdminRole | null>(null);
    const [rolePermissions, setRolePermissions] = useState<string[]>([]);
    const [isSavingPermissions, setIsSavingPermissions] = useState<boolean>(false);

    // Modal para Asignar / Revocar Roles a un Usuario
    const [userForRoleModal, setUserForRoleModal] = useState<AdminUser | null>(null);
    const [selectedRolesForUser, setSelectedRolesForUser] = useState<string[]>([]);
    const [isAssigningRoles, setIsAssigningRoles] = useState<boolean>(false);

    // Modal para Crear Nuevo Rol Dinámico con Permisos Específicos
    const [showNewRoleModal, setShowNewRoleModal] = useState<boolean>(false);
    const [newRoleName, setNewRoleName] = useState<string>('');
    const [newRoleDesc, setNewRoleDesc] = useState<string>('');
    const [newRolePermissions, setNewRolePermissions] = useState<string[]>([
        "groups:read", "expenses:read", "wallets:read", "stats:read"
    ]);
    const [isCreatingRole, setIsCreatingRole] = useState<boolean>(false);

    // Modal de Detalles de Auditoría
    const [inspectLog, setInspectLog] = useState<AuditLogItem | null>(null);

    // ── Consumo Real Paginado del Endpoint de Auditoría con Inyección de JWT ────
    const fetchAuditLogs = useCallback(async (pageToFetch = 1, pageSizeToFetch = auditPageSize) => {
        setIsAuditLoading(true);
        try {
            const data = await adminService.getAuditLogsPaginated({
                page: pageToFetch,
                page_size: pageSizeToFetch,
                user_email: auditSearchEmail.trim() || undefined,
                action: auditFilterAction || undefined,
                resource: auditFilterResource || undefined
            });
            setAuditLogs(data.items || []);
            setAuditTotal(data.total || 0);
            setAuditTotalPages(data.total_pages || 1);
            setAuditPage(data.page || pageToFetch);
        } catch (error: any) {
            console.error('Error fetching audit logs:', error);
            // Mensaje genérico de error sin revelar stack traces ni detalles internos del servidor
            toast.error('No fue posible cargar el registro de auditoría. Por favor intenta de nuevo.');
        } finally {
            setIsAuditLoading(false);
        }
    }, [auditPageSize, auditSearchEmail, auditFilterAction, auditFilterResource]);

    // Soporte para cerrar modales con la tecla Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (inspectLog) setInspectLog(null);
                else if (userForRoleModal) setUserForRoleModal(null);
                else if (showNewRoleModal) setShowNewRoleModal(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [inspectLog, userForRoleModal, showNewRoleModal]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [usersData, rolesData, metaData] = await Promise.all([
                adminService.getUsers(),
                adminService.getRoles(),
                adminService.getMetadata()
            ]);
            setUsers(usersData);
            setRoles(rolesData);
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

    // Consulta reactiva y con debounce al buscar o paginar en auditoría
    useEffect(() => {
        if (activeTab === 'audit') {
            const timer = setTimeout(() => {
                fetchAuditLogs(1, auditPageSize);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [activeTab, auditSearchEmail, auditFilterAction, auditFilterResource, auditPageSize, fetchAuditLogs]);

    // ── Manejadores de Roles y Permisos ─────────────────────────────────────────
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
            const successMsg = `Permisos del rol '${selectedRole.name}' actualizados correctamente en el servidor.`;
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

    // ── Creación de Rol Dinámico con Matriz de Permisos Específicos ────────────
    const handleToggleNewRolePermission = (permKey: string) => {
        setNewRolePermissions(prev => 
            prev.includes(permKey)
                ? prev.filter(p => p !== permKey)
                : [...prev, permKey]
        );
    };

    const handleToggleNewRoleResourceAll = (resourceId: string, shouldEnable: boolean) => {
        const resourcePerms = meta.actions.map(act => `${resourceId}:${act.id}`);
        setNewRolePermissions(prev => {
            const otherPerms = prev.filter(p => !p.startsWith(`${resourceId}:`));
            return shouldEnable ? [...otherPerms, ...resourcePerms] : otherPerms;
        });
    };

    const handleCreateRole = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRoleName.trim()) return;

        setIsCreatingRole(true);
        try {
            await adminService.createRole({
                name: newRoleName.trim(),
                description: newRoleDesc.trim(),
                permissions: newRolePermissions
            });
            const successMsg = `Rol '${newRoleName}' creado exitosamente con ${newRolePermissions.length} permisos.`;
            setMessage({ type: 'success', text: successMsg });
            toast.success(successMsg);
            setShowNewRoleModal(false);
            setNewRoleName('');
            setNewRoleDesc('');
            setNewRolePermissions(["groups:read", "expenses:read", "wallets:read", "stats:read"]);
            
            const updatedRoles = await adminService.getRoles();
            setRoles(updatedRoles);
            if (updatedRoles.length > 0) {
                const justCreated = updatedRoles.find(r => r.name === newRoleName.trim()) || updatedRoles[updatedRoles.length - 1];
                setSelectedRole(justCreated);
                setRolePermissions(justCreated.permissions || []);
            }
        } catch (error: any) {
            const errDetail = error.response?.data?.detail || 'Error al crear el nuevo rol.';
            setMessage({ type: 'error', text: errDetail });
            toast.error(errDetail);
        } finally {
            setIsCreatingRole(false);
        }
    };

    // ── Modal de Asignación / Revocación de Roles a Usuario ────────────────────
    const openUserRoleModal = (targetUser: AdminUser) => {
        setUserForRoleModal(targetUser);
        setSelectedRolesForUser(targetUser.roles || ['Usuario Regular']);
    };

    const handleToggleUserRole = (roleName: string) => {
        setSelectedRolesForUser(prev => {
            if (prev.includes(roleName)) {
                // Al menos un rol debe permanecer asignado
                if (prev.length === 1) {
                    toast.warning("El usuario debe tener al menos un rol asignado.");
                    return prev;
                }
                return prev.filter(r => r !== roleName);
            } else {
                return [...prev, roleName];
            }
        });
    };

    const handleSaveUserRoles = async () => {
        if (!userForRoleModal) return;
        setIsAssigningRoles(true);
        try {
            await adminService.assignUserRoles(userForRoleModal.id, selectedRolesForUser);
            const successMsg = `Roles actualizados correctamente para ${userForRoleModal.nombre || userForRoleModal.email}.`;
            setMessage({ type: 'success', text: successMsg });
            toast.success(successMsg);

            // Refrescar sesión actual si se modificó el propio usuario
            if (user?.id === userForRoleModal.id) {
                await refreshUserPermissions();
            }

            const updatedUsers = await adminService.getUsers();
            setUsers(updatedUsers);
            setUserForRoleModal(null);
        } catch (error: any) {
            const errDetail = error.response?.data?.detail || 'Error al actualizar los roles del usuario.';
            setMessage({ type: 'error', text: errDetail });
            toast.error(errDetail);
        } finally {
            setIsAssigningRoles(false);
        }
    };

    // ── Filtros de Búsqueda ───────────────────────────────────────────────────
    const filteredUsers = users.filter(u => 
        (u.nombre || '').toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(userSearch.toLowerCase())
    );

    // Los registros de auditoría se obtienen directamente paginados y filtrados del backend
    const filteredAudit = auditLogs;
    const uniqueAuditActions = Array.from(new Set([...KNOWN_AUDIT_ACTIONS, ...auditLogs.map(l => l.action)])).filter(Boolean);
    const uniqueAuditResources = Array.from(new Set([...KNOWN_AUDIT_RESOURCES, ...auditLogs.map(l => l.resource)])).filter(Boolean);

    return (
        <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4 pb-12">
            {/* Header del Panel con Jerarquía Tipográfica y Estética Anti-Plantilla */}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--bg-surface)] p-6 rounded-3xl border border-[var(--border-color)] shadow-sm backdrop-blur-md">
                <div>
                    <div className="flex items-center gap-3">
                        <span className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shadow-inner">
                            <Shield size={24} />
                        </span>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[var(--text-primary)]">
                                    Panel de Control y RBAC
                                </h1>
                                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                    Enforced
                                </span>
                            </div>
                            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 font-medium">
                                Motor de control de acceso granular en servidor, matriz de permisos y trazabilidad inmutable
                            </p>
                        </div>
                    </div>
                </div>

                <motion.button 
                    onClick={fetchData} 
                    disabled={isLoading}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[var(--hover-bg)] hover:bg-[var(--border-color)] rounded-xl text-xs sm:text-sm font-bold text-[var(--text-primary)] transition-colors border border-[var(--border-color)] active:scale-[0.98]"
                >
                    <RefreshCw size={15} className={isLoading ? "animate-spin text-indigo-500" : ""} />
                    <span>Sincronizar datos</span>
                </motion.button>
            </header>

            {/* Mensajes de feedback reactivo */}
            <AnimatePresence>
                {message && (
                    <motion.div 
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
                        className={`p-4 rounded-2xl flex items-center justify-between text-xs sm:text-sm font-semibold border shadow-sm ${
                            message.type === 'success' 
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25' 
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25'
                        }`}
                    >
                        <div className="flex items-center gap-2.5">
                            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                            <span>{message.text}</span>
                        </div>
                        <button 
                            type="button" 
                            onClick={() => setMessage(null)} 
                            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        >
                            <X size={15} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Métricas Principales del Sistema */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center gap-4 shadow-sm hover:border-indigo-500/40 transition-colors">
                    <div className="p-3.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                        <Users size={22} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Usuarios registrados</p>
                        <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight mt-0.5">{users.length}</h2>
                    </div>
                </div>

                <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center gap-4 shadow-sm hover:border-amber-500/40 transition-colors">
                    <div className="p-3.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        <Key size={22} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Roles dinámicos</p>
                        <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight mt-0.5">{roles.length}</h2>
                    </div>
                </div>

                <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center gap-4 shadow-sm hover:border-emerald-500/40 transition-colors">
                    <div className="p-3.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <FileText size={22} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Eventos auditados</p>
                        <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight mt-0.5">{auditLogs.length}</h2>
                    </div>
                </div>
            </section>

            {/* Navegación por Pestañas con Spring LayoutId */}
            <div className="flex border-b border-[var(--border-color)] gap-2 relative overflow-x-auto no-scrollbar">
                <button
                    type="button"
                    onClick={() => setActiveTab('users')}
                    className={`relative flex items-center gap-2 px-5 py-3.5 font-bold text-xs sm:text-sm transition-colors whitespace-nowrap ${
                        activeTab === 'users'
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                >
                    <UserCheck size={17} />
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
                    className={`relative flex items-center gap-2 px-5 py-3.5 font-bold text-xs sm:text-sm transition-colors whitespace-nowrap ${
                        activeTab === 'roles'
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                >
                    <ShieldCheck size={17} />
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
                    className={`relative flex items-center gap-2 px-5 py-3.5 font-bold text-xs sm:text-sm transition-colors whitespace-nowrap ${
                        activeTab === 'audit'
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                >
                    <FileText size={17} />
                    <span>Registro de auditoría ({auditLogs.length})</span>
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
                    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                        <div className="relative flex-1 max-w-md">
                            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                            <input
                                type="text"
                                placeholder="Buscar usuarios por nombre o correo..."
                                value={userSearch}
                                onChange={(e) => setUserSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-[var(--text-primary)] transition-all"
                            />
                        </div>
                        <div className="text-xs font-semibold text-[var(--text-secondary)] self-end sm:self-center">
                            Mostrando {filteredUsers.length} de {users.length} usuarios
                        </div>
                    </div>

                    {/* Vista Móvil (Tarjetas táctiles sin desbordamiento para pantallas <= 390px) */}
                    <div className="grid grid-cols-1 gap-3 sm:hidden">
                        {filteredUsers.map((u) => {
                            const userRolesList = u.roles || ['Usuario Regular'];
                            const isSelf = user?.id === u.id;

                            return (
                                <div key={u.id} className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-sm space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2.5">
                                            <Avatar name={u.nombre} email={u.email} size="sm" />
                                            <div>
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className="font-semibold text-sm text-[var(--text-primary)]">{u.nombre || 'Sin nombre'}</span>
                                                    {isSelf && (
                                                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                                            TÚ
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-xs text-[var(--text-secondary)] font-mono break-all">{u.email}</span>
                                            </div>
                                        </div>
                                        {u.is_verified ? (
                                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex-shrink-0">
                                                <CheckCircle2 size={11} /> 2FA
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-medium bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 flex-shrink-0">
                                                <AlertTriangle size={11} /> Pendiente
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        {userRolesList.map((rName) => (
                                            <RoleBadge key={rName} role={rName} size="sm" />
                                        ))}
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openUserRoleModal(u)}
                                        leftIcon={<Key size={13} />}
                                        className="w-full justify-center"
                                    >
                                        Gestionar roles
                                    </Button>
                                </div>
                            );
                        })}
                    </div>

                    {/* Tabla de Usuarios para Tablet y Escritorio (>= 640px) */}
                    <div className="hidden sm:block overflow-x-auto bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] shadow-sm">
                        <table className="w-full text-left text-xs sm:text-sm min-w-[650px]">
                            <thead className="bg-[var(--hover-bg)] text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--border-subtle)]">
                                <tr>
                                    <th className="py-3.5 px-4">Usuario</th>
                                    <th className="py-3.5 px-4">Correo</th>
                                    <th className="py-3.5 px-4">Roles Asignados</th>
                                    <th className="py-3.5 px-4">Estado 2FA / Cuenta</th>
                                    <th className="py-3.5 px-4 text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-subtle)]">
                                {filteredUsers.map((u) => {
                                    const userRolesList = u.roles || ['Usuario Regular'];
                                    const isSelf = user?.id === u.id;

                                    return (
                                        <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="py-3.5 px-4 font-medium text-[var(--text-primary)]">
                                                <div className="flex items-center gap-2.5">
                                                    <Avatar name={u.nombre} email={u.email} size="sm" />
                                                    <div>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="font-semibold text-[var(--text-primary)]">{u.nombre || 'Sin nombre'}</span>
                                                            {isSelf && (
                                                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                                                    TÚ
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-[11px] text-[var(--text-secondary)] font-normal">{u.phone || 'Sin teléfono'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4 text-[var(--text-secondary)] font-mono text-xs">
                                                {u.email}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {userRolesList.map((rName) => (
                                                        <RoleBadge key={rName} role={rName} size="sm" />
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                {u.is_verified ? (
                                                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                                                        <CheckCircle2 size={13} /> Verificado
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-medium">
                                                        <AlertTriangle size={13} /> Pendiente
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 text-right">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => openUserRoleModal(u)}
                                                    leftIcon={<Key size={13} />}
                                                >
                                                    Gestionar roles
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* PESTAÑA 2: ROLES Y MATRIZ DE PERMISOS DINÁMICOS */}
            {activeTab === 'roles' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    {/* Lista de Roles a la Izquierda */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-base text-[var(--text-primary)]">Roles configurados</h3>
                                <p className="text-xs text-[var(--text-secondary)]">Selecciona un rol para editar su matriz</p>
                            </div>
                            <motion.button
                                whileTap={{ scale: 0.96 }}
                                onClick={() => setShowNewRoleModal(true)}
                                className="flex items-center gap-1 text-xs font-bold px-3 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
                            >
                                <Plus size={14} /> Nuevo rol
                            </motion.button>
                        </div>

                        <div className="space-y-2.5">
                            {roles.map(r => {
                                const isSelected = selectedRole?.id === r.id;
                                return (
                                    <div
                                        key={r.id}
                                        onClick={() => handleSelectRole(r)}
                                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                                            isSelected
                                                ? 'bg-indigo-500/10 border-indigo-500 shadow-sm'
                                                : 'bg-[var(--bg-surface)] border-[var(--border-color)] hover:border-slate-400 dark:hover:border-slate-600'
                                        }`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <h4 className="font-bold text-sm text-[var(--text-primary)]">{r.name}</h4>
                                            {r.is_system && (
                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                                    Sistema
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">{r.description || 'Sin descripción'}</p>
                                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-[var(--border-color)]">
                                            <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                                                {r.permissions?.length || 0} permisos activos
                                            </span>
                                            <ChevronRight size={14} className="text-slate-400" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Matriz de Permisos a la Derecha */}
                    <div className="lg:col-span-2 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-3xl p-6 space-y-6 shadow-sm">
                        {selectedRole ? (
                            <>
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[var(--border-color)] pb-4">
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
                                        <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-medium">
                                            Evaluado en tiempo real en cada llamada a la API REST (Zero Trust)
                                        </p>
                                    </div>

                                    {selectedRole.name !== 'Administrador' ? (
                                        <motion.button
                                            whileTap={{ scale: 0.97 }}
                                            onClick={handleSaveRolePermissions}
                                            disabled={isSavingPermissions}
                                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs transition-colors shadow-sm"
                                        >
                                            {isSavingPermissions ? (
                                                <RefreshCw size={14} className="animate-spin" />
                                            ) : (
                                                <Save size={14} />
                                            )}
                                            <span>Guardar matriz</span>
                                        </motion.button>
                                    ) : (
                                        <div className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/30">
                                            Permisos completos inmutables
                                        </div>
                                    )}
                                </div>

                                {/* Cuadrícula de Recursos del Sistema */}
                                <div className="space-y-4">
                                    {meta.resources.map(res => {
                                        const resourcePerms = meta.actions.map(act => `${res.id}:${act.id}`);
                                        const activeCount = resourcePerms.filter(p => rolePermissions.includes(p)).length;
                                        const allChecked = activeCount === meta.actions.length;

                                        return (
                                            <div key={res.id} className="p-4 rounded-2xl bg-[var(--bg-body)] border border-[var(--border-color)]">
                                                <div className="flex justify-between items-center mb-3">
                                                    <div>
                                                        <span className="font-bold text-sm text-[var(--text-primary)]">{res.name}</span>
                                                        <span className="text-[11px] text-slate-400 ml-1.5 font-mono">({res.id})</span>
                                                    </div>

                                                    {selectedRole.name !== 'Administrador' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleAllResourceActions(res.id, !allChecked)}
                                                            className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
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
                                                                className={`flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-semibold border transition-all text-left ${
                                                                    isChecked
                                                                        ? 'bg-indigo-500/15 border-indigo-500/50 text-indigo-700 dark:text-indigo-300 shadow-sm'
                                                                        : 'bg-[var(--bg-surface)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-slate-400'
                                                                }`}
                                                            >
                                                                <span className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] border transition-colors ${
                                                                    isChecked
                                                                        ? 'bg-indigo-600 border-indigo-600 text-white'
                                                                        : 'border-slate-300 dark:border-slate-600 bg-transparent'
                                                                }`}>
                                                                    {isChecked ? <Check size={11} /> : null}
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
                            <div className="text-center py-16 text-slate-400 font-medium">
                                Selecciona un rol a la izquierda para visualizar y editar su matriz de permisos.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* PESTAÑA 3: AUDITORÍA Y REGISTRO INMUTABLE */}
            {activeTab === 'audit' && (
                <div className="space-y-4">
                    {/* Aviso de Inmutabilidad */}
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs sm:text-sm text-[var(--text-primary)]">
                        <ShieldAlert className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" size={20} />
                        <div>
                            <span className="font-bold text-indigo-600 dark:text-indigo-400">Registro de Auditoría Inmutable (Append-Only): </span>
                            <span className="text-[var(--text-secondary)]">
                                Cada evento queda sellado con fecha, hora, dirección IP, identificador de usuario y código de respuesta HTTP. Los registros no pueden ser eliminados ni modificados por ninguna vía.
                            </span>
                        </div>
                    </div>

                    {/* Filtros de Auditoría */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="relative">
                            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                            <input
                                type="text"
                                placeholder="Filtrar por correo de usuario..."
                                value={auditSearchEmail}
                                onChange={(e) => setAuditSearchEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-[var(--text-primary)]"
                            />
                        </div>

                        <select
                            value={auditFilterAction}
                            onChange={(e) => setAuditFilterAction(e.target.value)}
                            className="px-3.5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
                        >
                            <option value="">Todas las acciones ({uniqueAuditActions.length})</option>
                            {uniqueAuditActions.map(action => (
                                <option key={action} value={action}>{action}</option>
                            ))}
                        </select>

                        <select
                            value={auditFilterResource}
                            onChange={(e) => setAuditFilterResource(e.target.value)}
                            className="px-3.5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
                        >
                            <option value="">Todos los recursos ({uniqueAuditResources.length})</option>
                            {uniqueAuditResources.map(res => (
                                <option key={res} value={res}>{res}</option>
                            ))}
                        </select>
                    </div>

                    {/* Vista Móvil: Tarjetas de Auditoría (< 640px) */}
                    <div className="block sm:hidden space-y-3">
                        {filteredAudit.length === 0 ? (
                            <div className="text-center py-10 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-color)] text-[var(--text-secondary)] text-xs">
                                No se encontraron registros de auditoría que coincidan con los filtros.
                            </div>
                        ) : (
                            filteredAudit.map((log) => {
                                const isSuccess = log.action.includes('SUCCESS') || log.action.includes('ASSIGNED') || log.action.includes('CREATED') || log.action.includes('REGISTER');
                                const isFail = log.action.includes('FAILED') || log.action.includes('BLOCKED') || log.action.includes('DENIED');

                                return (
                                    <div
                                        key={log.id}
                                        className="p-3.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-sm space-y-2.5"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                                isSuccess
                                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                                    : isFail
                                                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                                                    : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
                                            }`}>
                                                {log.action}
                                            </span>
                                            <button
                                                onClick={() => setInspectLog(log)}
                                                className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                                            >
                                                <Eye size={12} />
                                                <span>Inspeccionar</span>
                                            </button>
                                        </div>

                                        <div className="text-xs">
                                            <span className="font-bold text-[var(--text-primary)] block truncate">
                                                {log.user_email || 'Sistema / Anónimo'}
                                            </span>
                                            <span className="text-[11px] text-slate-400 font-mono">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[var(--border-color)] font-mono text-slate-400">
                                            <span className="font-sans font-bold uppercase text-[10px] text-indigo-500">
                                                {log.resource}
                                            </span>
                                            <span>IP: {log.ip_address}</span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Tabla de Solo Lectura para Tablet y Desktop (>= 640px) */}
                    <div className="hidden sm:block overflow-x-auto bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] shadow-sm relative">
                        {isAuditLoading && (
                            <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-2xl">
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-medium text-indigo-400 shadow-lg">
                                    <RefreshCw className="animate-spin" size={14} />
                                    <span>Actualizando registros...</span>
                                </div>
                            </div>
                        )}
                        <table className="w-full text-left text-xs min-w-[700px]">
                            <thead className="bg-[var(--hover-bg)] text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--border-subtle)]">
                                <tr>
                                    <th className="py-3.5 px-4">Fecha y hora (UTC)</th>
                                    <th className="py-3.5 px-4">Usuario</th>
                                    <th className="py-3.5 px-4">Acción Realizada</th>
                                    <th className="py-3.5 px-4">Recurso</th>
                                    <th className="py-3.5 px-4">Dirección IP</th>
                                    <th className="py-3.5 px-4 text-right">Detalles</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-subtle)] font-mono">
                                {filteredAudit.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center text-slate-400 font-sans">
                                            {isAuditLoading ? 'Cargando registros...' : 'No se encontraron registros de auditoría que coincidan con los filtros.'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredAudit.map((log) => {
                                        const isSuccess = log.action.includes('SUCCESS') || log.action.includes('ASSIGNED') || log.action.includes('CREATED') || log.action.includes('REGISTER');
                                        const isFail = log.action.includes('FAILED') || log.action.includes('BLOCKED') || log.action.includes('DENIED');

                                        return (
                                            <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="py-3 px-4 text-[var(--text-secondary)] whitespace-nowrap">
                                                    {new Date(log.created_at || log.timestamp).toLocaleString()}
                                                </td>
                                                <td className="py-3 px-4 font-sans font-medium text-[var(--text-primary)] whitespace-nowrap">
                                                    {log.user_email || 'Sistema / Anónimo'}
                                                </td>
                                                <td className="py-3 px-4 whitespace-nowrap">
                                                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                                                        isSuccess
                                                            ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20'
                                                            : isFail
                                                            ? 'bg-rose-500/10 text-rose-500 dark:text-rose-400 border-rose-500/20'
                                                            : 'bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border-indigo-500/20'
                                                    }`}>
                                                        {log.action}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-[var(--text-secondary)] font-sans uppercase text-[10px] font-medium">
                                                    {log.resource}
                                                </td>
                                                <td className="py-3 px-4 text-[var(--text-secondary)]">
                                                    {log.ip_address}
                                                </td>
                                                <td className="py-3 px-4 text-right font-sans">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setInspectLog(log)}
                                                        leftIcon={<Eye size={13} />}
                                                    >
                                                        Inspeccionar
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Barra de Paginación Fluida para Auditoría */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 px-1 text-xs">
                        <div className="flex items-center gap-3 text-[var(--text-secondary)] font-medium">
                            <span>
                                Mostrando <strong className="text-[var(--text-primary)] font-bold">{auditTotal === 0 ? 0 : (auditPage - 1) * auditPageSize + 1}</strong> a <strong className="text-[var(--text-primary)] font-bold">{Math.min(auditPage * auditPageSize, auditTotal)}</strong> de <strong className="text-[var(--text-primary)] font-bold">{auditTotal}</strong> eventos
                            </span>
                            <span className="text-slate-400">•</span>
                            <div className="flex items-center gap-1.5">
                                <label htmlFor="pageSizeSelect" className="text-[11px]">Por pág:</label>
                                <select
                                    id="pageSizeSelect"
                                    value={auditPageSize}
                                    onChange={(e) => {
                                        const newSize = Number(e.target.value);
                                        setAuditPageSize(newSize);
                                        setAuditPage(1);
                                        fetchAuditLogs(1, newSize);
                                    }}
                                    className="px-2 py-1 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg text-xs font-bold text-[var(--text-primary)] focus:outline-none"
                                >
                                    <option value={10}>10</option>
                                    <option value={15}>15</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                type="button"
                                disabled={auditPage <= 1 || isAuditLoading}
                                onClick={() => {
                                    const prev = auditPage - 1;
                                    setAuditPage(prev);
                                    fetchAuditLogs(prev);
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl text-xs font-bold text-[var(--text-primary)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--hover-bg)] transition-colors shadow-xs"
                            >
                                <ChevronLeft size={14} />
                                <span>Anterior</span>
                            </motion.button>

                            <span className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold">
                                Pág. {auditPage} de {auditTotalPages || 1}
                            </span>

                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                type="button"
                                disabled={auditPage >= auditTotalPages || isAuditLoading}
                                onClick={() => {
                                    const next = auditPage + 1;
                                    setAuditPage(next);
                                    fetchAuditLogs(next);
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl text-xs font-bold text-[var(--text-primary)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--hover-bg)] transition-colors shadow-xs"
                            >
                                <span>Siguiente</span>
                                <ChevronRight size={14} />
                            </motion.button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 1: REDISEÑO MINIMALISTA DE ROLES (EMIL DESIGN ENG) */}
            <AnimatePresence>
                {userForRoleModal && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        onClick={() => setUserForRoleModal(null)}
                        className="fixed inset-0 bg-black/65 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
                    >
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.96, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 8 }}
                            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-3xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl relative"
                        >
                            {/* Header Compacto con Identidad del Usuario */}
                            <div className="flex justify-between items-center pb-3 border-b border-[var(--border-color)]">
                                <div>
                                    <h3 className="text-base font-bold text-[var(--text-primary)]">
                                        Roles de usuario
                                    </h3>
                                    <p className="text-xs text-[var(--text-secondary)] font-medium truncate max-w-[280px]">
                                        <span className="font-bold text-[var(--text-primary)]">{userForRoleModal.nombre || 'Usuario'}</span>
                                        {' • '}
                                        <span className="font-mono text-slate-400">{userForRoleModal.email}</span>
                                    </p>
                                </div>
                                <motion.button 
                                    whileTap={{ scale: 0.92 }}
                                    type="button" 
                                    onClick={() => setUserForRoleModal(null)}
                                    aria-label="Cerrar modal"
                                    className="p-1.5 rounded-xl text-slate-400 hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-colors"
                                >
                                    <X size={18} />
                                </motion.button>
                            </div>

                            {/* Alerta Compacta para Protección de Cuenta Propia */}
                            {user?.id === userForRoleModal.id && (
                                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                                    <ShieldAlert size={15} className="flex-shrink-0" />
                                    <span>Tu rol de Administrador está protegido contra auto-revocación.</span>
                                </div>
                            )}

                            {/* Lista Minimalista de Filas con Toggle Switches */}
                            <div className="divide-y divide-[var(--border-color)] border-y border-[var(--border-color)]">
                                {roles.map(r => {
                                    const isAssigned = selectedRolesForUser.includes(r.name);
                                    const isSelfAdmin = user?.id === userForRoleModal.id && (r.name.toLowerCase() === 'administrador' || r.name.toLowerCase() === 'admin');

                                    return (
                                        <div
                                            key={r.id}
                                            onClick={() => !isSelfAdmin && handleToggleUserRole(r.name)}
                                            className={`py-3 px-2 flex items-center justify-between rounded-xl transition-colors ${
                                                isSelfAdmin ? 'cursor-not-allowed opacity-75' : 'cursor-pointer hover:bg-[var(--hover-bg)]'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-sm text-[var(--text-primary)]">
                                                    {r.name}
                                                </span>
                                                {r.is_system && (
                                                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-slate-500/10 text-slate-500 border border-slate-500/20">
                                                        Sistema
                                                    </span>
                                                )}
                                            </div>

                                            <RoleToggleSwitch
                                                checked={isAssigned}
                                                disabled={isSelfAdmin}
                                                onChange={() => handleToggleUserRole(r.name)}
                                            />
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Botones de Acción Directos */}
                            <div className="flex justify-end gap-2.5 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setUserForRoleModal(null)}
                                    className="px-4 py-2 text-xs font-bold rounded-xl text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] transition-colors"
                                >
                                    Cancelar
                                </button>
                                <motion.button
                                    whileTap={{ scale: 0.96 }}
                                    type="button"
                                    onClick={handleSaveUserRoles}
                                    disabled={isAssigningRoles || selectedRolesForUser.length === 0}
                                    className="flex items-center gap-2 px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-50 transition-colors shadow-sm"
                                >
                                    {isAssigningRoles ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                                    <span>{isAssigningRoles ? 'Guardando...' : 'Guardar roles'}</span>
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MODAL 2: CREACIÓN DE ROL DINÁMICO CON PERMISOS GRANULARES */}
            <AnimatePresence>
                {showNewRoleModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
                            className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-3xl p-6 max-w-2xl w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-3">
                                <div>
                                    <h3 className="text-base font-bold text-[var(--text-primary)]">Crear rol dinámico</h3>
                                    <p className="text-xs text-[var(--text-secondary)]">Define el nombre y asigna permisos específicos</p>
                                </div>
                                <button 
                                    type="button" 
                                    onClick={() => setShowNewRoleModal(false)}
                                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleCreateRole} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-[var(--text-secondary)]">Nombre del rol</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Ej. Moderador de Contenido"
                                            value={newRoleName}
                                            onChange={(e) => setNewRoleName(e.target.value)}
                                            className="w-full mt-1.5 px-3.5 py-2.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-xs sm:text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-[var(--text-secondary)]">Descripción</label>
                                        <input
                                            type="text"
                                            placeholder="Ej. Puede revisar y editar gastos y grupos"
                                            value={newRoleDesc}
                                            onChange={(e) => setNewRoleDesc(e.target.value)}
                                            className="w-full mt-1.5 px-3.5 py-2.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-xs sm:text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                                        />
                                    </div>
                                </div>

                                {/* Matriz Granular de Permisos para Nuevo Rol */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-xs font-bold text-[var(--text-primary)]">
                                            Matriz de permisos granulares ({newRolePermissions.length} seleccionados)
                                        </label>
                                    </div>

                                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                                        {meta.resources.map(res => {
                                            const resPerms = meta.actions.map(act => `${res.id}:${act.id}`);
                                            const allChecked = resPerms.every(p => newRolePermissions.includes(p));

                                            return (
                                                <div key={res.id} className="p-3.5 rounded-2xl bg-[var(--bg-body)] border border-[var(--border-color)]">
                                                    <div className="flex justify-between items-center mb-2.5">
                                                        <span className="font-bold text-xs text-[var(--text-primary)]">{res.name}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleNewRoleResourceAll(res.id, !allChecked)}
                                                            className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                                                        >
                                                            {allChecked ? 'Desmarcar todos' : 'Marcar todos'}
                                                        </button>
                                                    </div>

                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                        {meta.actions.map(act => {
                                                            const permKey = `${res.id}:${act.id}`;
                                                            const isChecked = newRolePermissions.includes(permKey);

                                                            return (
                                                                <button
                                                                    key={act.id}
                                                                    type="button"
                                                                    onClick={() => handleToggleNewRolePermission(permKey)}
                                                                    className={`flex items-center gap-2 p-2 rounded-xl text-[11px] font-semibold border transition-all ${
                                                                        isChecked
                                                                            ? 'bg-indigo-500/15 border-indigo-500/50 text-indigo-700 dark:text-indigo-300'
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
                                </div>

                                <div className="flex justify-end gap-2.5 pt-3 border-t border-[var(--border-color)]">
                                    <button
                                        type="button"
                                        onClick={() => setShowNewRoleModal(false)}
                                        className="px-4 py-2 text-xs font-bold rounded-xl text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]"
                                    >
                                        Cancelar
                                    </button>
                                    <motion.button
                                        whileTap={{ scale: 0.97 }}
                                        type="submit"
                                        disabled={isCreatingRole || !newRoleName.trim()}
                                        className="px-5 py-2 text-xs font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
                                    >
                                        {isCreatingRole ? 'Creando rol...' : 'Crear rol'}
                                    </motion.button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL 3: INSPECCIÓN DE DETALLES DE AUDITORÍA */}
            <AnimatePresence>
                {inspectLog && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        onClick={() => setInspectLog(null)}
                        className="fixed inset-0 bg-black/65 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
                    >
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 12 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 12 }}
                            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-3xl p-6 sm:p-7 max-w-2xl w-full space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto"
                        >
                            {/* Header del Modal */}
                            <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-3.5">
                                <div className="flex items-center gap-3">
                                    <span className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shadow-xs">
                                        <ShieldAlert size={20} />
                                    </span>
                                    <div>
                                        <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                                            Detalles del Registro de Auditoría
                                        </h3>
                                        <p className="text-[11px] text-[var(--text-secondary)] font-mono">
                                            Evidencia forense inmutable sellada en base de datos
                                        </p>
                                    </div>
                                </div>
                                <motion.button 
                                    whileTap={{ scale: 0.92 }}
                                    type="button" 
                                    onClick={() => setInspectLog(null)}
                                    aria-label="Cerrar modal"
                                    className="p-2 rounded-xl text-slate-400 hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-colors"
                                >
                                    <X size={18} />
                                </motion.button>
                            </div>

                            {/* Resumen Clave del Evento */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                                <div className="p-3 rounded-2xl bg-[var(--bg-body)] border border-[var(--border-color)]">
                                    <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block mb-1">
                                        Acción y Recurso
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                                            {inspectLog.action}
                                        </span>
                                        <span className="text-[11px] font-bold text-slate-400 uppercase">
                                            [{inspectLog.resource}]
                                        </span>
                                    </div>
                                </div>

                                <div className="p-3 rounded-2xl bg-[var(--bg-body)] border border-[var(--border-color)]">
                                    <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block mb-1">
                                        Fecha / Sellado UTC
                                    </span>
                                    <span className="text-xs font-bold text-[var(--text-primary)]">
                                        {inspectLog.created_at || inspectLog.timestamp ? new Date(inspectLog.created_at || inspectLog.timestamp).toLocaleString() : 'N/A'}
                                    </span>
                                </div>

                                <div className="p-3 rounded-2xl bg-[var(--bg-body)] border border-[var(--border-color)]">
                                    <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block mb-1">
                                        Usuario Responsable
                                    </span>
                                    <span className="text-xs font-bold text-[var(--text-primary)] block truncate">
                                        {inspectLog.user_email || 'Anónimo / Sistema'}
                                    </span>
                                    <span className="text-[10px] text-slate-400 block truncate">
                                        ID: {inspectLog.user_id || 'Sin user_id'}
                                    </span>
                                </div>

                                <div className="p-3 rounded-2xl bg-[var(--bg-body)] border border-[var(--border-color)]">
                                    <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block mb-1">
                                        IP Cliente & User-Agent
                                    </span>
                                    <span className="text-xs font-bold text-emerald-400 block truncate">
                                        {inspectLog.ip_address || '127.0.0.1'}
                                    </span>
                                    <span className="text-[10px] text-slate-400 block truncate" title={inspectLog.user_agent}>
                                        {inspectLog.user_agent || 'Unknown'}
                                    </span>
                                </div>
                            </div>

                            {/* Visor de Metadatos Formateados con Syntax Highlighting */}
                            <div className="space-y-2">
                                <span className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                                    <Code size={14} className="text-indigo-400" />
                                    <span>Metadatos en Payload</span>
                                </span>
                                <AuditMetadataViewer metadata={inspectLog.metadata || inspectLog.details || {}} />
                            </div>

                            {/* Footer con Atajo y Botón de Cierre */}
                            <div className="flex justify-between items-center pt-3 border-t border-[var(--border-color)]">
                                <span className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
                                    <kbd className="px-2 py-0.5 rounded-lg bg-[var(--bg-body)] border border-[var(--border-color)] text-[10px] font-bold">Esc</kbd>
                                    <span>para cerrar</span>
                                </span>
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    type="button"
                                    onClick={() => setInspectLog(null)}
                                    className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-sm"
                                >
                                    Cerrar
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
