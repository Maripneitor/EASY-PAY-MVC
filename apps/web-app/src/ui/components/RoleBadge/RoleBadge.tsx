import React from 'react';
import { cn } from '../../../infrastructure/utils';

interface RoleBadgeProps {
    role: string;
    size?: 'sm' | 'md';
    className?: string;
    showDot?: boolean;
}

function normalizeRoleKey(role: string): 'admin' | 'editor' | 'user' | 'custom' {
    const lower = role.toLowerCase().trim();
    if (lower.includes('admin') || lower.includes('administrador')) return 'admin';
    if (lower.includes('editor')) return 'editor';
    if (lower.includes('user') || lower.includes('usuario') || lower.includes('regular') || lower.includes('viewer')) return 'user';
    return 'custom';
}

const roleStyles: Record<'admin' | 'editor' | 'user' | 'custom', { badge: string; dot: string }> = {
    admin: {
        badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/15',
        dot: 'bg-indigo-400',
    },
    editor: {
        badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/15',
        dot: 'bg-emerald-400',
    },
    user: {
        badge: 'bg-slate-500/10 text-slate-400 border-slate-500/20 hover:bg-slate-500/15',
        dot: 'bg-slate-400',
    },
    custom: {
        badge: 'bg-primary-500/10 text-primary-400 border-primary-500/20 hover:bg-primary-500/15',
        dot: 'bg-primary-400',
    },
};

const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 tracking-tight',
    md: 'text-xs px-2.5 py-1 tracking-normal',
};

/**
 * RoleBadge displays a non-saturated, elegant translucent pill badge
 * adhering to the FinTech obsidian design token guidelines.
 */
export const RoleBadge: React.FC<RoleBadgeProps> = ({
    role,
    size = 'sm',
    className,
    showDot = false,
}) => {
    const key = normalizeRoleKey(role);
    const styling = roleStyles[key];

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full font-medium border backdrop-blur-[2px] transition-colors duration-150 select-none',
                styling.badge,
                sizeStyles[size],
                className
            )}
        >
            {showDot && (
                <span className={cn('size-1.5 rounded-full', styling.dot)} />
            )}
            {role}
        </span>
    );
};

