import { Item } from '../../../domain/models/Item';
import { GroupRepository } from '../../../infrastructure/ports';

/**
 * Use Case: AddItem
 *
 * Any group member can add an item (dish/expense) to the group's bill.
 * Items start unassigned — the leader assigns them to members afterwards.
 */
export class AddItemUseCase {
    constructor(private readonly groupRepository: GroupRepository) {}

    async execute(
        groupId: string,
        itemData: Pick<Item, 'description' | 'amount'>,
        addedBy: string
    ): Promise<void> {
        if (!itemData.description?.trim()) {
            throw new Error('La descripción del ítem es requerida.');
        }
        if (itemData.amount <= 0) {
            throw new Error('El monto del ítem debe ser mayor a cero.');
        }

        const item: Omit<Item, 'id'> = {
            description: itemData.description.trim(),
            amount:      itemData.amount,
            addedBy,
            assignedTo:  [], // Starts unassigned
        };

        await this.groupRepository.addItem(groupId, item as Item);
    }
}
