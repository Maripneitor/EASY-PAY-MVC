import { Group, Item, Member, GroupRepository } from '@easy-pay/domain';
import { httpClient } from '../http-client';

/**
 * Mobile implementation of GroupRepository connecting to the FastAPI backend.
 */
export class ApiMobileGroupRepository implements GroupRepository {
    
    async getGroup(id: string): Promise<Group> {
        const response = await httpClient.get(`/groups/${id}`);
        // Backend returns GroupDetailOut which might need mapping
        return response.data;
    }

    async createGroup(leader: Member, name?: string, items: any[] = []): Promise<Group> {
        const response = await httpClient.post('/groups/create', { 
            admin_id: leader.id, 
            nombre: name || 'Nuevo Grupo',
            items: items
        });
        
        // Manual mapping from create response
        return {
            id: response.data.group_id,
            code: response.data.invite_code,
            name: name || 'Nuevo Grupo',
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
    }

    async joinGroup(code: string, member: Member): Promise<Group> {
        const response = await httpClient.post('/groups/join', { 
            codigo: code, 
            user_id: member.id 
        });
        return this.getGroup(response.data.group_id);
    }

    async closeGroup(groupId: string, data: any = {}): Promise<void> {
        await httpClient.post(`/groups/${groupId}/close`, data);
    }

    async startSettlement(groupId: string, selectedBankAccounts: any[]): Promise<void> {
        await httpClient.post(`/groups/${groupId}/start-settlement`, {
            selected_bank_accounts: selectedBankAccounts
        });
    }

    async addItem(groupId: string, item: any): Promise<void> {
        await httpClient.post('/groups/add-item', {
            group_id: groupId,
            nombre: item.nombre || item.description,
            precio: item.precio || item.amount,
            cantidad: item.cantidad || item.quantity || 1,
            categoria: item.categoria || item.category || 'Otros',
            comprador_id: item.autorId || item.comprador_id || item.addedBy,
            participantes_ids: item.asignadoA || item.participantes_ids || item.assignedTo || []
        });
    }

    async removeItem(groupId: string, itemId: string): Promise<void> {
        await httpClient.delete(`/groups/${groupId}/items/${itemId}`);
    }

    async assignItem(groupId: string, itemId: string, memberIds: string[]): Promise<void> {
        await httpClient.put(`/groups/${groupId}/items/${itemId}`, {
            participantes_ids: memberIds
        });
    }

    async editItem(groupId: string, itemId: string, itemData: any): Promise<void> {
        await httpClient.put(`/groups/${groupId}/items/${itemId}`, itemData);
    }

    async updateGroup(groupId: string, data: { nombre?: string, descripcion?: string }): Promise<void> {
        await httpClient.put(`/groups/${groupId}`, data);
    }


    async markMemberAsPaid(groupId: string, memberId: string): Promise<void> {
        await httpClient.patch(`/groups/${groupId}/members/${memberId}/paid`);
    }

    async createSettlement(groupId: string, data: { amount: number, method: string, creditor_id: string }): Promise<void> {
        await httpClient.post(`/groups/${groupId}/settlements`, data);
    }

    async findByUser(userId: string): Promise<any[]> {
        const response = await httpClient.get(`/groups/user/${userId}`);
        return response.data;
    }

    async getItems(groupId: string): Promise<any[]> {
        const response = await httpClient.get(`/groups/${groupId}/items`);
        return response.data;
    }

    async getBalances(groupId: string): Promise<any> {
        const response = await httpClient.get(`/groups/${groupId}/balances`);
        return response.data;
    }

    async getPendingSettlements(groupId: string): Promise<any[]> {
        const response = await httpClient.get(`/groups/${groupId}/settlements/pending`);
        return response.data;
    }

    async deleteGroup(groupId: string): Promise<void> {
        await httpClient.delete(`/groups/${groupId}`);
    }

    async removeMember(groupId: string, userId: string): Promise<void> {
        await httpClient.delete(`/groups/${groupId}/members/${userId}`);
    }

    async approveSettlement(groupId: string, settlementId: string, currentUserId: string): Promise<void> {
        await httpClient.post(`/groups/${groupId}/settlements/${settlementId}/approve`, null, {
            params: { current_user_id: currentUserId }
        });
    }

    async rejectSettlement(groupId: string, settlementId: string, currentUserId: string, reason: string): Promise<void> {
        await httpClient.post(`/groups/${groupId}/settlements/${settlementId}/reject`, { reason }, {
            params: { current_user_id: currentUserId }
        });
    }

    onGroupUpdate(groupId: string, callback: (group: Group) => void): () => void {
        return () => {};
    }
}

export const groupRepository = new ApiMobileGroupRepository();
