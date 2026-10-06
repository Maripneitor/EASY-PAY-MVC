import { ValidationException } from '../exceptions';

/**
 * Value Object: TipPercentage
 *
 * Encapsulates the Easy-Pay tip business rule:
 *   - 10% if subtotal < $3,000 MXN
 *   - 5%  if subtotal >= $3,000 MXN
 *
 * This is the single source of truth for the tip rule.
 * If the rule changes, this is the ONLY place to update it.
 */
export class TipPercentage {
    // ─── Business Rules ───────────────────────────────────────────────────────
    static readonly THRESHOLD_MXN = 3_000;
    static readonly HIGH_TIP_RATE = 0.10; // Applied when subtotal < THRESHOLD
    static readonly LOW_TIP_RATE  = 0.05; // Applied when subtotal >= THRESHOLD

    private constructor(private readonly _rate: number) {}

    // ─── Factories ────────────────────────────────────────────────────────────

    /**
     * Creates the correct TipPercentage based on the Easy-Pay business rule.
     * @param subtotal - The group's subtotal before tip (in MXN)
     */
    static forSubtotal(subtotal: number): TipPercentage {
        const rate = subtotal < TipPercentage.THRESHOLD_MXN
            ? TipPercentage.HIGH_TIP_RATE
            : TipPercentage.LOW_TIP_RATE;
        return new TipPercentage(rate);
    }

    /** Creates a custom tip percentage. Rate must be between 0 and 1. */
    static custom(rate: number): TipPercentage {
        if (rate < 0 || rate > 1) {
            throw new ValidationException(`El porcentaje de propina debe estar entre 0 y 1 (recibido: ${rate}).`);
        }
        return new TipPercentage(rate);
    }

    // ─── Accessors ────────────────────────────────────────────────────────────

    /** The rate as a decimal (e.g. 0.10) */
    get rate(): number {
        return this._rate;
    }

    /** The rate as a whole number percentage (e.g. 10) */
    get percentage(): number {
        return this._rate * 100;
    }

    // ─── Methods ──────────────────────────────────────────────────────────────

    /** Calculates the tip amount for a given subtotal, rounded to 2 decimals. */
    calculate(subtotal: number): number {
        return Math.round(subtotal * this._rate * 100) / 100;
    }

    equals(other: TipPercentage): boolean {
        return this._rate === other._rate;
    }

    toString(): string {
        return `${this.percentage}%`;
    }
}
