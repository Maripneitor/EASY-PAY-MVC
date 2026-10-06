import React from 'react';
import { cn } from '../../../../infrastructure/utils';

interface BalanceBadgeProps {
    balance: number;
}

export const BalanceBadge: React.FC<BalanceBadgeProps> = ({ balance }) => {
    const isDebt = balance < 0;
    const absBalance = Math.abs(balance);

    return (
        <div className={cn(
            "w-full text-right rounded-lg px-3 py-1.5 border",
            isDebt
                ? "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30"
                : "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30"
        )}>
            <p className={cn(
                "text-[0.625rem] font-bold uppercase tracking-wider",
                isDebt ? "text-red-400" : "text-green-600 dark:text-green-400"
            )}>
                {isDebt ? 'Tu deuda' : 'Te deben'}
            </p>
            <p className={cn(
                "text-lg font-bold",
                isDebt ? "text-red-500" : "text-green-500"
            )}>
                {isDebt ? '-' : '+'}${absBalance.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
            </p>
        </div>
    );
};
