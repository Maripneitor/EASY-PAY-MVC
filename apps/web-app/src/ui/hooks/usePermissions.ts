import { useMemo, useCallback } from 'react';
import { useAuthContext } from '../context/AuthContext';

export interface UsePermissionsReturn {
    userRoles: string[];
    userPermissions: string[];
    isAdmin: boolean;
    isEditor: boolean;
    isAuditor: boolean;
    isRegularUser: boolean;
    hasRole: (role: string | string[]) => boolean;
    hasPermission: (permission: string | string[]) => boolean;
    canWriteGroups: boolean;
    canDeleteGroups: boolean;
    canWriteExpenses: boolean;
    canDeleteExpenses: boolean;
    canManageUsers: boolean;
    canManageRoles: boolean;
    canViewAudit: boolean;
    canViewStats: boolean;
}

/**
 * Hook centralizado para evaluar roles y permisos en el cliente web de Easy-Pay.
 * Sigue los principios RBAC con bypass para Administradores y evaluación dinámica de permisos.
 */
export const usePermissions = (): UsePermissionsReturn => {
    const { user } = useAuthContext();

    const userRoles = useMemo(() => {
        return (user?.roles || ['Usuario Regular']).map((r: string) => r.trim().toLowerCase());
    }, [user?.roles]);

    const userPermissions = useMemo(() => {
        return (user?.permissions || []).map((p: string) => p.trim().toLowerCase());
    }, [user?.permissions]);

    const isAdmin = useMemo(() => {
        return userRoles.includes('administrador') || userRoles.includes('admin');
    }, [userRoles]);

    const isEditor = useMemo(() => {
        return userRoles.includes('editor');
    }, [userRoles]);

    const isAuditor = useMemo(() => {
        return userRoles.includes('auditor') || userRoles.includes('auditor financiero');
    }, [userRoles]);

    const isRegularUser = useMemo(() => {
        return userRoles.includes('usuario regular') || userRoles.includes('usuario');
    }, [userRoles]);

    const hasRole = useCallback((role: string | string[]): boolean => {
        if (isAdmin) return true;
        const targets = Array.isArray(role) ? role : [role];
        const lowerTargets = targets.map(t => t.trim().toLowerCase());
        return lowerTargets.some(target => userRoles.includes(target));
    }, [isAdmin, userRoles]);

    const hasPermission = useCallback((permission: string | string[]): boolean => {
        if (isAdmin) return true;
        const targets = Array.isArray(permission) ? permission : [permission];
        const lowerTargets = targets.map(t => t.trim().toLowerCase());
        return lowerTargets.some(target => userPermissions.includes(target));
    }, [isAdmin, userPermissions]);

    const canWriteGroups = useMemo(() => {
        return isAdmin || isEditor || isRegularUser || hasPermission('groups:write');
    }, [isAdmin, isEditor, isRegularUser, hasPermission]);

    const canDeleteGroups = useMemo(() => {
        return isAdmin || isEditor || hasPermission('groups:delete');
    }, [isAdmin, isEditor, hasPermission]);

    const canWriteExpenses = useMemo(() => {
        return isAdmin || isEditor || isRegularUser || hasPermission('expenses:write');
    }, [isAdmin, isEditor, isRegularUser, hasPermission]);

    const canDeleteExpenses = useMemo(() => {
        return isAdmin || isEditor || hasPermission('expenses:delete');
    }, [isAdmin, isEditor, hasPermission]);

    const canManageUsers = useMemo(() => {
        return isAdmin || hasPermission('users:write');
    }, [isAdmin, hasPermission]);

    const canManageRoles = useMemo(() => {
        return isAdmin || hasPermission('roles:write');
    }, [isAdmin, hasPermission]);

    const canViewAudit = useMemo(() => {
        return isAdmin || isAuditor || isEditor || hasPermission('audit:read');
    }, [isAdmin, isAuditor, isEditor, hasPermission]);

    const canViewStats = useMemo(() => {
        return isAdmin || isAuditor || isEditor || isRegularUser || hasPermission('stats:read');
    }, [isAdmin, isAuditor, isEditor, isRegularUser, hasPermission]);

    return {
        userRoles,
        userPermissions,
        isAdmin,
        isEditor,
        isAuditor,
        isRegularUser,
        hasRole,
        hasPermission,
        canWriteGroups,
        canDeleteGroups,
        canWriteExpenses,
        canDeleteExpenses,
        canManageUsers,
        canManageRoles,
        canViewAudit,
        canViewStats,
    };
};

