import { Group } from '../../../domain/models/Group';
import { Member } from '../../../domain/models/Member';
import { GroupRepository } from '../../../infrastructure/ports';

/**
 * Use Case: JoinGroup
 *
 * A registered user or guest joins an existing group using its short code.
 * Guests only provide a name; registered users have a full Member profile.
 */
export class JoinGroupUseCase {
    constructor(private readonly groupRepository: GroupRepository) {}

    async execute(code: string, member: Member): Promise<Group> {
        if (!member.name?.trim()) {
            throw new Error('El nombre es requerido para unirse a un grupo.');
        }
        if (!code?.trim()) {
            throw new Error('Se requiere un código de grupo válido.');
        }

        return await this.groupRepository.joinGroup(code, member);
    }
}
