import { GroupRepository } from '../../../infrastructure/ports';

/**
 * Use Case: AssignItem
 *
 * Only the group leader can assign items to members.
 * An item can be assigned to multiple members (shared split).
 */
export class AssignItemUseCase {
    constructor(private readonly groupRepository: GroupRepository) {}

    async execute(
        groupId: string,
        itemId: string,
        memberIds: string[],
        requesterId: string,
        leaderId: string
    ): Promise<void> {
        if (requesterId !== leaderId) {
            throw new Error('Solo el líder puede asignar ítems a los miembros.');
        }
        if (memberIds.length === 0) {
            throw new Error('Debes asignar el ítem a al menos un miembro.');
        }

        await this.groupRepository.assignItem(groupId, itemId, memberIds);
    }
}
