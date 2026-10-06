import React from 'react';
import { cn } from '../../../infrastructure/utils';

type BadgeVariant = 'success' | 'warning' | 'info' | 'danger' | 'neutral';

interface StatusBadgeProps {
    label: string;
    variant?: BadgeVariant;
    pulse?: boolean;
    className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
    success: 'bg-green-500/10 text-green-400 border-green-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    danger: 'bg-red-500/10 text-red-400 border-red-500/20',
    neutral: 'bg-slate-700/30 text-slate-400 border-slate-600/30',
};

const dotStyles: Record<BadgeVariant, string> = {
    success: 'bg-green-400',
    warning: 'bg-amber-400',
    info: 'bg-blue-400',
    danger: 'bg-red-400',
    neutral: 'bg-slate-400',
};

/**
 * A small status badge with optional pulsing dot indicator.
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
    label,
    variant = 'neutral',
    pulse = false,
    className,
}) => (
    <span
        className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
            variantStyles[variant],
            className,
        )}
    >
        <span className={cn('size-1.5 rounded-full', dotStyles[variant], pulse && 'animate-pulse')} />
        {label}
    </span>
);
