import React, { useState, useEffect } from 'react';
import { 
    Settings, Plus, Receipt, UserCircle, ArrowRight, 
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
    Save
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../infrastructure/utils';
import { useGroupDetail } from './useGroupDetail';
import { PageHeader } from '@ui/components/PageHeader';
import { useOutletContext, useParams, useNavigate } from 'react-router-dom';
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
import { useMyPayments } from '../MyPayments/useMyPayments';
import { AddCardModal } from '../MyPayments/components/AddCardModal';
import { PaymentCard } from '../../components/Dashboard/PaymentCard';
import { groupRepository } from '../../../infrastructure/api/repositories';

import { TwoFactorModal } from '../../components/Security/TwoFactorModal';
import { EditGroupModal } from '../Groups/components/EditGroupModal';
import { EditItemModal } from './components/EditItemModal';

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
    const { toggleSidebar } = useOutletContext<{ toggleSidebar: () => void }>();
    const navigate = useNavigate();

    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState<any>(null);
    const [isEditingGroupOpen, setIsEditingGroupOpen] = useState(false);

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
        membersData, isFetchingGroup, adminId, currentUserId,
        isRefreshing, refresh, removeMember,
        deleteGroup, confirmDeleteGroup, deleteItem,
        is2FAModalOpen, setIs2FAModalOpen, leaderProfile,
        pendingSettlements,
        approveSettlement,
        rejectSettlement
    } = useGroupDetail(finalId);

    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
    const { 
        cards, loading: isFetchingCards, refreshCards, 
        handleDeleteCard, isAddingCard: isAddCardOpen, 
        setIsAddingCard: setIsAddCardOpen 
    } = useMyPayments();
    
    const isAdmin = adminId === currentUserId;
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
        <div className="space-y-8 pb-20">
            <PageHeader 
                title={groupName || "Detalle de Grupo"}
                onMenuClick={toggleSidebar}
                onBack={() => navigate(ROUTES.GROUPS)}
                rightSlot={
                    <div className="hidden md:flex items-center gap-3 bg-white/10 px-4 py-2 rounded-xl border border-white/10 backdrop-blur-sm">
                        <div className="flex flex-col items-end">
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">ID Grupo</span>
                            <span className="font-mono text-xs font-black tracking-widest text-[var(--text-primary)]">{groupCode}</span>
                        </div>
                        <button 
                            onClick={() => {
                                navigator.clipboard.writeText(groupCode);
                                toast.success("ID copiado");
                            }}
                            className="p-1.5 hover:bg-white/10 rounded-lg transition-all text-slate-400 hover:text-[var(--primary)]"
                        >
                            <Copy size={14} />
                        </button>
                    </div>
                }
            />

            <div className="bg-white/50 dark:bg-white/5 border-b border-[var(--border-color)] backdrop-blur-md sticky top-[4.5rem] md:top-[6rem] z-40">
                <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        {userOwed < -0.01 && (
                            <button 
                                onClick={() => navigate(ROUTES.SETTLE_UP(finalId))}
                                className="px-6 py-3 bg-emerald-500 text-white rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                            >
                                <DollarSign size={18} /> Saldar Deuda
                            </button>
                        )}
                    </div>

                    {isAdmin && (
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setIsEditingGroupOpen(true)}
                                className="flex items-center gap-2 px-6 py-3 border border-blue-500/30 text-blue-500 bg-blue-500/5 rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest hover:bg-blue-500/10 transition-all"
                            >
                                <Pencil size={18} /> Editar Grupo
                            </button>
                            <button 
                                onClick={deleteGroup}
                                className="flex items-center gap-2 px-6 py-3 border border-rose-500/30 text-rose-500 bg-rose-500/5 rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest hover:bg-rose-500/10 transition-all"
                            >
                                <Trash2 size={18} /> Eliminar Grupo
                            </button>
                        </div>
                    )}
                </div>
            </div>



            {/* Stats Cards (Mini) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: "Total Gastado", value: totalSpent, icon: <Receipt size={20}/>, color: "var(--primary)" },
                    { label: "Tu Parte", value: userShare, icon: <UserCircle size={20}/>, color: "#10b981" },
                    { 
                        label: userOwed >= 0 ? "Te Deben" : "Debes", 
                        value: Math.abs(userOwed), 
                        icon: userOwed >= 0 ? <PieChart size={20}/> : <DollarSign size={20}/>, 
                        color: userOwed >= 0 ? "#f59e0b" : "#f43f5e",
                        action: userOwed < -0.01 ? (
                            <button 
                                onClick={() => navigate(ROUTES.SETTLE_UP(finalId))}
                                className="mt-2 px-4 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all backdrop-blur-md"
                            >
                                Pagar Ahora
                            </button>
                        ) : null
                    },
                ].map((stat, i) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i}
                        className="p-6 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2.5rem] flex items-center gap-6 shadow-sm group hover:border-[var(--primary)]/30 transition-all"
                    >
                        <div className="w-14 h-14 rounded-[1.5rem] flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: stat.color }}>
                            {stat.icon}
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{stat.label}</p>
                            <p className="text-2xl font-black tracking-tighter text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">${Number(stat.value || 0).toFixed(2)}</p>
                            {(stat as any).action}
                        </div>
                    </motion.div>
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
                                "flex-1 min-w-[120px] py-6 text-xs font-black uppercase tracking-[0.2em] transition-all relative",
                                activeTab === tab ? "text-[var(--primary)]" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            {tab}
                            {activeTab === tab && (
                                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--primary)] rounded-full" />
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
                                             className="p-4 bg-white border border-[var(--border-color)] text-blue-500 rounded-2xl hover:border-blue-500 hover:bg-blue-50/50 transition-all shadow-sm"
                                             title="Exportar PDF"
                                         >
                                             <Download size={22} />
                                         </button>
                                         {isAdmin && (
                                            <>
                                                <button 
                                                    onClick={handleToggleQuickAssign}
                                                    className={cn(
                                                        "flex items-center gap-2 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all",
                                                        isQuickAssignMode 
                                                            ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20" 
                                                            : "bg-white border border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)] shadow-sm"
                                                    )}
                                                    title="Asignación Rápida"
                                                >
                                                    {isQuickAssignMode ? <X size={18} /> : <Users size={18} />}
                                                    {isQuickAssignMode ? "Cancelar" : "Asignar Items"}
                                                </button>

                                                {isQuickAssignMode ? (
                                                    <button 
                                                        onClick={handleSaveQuickAssignments}
                                                        className="flex items-center gap-3 px-8 py-4 bg-emerald-500 text-white rounded-[1.5rem] text-sm font-black uppercase tracking-widest shadow-2xl shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                                    >
                                                        <Save size={18} /> Guardar Todo
                                                    </button>
                                                ) : (
                                                    <button 
                                                        onClick={() => navigate(ROUTES.REGISTER_EXPENSE(finalId))}
                                                        className="group flex items-center gap-3 px-8 py-4 bg-[var(--primary)] text-white rounded-[1.5rem] text-sm font-black uppercase tracking-widest shadow-2xl shadow-[var(--primary)]/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                                    >
                                                        <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center group-hover:rotate-90 transition-transform">
                                                            <Plus size={18} />
                                                        </div>
                                                        Nuevo Gasto
                                                    </button>
                                                )}
                                                
                                                {!isQuickAssignMode && (
                                                    <button 
                                                        onClick={() => navigate(ROUTES.OCR_SCANNER)}
                                                        className="p-4 bg-white border border-[var(--border-color)] text-[var(--text-secondary)] rounded-2xl hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all shadow-sm"
                                                        title="Escanear Ticket"
                                                    >
                                                        <Receipt size={22} />
                                                    </button>
                                                )}
                                            </>
                                         )}
                                 </div>
                                 </div>
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
                                                     "Comida": "bg-orange-500/10 text-orange-500 border-orange-500/20",
                                                     "Transporte": "bg-blue-500/10 text-blue-500 border-blue-500/20",
                                                     "Entretenimiento": "bg-purple-500/10 text-purple-500 border-purple-500/20",
                                                     "Otros": "bg-slate-500/10 text-slate-500 border-slate-500/20"
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
                                                                      <p className="font-black text-slate-800 dark:text-white uppercase tracking-tight text-base group-hover:text-[var(--primary)] transition-colors">{act.nombre}</p>
                                                                      {!isQuickAssignMode && (
                                                                          <div className="flex flex-wrap gap-1.5 mt-2">
                                                                              {Array.isArray(act.nombres_participantes) && act.nombres_participantes.length > 0 ? act.nombres_participantes.map((p: string, j: number) => (
                                                                                  <span key={j} className="text-[8px] font-black uppercase px-2 py-0.5 bg-black/5 dark:bg-white/5 rounded-full text-slate-500 dark:text-slate-300 group-hover:bg-[var(--primary)]/10 group-hover:text-[var(--primary)] transition-all">
                                                                                      {p.split(' ')[0]}
                                                                                  </span>
                                                                              )) : (
                                                                                  <span className="text-[8px] font-black uppercase px-2 py-0.5 bg-rose-500/5 rounded-full text-rose-500/60">Sin asignar</span>
                                                                              )}
                                                                          </div>
                                                                      )}
                                                                      <span className={cn("inline-block mt-2 text-[8px] font-black uppercase px-2.5 py-1 rounded-lg border tracking-[0.15em]", categoryStyles[category] || categoryStyles["Otros"])}>
                                                                          {category}
                                                                      </span>
                                                                  </div>
                                                              </div>
                                                          </td>
                                                          <td className="py-6 border-y border-white/20 dark:border-white/5">
                                                              <div className="flex items-center gap-3">
                                                                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-black text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                                                      {comprador?.nombre?.charAt(0) || "U"}
                                                                  </div>
                                                                  <span className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wide">{comprador?.nombre || "Usuario"}</span>
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

                                                                     {isAdmin && !isQuickAssignMode && (
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
                                className="space-y-6 px-2"
                            >
                                <div className="flex justify-between items-center mb-8">
                                    <div>
                                        <h3 className="text-lg font-black uppercase tracking-tight">{I18N_TEXTS.MEMBERS_TITLE}</h3>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{members.length} {I18N_TEXTS.MEMBERS_DESC_SUFFIX}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-black/5 rounded-2xl border border-black/5 text-[var(--text-primary)] font-mono text-xs font-black flex items-center gap-2">
                                            <Scan size={14} /> {groupCode}
                                        </div>
                                        {isAdmin && (
                                            <button 
                                                onClick={() => setIsAddMemberOpen(true)}
                                                className="flex items-center gap-2 px-6 py-3 bg-[var(--primary)] text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-[var(--primary)]/20 hover:scale-105 active:scale-95 transition-all"
                                            >
                                                <Plus size={18} /> Agregar
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {members.map((member, i) => {
                                        return (
                                            <motion.div 
                                                key={member.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                className="p-5 bg-[var(--bg-body)] rounded-3xl border border-[var(--border-color)] flex items-center gap-4 group hover:border-[var(--primary)]/30 transition-all shadow-sm"
                                            >
                                                <div className="relative">
                                                    <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-sm font-black border-2 border-white shadow-sm">
                                                        {member.nombre.charAt(0)}
                                                    </div>
                                                    {member.id === adminId && (
                                                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full border-2 border-white flex items-center justify-center" title="Admin">
                                                            <Settings size={10} className="text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-black text-[var(--text-primary)] uppercase tracking-tight text-sm">{member.nombre}</p>
                                                        {(member.trust_score >= 5 || member.fast_payments_count >= 10) && (
                                                            <div className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1" title="Buen Pagador (>24h)">
                                                                <Zap size={8} className="text-emerald-500 fill-emerald-500" />
                                                                <span className="text-[7px] font-black text-emerald-500 uppercase tracking-widest">Buen Pagador</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{member.id === currentUserId ? "Tú" : (member.id === adminId ? "Organizador" : "Miembro")}</p>
                                                </div>
                                                
                                                {isAdmin && member.id !== currentUserId && (
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (window.confirm(`¿Estás seguro de eliminar a ${member.nombre}?`)) {
                                                                removeMember(member.id);
                                                            }
                                                        }}
                                                        className="p-2.5 text-rose-400 hover:text-white hover:bg-rose-500 rounded-xl transition-all opacity-100 sm:opacity-0 group-hover:opacity-100"
                                                        title="Eliminar Miembro"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                </div>
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
                                            <p className="text-xs font-black uppercase tracking-widest text-slate-500">Invitación</p>
                                            <div className="p-8 bg-white rounded-[2rem] border border-[var(--border-color)] flex flex-col items-center justify-center text-center space-y-6">
                                                <div className="p-4 bg-black/5 rounded-2xl border border-black/5">
                                                    <QRCodeSVG value={groupCode} size={120} />
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Código de Acceso</p>
                                                    <p className="font-mono text-2xl font-black tracking-[0.2em]">{groupCode}</p>
                                                </div>
                                                <button 
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(groupCode);
                                                        toast.success("Código copiado al portapapeles");
                                                    }}
                                                    className="px-6 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                                >
                                                    Copiar Código
                                                </button>
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
                                                onClick={async () => {
                                                    await deleteGroup();
                                                    navigate(ROUTES.GROUPS);
                                                }}
                                                className="w-full md:w-auto px-10 py-5 bg-rose-500 text-white rounded-[1.5rem] text-xs font-black uppercase tracking-widest shadow-xl shadow-rose-500/20 hover:scale-105 active:scale-95 transition-all"
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


            </div>
        </div>
    );
};