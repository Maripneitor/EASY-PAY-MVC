import { Group } from '../../../domain/models/Group';
import { Money } from '../../../domain/value-objects/Money';
import { TipCalculator } from '../../../domain/services/TipCalculator';
import { BillSplitter, SplitResult } from '../../../domain/services/BillSplitter';

/**
 * Use Case: CalculateShares
 *
 * Pure computation — no I/O, no repository needed.
 * Receives the full Group state and returns each member's share breakdown.
 *
 * This is the core "what do I owe?" calculation of Easy-Pay.
 */
export class CalculateSharesUseCase {
    private readonly tipCalculator = new TipCalculator();
    private readonly billSplitter  = new BillSplitter();

    execute(group: Group): SplitResult {
        const subtotal = Money.of(group.subtotal);
        const { tip }  = this.tipCalculator.calculate(subtotal);

        return this.billSplitter.split(group.members, group.items, tip);
    }
}
