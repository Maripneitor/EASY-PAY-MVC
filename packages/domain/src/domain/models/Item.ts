/** Item entity — represents a dish or expense on the group's bill. */

export interface Item {
    id: string;
    description: string;
    amount: number;
    assignedTo: string[]; // Array of Member ids (shared item if length > 1)
    addedBy: string;      // Member id of who added this item
}
