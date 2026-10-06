import { Group, GroupRepository, Member, Item } from '@easy-pay/domain';

export class InMemoryGroupRepository implements GroupRepository {
    private groups: Map<string, Group> = new Map();
    private observers: Map<string, ((group: Group) => void)[]> = new Map();

    constructor() {
        // Initialize with dummy data
        const dummyGroup: Group = {
            id: '1',
            code: 'ABCD',
            name: 'Cena de Pizza',
            members: [
                { id: 'm1', name: 'Mario', email: 'mario@example.com' },
                { id: 'm2', name: 'Juan', email: 'juan@example.com' }
            ],
            items: [
                { id: 'i1', name: 'Pizza Grande', price: 25.50, quantity: 1, assignedMemberIds: ['m1', 'm2'] },
                { id: 'i2', name: 'Refresco', price: 2.50, quantity: 2, assignedMemberIds: ['m1'] }
            ],
            status: 'active',
            subtotal: 30.50,
            tip: 3.00,
            total: 33.50,
            leaderId: 'm1',
            version: 1,
            createdAt: new Date().toISOString()
        };
        this.groups.set(dummyGroup.id, dummyGroup);
    }

    async getGroup(id: string): Promise<Group> {
        await this.simulateDelay();
        const group = this.groups.get(id);
        if (!group) throw new Error('Group not found');
        return group;
    }

    async createGroup(leader: Member, name?: string): Promise<Group> {
        await this.simulateDelay();
        const newGroup: Group = {
            id: Math.random().toString(36).substring(7),
            code: Math.random().toString(36).substring(7).toUpperCase(),
            name: name || 'Nuevo Grupo',
            members: [leader],
            items: [],
            status: 'active',
            subtotal: 0,
            tip: 0,
            total: 0,
            leaderId: leader.id,
            version: 1,
            createdAt: new Date().toISOString()
        };
        this.groups.set(newGroup.id, newGroup);
        return newGroup;
    }

    async joinGroup(code: string, member: Member): Promise<Group> {
        await this.simulateDelay();
        const group = Array.from(this.groups.values()).find(g => g.code === code);
        if (!group) throw new Error('Group code not found');
        
        if (!group.members.find(m => m.id === member.id)) {
            group.members.push(member);
            this.notifyObservers(group.id);
        }
        return group;
    }

    async closeGroup(groupId: string): Promise<void> {
        await this.simulateDelay();
        const group = this.groups.get(groupId);
        if (group) {
            group.status = 'closed';
            this.notifyObservers(groupId);
        }
    }

    async addItem(groupId: string, item: Item): Promise<void> {
        await this.simulateDelay();
        const group = this.groups.get(groupId);
        if (group) {
            group.items.push(item);
            this.updateTotals(group);
            this.notifyObservers(groupId);
        }
    }

    async removeItem(groupId: string, itemId: string): Promise<void> {
        await this.simulateDelay();
        const group = this.groups.get(groupId);
        if (group) {
            group.items = group.items.filter(i => i.id !== itemId);
            this.updateTotals(group);
            this.notifyObservers(groupId);
        }
    }

    async assignItem(groupId: string, itemId: string, memberIds: string[]): Promise<void> {
        await this.simulateDelay();
        const group = this.groups.get(groupId);
        if (group) {
            const item = group.items.find(i => i.id === itemId);
            if (item) {
                item.assignedMemberIds = memberIds;
                this.notifyObservers(groupId);
            }
        }
    }

    async markMemberAsPaid(groupId: string, memberId: string): Promise<void> {
        await this.simulateDelay();
        // Mock implementation
    }

    onGroupUpdate(groupId: string, callback: (group: Group) => void): () => void {
        if (!this.observers.has(groupId)) {
            this.observers.set(groupId, []);
        }
        this.observers.get(groupId)?.push(callback);
        
        // Initial call
        const group = this.groups.get(groupId);
        if (group) callback(group);

        return () => {
            const groupObservers = this.observers.get(groupId);
            if (groupObservers) {
                this.observers.set(groupId, groupObservers.filter(cb => cb !== callback));
            }
        };
    }

    private simulateDelay() {
        return new Promise(resolve => setTimeout(resolve, 300));
    }

    private notifyObservers(groupId: string) {
        const group = this.groups.get(groupId);
        if (group) {
            group.version++;
            this.observers.get(groupId)?.forEach(callback => callback({ ...group }));
        }
    }

    private updateTotals(group: Group) {
        group.subtotal = group.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        group.total = group.subtotal + group.tip;
    }
}
