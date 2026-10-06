import { Group } from '../../domain/models/Group';
import { Item } from '../../domain/models/Item';
import { Member } from '../../domain/models/Member';

/**
 * Port (interface): GroupRepository
 *
 * This is the contract that any data adapter must fulfill.
 * The domain defines WHAT it needs; infrastructure defines HOW to do it.
 *
 * Implementations:
 *  - web-app:    infrastructure/api/repositories/GroupRepository.ts (via FastAPI)
 *  - mobile-app: infrastructure/api/repositories/GroupRepository.ts (same API)
 *  - offline:    infrastructure/localStorage/group-storage.ts
 */
export interface GroupRepository {
    // ─── Group Operations ─────────────────────────────────────────────────────
    getGroup(id: string): Promise<Group>;
    createGroup(leader: Member, name?: string): Promise<Group>;
    joinGroup(code: string, member: Member): Promise<Group>;
    updateGroup(groupId: string, name: string, description?: string): Promise<void>;
    closeGroup(groupId: string): Promise<void>;
    deleteGroup(groupId: string): Promise<void>;

    // ─── Item Operations ──────────────────────────────────────────────────────
    addItem(groupId: string, item: Item): Promise<void>;
    removeItem(groupId: string, itemId: string): Promise<void>;
    assignItem(groupId: string, itemId: string, memberIds: string[]): Promise<void>;

    // ─── Payment Operations ───────────────────────────────────────────────────
    markMemberAsPaid(groupId: string, memberId: string): Promise<void>;

    // ─── Real-time Subscription ───────────────────────────────────────────────
    /**
     * Subscribe to live updates for a group.
     * @returns An unsubscribe function — call it on component cleanup.
     *
     * Example (React):
     *   useEffect(() => {
     *     const unsubscribe = repo.onGroupUpdate(id, setGroup);
     *     return () => unsubscribe();
     *   }, [id]);
     */
    onGroupUpdate(groupId: string, callback: (group: Group) => void): () => void;
}

// ─── Backward-compatibility alias ─────────────────────────────────────────────
/** @deprecated Use `GroupRepository` instead */
export type { GroupRepository as TableRepository };
