import { Member } from './Member';
import { Item } from './Item';

/** Group entity — the central aggregate representing a shared bill session (formerly "Table"). */

export type GroupStatus = 'active' | 'closed' | 'paying';

export interface Group {
    id: string;
    code: string;           // Short QR/numerical code members use to join
    name?: string;          // Optional display name (e.g. "Cena de cumpleaños")
    members: Member[];
    items: Item[];
    status: GroupStatus;
    subtotal: number;       // Sum of all items (before tip)
    tip: number;            // Tip amount
    total: number;          // subtotal + tip
    leaderId: string;       // Member id of the group leader
    version: number;        // Sequence number for synchronization
    createdAt?: string;     // ISO 8601 date string
}

/** Lightweight summary used in list views (Dashboard). */
export interface GroupSummary {
    id: string;
    code: string;
    name?: string;
    membersCount: number;
    totalAmount: number;
    myShare: number;
    status: GroupStatus;
}
