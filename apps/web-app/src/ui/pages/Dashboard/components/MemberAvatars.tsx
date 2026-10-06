
import React from 'react';
import type { Member } from '../../../../types';

interface MemberAvatarsProps {
    members: (Member | string)[];
    extraMembers?: number;
    maxVisible?: number;
}

export const MemberAvatars: React.FC<MemberAvatarsProps> = ({
    members = [],
    extraMembers = 0,
    maxVisible = 3
}) => {
    const visibleMembers = members.slice(0, maxVisible);
    const hiddenCount = extraMembers > 0
        ? extraMembers
        : Math.max(0, members.length - maxVisible);

    return (
        <div className="flex -space-x-2 overflow-hidden pl-1">
            {visibleMembers.map((m, i) => {
                const name = typeof m === 'string' ? 'Usuario' : m.name || 'Usuario';
                const avatarUrl = typeof m === 'string' 
                    ? m 
                    : ((m as any).avatarUrl || (m as any).avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`);
                const key = typeof m === 'string' ? i : m.id || i;

                return (
                    <img
                        key={key}
                        src={avatarUrl}
                        alt={`Avatar de ${name}`}
                        className="inline-block h-7 w-7 rounded-full ring-2 ring-white dark:ring-slate-800 object-cover bg-slate-100"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (!target.src.includes('ui-avatars.com')) {
                                target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`;
                            }
                        }}
                    />
                );
            })}
            {hiddenCount > 0 && (
                <div className="flex h-7 w-7 items-center justify-center rounded-full ring-2 ring-white dark:ring-slate-800 bg-slate-500 text-xs font-medium text-white">
                    +{hiddenCount}
                </div>
            )}
        </div>
    );
};
