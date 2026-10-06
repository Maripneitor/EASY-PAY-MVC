import { Member, MemberRole } from '@easy-pay/domain';

/**
 * Shape of a member as returned by the FastAPI backend.
 * snake_case, may have different or additional fields vs the domain entity.
 */
export interface ApiMember {
    id: string;
    name: string;
    role: string;           // 'leader' | 'member' | 'guest'
    avatar_url?: string;
    has_paid?: boolean;
}

/**
 * Maps a raw API member object to the domain `Member` entity.
 * This is the ONLY place where backend naming conventions are translated.
 */
export const toMember = (apiMember: ApiMember): Member => ({
    id:        apiMember.id,
    name:      apiMember.name,
    role:      (apiMember.role as MemberRole) ?? 'member',
    avatarUrl: apiMember.avatar_url,
    hasPaid:   apiMember.has_paid ?? false,
});

export const toMemberList = (apiMembers: ApiMember[]): Member[] =>
    apiMembers.map(toMember);
