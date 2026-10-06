import React from 'react';
import { CheckCircle2, Check } from 'lucide-react';
import { MemberAvatars } from './MemberAvatars';

import type { Member } from '../../../../types';

interface SettledGroupProps {
    id: string;
    name: string;
    icon: React.ReactNode;
    date?: string;
    members: (Member | string)[];
    extraMembers?: number;
    total: number;
}

interface SettledGroupCardProps {
    group: SettledGroupProps;
}

export const SettledGroupCard: React.FC<SettledGroupCardProps> = ({ group }) => {
    return (
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white/30 p-5 shadow-sm backdrop-blur-md transition-all hover:bg-white/60 dark:border-slate-800 dark:bg-slate-900/30 dark:hover:bg-slate-800/60 opacity-75 hover:opacity-100">
            <div className="absolute top-0 right-0 flex items-center gap-1 rounded-bl-xl border-b border-l border-slate-200 bg-slate-100 px-3 py-1.5 text-[0.625rem] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                <CheckCircle2 size={10} className="mr-1" />
                Liquidado
            </div>

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 shadow-sm ring-1 ring-inset ring-black/5 dark:bg-slate-800 dark:text-slate-500 dark:ring-white/5">
                        {group.icon}
                    </div>

                    <div>
                        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">
                            {group.name}
                        </h3>
                        <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
                            Finalizado el {group.date}
                        </p>

                        <MemberAvatars
                            members={group.members}
                            extraMembers={group.extraMembers}
                        />
                    </div>
                </div>

                <div className="flex min-w-[120px] flex-col items-end gap-1">
                    <span className="text-xs font-medium text-slate-400">Total final</span>
                    <span className="mb-2 text-base font-semibold text-slate-500 dark:text-slate-400">
                        ${group.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                    </span>

                    <div className="flex items-center gap-2 text-sm font-medium text-slate-400 dark:text-slate-500">
                        <Check size={14} />
                        <span>Pagado</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
