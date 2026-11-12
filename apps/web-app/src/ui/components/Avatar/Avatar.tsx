import React from 'react';
import { cn } from '../../../infrastructure/utils';

interface AvatarProps {
    name?: string;
    email?: string;
    src?: string;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'neutral' | 'subtle';
    className?: string;
}

function getInitials(name?: string, email?: string): string {
    if (name && name.trim()) {
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return parts[0].slice(0, 2).toUpperCase();
    }
    if (email && email.trim()) {
        return email.trim().slice(0, 2).toUpperCase();
    }
    return 'U';
}

const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base font-semibold',
};

const variantClasses = {
    neutral: 'bg-slate-800/60 text-slate-300 border-white/[0.08]',
    subtle: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
};

/**
 * Avatar renders a soft, desaturated initials placeholder or image
 * avoiding eye-straining solid gradients.
 */
export const Avatar: React.FC<AvatarProps> = ({
    name,
    email,
    src,
    size = 'sm',
    variant = 'neutral',
    className,
}) => {
    const initials = getInitials(name, email);

    if (src) {
        return (
            <img
                src={src}
                alt={name || email || 'Avatar'}
                className={cn(
                    'rounded-full object-cover border shrink-0',
                    sizeClasses[size],
                    variantClasses[variant],
                    className
                )}
            />
        );
    }

    return (
        <div
            className={cn(
                'rounded-full flex items-center justify-center font-medium border shrink-0 select-none backdrop-blur-sm',
                sizeClasses[size],
                variantClasses[variant],
                className
            )}
            title={name || email}
        >
            {initials}
        </div>
    );
};

