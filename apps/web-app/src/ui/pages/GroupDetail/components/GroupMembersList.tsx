import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    User, Mail, Clock, Trash2, RotateCw, Crown, 
    ShieldCheck, CheckCircle2, MoreVertical, X, 
    UserPlus, Zap, Copy, Check, Scan, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../../../infrastructure/utils';

export interface GroupMemberItem {
    id: string;
    nombre: string;
    email?: string;
    trust_score?: number;
    fast_payments_count?: number;
    avatar_url?: string;
}

export interface PendingInvitationItem {
    id?: string;
    _id?: string;
    invited_email: string;
    invited_by_name?: string;
    created_at?: string;
    email_delivered?: boolean;
    email_error?: string;
    status?: string;
}

interface GroupMembersListProps {
    members: GroupMemberItem[];
    pendingInvitations: PendingInvitationItem[];
    adminId?: string;
    currentUserId?: string;
    groupCode?: string;
    isAdmin: boolean;
    onOpenAddMember: () => void;
    onRemoveMember: (memberId: string) => Promise<void> | void;
    onCancelInvitation: (invitationId: string) => Promise<void> | void;
    onResendInvitation: (invitationId: string) => Promise<void> | void;
}

export const GroupMembersList: React.FC<GroupMembersListProps> = ({
    members,
    pendingInvitations,
    adminId,
    currentUserId,
    groupCode,
    isAdmin,
    onOpenAddMember,
    onRemoveMember,
    onCancelInvitation,
    onResendInvitation
}) => {
    const [copiedCode, setCopiedCode] = useState(false);
    const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
    const [memberToDelete, setMemberToDelete] = useState<GroupMemberItem | null>(null);
    const [isResending, setIsResending] = useState<string | null>(null);
    const [isCanceling, setIsCanceling] = useState<string | null>(null);

    const handleCopyCode = async () => {
        if (!groupCode) return;
        try {
            await navigator.clipboard.writeText(groupCode);
            setCopiedCode(true);
            toast.success("Código copiado al portapapeles");
            setTimeout(() => setCopiedCode(false), 2000);
        } catch {
            toast.error("No se pudo copiar el código");
        }
    };

    const handleResend = async (invitationId: string) => {
        setIsResending(invitationId);
        try {
            await onResendInvitation(invitationId);
        } finally {
            setIsResending(null);
        }
    };

    const handleCancel = async (invitationId: string) => {
        setIsCanceling(invitationId);
        try {
            await onCancelInvitation(invitationId);
        } finally {
            setIsCanceling(null);
        }
    };

    const confirmDeleteMember = async () => {
        if (!memberToDelete) return;
        try {
            await onRemoveMember(memberToDelete.id);
            setMemberToDelete(null);
        } catch {
            // error handled in hook
        }
    };

    return (
        <div className="space-y-8">
            {/* Cabecera Principal de Miembros */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/40 dark:bg-slate-900/60 bg-white/60 border border-slate-200 dark:border-slate-800/80 backdrop-blur-md shadow-sm">
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black uppercase tracking-tight text-[var(--text-primary)]">
                            Miembros del Grupo
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                            {members.length} {members.length === 1 ? 'miembro' : 'miembros'}
                        </span>
                    </div>
                    <p className="text-xs font-medium text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                        <span>{members.length} participantes activos</span>
                        {pendingInvitations.length > 0 && (
                            <>
                                <span className="inline-block w-1 h-1 rounded-full bg-slate-600" />
                                <span className="text-amber-400 font-semibold">
                                    {pendingInvitations.length} esperando aceptación
                                </span>
                            </>
                        )}
                    </p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                    {/* Botón de Código de Invitación con Copia Rápida */}
                    {groupCode && (
                        <button
                            type="button"
                            onClick={handleCopyCode}
                            className="px-3.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-[var(--text-primary)] border border-slate-700/80 hover:border-cyan-500/40 font-mono text-xs font-bold flex items-center gap-2 transition-all active:scale-95 shadow-sm"
                            title="Haz clic para copiar el código del grupo"
                        >
                            <Scan size={14} className="text-cyan-400 shrink-0" />
                            <span className="tracking-widest">{groupCode}</span>
                            {copiedCode ? (
                                <Check size={14} className="text-emerald-400 shrink-0 ml-1" />
                            ) : (
                                <Copy size={13} className="text-slate-400 shrink-0 ml-1" />
                            )}
                        </button>
                    )}

                    {/* Botón Invitar */}
                    {isAdmin && (
                        <button 
                            type="button"
                            onClick={onOpenAddMember}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
                        >
                            <UserPlus size={15} />
                            <span>Invitar</span>
                        </button>
                    )}
                </div>
            </div>

            {/* SECCIÓN 1: PARTICIPANTES ACTIVOS */}
            <div className="space-y-3.5">
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                        <h4 className="text-xs font-black uppercase tracking-wider text-[var(--text-primary)]">
                            Participantes Activos ({members.length})
                        </h4>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400">
                        Acceso confirmado al grupo
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {members.map((member, i) => {
                        const isMemberAdmin = member.id === adminId;
                        const isCurrentUser = member.id === currentUserId;
                        const isDropdownOpen = activeDropdownId === member.id;

                        return (
                            <motion.div
                                key={member.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03, duration: 0.2 }}
                                className={cn(
                                    "relative p-4 rounded-xl",
                                    "bg-slate-900/70 dark:bg-slate-900/80 bg-white border border-slate-200 dark:border-slate-800/80",
                                    "hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/5",
                                    "flex items-center justify-between gap-3.5",
                                    "transition-all duration-200 group"
                                )}
                            >
                                {/* Lado Izquierdo: Avatar + Info */}
                                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                    <div className="relative shrink-0">
                                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-800 dark:to-slate-900 border border-slate-700/80 flex items-center justify-center text-sm font-black text-cyan-400 shadow-sm">
                                            {member.nombre?.charAt(0)?.toUpperCase() || 'U'}
                                        </div>
                                        {isMemberAdmin && (
                                            <div 
                                                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gradient-to-tr from-amber-500 to-amber-300 rounded-full border-2 border-slate-900 flex items-center justify-center shadow-sm"
                                                title="Organizador del Grupo"
                                            >
                                                <Crown size={10} className="text-slate-950 stroke-[2.5]" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <p 
                                                className="font-bold text-sm text-[var(--text-primary)] truncate"
                                                title={member.nombre}
                                            >
                                                {member.nombre}
                                            </p>
                                            {((member.trust_score ?? 0) >= 5 || (member.fast_payments_count ?? 0) >= 10) && (
                                                <div 
                                                    className="px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md flex items-center gap-0.5 shrink-0" 
                                                    title="Buen Pagador (pagos en <24h)"
                                                >
                                                    <Zap size={9} className="text-emerald-400 fill-emerald-400" />
                                                    <span className="text-[8px] font-black text-emerald-400 uppercase tracking-wider">Top</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className={cn(
                                                "text-[10px] font-bold uppercase tracking-wider",
                                                isMemberAdmin ? "text-amber-400" : "text-slate-400"
                                            )}>
                                                {isCurrentUser
                                                    ? (isMemberAdmin ? "Tú (Organizador)" : "Tú")
                                                    : (isMemberAdmin ? "Organizador" : "Miembro Activo")}
                                            </span>
                                            {isCurrentUser && (
                                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Lado Derecho: Acciones Contextuales Limpias */}
                                <div className="shrink-0 flex items-center gap-1.5 relative">
                                    {isAdmin && !isCurrentUser ? (
                                        <div className="relative">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveDropdownId(isDropdownOpen ? null : member.id);
                                                }}
                                                className={cn(
                                                    "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                                                    "text-slate-400 hover:text-slate-200 hover:bg-slate-800 active:scale-95",
                                                    isDropdownOpen ? "bg-slate-800 text-slate-100" : ""
                                                )}
                                                title="Opciones del miembro"
                                                aria-label="Opciones del miembro"
                                            >
                                                <MoreVertical size={16} />
                                            </button>

                                            {/* Dropdown contextual */}
                                            <AnimatePresence>
                                                {isDropdownOpen && (
                                                    <>
                                                        <div 
                                                            className="fixed inset-0 z-40" 
                                                            onClick={() => setActiveDropdownId(null)}
                                                        />
                                                        <motion.div
                                                            initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                                            exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                                            transition={{ duration: 0.15 }}
                                                            className="absolute right-0 top-full mt-1.5 z-50 w-48 p-1.5 rounded-xl bg-slate-900 border border-slate-700 shadow-xl backdrop-blur-xl"
                                                        >
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setActiveDropdownId(null);
                                                                    setMemberToDelete(member);
                                                                }}
                                                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors text-left"
                                                            >
                                                                <Trash2 size={14} className="shrink-0" />
                                                                <span>Eliminar del grupo</span>
                                                            </button>
                                                        </motion.div>
                                                    </>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    ) : (
                                        <div className="w-8 h-8 flex items-center justify-center text-slate-600">
                                            <ShieldCheck size={16} className={isMemberAdmin ? "text-amber-400/60" : "text-slate-600"} />
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* SECCIÓN 2: ESPERANDO ACEPTACIÓN (INVITACIONES PENDIENTES) */}
            <div className="space-y-3.5 pt-4 border-t border-slate-800/80">
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shadow-sm shadow-amber-400/50" />
                        <h4 className="text-xs font-black uppercase tracking-wider text-amber-400">
                            Esperando Aceptación ({pendingInvitations.length})
                        </h4>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400">
                        Invitación enviada por correo electrónico
                    </span>
                </div>

                {pendingInvitations.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-slate-900/30 dark:bg-slate-900/40 border border-dashed border-slate-800 text-center">
                        <Mail className="mx-auto text-slate-500 mb-2 opacity-60" size={24} />
                        <p className="text-xs font-bold text-slate-400">No hay invitaciones pendientes</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                            Invita a nuevos amigos o compañeros usando el botón "Invitar" arriba.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        {pendingInvitations.map((inv, i) => {
                            const invitationId = inv.id || inv._id || '';
                            const isThisResending = isResending === invitationId;
                            const isThisCanceling = isCanceling === invitationId;

                            return (
                                <motion.div
                                    key={invitationId || i}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.03, duration: 0.2 }}
                                    className={cn(
                                        "relative p-4 rounded-xl",
                                        "bg-amber-500/[0.04] dark:bg-amber-500/[0.03] border border-amber-500/20",
                                        "hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/5",
                                        "flex items-center justify-between gap-3.5",
                                        "transition-all duration-200"
                                    )}
                                >
                                    {/* Lado Izquierdo: Icono + Correo */}
                                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                                            {inv.invited_email ? inv.invited_email.charAt(0).toUpperCase() : <Mail size={16} />}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p 
                                                className="text-xs font-bold text-[var(--text-primary)] truncate"
                                                title={inv.invited_email}
                                            >
                                                {inv.invited_email}
                                            </p>
                                            <div className="flex items-center gap-1.5 mt-0.5 text-[9px] font-semibold text-slate-400">
                                                <Clock size={10} className="text-amber-400/80 shrink-0" />
                                                <span className="truncate">
                                                    Invitado por {inv.invited_by_name || 'Admin'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Lado Derecho: Acciones (Reenviar / Cancelar) */}
                                    <div className="shrink-0 flex items-center gap-1.5">
                                        {isAdmin && (
                                            <>
                                                {/* Botón Reenviar Correo */}
                                                <button
                                                    type="button"
                                                    disabled={isThisResending || isThisCanceling}
                                                    onClick={() => handleResend(invitationId)}
                                                    className={cn(
                                                        "p-2 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10",
                                                        "border border-transparent hover:border-cyan-500/20 transition-all active:scale-95",
                                                        "disabled:opacity-50"
                                                    )}
                                                    title="Reenviar correo de invitación"
                                                    aria-label="Reenviar correo"
                                                >
                                                    <RotateCw size={14} className={isThisResending ? "animate-spin text-cyan-400" : ""} />
                                                </button>

                                                {/* Botón Cancelar Invitación */}
                                                <button
                                                    type="button"
                                                    disabled={isThisResending || isThisCanceling}
                                                    onClick={() => handleCancel(invitationId)}
                                                    className={cn(
                                                        "p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10",
                                                        "border border-transparent hover:border-rose-500/20 transition-all active:scale-95",
                                                        "disabled:opacity-50"
                                                    )}
                                                    title="Cancelar invitación"
                                                    aria-label="Cancelar invitación"
                                                >
                                                    <X size={14} className={isThisCanceling ? "animate-pulse text-rose-400" : ""} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal de Confirmación para Eliminar Miembro */}
            <AnimatePresence>
                {memberToDelete && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMemberToDelete(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="relative w-full max-w-sm p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl text-center space-y-4"
                        >
                            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <h4 className="text-base font-bold text-white">¿Eliminar miembro?</h4>
                                <p className="text-xs text-slate-400 mt-1">
                                    ¿Estás seguro de que deseas retirar a <span className="font-semibold text-slate-200">{memberToDelete.nombre}</span> del grupo?
                                </p>
                            </div>
                            <div className="flex items-center gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setMemberToDelete(null)}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmDeleteMember}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white shadow-lg shadow-rose-600/20 transition-all active:scale-95"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

