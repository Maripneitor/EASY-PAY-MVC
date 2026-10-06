import { Group } from '../../../domain/models/Group';
import { GroupRepository } from '../../../infrastructure/ports';
import { NotFoundException } from '../../../domain/exceptions';

/**
 * Use Case: GetGroup
 * 
 * Retrieves a group by its ID.
 */
export class GetGroupUseCase {
    constructor(private readonly groupRepository: GroupRepository) {}

    async execute(id: string): Promise<Group> {
        const group = await this.groupRepository.getGroup(id);
        if (!group) {
            throw new NotFoundException('Grupo', id);
        }
        return group;
    }
}
