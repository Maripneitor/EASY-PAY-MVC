import { Money } from '../value-objects/Money';
import { TipPercentage } from '../value-objects/TipPercentage';

export interface TipCalculationResult {
    subtotal: Money;
    tip: Money;
    tipPercentage: TipPercentage;
    total: Money;
}

/**
 * Domain Service: TipCalculator
 *
 * Orchestrates the tip calculation using the TipPercentage business rule.
 * This service is the canonical way to compute the full breakdown of a bill.
 *
 * Usage:
 *   const calc = new TipCalculator();
 *   const { tip, total, tipPercentage } = calc.calculate(Money.of(1250));
 *   // tipPercentage.toString() → "10%"
 */
export class TipCalculator {
    calculate(subtotal: Money): TipCalculationResult {
        const tipPercentage = TipPercentage.forSubtotal(subtotal.amount);
        const tip = Money.of(tipPercentage.calculate(subtotal.amount));
        const total = subtotal.add(tip);

        return { subtotal, tip, tipPercentage, total };
    }
}

// ─── Backward-compatible functional API ──────────────────────────────────────
// Preserved from domain/rules/tip.ts so existing imports don't break.

/** @deprecated Use `new TipCalculator().calculate(Money.of(subtotal))` */
export const calculateTip = (subtotal: number): number =>
    TipPercentage.forSubtotal(subtotal).calculate(subtotal);

/** @deprecated Use `TipPercentage.forSubtotal(subtotal).percentage` */
export const getTipPercentage = (subtotal: number): number =>
    TipPercentage.forSubtotal(subtotal).percentage;
