import { toast } from 'sonner';
import React, { useRef, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    FolderOpen,
    Sparkles,
    ReceiptText,
    Smartphone,
    AlertTriangle,
    UserPlus,
    Users,
    CheckCircle,
    Loader2,
    FileUp
} from 'lucide-react';
import { cn } from '@infrastructure/utils';
import { StatusBadge } from '../../components/StatusBadge';
import { PageHeader } from '@ui/components/PageHeader';
import { useOCRScanner, type OCRItem } from './useOCRScanner';
import { useGroupContext } from '../../context/GroupContext';
import styles from './OCRScanner.module.css';

// OCRItem imported from useOCRScanner

/* ─── UploadZone component con Drag & Drop ─── */
const UploadZone: React.FC<{ 
    isProcessing: boolean; 
    onFileSelected: (file: File) => void;
    selectedFile: File | null;
}> = ({ isProcessing, onFileSelected, selectedFile }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onFileSelected(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onFileSelected(e.target.files[0]);
        }
    };

    return (
        <div 
            className={cn(
                styles.glassPanel, 
                'relative flex-grow rounded-3xl overflow-hidden shadow-2xl border-2 transition-all duration-300 flex flex-col min-h-[400px]',
                isDragging ? 'border-[var(--primary)] bg-[var(--primary)]/5 scale-[1.01]' : 'border-white/10'
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div className="absolute inset-0 opacity-10 z-0" style={{ backgroundImage: 'radial-gradient(circle at center, var(--primary) 0%, transparent 70%)' }} />
            
            <div className="relative flex-grow flex flex-col items-center justify-center p-12 text-center">
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                />

                {isProcessing ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center"
                    >
                        <div className="relative mb-8">
                            <div className="absolute inset-0 bg-[var(--primary)] rounded-full blur-2xl opacity-20 animate-pulse" />
                            <Loader2 size={64} className="text-[var(--primary)] animate-spin relative z-10" />
                        </div>
                        <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-widest">Analizando Ticket</h3>
                        <p className="text-[var(--text-secondary)] font-medium">Extrayendo datos con IA...</p>
                    </motion.div>
                ) : (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center"
                    >
                        <div className="w-24 h-24 rounded-[32px] bg-white/5 border border-white/10 flex items-center justify-center mb-8 shadow-xl">
                            {selectedFile ? <FileUp size={40} className="text-emerald-500" /> : <FolderOpen size={40} className="text-[var(--primary)]" />}
                        </div>
                        <h3 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter">
                            {selectedFile ? 'Archivo Listo' : 'Sube tu Ticket'}
                        </h3>
                        <p className="text-[var(--text-secondary)] max-w-sm mb-10 font-medium">
                            {selectedFile ? `Has seleccionado: ${selectedFile.name}` : 'Arrastra tus archivos aquí o haz clic para seleccionar. Soportamos JPG, PNG y PDF.'}
                        </p>
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="group relative px-10 py-4 bg-[var(--primary)] hover:opacity-90 rounded-2xl transition-all shadow-glow active:scale-95"
                        >
                            <div className="flex items-center gap-3">
                                <ReceiptText size={20} className="text-white" />
                                <span className="text-white font-black uppercase tracking-widest text-sm">
                                    {selectedFile ? 'Cambiar Archivo' : 'Seleccionar Archivo'}
                                </span>
                            </div>
                        </button>
                    </motion.div>
                )}
            </div>

            <div className="p-4 bg-black/20 border-t border-white/5 flex items-center justify-center gap-6">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Web Engine</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronización Hotspot</span>
                </div>
            </div>
        </div>
    );
};

/* ─── Main Page Component ─── */
export const OCRScanner: React.FC = () => {
    const navigate = useNavigate();
    const { toggleSidebar } = useOutletContext<{ toggleSidebar: () => void }>();
    const { activeGroups } = useGroupContext();
    const {
        scanResult,
        isProcessing,
        selectedFile,
        selectedGroupId,
        setSelectedGroupId,
        handleFileUpload,
        handleSplitAll,
        handleAssignToMe,
        handleConfirmSync,
        formatCurrency,
    } = useOCRScanner();

    const selectedGroup = activeGroups.find(g => g.id === selectedGroupId);

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-[var(--bg-body)] text-[var(--text-primary)] antialiased selection:bg-[var(--primary)] selection:text-white transition-colors duration-300">
            <div className="flex-1 flex flex-col min-w-0 relative pb-20 md:pb-0">
                <PageHeader
                    onMenuClick={toggleSidebar}
                    title="DESGLOSE DE TICKETS"
                    subtitle="Easy-Pay Desktop"
                    onBack={() => navigate(-1)}
                    showAvatar={false} 
                    showStats
                />

                <main className="flex-grow flex flex-col items-center justify-start p-4 sm:p-6 lg:p-8 relative w-full max-w-7xl mx-auto gap-6">
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                        <div className="absolute top-[-10%] left-[20%] w-[30%] h-[30%] bg-[var(--primary)]/5 rounded-full blur-[100px]" />
                        <div className="absolute bottom-[10%] right-[10%] w-[40%] h-[40%] bg-[var(--primary)]/5 rounded-full blur-[120px]" />
                    </div>

                    {/* Group Selection Section */}
                    <div className={cn(styles.glassPanel, 'w-full p-6 rounded-3xl border border-white/10 bg-white/5 flex flex-col md:flex-row items-center justify-between gap-6')}>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] border border-[var(--primary)]/20">
                                <Users size={24} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-1">Destino de Sincronización</h3>
                                <p className="text-xs text-[var(--text-secondary)] font-medium">Selecciona el grupo donde registrarás estos gastos</p>
                            </div>
                        </div>

                        <select 
                            value={selectedGroupId}
                            onChange={(e) => setSelectedGroupId(e.target.value)}
                            className="w-full md:w-64 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:ring-2 focus:ring-[var(--primary)] outline-none transition-all cursor-pointer"
                        >
                            <option value="">Seleccionar Grupo...</option>
                            {activeGroups.map(group => (
                                <option key={group.id} value={group.id}>
                                    {group.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="w-full flex flex-col gap-6">
                        <UploadZone 
                            isProcessing={isProcessing} 
                            onFileSelected={handleFileUpload} 
                            selectedFile={selectedFile}
                        />
                    </div>

                    <div className={cn(styles.glassPanel, 'w-full rounded-2xl shadow-glass flex flex-col overflow-hidden mt-2 bg-[var(--bg-card)] border border-[var(--border-color)]')}>
                        <div className="p-4 sm:px-6 border-b border-[var(--border-color)] flex items-center justify-between bg-white/5">
                            <div className="flex items-center gap-2">
                                <Sparkles size={20} className="text-[var(--primary)]" />
                                <h3 className="text-lg font-bold text-[var(--text-primary)]">Análisis de Auditoría</h3>
                            </div>
                            <StatusBadge label={`Confianza IA: ${scanResult.confidence}%`} variant="success" />
                        </div>

                        <div className="flex flex-col lg:flex-row h-full">
                            <div className="w-full lg:w-1/2 border-r border-[var(--border-color)] p-4 sm:p-6 bg-black/5">
                                <h4 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <ReceiptText size={16} /> Lectura Digital del Ticket
                                </h4>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm font-mono">
                                        <thead>
                                            <tr className="border-b border-[var(--border-color)] text-left">
                                                <th className="pb-2 text-[var(--text-secondary)]">Descripción</th>
                                                <th className="pb-2 text-right text-[var(--text-secondary)]">Importe</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[var(--border-color)]">
                                            {scanResult.detectedItems.map((item: any) => (
                                                <tr 
                                                    key={item.id}
                                                    className={cn(
                                                        'transition-colors',
                                                        item.isUnassigned ? 'bg-amber-500/5' : 'hover:bg-white/5'
                                                    )}
                                                >
                                                    <td className={cn('py-3', item.isUnassigned ? 'text-amber-200 font-bold' : 'text-[var(--text-secondary)]')}>
                                                        {item.description}
                                                    </td>
                                                    <td className={cn('py-3 text-right font-bold', item.isUnassigned ? 'text-amber-200' : 'text-[var(--text-primary)]')}>
                                                        {formatCurrency(item.amount)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="w-full lg:w-1/2 p-4 sm:p-6 bg-[var(--hover-bg)] relative">
                                <h4 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Smartphone size={16} /> Registros en Sistema (App)
                                </h4>
                                <div className="space-y-3 mb-6 opacity-60">
                                    {scanResult.appItems.map((item: any, idx: number) => (
                                        <div key={idx} className="flex justify-between items-center text-sm border-b border-dashed border-[var(--border-color)] pb-2">
                                            <div className="flex flex-col">
                                                <span className="text-[var(--text-secondary)]">{item.description}</span>
                                                <span className="text-[10px] text-[var(--primary)] font-black uppercase tracking-widest">
                                                    Asignado a: {item.assignedToIds?.length === 1 ? 'Yo' : `${item.assignedToIds?.length} integrantes`}
                                                </span>
                                            </div>
                                            <span className="text-[var(--text-primary)] font-bold">{formatCurrency(item.amount)}</span>
                                        </div>
                                    ))}
                                </div>

                                {scanResult.unassignedItems.map((item: any) => (
                                    <div
                                        key={item.id}
                                        className={cn(styles.glassPanel, 'bg-amber-900/10 border-l-4 border-l-amber-500 border-y border-r border-amber-500/30 rounded-r-lg p-4 mb-4 shadow-lg')}
                                    >
                                        <div className="flex items-start gap-3">
                                            <AlertTriangle size={20} className="text-amber-500 mt-0.5" />
                                            <div className="flex-grow">
                                                <h5 className="text-amber-100 font-bold text-sm mb-1">Diferencia Detectada</h5>
                                                <p className="text-[var(--text-secondary)] text-xs mb-3 font-medium">
                                                    El item <span className="text-[var(--text-primary)] font-mono font-bold">{item.description}</span> no ha sido asignado a ningún integrante.
                                                </p>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => {
                                                            if (!selectedGroupId) {
                                                                toast.error("Selecciona un grupo primero");
                                                                return;
                                                            }
                                                            handleSplitAll(item, selectedGroup?.integrantes.map((m: any) => m.id) || []);
                                                        }}
                                                        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-[var(--text-primary)] text-xs px-4 py-2 rounded-lg transition border border-[var(--border-color)] font-bold uppercase tracking-wider"
                                                    >
                                                        <Users size={14} /> Dividir Todos
                                                    </button>
                                                    <button
                                                        onClick={() => handleAssignToMe(item)}
                                                        className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white text-xs px-4 py-2 rounded-lg transition shadow-md font-bold uppercase tracking-wider"
                                                    >
                                                        <UserPlus size={14} /> Reclamar
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-[var(--bg-card)] p-6 border-t border-[var(--border-color)] flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-8 w-full sm:w-auto">
                                <div>
                                    <span className="block text-[10px] text-[var(--text-secondary)] uppercase font-black tracking-widest mb-1">Total Ticket</span>
                                    <span className="block text-2xl font-mono text-[var(--text-primary)] font-bold">{formatCurrency(scanResult.ticketTotal)}</span>
                                </div>
                                <div className="h-10 w-px bg-[var(--border-color)]" />
                                <div>
                                    <span className="block text-[10px] text-[var(--text-secondary)] uppercase font-black tracking-widest mb-1">Total App</span>
                                    <span className="block text-2xl font-mono text-emerald-500 font-bold">{formatCurrency(scanResult.appTotal)}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => handleConfirmSync(selectedGroupId)}
                                className="w-full sm:w-auto px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest rounded-xl shadow-xl shadow-emerald-500/20 transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
                            >
                                <CheckCircle size={22} /> Sincronizar Cuentas
                            </button>
                        </div>
                    </div>
                </main>

                <footer className="py-8 text-center text-[var(--text-secondary)] text-xs font-medium uppercase tracking-[0.2em] opacity-40">
                    Easy-Pay Desktop Edition • 2026
                </footer>
            </div>
        </div>
    );
};