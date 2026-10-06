import { Group, Item, Member, GroupRepository } from '@easy-pay/domain';
import { httpClient } from '../http-client';
import { subscribeToGroup } from '../websocket-client';
import { toGroup, toApiItem, ApiGroup } from '../mappers';
import { handleApiError } from '../error-handler';
import { STORAGE_KEYS } from '../../localStorage/storage-keys';

/**
 * Concrete implementation of the `GroupRepository` port connecting to the FastAPI backend.
 */
export class ApiGroupRepository implements GroupRepository {

    // ── getGroup ──────────────────────────────────────────────────────────────
    async getGroup(id: string): Promise<Group> {
        try {
            const res = await httpClient.get<ApiGroup>(`/groups/${id}`);
            return toGroup(res.data);
        } catch (e) {
            return handleApiError(e);
        }
    }

    // ── createGroup ───────────────────────────────────────────────────────────
    async createGroup(leader: Member, name?: string): Promise<Group> {
        try {
            const res = await httpClient.post<any>('/groups/create', { admin_id: leader.id, nombre: name });
            return {
                id: res.data.group_id,
                code: res.data.invite_code,
                name: name || '',
                leaderId: leader.id,
                status: 'active',
                subtotal: 0,
                tip: 0,
                total: 0,
                version: 1,
                members: [{ ...leader, role: 'leader' }],
                items: [],
                createdAt: new Date().toISOString()
            };
        } catch (e) {
            return handleApiError(e);
        }
    }

    // ── joinGroup ─────────────────────────────────────────────────────────────
    async joinGroup(code: string, member: Member): Promise<Group> {
        try {
            const res = await httpClient.post<any>(`/groups/join`, { codigo: code, user_id: member.id });
            return this.getGroup(res.data.group_id);
        } catch (e) {
            return handleApiError(e);
        }
    }

    // ── updateGroup ───────────────────────────────────────────────────────────
    async updateGroup(groupId: string, name: string, description?: string): Promise<void> {
        try {
            await httpClient.put(`/groups/${groupId}`, { nombre: name, descripcion: description });
        } catch (e) {
            return handleApiError(e);
        }
    }

    // ── closeGroup ────────────────────────────────────────────────────────────
    async closeGroup(groupId: string, tip?: number, total?: number): Promise<void> {
        try {
            await httpClient.post(`/groups/${groupId}/close`, { 
                tip_amount: tip ?? 0, 
                final_total: total ?? 0 
            });
        } catch (e) {
            return handleApiError(e);
        }
    }

    // ── startSettlement ──────────────────────────────────────────────────────────
    async startSettlement(groupId: string, selectedBankAccounts: any[]): Promise<void> {
        try {
            await httpClient.post(`/groups/${groupId}/start-settlement`, {
                selected_bank_accounts: selectedBankAccounts
            });
        } catch (e) {
            return handleApiError(e);
        }
    }

    // ── addItem ───────────────────────────────────────────────────────────────
    async addItem(groupId: string, item: Item): Promise<void> {
        try {
            await httpClient.post(`/groups/add-item`, {
                group_id: groupId,
                ...toApiItem(item)
            });
        } catch (e) {
            return handleApiError(e);
        }
    }

    // ── removeItem ────────────────────────────────────────────────────────────
    async removeItem(groupId: string, itemId: string): Promise<void> {
        try {
            await httpClient.delete(`/groups/${groupId}/items/${itemId}`);
        } catch (e) {
            return handleApiError(e);
        }
    }

    // ── assignItem ────────────────────────────────────────────────────────────
    async assignItem(groupId: string, itemId: string, memberIds: string[]): Promise<void> {
        try {
            await httpClient.put(`/groups/${groupId}/items/${itemId}`, { participantes_ids: memberIds });
        } catch (e) {
            return handleApiError(e);
        }
    }

    async editItem(groupId: string, itemId: string, itemData: any): Promise<void> {
        try {
            await httpClient.put(`/groups/${groupId}/items/${itemId}`, itemData);
        } catch (e) {
            return handleApiError(e);
        }
    }

    // ── markMemberAsPaid ──────────────────────────────────────────────────────
    async markMemberAsPaid(groupId: string, memberId: string): Promise<void> {
        try {
            await httpClient.patch(`/groups/${groupId}/members/${memberId}/paid`);
        } catch (e) {
            return handleApiError(e);
        }
    }

    // ── findByUser ───────────────────────────────────────────────────────────
    async findByUser(userId: string): Promise<any[]> {
        try {
            const res = await httpClient.get(`/groups/user/${userId}`);
            return res.data;
        } catch (e) {
            return handleApiError(e);
        }
    }

    async getActiveGroups(userId?: string): Promise<any[]> {
        let uid = userId;
        if (!uid) {
            const stored = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
            if (stored) {
                try {
                    const u = JSON.parse(stored);
                    uid = u.id || u._id;
                } catch {}
            }
        }
        if (!uid) return [];
        return this.findByUser(uid);
    }

    // ── getBalances ───────────────────────────────────────────────────────────
    async getBalances(groupId: string): Promise<any> {
        try {
            const res = await httpClient.get(`/groups/${groupId}/balances`);
            return res.data;
        } catch (e) {
            return handleApiError(e);
        }
    }

    // ── deleteGroup ───────────────────────────────────────────────────────────
    async deleteGroup(groupId: string): Promise<void> {
        try {
            await httpClient.delete(`/groups/${groupId}`);
        } catch (e) {
            return handleApiError(e);
        }
    }

    // ── onGroupUpdate (WebSocket) ─────────────────────────────────────────────
    onGroupUpdate(groupId: string, callback: (group: Group) => void): () => void {
        return subscribeToGroup(groupId, callback);
    }

    async addMember(groupId: string, userId: string): Promise<void> {
        try {
            await httpClient.post(`/groups/${groupId}/members`, { user_id: userId });
        } catch (e) {
            return handleApiError(e);
        }
    }

    async removeMember(groupId: string, userId: string): Promise<void> {
        try {
            await httpClient.delete(`/groups/${groupId}/members/${userId}`);
        } catch (e) {
            return handleApiError(e);
        }
    }
}

export const groupRepository = new ApiGroupRepository();
