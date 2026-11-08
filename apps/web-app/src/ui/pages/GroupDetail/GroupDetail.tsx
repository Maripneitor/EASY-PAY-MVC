import React, { useState, useEffect } from 'react';
import { 
    Settings, Plus, Receipt, UserCircle, ArrowRight, ArrowLeft,
    CreditCard, Pencil, Trash2, Users, Download, 
    PieChart, Activity, Info, Scan, Utensils, Car, Gamepad2, ShoppingBag, Briefcase,
    X,
    Check,
    CheckCircle,
    User,
    DollarSign,
    Copy,
    Zap,
    AlertTriangle,
    AlertCircle,
    Save,
    TrendingUp,
    TrendingDown,
    Loader2,
    Share2,
    Clock,
    UserPlus
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../infrastructure/utils';
import { useGroupDetail } from './useGroupDetail';
import { useParams, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../infrastructure/routes';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

import { httpClient } from '../../../infrastructure/api/http-client';
import { SettlementWizard } from './components/SettlementWizard';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { TransactionDetailModal } from '../MyPayments/components/TransactionDetailModal';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { AddMemberModal } from './components/AddMemberModal';
import { GroupMembersList } from './components/GroupMembersList';
import { useMyPayments } from '../MyPayments/useMyPayments';
import { AddCardModal } from '../MyPayments/components/AddCardModal';
import { PaymentCard } from '../../components/Dashboard/PaymentCard';
import { groupRepository } from '../../../infrastructure/api/repositories';

import { TwoFactorModal } from '../../components/Security/TwoFactorModal';
import { EditGroupModal } from '../Groups/components/EditGroupModal';
import { EditItemModal } from './components/EditItemModal';
import { useAuthContext } from '../../context/AuthContext';

const I18N_TEXTS = {
    TABS: {
        ACTIVITIES: 'Actividad',
        BALANCES: 'Saldos',
        MEMBERS: 'Miembros',
        PAYMENTS: 'Pagos'
    },
    BALANCES_TITLE: 'Balance de Cuentas',
    BALANCES_DESC: 'Cómo se dividen los gastos actualmente',
    SETTLE_GROUP: 'Liquidar Grupo',
    STATUS: {
        FAVOR: 'Saldo a favor',
        DEBT: 'Deuda pendiente'
    },
    PAY_BUTTON: 'Pagar',
    MEMBERS_TITLE: 'Miembros del Grupo',
    MEMBERS_DESC_SUFFIX: 'personas conectadas',
    EMPTY_CARDS_TITLE: 'No tienes tarjetas guardadas',
    EMPTY_CARDS_DESC: 'Agrega una para liquidar tus deudas fácilmente',
    HOLDER_LABEL: 'TITULAR'
} as const;


export const GroupDetail = () => {
    const params = useParams();
    const finalId = params.groupId || params.group_id || params.id || "";
    const { user } = useAuthContext();
    const navigate = useNavigate();

    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState<any>(null);
    const [isEditingGroupOpen, setIsEditingGroupOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    // Quick Assignment Mode States
    const [isQuickAssignMode, setIsQuickAssignMode] = useState(false);
    const [pendingAssignments, setPendingAssignments] = useState<Record<string, string[]>>({});
    const [isEditItemModalOpen, setIsEditItemModalOpen] = useState(false);
    const [itemToEdit, setItemToEdit] = useState<any>(null);

    useKeyboardShortcuts(() => {
        setIsWizardOpen(false);
        setIsQuickAssignMode(false);
    });

    const {
        activeTab, setActiveTab, groupName, groupDescription, groupCode, totalSpent,
        userShare, userOwed, activities, balances, members,
        membersData, pendingInvitations, cancelInvitation, resendInvitation, isFetchingGroup, adminId, currentUserId,
        isRefreshing, refresh, removeMember,
        deleteGroup, confirmDeleteGroup, deleteItem,
        is2FAModalOpen, setIs2FAModalOpen, leaderProfile,
        pendingSettlements,
        approveSettlement,
        rejectSettlement
    } = useGroupDetail(finalId);

    const deepLinkUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/join?code=${groupCode}&group=${finalId}`
        : '';

    const handleCopyCode = () => {
        if (!groupCode) return;
        navigator.clipboard.writeText(groupCode);
        setIsCopied(true);
        toast.success("Código de invitación copiado al portapapeles");
        setTimeout(() => {
            setIsCopied(false);
        }, 2000);
    };

    const handleCopyDeepLink = () => {
        if (!deepLinkUrl) return;
        navigator.clipboard.writeText(deepLinkUrl);
        toast.success("Enlace de invitación directa copiado al portapapeles");
    };

    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
    const { 
        cards, loading: isFetchingCards, refreshCards, 
        handleDeleteCard, isAddingCard: isAddCardOpen, 
        setIsAddingCard: setIsAddCardOpen 
    } = useMyPayments();
    
    const userRoles = (user?.roles || ['Usuario Regular']).map((r: string) => r.toLowerCase());
    const isGlobalAdmin = userRoles.includes('administrador') || userRoles.includes('admin');
    const isEditor = userRoles.includes('editor');
    const userPermissions = user?.permissions || [];
    const isAdmin = adminId === currentUserId || isGlobalAdmin;
    const canWriteExpenses = isAdmin || isEditor || userPermissions.includes('expenses:write');
    useDocumentTitle(groupName ? `${groupName} - Detalle` : 'Detalle de Grupo');

    const handleApprove = async (s: any) => {
        const confirmed = window.confirm(`¿Confirmas que has recibido el pago de $${s.amount} por parte de ${membersData.find(m => m.id === s.payer_id)?.nombre || 'un miembro'}?`);
        if (confirmed) {
            await approveSettlement(s.id);
        }
    };

    const handleReject = async (s: any) => {
        const reason = window.prompt(`¿Por qué rechazas el pago de $${s.amount}?`, "No se visualiza en mi cuenta bancaria");
        if (reason !== null) {
            await rejectSettlement(s.id, reason);
        }
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        const date = new Date().toLocaleDateString();

        doc.setFontSize(22);
        doc.setTextColor(59, 130, 246);
        doc.text("EASY-PAY", 14, 20);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Reporte de Gastos: ${groupName}`, 14, 30);
        doc.text(`Fecha: ${date}`, 14, 35);
        doc.text(`Código: ${groupCode}`, 14, 40);

        const tableData = activities.map((act: any) => [
            act.nombre,
            membersData.find(i => i.id === act.comprador_id)?.nombre || "N/A",
            `$${Number(act.monto).toFixed(2)}`,
            act.fecha
        ]);

        (doc as any).autoTable({
            head: [['Gasto', 'Pagado por', 'Monto', 'Fecha']],
            body: tableData,
            startY: 50,
            theme: 'grid',
            headStyles: { fillColor: [59, 130, 246] }
        });

        doc.save(`EasyPay_${groupName}_${date}.pdf`);
        toast.success("PDF generado correctamente");
    };

    const handleToggleQuickAssign = () => {
        if (!isQuickAssignMode) {
            // Enter mode: initialize pendingAssignments with current values
            const initial: Record<string, string[]> = {};
            activities.forEach((act: any) => {
                initial[act.id] = [...(act.participantes_ids || [])];
            });
            setPendingAssignments(initial);
        }
        setIsQuickAssignMode(!isQuickAssignMode);
    };

    const toggleMemberInItem = (itemId: string, memberId: string) => {
        setPendingAssignments(prev => {
            const current = prev[itemId] || [];
            if (current.includes(memberId)) {
                return { ...prev, [itemId]: current.filter(id => id !== memberId) };
            } else {
                return { ...prev, [itemId]: [...current, memberId] };
            }
        });
    };

    const handleSaveQuickAssignments = async () => {
        const loadingToast = toast.loading("Guardando asignaciones...");
        try {
            await Promise.all(
                Object.entries(pendingAssignments).map(([itemId, memberIds]) => 
                    groupRepository.assignItem(finalId, itemId, memberIds)
                )
            );
            toast.dismiss(loadingToast);
            toast.success("Asignaciones guardadas correctamente");
            setIsQuickAssignMode(false);
            refresh();
        } catch (error) {
            toast.dismiss(loadingToast);
            toast.error("Error al guardar algunas asignaciones");
        }
    };

    const handleEditItem = async (itemId: string, data: any) => {
        try {
            await groupRepository.editItem(finalId, itemId, data);
            toast.success("Gasto actualizado");
            refresh();
        } catch (error) {
            toast.error("Error al actualizar el gasto");
        }
    };

    if (isFetchingGroup) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Cargando grupo...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 sm:space-y-8 pb-20">
            {/* Cabecera Unificada y Cohesiva del Grupo (Sin solapamientos ni doble franja) */}
            <div className="bg-[#0f172a] border border-slate-800/80 rounded-3xl p-4 sm:p-6 shadow-sm space-y-4">
                {/* Fila Principal: Botón Retroceso ("←") y Título en una sola línea horizontal limpia */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <button
                            type="button"
                            onClick={() => navigate(ROUTES.GROUPS)}
                            className="w-10 h-10 rounded-2xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-slate-200 hover:text-white border border-slate-700/80 flex items-center justify-center transition-transform duration-150 shrink-0 shadow-sm"
                            aria-label="Volver a Mis Grupos"
                            title="Volver a Mis Grupos"
                        >
                            <ArrowLeft size={18} strokeWidth={2.5} />
                        </button>

                        <div className="min-w-0 flex-1">
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight truncate leading-tight">
                                {groupName || "Detalle de Grupo"}
                            </h1>
                            {groupDescription && (
                                <p className="text-xs text-slate-400 font-medium truncate mt-0.5">
                                    {groupDescription}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Acciones Rápidas: Copiar Código de Invitación e Invitar */}
                    <div className="flex items-center gap-2.5 shrink-0 pl-13 sm:pl-0">
                        <button
                            type="button"
                            onClick={handleCopyCode}
                            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800/80 hover:bg-slate-800 active:scale-[0.97] text-slate-200 hover:text-white rounded-xl border border-slate-700/80 text-xs font-black uppercase tracking-wider shadow-sm transition-transform duration-200 ease-out group"
                            title="Copiar código de invitación"
                        >
                            <AnimatePresence mode="wait" initial={false}>
                                {isCopied ? (
                                    <motion.div
                                        key="copied"
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.8, opacity: 0 }}
                                        className="flex items-center gap-1.5 text-emerald-400"
                                    >
                                        <Check size={14} className="stroke-[3]" />
                                        <span>¡Copiado!</span>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="copy"
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.8, opacity: 0 }}
                                        className="flex items-center gap-2"
                                    >
                                        <Copy size={14} className="text-cyan-400 group-hover:scale-110 transition-transform" />
                                        <span>Código: <span className="font-mono text-cyan-300 tracking-wider font-bold">{groupCode || '...'}</span></span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </button>

                        {isAdmin && (
                            <button
                                type="button"
                                onClick={() => setIsAddMemberOpen(true)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 active:scale-[0.97] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-blue-600/20 transition-transform duration-200 ease-out"
                                title="Añadir miembro directamente"
                            >
                                <Plus size={14} strokeWidth={2.5} />
                                <span>Invitar</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Sub-fila: Lista de Participantes Activos Integrada */}
                <div className="pt-3.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="flex -space-x-2.5 overflow-hidden pl-1 py-1">
                            {members.slice(0, 5).map((m: any, i: number) => {
                                const name = m.nombre || m.name || `Integrante ${i + 1}`;
                                const initial = name.charAt(0).toUpperCase();
                                const colors = [
                                    'bg-blue-600 text-white',
                                    'bg-emerald-600 text-white',
                                    'bg-purple-600 text-white',
                                    'bg-amber-600 text-white',
                                    'bg-rose-600 text-white',
                                    'bg-cyan-600 text-white',
                                ];
                                const colorClass = colors[i % colors.length];

                                return (
                                    <div
                                        key={m.id || i}
                                        title={name}
                                        className={cn(
                                            "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-black ring-2 ring-[#0f172a] shadow-sm select-none transition-transform hover:scale-110 hover:z-10",
                                            colorClass
                                        )}
                                    >
                                        {initial}
                                    </div>
                                );
                            })}
                            {members.length > 5 && (
                                <div 
                                    title={`${members.length - 5} integrantes más`}
                                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-800 text-slate-300 ring-2 ring-[#0f172a] flex items-center justify-center text-[11px] font-black shadow-sm"
                                >
                                    +{members.length - 5}
                                </div>
                            )}
                        </div>

                        <span className="text-xs font-bold text-slate-300 tracking-wide">
                            {members.length} {members.length === 1 ? 'participante activo' : 'participantes activos'}
                        </span>
                    </div>

                    <button 
                        type="button"
                        onClick={() => setActiveTab('miembros')}
                        className="text-xs font-bold text-cyan-400 hover:text-cyan-300 uppercase tracking-wider transition-colors inline-flex items-center gap-1 group"
                    >
                        <span>Ver todos los integrantes</span>
                        <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                    </button>
                </div>
            </div>

            {/* Stats Cards (Métricas adaptables, elásticas y explicativas) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                    { 
                        label: "Total Gastado", 
                        value: totalSpent, 
                        icon: <Receipt size={22} className="text-blue-500" />, 
                        bg: "bg-blue-500/10 border border-blue-500/20",
                        textColor: "text-white",
                        subtext: "Incluye propinas e impuestos calculados",
                        tooltip: "Suma acumulada de todos los gastos, propinas e impuestos registrados en el grupo."
                    },
                    { 
                        label: "Tu Parte", 
                        value: userShare, 
                        icon: <UserCircle size={22} className="text-cyan-400" />, 
                        bg: "bg-cyan-500/10 border border-cyan-500/20",
                        textColor: "text-white",
                        subtext: "Tu consumo individual neto",
                        tooltip: "Monto neto asignado a tu cuenta según los ítems y gastos en los que participas."
                    },
                    { 
                        label: userOwed < -0.01 ? "Debes" : (userOwed > 0.01 ? "Te Deben" : "Al día"), 
                        value: Math.abs(userOwed), 
                        icon: userOwed < -0.01 
                            ? <TrendingDown size={22} className="text-rose-500" /> 
                            : (userOwed > 0.01 ? <TrendingUp size={22} className="text-emerald-400" /> : <Check size={22} className="text-slate-400" />), 
                        bg: userOwed < -0.01 
                            ? "bg-rose-500/10 border border-rose-500/20" 
                            : (userOwed > 0.01 ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-slate-800/40 border border-slate-700/40"),
                        textColor: userOwed < -0.01 
                            ? "text-rose-400" 
                            : (userOwed > 0.01 ? "text-emerald-400" : "text-slate-300"),
                        subtext: userOwed < -0.01 
                            ? "Saldo pendiente por liquidar" 
                            : (userOwed > 0.01 ? "Saldo a tu favor por cobrar" : "Todas tus cuentas al día"),
                        tooltip: "Balance final obtenido al restar tu consumo de lo que has pagado directamente.",
                        action: userOwed < -0.01 ? (
                            <button 
                                onClick={() => navigate(ROUTES.SETTLE_UP(finalId))}
                                className="mt-2.5 px-3 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-[10px] font-black uppercase tracking-wider transition-transform duration-200 ease-out hover:scale-[1.02] active:scale-[0.97]"
                            >
                                Pagar Ahora
                            </button>
                        ) : null
                    },
                ].map((stat, i) => (
                    <div 
                        key={i}
                        className={cn(
                            "p-5 sm:p-6 bg-[#0f172a] border border-slate-800/80 rounded-3xl flex items-center gap-4 sm:gap-5 shadow-sm hover:border-slate-700/80 transition-colors",
                            i === 2 && "sm:col-span-2 lg:col-span-1"
                        )}
                    >
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm", stat.bg)}>
                            {stat.icon}
                        </div>
                        <div className="min-w-0 flex-1 overflow-hidden">
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 truncate">{stat.label}</p>
                                <span title={stat.tooltip} className="cursor-help text-slate-500 hover:text-cyan-400 transition-colors inline-flex" aria-label={stat.tooltip}>
                                    <Info size={11} />
                                </span>
                            </div>
                            <p className={cn("text-2xl sm:text-3xl font-black tracking-tight truncate", stat.textColor)} title={`$${Number(stat.value || 0).toFixed(2)}`}>
                                ${Number(stat.value || 0).toFixed(2)}
                            </p>
                            <p className="text-[10px] font-semibold text-slate-400/80 truncate mt-0.5" title={stat.subtext}>
                                {stat.subtext}
                            </p>
                            {(stat as any).action}
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Section */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[3rem] overflow-hidden shadow-sm">
                <div className="flex border-b border-[var(--border-color)] overflow-x-auto no-scrollbar">
                    {(isAdmin ? ['actividades', 'saldos', 'miembros', 'ajustes'] : ['actividades', 'saldos', 'miembros']).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={cn(
                                "flex-1 min-w-[120px] py-6 text-xs font-black uppercase tracking-[0.2em] relative transition-colors duration-200",
                                activeTab === tab ? "text-[var(--primary)]" : "text-slate-400 hover:text-slate-900 dark:hover:text-white"
                            )}
                        >
                            {tab}
                            {activeTab === tab && (
                                <motion.div 
                                    layoutId="activeTab" 
                                    className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--primary)] rounded-full" 
                                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                                />
                            )}
                        </button>
                    ))}
                </div>

                <div className="p-8">
                    <AnimatePresence mode="wait">
                        {activeTab === 'actividades' && (
                            <motion.div 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="space-y-6"
                            >
                                <div className="flex justify-between items-center px-2">
                                    <h3 className="text-lg font-black uppercase tracking-tight">Registro de Gastos</h3>
                                     <div className="flex items-center gap-3">
                                         <button 
                                             onClick={handleExportPDF}
                                             className="h-11 w-11 flex items-center justify-center bg-white/5 border border-slate-300 dark:border-slate-700 text-blue-500 rounded-2xl transition-opacity duration-200 opacity-70 hover:opacity-100 shadow-sm"
                                             title="Exportar PDF"
                                             aria-label="Exportar PDF"
                                         >
                                             <Download size={18} />
                                         </button>
                                         {canWriteExpenses && (
                                            <>
                                                {activities.length > 0 && (
                                                    <button 
                                                        onClick={handleToggleQuickAssign}
                                                        className={cn(
                                                            "h-11 px-4 rounded-2xl text-xs font-bold flex items-center gap-2 border shadow-sm transition-transform duration-200 ease-out hover:scale-[1.02] active:scale-[0.97]",
                                                            isQuickAssignMode 
                                                                ? "border-rose-500/40 text-rose-400 bg-rose-500/10 hover:bg-rose-500/20" 
                                                                : "border-slate-700 text-slate-300 hover:text-white bg-slate-800/40 hover:bg-slate-800"
                                                        )}
                                                        title="Asignación Rápida"
                                                    >
                                                        {isQuickAssignMode ? <X size={16} /> : <Users size={16} />}
                                                        {isQuickAssignMode ? "Cancelar" : "Asignar Items"}
                                                    </button>
                                                )}

                                                {isQuickAssignMode ? (
                                                    <button 
                                                        onClick={handleSaveQuickAssignments}
                                                        className="h-11 px-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-600/20 transition-transform duration-200 ease-out hover:scale-[1.02] active:scale-[0.97] flex items-center gap-2"
                                                    >
                                                        <Save size={16} /> Guardar Todo
                                                    </button>
                                                ) : (
                                                    <button 
                                                        onClick={() => navigate(ROUTES.REGISTER_EXPENSE(finalId))}
                                                        className="h-11 px-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 transition-transform duration-200 ease-out hover:scale-[1.02] active:scale-[0.97] flex items-center gap-2"
                                                    >
                                                        <Plus size={16} strokeWidth={2.5} />
                                                        <span>Nuevo Gasto</span>
                                                    </button>
                                                )}
                                                
                                                {!isQuickAssignMode && (
                                                    <button 
                                                        onClick={() => navigate(ROUTES.OCR_SCANNER)}
                                                        className="h-11 w-11 flex items-center justify-center bg-slate-800/50 border border-slate-700 text-slate-300 hover:text-white rounded-2xl hover:scale-[1.05] active:scale-[0.95] transition-transform duration-200 ease-out shadow-sm"
                                                        title="Escanear Ticket"
                                                        aria-label="Escanear Ticket"
                                                    >
                                                        <Receipt size={18} />
                                                    </button>
                                                )}
                                            </>
                                         )}
                                 </div>
                                 </div>
                                 {activities.length > 0 ? (
                                    <div className="overflow-x-auto overflow-y-visible">
                                         <table className="w-full text-left border-separate border-spacing-y-4">
                                             <thead>
                                                 <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] px-4">
                                                     <th className="pb-2 pl-8">Gasto / Concepto</th>
                                                     <th className="pb-2">Pagador</th>
                                                     {isQuickAssignMode ? (
                                                         <th className="pb-2">Repartir entre (Clic para asignar)</th>
                                                     ) : (
                                                         <>
                                                            <th className="pb-2">Importe</th>
                                                            <th className="pb-2">Fecha</th>
                                                         </>
                                                     )}
                                                     <th className="pb-2 pr-8 text-right">Estado</th>
                                                 </tr>
                                             </thead>
                                             <tbody>
                                                 {activities.map((act: any) => {
                                                     const comprador = membersData.find(i => i.id === act.comprador_id);
                                                     const category = act.categoria || "Otros";
                                                     const categoryStyles: any = {
                                                         "Comida": "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
                                                         "Transporte": "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
                                                         "Entretenimiento": "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
                                                         "Otros": "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20"
                                                     };
                                                     
                                                     const isFullyAssigned = (isQuickAssignMode ? (pendingAssignments[act.id] || []) : (act.participantes_ids || [])).length > 0;

                                                     return (
                                                          <motion.tr 
                                                              layout
                                                              key={act.id} 
                                                              onClick={() => !isQuickAssignMode && setSelectedExpense(act)}
                                                              className={cn(
                                                                  "group bg-white/50 dark:bg-white/[0.02] backdrop-blur-xl border border-white/20 dark:border-white/5 hover:border-[var(--primary)]/30 transition-all cursor-pointer shadow-sm hover:shadow-xl hover:shadow-[var(--primary)]/5",
                                                                  isQuickAssignMode && "cursor-default"
                                                              )}
                                                          >
                                                              <td className="py-6 pl-8 rounded-l-[2.5rem] border-y border-l border-white/20 dark:border-white/5">
                                                                  <div className="flex items-center gap-5">
                                                                      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border shadow-inner transition-all group-hover:scale-110 group-hover:rotate-3", categoryStyles[category] || categoryStyles["Otros"])}>
                                                                          {category === "Comida" && <Utensils size={24} />}
                                                                          {category === "Transporte" && <Car size={24} />}
                                                                          {category === "Entretenimiento" && <Gamepad2 size={24} />}
                                                                          {category === "Otros" && <ShoppingBag size={24} />}
                                                                      </div>
                                                                      <div>
                                                                          <p className="font-bold text-slate-800 dark:text-white text-base group-hover:text-[var(--primary)] transition-colors">{act.nombre}</p>
                                                                          {!isQuickAssignMode && (
                                                                              <div className="flex flex-wrap gap-1.5 mt-2">
                                                                                  {Array.isArray(act.nombres_participantes) && act.nombres_participantes.length > 0 ? act.nombres_participantes.map((p: string, j: number) => (
                                                                                      <span key={j} className="text-xs font-normal px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-700 dark:text-slate-300 transition-all">
                                                                                          {p}
                                                                                      </span>
                                                                                  )) : (
                                                                                      <span className="text-xs font-normal px-2.5 py-0.5 bg-rose-500/10 rounded-md text-rose-500">Sin asignar</span>
                                                                                  )}
                                                                              </div>
                                                                          )}
                                                                          <span className={cn("inline-block mt-2 text-xs font-medium px-2.5 py-0.5 rounded-lg border", categoryStyles[category] || categoryStyles["Otros"])}>
                                                                              {category}
                                                                          </span>
                                                                      </div>
                                                                  </div>
                                                              </td>
                                                              <td className="py-6 border-y border-white/20 dark:border-white/5">
                                                                  <div className="flex items-center gap-3">
                                                                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                                                          {comprador?.nombre?.charAt(0) || "U"}
                                                                      </div>
                                                                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{comprador?.nombre || "Usuario"}</span>
                                                                  </div>
                                                              </td>
                                                              
                                                              {isQuickAssignMode ? (
                                                                  <td className="py-6 border-y border-white/20 dark:border-white/5">
                                                                      <div className="flex flex-wrap gap-3">
                                                                          {membersData.map(member => {
                                                                              const isAssigned = (pendingAssignments[act.id] || []).includes(member.id);
                                                                              const memberColor = (member as any).color || "var(--primary)";
                                                                              return (
                                                                                  <motion.button
                                                                                      whileHover={{ scale: 1.1, y: -2 }}
                                                                                      whileTap={{ scale: 0.9 }}
                                                                                      key={member.id}
                                                                                      onClick={(e) => {
                                                                                          e.stopPropagation();
                                                                                          toggleMemberInItem(act.id, member.id);
                                                                                      }}
                                                                                      className={cn(
                                                                                          "group/member relative flex flex-col items-center transition-all",
                                                                                          !isAssigned && "opacity-25 grayscale hover:opacity-100 hover:grayscale-0"
                                                                                      )}
                                                                                      title={member.nombre}
                                                                                  >
                                                                                      <div className={cn(
                                                                                          "w-12 h-12 rounded-2xl border-2 flex items-center justify-center text-sm font-black transition-all shadow-sm",
                                                                                          isAssigned 
                                                                                            ? "bg-white dark:bg-slate-900 shadow-md" 
                                                                                            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-400"
                                                                                      )}
                                                                                      style={isAssigned ? { borderColor: memberColor, color: memberColor } : {}}>
                                                                                          {member.nombre.charAt(0)}
                                                                                      </div>
                                                                                      {isAssigned && (
                                                                                          <motion.div 
                                                                                            initial={{ scale: 0, rotate: -45 }}
                                                                                            animate={{ scale: 1, rotate: 0 }}
                                                                                            className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-lg"
                                                                                            style={{ backgroundColor: memberColor }}
                                                                                          >
                                                                                              <Check size={12} className="text-white stroke-[4]" />
                                                                                          </motion.div>
                                                                                      )}
                                                                                      <span className="text-[7px] font-black uppercase mt-2 text-slate-500 opacity-0 group-hover/member:opacity-100 transition-opacity">
                                                                                          {member.nombre.split(' ')[0]}
                                                                                      </span>
                                                                                  </motion.button>
                                                                              );
                                                                          })}
                                                                      </div>
                                                                  </td>
                                                              ) : (
                                                                  <>
                                                                      <td className="py-6 border-y border-white/20 dark:border-white/5">
                                                                          {(() => {
                                                                              const rawVal = act.monto ?? act.precio ?? 0;
                                                                              const numVal = Number(rawVal);
                                                                              const finalMonto = isNaN(numVal) ? 0 : numVal;
                                                                              return (
                                                                                <span className="font-black text-xl font-mono tracking-tighter text-slate-800 dark:text-white">${finalMonto.toFixed(2)}</span>
                                                                              );
                                                                          })()}
                                                                      </td>
                                                                      <td className="py-6 border-y border-white/20 dark:border-white/5">
                                                                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{act.fecha}</span>
                                                                      </td>
                                                                  </>
                                                              )}
                                                              
                                                              <td className="py-6 pr-8 rounded-r-[2.5rem] border-y border-r border-white/20 dark:border-white/5 text-right">
                                                                      <div className="flex justify-end items-center gap-5">
                                                                         <div className={cn(
                                                                             "flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] shadow-sm",
                                                                             isFullyAssigned 
                                                                                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                                                                                : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                                                                         )}>
                                                                             {isFullyAssigned ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                                                                             <span className="hidden xl:inline">{isFullyAssigned ? "Liquidado" : "Pendiente"}</span>
                                                                         </div>

                                                                         {canWriteExpenses && !isQuickAssignMode && (
                                                                             <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                 <button 
                                                                                     onClick={(e) => {
                                                                                         e.stopPropagation();
                                                                                         e.preventDefault();
                                                                                         setItemToEdit(act);
                                                                                         setIsEditItemModalOpen(true);
                                                                                     }}
                                                                                     className="p-3 hover:bg-blue-500/10 rounded-2xl text-blue-400 hover:text-blue-500 transition-all"
                                                                                     title="Editar"
                                                                                 >
                                                                                     <Pencil size={20} />
                                                                                 </button>
                                                                                 <button 
                                                                                     onClick={(e) => {
                                                                                         e.stopPropagation();
                                                                                         e.preventDefault();
                                                                                         if (window.confirm("¿Eliminar este gasto?")) {
                                                                                             deleteItem(act.id);
                                                                                         }
                                                                                     }}
                                                                                     className="p-3 hover:bg-rose-500/10 rounded-2xl text-rose-400 hover:text-rose-500 transition-all"
                                                                                     title="Eliminar"
                                                                                 >
                                                                                     <Trash2 size={20} />
                                                                                 </button>
                                                                             </div>
                                                                         )}
                                                                         {!isQuickAssignMode && (
                                                                             <button className="p-3 bg-slate-50 dark:bg-white/5 hover:bg-[var(--primary)]/10 rounded-2xl text-slate-400 hover:text-[var(--primary)] transition-all">
                                                                                 <ArrowRight size={20} />
                                                                             </button>
                                                                         )}
                                                                      </div>
                                                              </td>
                                                          </motion.tr>
                                                     );
                                                 })}
                                             </tbody>
                                         </table>
                                     </div>
                                 ) : (
                                     <div className="py-16 sm:py-20 text-center flex flex-col items-center justify-center border-2 border-dashed border-slate-800/90 rounded-[2.5rem] bg-[#0f172a]/70 p-6 sm:p-12 space-y-4 relative overflow-hidden group shadow-inner">
                                         {/* Resplandores ambientales al pasar el cursor */}
                                         <div className="pointer-events-none absolute -top-12 -right-12 w-44 h-44 bg-blue-600/5 rounded-full blur-3xl group-hover:bg-blue-600/15 transition-colors duration-500" />
                                         <div className="pointer-events-none absolute -bottom-12 -left-12 w-44 h-44 bg-cyan-500/5 rounded-full blur-3xl group-hover:bg-cyan-500/15 transition-colors duration-500" />

                                         <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform duration-300 ease-out shadow-sm">
                                             <Receipt size={30} />
                                         </div>
                                         <div className="space-y-1.5 max-w-sm">
                                             <h4 className="text-base sm:text-lg font-black uppercase tracking-widest text-white">
                                                 No hay gastos registrados
                                             </h4>
                                             <p className="text-xs font-medium text-slate-400 leading-relaxed">
                                                 {canWriteExpenses 
                                                     ? "Comienza añadiendo un nuevo gasto para calcular automáticamente los saldos de cada integrante." 
                                                     : "Aún no se han registrado gastos en este grupo."}
                                             </p>
                                         </div>
                                         {canWriteExpenses && (
                                             <button
                                                 onClick={() => navigate(ROUTES.REGISTER_EXPENSE(finalId))}
                                                 className="inline-flex items-center gap-2 px-7 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-600/25 hover:shadow-blue-600/40 hover:scale-[1.02] active:scale-[0.97] transition-transform duration-200 ease-out mt-2"
                                             >
                                                 <Plus size={16} strokeWidth={2.5} />
                                                 <span>Registrar Primer Gasto</span>
                                             </button>
                                         )}
                                     </div>
                                 )}
                            </motion.div>
                        )}

                        {activeTab === 'saldos' && (
                            <motion.div 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="space-y-8"
                            >
                                <div className="flex justify-between items-center px-2">
                                    <div>
                                        <h3 className="text-lg font-black uppercase tracking-tight">{I18N_TEXTS.BALANCES_TITLE}</h3>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{I18N_TEXTS.BALANCES_DESC}</p>
                                    </div>
                                    {isAdmin && (
                                        <button 
                                            onClick={() => setIsWizardOpen(true)}
                                            className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
                                        >
                                            <Check size={18} /> {I18N_TEXTS.SETTLE_GROUP}
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {Array.isArray(balances) && balances.map((balance, i) => (
                                        <motion.div 
                                            key={i}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: i * 0.1 }}
                                            className="p-6 bg-[var(--bg-body)] rounded-[2rem] border border-[var(--border-color)] flex items-center justify-between group hover:border-[var(--primary)]/30 transition-all shadow-sm"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center border border-[var(--border-color)] shadow-sm text-[var(--primary)]">
                                                    <UserCircle size={24} />
                                                </div>
                                                <div>
                                                    <p className="font-black text-[var(--text-primary)] uppercase tracking-tight">{balance.persona}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <div className="text-right">
                                                    <span className={cn(
                                                        "text-xl font-black font-mono tracking-tighter block",
                                                        (balance.monto ?? balance.balance ?? 0) >= 0 ? "text-emerald-500" : "text-rose-500"
                                                    )}>
                                                        {(balance.monto ?? balance.balance ?? 0) >= 0 ? "+" : ""}${Math.abs(Number(balance.monto ?? balance.balance ?? 0)).toFixed(2)}
                                                    </span>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{(balance.monto ?? balance.balance ?? 0) >= 0 ? I18N_TEXTS.STATUS.FAVOR : I18N_TEXTS.STATUS.DEBT}</p>
                                                </div>
                                                {(balance.monto ?? balance.balance ?? 0) < -0.01 && (
                                                    <button 
                                                        onClick={() => navigate(ROUTES.SETTLE_UP(finalId))}
                                                        className="px-4 py-2 bg-[var(--primary)] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[var(--primary)]/20 hover:scale-105 active:scale-95 transition-all"
                                                    >
                                                        {I18N_TEXTS.PAY_BUTTON}
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Shared Items Breakdown (Web) */}
                                <div className="mt-12 space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                            <Receipt size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black uppercase tracking-tight">Desglose Detallado</h3>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Cómo se divide cada ítem entre los participantes</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        {activities.map((item: any, idx: number) => {
                                            const itemParticipants = membersData.filter(m => item.participantes_ids?.includes(m.id));
                                            const price = Number(item.monto || item.precio || 0);
                                            const sharePerPerson = itemParticipants.length > 0 ? price / itemParticipants.length : 0;

                                            return (
                                                <div 
                                                    key={item.id || idx}
                                                    className="p-6 bg-white/50 dark:bg-white/[0.02] border border-[var(--border-color)] rounded-[2rem] flex flex-col gap-4 hover:border-[var(--primary)]/20 transition-all group"
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex gap-4">
                                                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-[var(--primary)] transition-colors">
                                                                <Receipt size={20} />
                                                            </div>
                                                            <div>
                                                                <p className="font-black text-slate-800 dark:text-white uppercase tracking-tight text-base">{item.nombre}</p>
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Total: ${price.toFixed(2)}</p>
                                                            </div>
                                                        </div>
                                                        <div className="px-3 py-1.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded-lg text-[10px] font-black uppercase shadow-sm">
                                                            ${sharePerPerson.toFixed(2)} c/u
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap gap-2 pt-4 border-t border-[var(--border-color)]">
                                                        {itemParticipants.map(p => (
                                                            <div key={p.id} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent hover:border-[var(--primary)]/30 transition-all">
                                                                <div className="w-5 h-5 rounded-full bg-[var(--primary)] text-[8px] font-black text-white flex items-center justify-center">
                                                                    {p.nombre.charAt(0)}
                                                                </div>
                                                                <span className="text-[9px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">{p.nombre.split(' ')[0]}</span>
                                                            </div>
                                                        ))}
                                                        {itemParticipants.length === 0 && (
                                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/5 rounded-xl border border-rose-500/20">
                                                                <AlertCircle size={12} className="text-rose-500" />
                                                                <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Sin participantes asignados</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                            </motion.div>
                        )}

                        {activeTab === 'miembros' && (
                            <motion.div 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="px-2"
                            >
                                <GroupMembersList
                                    members={members}
                                    pendingInvitations={pendingInvitations}
                                    adminId={adminId}
                                    currentUserId={currentUserId}
                                    groupCode={groupCode}
                                    isAdmin={isAdmin}
                                    onOpenAddMember={() => setIsAddMemberOpen(true)}
                                    onRemoveMember={removeMember}
                                    onCancelInvitation={cancelInvitation}
                                    onResendInvitation={resendInvitation}
                                />
                            </motion.div>
                        )}

                        {activeTab === 'ajustes' && isAdmin && (
                            <motion.div 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="space-y-12 max-w-4xl mx-auto py-4"
                            >
                                {isAdmin && pendingSettlements.length > 0 && (
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                                                <Receipt size={20} />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black uppercase tracking-tight">Pagos por Aprobar</h3>
                                                <p className="text-[10px] font-black text-amber-500/60 uppercase tracking-widest mt-1">Verifica y confirma los pagos recibidos</p>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 gap-4">
                                            {pendingSettlements.map((s: any) => (
                                                <div key={s.id} className="p-6 bg-white rounded-3xl border border-amber-200 shadow-sm flex items-center justify-between group hover:border-amber-500 transition-all">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                                                            <User size={24} />
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-slate-700 uppercase">{membersData.find(m => m.id === s.payer_id)?.nombre || 'Miembro'}</p>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Envió ${s.amount.toFixed(2)}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <button 
                                                            onClick={() => handleReject(s)}
                                                            className="px-6 py-3 border border-rose-500 text-rose-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500/5 transition-all"
                                                        >
                                                            Rechazar
                                                        </button>
                                                        <button 
                                                            onClick={() => handleApprove(s)}
                                                            className="px-6 py-3 bg-amber-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                                                        >
                                                            <Check size={16} /> Aprobar
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-xl font-black uppercase tracking-tight">Ajustes del Grupo</h3>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Configuración general y administración</p>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-black/5 p-8 rounded-[2.5rem] border border-black/5">
                                        <div className="space-y-4">
                                            <p className="text-xs font-black uppercase tracking-widest text-slate-500">Información del Grupo</p>
                                            <div className="space-y-4">
                                                <div className="p-6 bg-white rounded-3xl border border-[var(--border-color)]">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Nombre</p>
                                                    <p className="font-black text-lg uppercase">{groupName}</p>
                                                </div>
                                                <div className="p-6 bg-white rounded-3xl border border-[var(--border-color)]">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Descripción</p>
                                                    <p className="font-bold text-sm text-slate-600">{groupDescription || "Sin descripción"}</p>
                                                </div>
                                                <button 
                                                    onClick={() => setIsEditingGroupOpen(true)}
                                                    className="w-full flex items-center justify-center gap-3 py-4 bg-white border border-[var(--border-color)] rounded-2xl text-xs font-black uppercase tracking-widest hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all"
                                                >
                                                    <Pencil size={18} /> Editar Información
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <p className="text-xs font-black uppercase tracking-widest text-slate-500">Invitación y Código QR</p>
                                            <div className="p-8 bg-white dark:bg-slate-900 rounded-[2rem] border border-[var(--border-color)] flex flex-col items-center justify-center text-center space-y-5 shadow-sm">
                                                <div className="p-4 bg-white rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
                                                    <QRCodeSVG value={deepLinkUrl || groupCode} size={140} level="M" />
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Código de Acceso Rápido</p>
                                                    <p className="font-mono text-2xl font-black tracking-[0.2em] text-[var(--text-primary)]">{groupCode}</p>
                                                </div>
                                                <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full">
                                                    <button 
                                                        onClick={handleCopyCode}
                                                        className="flex-1 w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 rounded-xl text-[10px] font-black uppercase tracking-widest transition-transform flex items-center justify-center gap-2"
                                                    >
                                                        <Copy size={13} className="text-slate-400" />
                                                        Copiar Código
                                                    </button>
                                                    <button 
                                                        onClick={handleCopyDeepLink}
                                                        className="flex-1 w-full py-2.5 px-4 bg-[var(--primary)] text-white hover:opacity-90 active:scale-95 rounded-xl text-[10px] font-black uppercase tracking-widest transition-transform flex items-center justify-center gap-2 shadow-sm"
                                                    >
                                                        <Share2 size={13} />
                                                        Copiar Enlace
                                                    </button>
                                                </div>
                                                <p className="text-[9px] text-slate-400 max-w-xs">
                                                    Al escanear el QR con la cámara o hacer clic en el enlace, cualquier usuario se unirá con 1 solo toque.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {isAdmin && (
                                    <div className="pt-8 border-t border-rose-500/20">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                                                <Trash2 size={20} />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-rose-500">Zona de Peligro</h4>
                                                <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Acciones irreversibles</p>
                                            </div>
                                        </div>
                                        
                                        <div className="p-8 bg-rose-500/5 border border-rose-500/10 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6">
                                            <div className="text-center md:text-left">
                                                <p className="font-black text-rose-500 uppercase tracking-tight">Eliminar permanentemente este grupo</p>
                                                <p className="text-[10px] font-black text-rose-500/60 uppercase tracking-widest mt-1 max-w-md">Esta acción borrará todos los gastos, saldos e integrantes de forma definitiva.</p>
                                            </div>
                                            <button 
                                                onClick={() => setIsDeleteModalOpen(true)}
                                                className="w-full md:w-auto px-8 py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-rose-600/20 hover:shadow-rose-600/35 hover:scale-[1.02] active:scale-[0.97] transition-transform duration-200 ease-out"
                                            >
                                                Eliminar Grupo
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>

                <AddMemberModal 
                    isOpen={isAddMemberOpen}
                    onClose={() => setIsAddMemberOpen(false)}
                    groupId={finalId}
                    onSuccess={() => {
                        refresh();
                    }}
                    existingMemberIds={members.map((m: any) => m.id)}
                    pendingInvitations={pendingInvitations}
                />

                <SettlementWizard 
                    isOpen={isWizardOpen}
                    onClose={() => setIsWizardOpen(false)}
                    groupId={finalId}
                    activities={activities}
                    members={members}
                    totalSpent={totalSpent}
                    membersData={membersData}
                />

                <TransactionDetailModal 
                    isOpen={!!selectedExpense}
                    onClose={() => setSelectedExpense(null)}
                    transaction={selectedExpense}
                    members={membersData}
                />

                <AddCardModal 
                    isOpen={isAddCardOpen}
                    onClose={() => setIsAddCardOpen(false)}
                    onSuccess={refreshCards}
                    currentCardsCount={cards.length}
                />

                <EditGroupModal 
                    isOpen={isEditingGroupOpen}
                    onClose={() => setIsEditingGroupOpen(false)}
                    group={{ id: finalId, nombre: groupName, descripcion: groupDescription }}
                    onSuccess={refresh}
                />

                <EditItemModal
                    isOpen={isEditItemModalOpen}
                    onClose={() => {
                        setIsEditItemModalOpen(false);
                        setItemToEdit(null);
                    }}
                    item={itemToEdit}
                    onSave={handleEditItem}
                />

                {/* Modal de Confirmación de Eliminación Destructiva */}
                <AnimatePresence>
                    {isDeleteModalOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => !isDeleting && setIsDeleteModalOpen(false)}
                                className="absolute inset-0 bg-black/75 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 12 }}
                                transition={{ duration: 0.18, ease: "easeOut" }}
                                className="relative w-full max-w-md bg-[#0f172a] rounded-3xl border border-rose-500/30 p-6 sm:p-8 shadow-2xl text-center space-y-6 overflow-hidden"
                            >
                                <div className="pointer-events-none absolute -top-12 -right-12 w-36 h-36 bg-rose-500/10 rounded-full blur-2xl" />

                                <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center mx-auto shadow-sm">
                                    <Trash2 size={28} />
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-xl font-black text-white uppercase tracking-tight">
                                        ¿Eliminar este grupo?
                                    </h3>
                                    <p className="text-xs text-slate-400 font-medium leading-relaxed">
                                        Estás a punto de eliminar permanentemente <span className="text-white font-bold">"{groupName || 'este grupo'}"</span>. Esta acción no se puede deshacer y borrará todos los gastos, comprobantes y balances calculados.
                                    </p>
                                </div>

                                {balances.some((b: any) => Math.abs(b.balance) > 0.01) && (
                                    <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-left flex items-start gap-2.5">
                                        <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                                        <p className="text-[11px] text-amber-300 font-semibold leading-relaxed">
                                            Atención: Este grupo cuenta con integrantes con saldos o deudas pendientes de liquidar.
                                        </p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    <button
                                        type="button"
                                        disabled={isDeleting}
                                        onClick={() => setIsDeleteModalOpen(false)}
                                        className="py-3.5 px-4 bg-slate-800/80 hover:bg-slate-800 active:scale-[0.97] text-slate-200 rounded-2xl text-xs font-black uppercase tracking-wider transition-transform duration-200 ease-out border border-slate-700"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="button"
                                        disabled={isDeleting}
                                        onClick={async () => {
                                            setIsDeleting(true);
                                            try {
                                                const success = await confirmDeleteGroup();
                                                if (success) {
                                                    setIsDeleteModalOpen(false);
                                                    navigate(ROUTES.GROUPS);
                                                }
                                            } finally {
                                                setIsDeleting(false);
                                            }
                                        }}
                                        className="py-3.5 px-4 bg-rose-600 hover:bg-rose-500 active:scale-[0.97] text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-rose-600/30 hover:shadow-rose-600/50 hover:scale-[1.02] transition-transform duration-200 ease-out flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isDeleting ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
                                                <span>Eliminando...</span>
                                            </>
                                        ) : (
                                            <span>Sí, Eliminar</span>
                                        )}
                                    </button>
                                </div>

                                {pendingInvitations && pendingInvitations.length > 0 && (
                                    <div className="mt-8 pt-6 border-t border-[var(--border-color)]">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                                            <h4 className="text-xs font-black uppercase tracking-wider text-amber-500">
                                                Invitaciones Pendientes ({pendingInvitations.length})
                                            </h4>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {pendingInvitations.map((inv: any) => (
                                                <div 
                                                    key={inv.id || inv._id}
                                                    className="p-4 bg-amber-500/5 rounded-2xl border border-amber-500/20 flex items-center justify-between gap-3 shadow-sm"
                                                >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                                                            {inv.invited_email ? inv.invited_email.charAt(0).toUpperCase() : '?'}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-bold text-[var(--text-primary)] truncate">{inv.invited_email}</p>
                                                            <p className="text-[9px] font-semibold text-slate-400">Invitado por {inv.invited_by_name || 'Admin'}</p>
                                                        </div>
                                                    </div>
                                                    <span className="px-2.5 py-1 bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-lg text-[9px] font-black uppercase tracking-wider shrink-0">
                                                        PENDIENTE
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>


            </div>
        </div>
    );
};