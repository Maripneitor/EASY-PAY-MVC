import React, { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '../../../infrastructure/utils';

export type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'subtle' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    children?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
    primary:
        'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-950/50 border border-indigo-400/20 active:bg-indigo-700',
    outline:
        'bg-transparent hover:bg-white/[0.04] text-[var(--text-primary)] border border-white/10 hover:border-white/20 active:bg-white/[0.08]',
    ghost:
        'bg-transparent hover:bg-white/[0.04] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-transparent active:bg-white/[0.08]',
    subtle:
        'bg-indigo-500/10 hover:bg-indigo-500/15 text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 active:bg-indigo-500/20',
    danger:
        'bg-rose-500/10 hover:bg-rose-500/15 text-rose-400 hover:text-rose-300 border border-rose-500/20 active:bg-rose-500/20',
};

const sizeStyles: Record<ButtonSize, string> = {
    sm: 'text-xs px-2.5 py-1.5 rounded-lg gap-1.5',
    md: 'text-sm px-3.5 py-2 rounded-xl gap-2',
    lg: 'text-base px-4 py-2.5 rounded-xl gap-2.5',
    icon: 'p-2 rounded-lg aspect-square justify-center',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            variant = 'outline',
            size = 'md',
            isLoading = false,
            disabled,
            leftIcon,
            rightIcon,
            className,
            children,
            ...props
        },
        ref
    ) => {
        const isDisabled = disabled || isLoading;

        return (
            <motion.button
                ref={ref}
                whileTap={isDisabled ? undefined : { scale: 0.98 }}
                transition={{ duration: 0.12, ease: 'easeOut' }}
                disabled={isDisabled}
                className={cn(
                    'inline-flex items-center justify-center font-medium transition-colors select-none cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed',
                    variantStyles[variant],
                    sizeStyles[size],
                    className
                )}
                {...props}
            >
                {isLoading ? (
                    <Loader2 className="size-4 animate-spin shrink-0 text-current" />
                ) : (
                    leftIcon && <span className="shrink-0">{leftIcon}</span>
                )}
                {children}
                {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
            </motion.button>
        );
    }
);

Button.displayName = 'Button';

