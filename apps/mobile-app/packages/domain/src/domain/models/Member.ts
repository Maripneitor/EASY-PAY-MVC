/** Member entity — represents a participant in a group (registered user or guest). */

export type MemberRole = 'leader' | 'member' | 'guest';

export interface Member {
    id: string;
    name: string;
    role: MemberRole;
    avatarUrl?: string;
    hasPaid?: boolean;
}
