import { ValidationException } from '../exceptions';

/**
 * Value Object: Money
 *
 * Represents an immutable monetary amount in MXN.
 * All arithmetic operations return new Money instances (immutable).
 * Rounds to 2 decimal places to avoid floating-point drift.
 */
export class Money {
    private constructor(private readonly _amount: number) {
        if (!isFinite(_amount)) {
            throw new ValidationException('El monto debe ser un número válido.');
        }
        if (_amount < 0) {
            throw new ValidationException(`El monto no puede ser negativo (recibido: ${_amount}).`);
        }
    }

    // ─── Factories ────────────────────────────────────────────────────────────

    static of(amount: number): Money {
        return new Money(Math.round(amount * 100) / 100);
    }

    static zero(): Money {
        return new Money(0);
    }

    // ─── Accessors ────────────────────────────────────────────────────────────

    get amount(): number {
        return this._amount;
    }

    // ─── Arithmetic ───────────────────────────────────────────────────────────

    add(other: Money): Money {
        return Money.of(this._amount + other._amount);
    }

    subtract(other: Money): Money {
        const result = this._amount - other._amount;
        if (result < 0) {
            throw new ValidationException('El resultado de la resta no puede ser negativo.');
        }
        return Money.of(result);
    }

    multiply(factor: number): Money {
        if (factor < 0) {
            throw new ValidationException('El factor de multiplicación no puede ser negativo.');
        }
        return Money.of(this._amount * factor);
    }

    divide(divisor: number): Money {
        if (divisor === 0) {
            throw new ValidationException('No es posible dividir por cero.');
        }
        return Money.of(this._amount / divisor);
    }

    // ─── Comparison ───────────────────────────────────────────────────────────

    equals(other: Money): boolean {
        return this._amount === other._amount;
    }

    isGreaterThan(other: Money): boolean {
        return this._amount > other._amount;
    }

    isLessThan(other: Money): boolean {
        return this._amount < other._amount;
    }

    isZero(): boolean {
        return this._amount === 0;
    }

    // ─── Formatting ───────────────────────────────────────────────────────────

    /** Returns a formatted MXN currency string, e.g. "$1,250.00" */
    format(locale = 'es-MX', currency = 'MXN'): string {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency,
            minimumFractionDigits: 2,
        }).format(this._amount);
    }

    toString(): string {
        return this.format();
    }
}
