import React from 'react';
import { PageHeader } from '@ui/components/PageHeader';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Ghost, Check, X, Users } from 'lucide-react';

export const InvitationsPage = () => {
    const navigate = useNavigate();
    const { toggleSidebar } = useOutletContext<{ toggleSidebar: () => void }>();
    
    // In a real app, this would come from a custom hook calling the API
    const invitations: any[] = []; 

    return (
        <div className="min-h-screen flex flex-col bg-[var(--bg-body)] font-display text-[var(--text-primary)] antialiased transition-colors duration-300">
            <PageHeader
                onMenuClick={toggleSidebar}
                title="Invitaciones"
                subtitle="Grupos que quieren que te unas"
                onBack={() => navigate(-1)}
            />

            <main className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-6 py-8">
                {invitations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-40">
                        <Ghost size={64} className="mb-4 text-[var(--text-secondary)]" />
                        <h3 className="text-xl font-black uppercase tracking-widest">Sin invitaciones</h3>
                        <p className="text-sm font-bold text-[var(--text-secondary)] mt-2">No tienes grupos pendientes por ahora.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {invitations.map((inv) => (
                            <div key={inv.id} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 flex items-center justify-between shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)]">
                                        <Users size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-lg uppercase tracking-tight">{inv.groupName}</h3>
                                        <p className="text-xs text-[var(--text-secondary)] font-bold">Invitado por {inv.inviterName}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl hover:bg-emerald-500 hover:text-white transition-all">
                                        <Check size={20} />
                                    </button>
                                    <button className="p-3 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all">
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};
