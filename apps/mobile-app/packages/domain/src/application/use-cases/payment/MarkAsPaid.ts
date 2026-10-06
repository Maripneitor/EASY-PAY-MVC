import { GroupRepository } from '../../../infrastructure/ports';

/**
 * Use Case: MarkAsPaid
 *
 * Records that a member has paid their share.
 * Accessible to the leader (who can mark any member) and the member themselves.
 */
export class MarkAsPaidUseCase {
    constructor(private readonly groupRepository: GroupRepository) {}

    async execute(
        groupId: string,
        memberId: string,
        requesterId: string,
        leaderId: string
    ): Promise<void> {
        const isLeader    = requesterId === leaderId;
        const isSelf      = requesterId === memberId;

        if (!isLeader && !isSelf) {
            throw new Error('Solo el líder o el propio miembro pueden marcar su pago.');
        }

        await this.groupRepository.markMemberAsPaid(groupId, memberId);
    }
}
