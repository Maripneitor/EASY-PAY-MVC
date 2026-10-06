import { GroupRepository } from '../../../infrastructure/ports';

/**
 * Use Case: RemoveItem
 *
 * Only the group leader can remove items from the group's bill.
 */
export class RemoveItemUseCase {
    constructor(private readonly groupRepository: GroupRepository) {}

    async execute(
        groupId: string,
        itemId: string,
        requesterId: string,
        leaderId: string
    ): Promise<void> {
        if (requesterId !== leaderId) {
            throw new Error('Solo el líder puede eliminar ítems del grupo.');
        }

        await this.groupRepository.removeItem(groupId, itemId);
    }
}
