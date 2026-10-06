/**
 * Tip Rules:
 * - 10% if subtotal < $3,000 MXN
 * - 5% if subtotal >= $3,000 MXN
 */
export const calculateTip = (subtotal: number): number => {
    const tipPercentage = subtotal < 3000 ? 0.10 : 0.05;
    return subtotal * tipPercentage;
};

export const getTipPercentage = (subtotal: number): number => {
    return subtotal < 3000 ? 10 : 5;
};
