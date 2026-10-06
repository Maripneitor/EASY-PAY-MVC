import { GroupRepository } from '../../../infrastructure/ports';

/**
 * Use Case: CloseGroup
 *
 * Only the group leader can close (finalize) a group.
 * Closing freezes the bill and triggers final share calculation.
 */
export class CloseGroupUseCase {
    constructor(private readonly groupRepository: GroupRepository) {}

    async execute(groupId: string, requesterId: string, leaderId: string): Promise<void> {
        if (requesterId !== leaderId) {
            throw new Error('Solo el líder puede cerrar el grupo.');
        }

        await this.groupRepository.closeGroup(groupId);
    }
}
