export * from './Member';
export * from './Item';
export * from './Payment';
export * from './Group';

// ─── Backward-compatibility aliases ─────────────────────────────────────────
// These re-exports allow existing code that uses the old names (User, Table)
// to continue working without changes. Migrate usages to the new names.
/** @deprecated Use `Member` instead */
export type { Member as User, MemberRole as UserRole } from './Member';
/** @deprecated Use `Group` instead */
export type { Group as Table, GroupStatus as TableStatus } from './Group';
