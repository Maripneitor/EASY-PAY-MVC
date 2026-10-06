import { Group } from '../../../domain/models/Group';
import { GroupRepository } from '../../../infrastructure/ports';

/**
 * Use Case: GetGroupUpdate
 * 
 * Subscribes to changes in a specific group.
 */
export class GetGroupUpdateUseCase {
    constructor(private readonly groupRepository: GroupRepository) {}

    execute(groupId: string, callback: (group: Group) => void): () => void {
        return this.groupRepository.onGroupUpdate(groupId, callback);
    }
}
