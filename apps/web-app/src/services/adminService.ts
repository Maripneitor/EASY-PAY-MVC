import { httpClient } from '../infrastructure/api/http-client';

export interface AdminUser {
    id: string;
    nombre: string;
    email: string;
    roles: string[];
    is_verified: boolean;
    phone?: string;
    fecha_registro?: string;
}

export interface AdminRole {
    id: string;
    name: string;
    description?: string;
    permissions: string[];
    is_system?: boolean;
    created_at?: string;
}

export interface AuditLogItem {
    id: string;
    user_id?: string;
    user_email?: string;
    action: string;
    resource: string;
    metadata?: Record<string, any>;
    details?: Record<string, any>;
    ip_address?: string;
    user_agent?: string;
    created_at?: string;
    timestamp: string;
}

export interface PaginatedAuditLogs {
    items: AuditLogItem[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
}

export interface SystemMeta {
    resources: Array<{ id: string; name: string }>;
    actions: Array<{ id: string; name: string }>;
}

class AdminService {
    async getUsers(): Promise<AdminUser[]> {
        const response = await httpClient.get<AdminUser[]>('/admin/users');
        return response.data;
    }

    async assignUserRoles(userId: string, roles: string[]): Promise<any> {
        const response = await httpClient.put(`/admin/users/${userId}/roles`, { roles });
        return response.data;
    }

    async getRoles(): Promise<AdminRole[]> {
        const response = await httpClient.get<AdminRole[]>('/admin/roles');
        return response.data;
    }

    async createRole(data: { name: string; description?: string; permissions: string[] }): Promise<any> {
        const response = await httpClient.post('/admin/roles', data);
        return response.data;
    }

    async updateRole(roleId: string, data: { name?: string; description?: string; permissions?: string[] }): Promise<any> {
        const response = await httpClient.put(`/admin/roles/${roleId}`, data);
        return response.data;
    }

    async getAuditLogs(params?: { user_email?: string; user_id?: string; action?: string; resource?: string; limit?: number; page?: number; page_size?: number }): Promise<AuditLogItem[]> {
        const response = await httpClient.get<any>('/admin/audit-logs', { params });
        if (Array.isArray(response.data)) {
            return response.data;
        }
        if (response.data && Array.isArray(response.data.items)) {
            return response.data.items;
        }
        return [];
    }

    async getAuditLogsPaginated(params?: { user_email?: string; user_id?: string; action?: string; resource?: string; limit?: number; page?: number; page_size?: number }): Promise<PaginatedAuditLogs> {
        const response = await httpClient.get<any>('/admin/audit-logs', { params });
        if (Array.isArray(response.data)) {
            return {
                items: response.data,
                total: response.data.length,
                page: 1,
                page_size: response.data.length,
                total_pages: 1
            };
        }
        return response.data;
    }

    async getMetadata(): Promise<SystemMeta> {
        const response = await httpClient.get<SystemMeta>('/admin/meta');
        return response.data;
    }
}

export const adminService = new AdminService();
