import { Item } from '../models/Item';
import { Member } from '../models/Member';
import { Money } from '../value-objects/Money';

export interface MemberShare {
    memberId: string;
    memberName: string;
    /** Items fully or partially assigned to this member */
    items: Array<{ item: Item; splitAmount: Money }>;
    subtotal: Money;
    tip: Money;
    total: Money;
}

export interface SplitResult {
    shares: MemberShare[];
    groupSubtotal: Money;
    groupTip: Money;
    groupTotal: Money;
    /** Items with no assignees — require leader action before closing the group */
    unassignedItems: Item[];
}

/**
 * Domain Service: BillSplitter
 *
 * Calculates each member's monetary share of a group bill.
 *
 * Rules:
 *  - If an item is assigned to 1 member → full cost to that member.
 *  - If an item is assigned to N members → cost split equally (N-way).
 *  - Tip is pro-rated per member based on their share of the subtotal.
 *  - Items with no assignees are returned as `unassignedItems`.
 *
 * Usage:
 *   const splitter = new BillSplitter();
 *   const result = splitter.split(members, items, Money.of(125));
 */
export class BillSplitter {
    split(members: Member[], items: Item[], tip: Money): SplitResult {
        const unassignedItems = items.filter(item => item.assignedTo.length === 0);
        const assignedItems   = items.filter(item => item.assignedTo.length > 0);

        const groupSubtotal = items.reduce(
            (acc, item) => acc.add(Money.of(item.amount)),
            Money.zero()
        );
        const groupTotal = groupSubtotal.add(tip);

        const shares: MemberShare[] = members.map(member => {
            // Collect this member's portion of each assigned item
            const memberItemDetails = assignedItems
                .filter(item => item.assignedTo.includes(member.id))
                .map(item => ({
                    item,
                    splitAmount: Money.of(item.amount / item.assignedTo.length),
                }));

            const memberSubtotal = memberItemDetails.reduce(
                (acc, { splitAmount }) => acc.add(splitAmount),
                Money.zero()
            );

            // Pro-rate tip proportionally to this member's share
            const memberTip = groupSubtotal.isZero()
                ? Money.zero()
                : tip.multiply(memberSubtotal.amount / groupSubtotal.amount);

            return {
                memberId:   member.id,
                memberName: member.name,
                items:      memberItemDetails,
                subtotal:   memberSubtotal,
                tip:        memberTip,
                total:      memberSubtotal.add(memberTip),
            };
        });

        return { shares, groupSubtotal, groupTip: tip, groupTotal, unassignedItems };
    }
}
