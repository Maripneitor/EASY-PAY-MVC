import { Group } from '../../../domain/models/Group';
import { Member } from '../../../domain/models/Member';
import { GroupRepository } from '../../../infrastructure/ports';

/**
 * Use Case: CreateGroup
 *
 * The authenticated leader creates a new group (shared bill session).
 * The backend generates the short join code and assigns the leader role.
 */
export class CreateGroupUseCase {
    constructor(private readonly groupRepository: GroupRepository) {}

    async execute(leader: Member, groupName?: string): Promise<Group> {
        if (!leader.name?.trim()) {
            throw new Error('El nombre del líder es requerido para crear un grupo.');
        }

        return await this.groupRepository.createGroup(leader, groupName);
    }
}
