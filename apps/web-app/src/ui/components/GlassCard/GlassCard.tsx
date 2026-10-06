import React from 'react';
import { cn } from '../../../infrastructure/utils';

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
}

/**
 * Reusable glassmorphism card with backdrop blur, subtle border,
 * and deep shadow. Accepts extra Tailwind classes via `className`.
 */
export const GlassCard: React.FC<GlassCardProps> = ({ children, className }) => (
    <div
        className={cn(
            'bg-card-glass backdrop-blur-md border border-card-border rounded-2xl shadow-glass',
            className,
        )}
    >
        {children}
    </div>
);
