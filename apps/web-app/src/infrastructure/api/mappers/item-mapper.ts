import { Item } from '@easy-pay/domain';

/**
 * Shape of an item as returned by the FastAPI backend.
 */
export interface ApiItem {
    id: string;
    nombre: string;
    precio: number;
    participantes_ids: string[];  // Array of member ids
    comprador_id: string;       // Member id
}

/**
 * Maps a raw API item to the domain `Item` entity.
 */
export const toItem = (apiItem: ApiItem): Item => ({
    id:          apiItem.id,
    description: apiItem.nombre,
    amount:      apiItem.precio,
    assignedTo:  apiItem.participantes_ids ?? [],
    addedBy:     apiItem.comprador_id,
});

export const toItemList = (apiItems: ApiItem[]): Item[] =>
    apiItems.map(toItem);

// ─── Reverse mapper (Domain → API) for write operations ──────────────────────

export const toApiItem = (item: Omit<Item, 'id'>): Omit<ApiItem, 'id'> => ({
    nombre:            item.description,
    precio:            item.amount,
    participantes_ids: item.assignedTo,
    comprador_id:      item.addedBy,
});
