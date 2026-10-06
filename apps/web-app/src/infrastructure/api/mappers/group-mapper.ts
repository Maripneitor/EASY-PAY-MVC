import { Group, GroupStatus } from '@easy-pay/domain';
import { ApiItem, toItemList } from './item-mapper';
import { ApiMember, toMemberList } from './member-mapper';

/**
 * Shape of a group as returned by the FastAPI backend.
 * The backend uses "table" terminology — mappers act as the translator.
 */
export interface ApiGroup {
    id: string;
    codigo_invitacion: string;
    nombre?: string;
    admin_id: string;
    integrantes: ApiMember[];
    items?: ApiItem[];
    status?: string;         // 'ACTIVA' | 'CERRADA'
    subtotal?: number;
    tip?: number;
    total?: number;
    version?: number;
    fecha_creacion?: string;
}

/**
 * Maps the API response to the domain `Group` entity.
 */
export const toGroup = (apiGroup: ApiGroup): Group => ({
    id:        apiGroup.id,
    code:      apiGroup.codigo_invitacion,
    name:      apiGroup.nombre,
    leaderId:  apiGroup.admin_id,
    members:   toMemberList(apiGroup.integrantes ?? []),
    items:     toItemList(apiGroup.items ?? []),
    status:    (apiGroup.status?.toLowerCase() as GroupStatus) ?? 'active',
    subtotal:  apiGroup.subtotal ?? 0,
    tip:       apiGroup.tip ?? 0,
    total:     apiGroup.total ?? 0,
    version:   apiGroup.version ?? 1,
    createdAt: apiGroup.fecha_creacion,
});

export const toGroupList = (apiGroups: ApiGroup[]): Group[] =>
    apiGroups.map(toGroup);
