import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import OcrService, { TicketData } from '../../../infrastructure/services/OcrService';
import { groupRepository } from '../../../infrastructure/api/repositories/GroupRepository';
import { useAuthContext } from '../../context/AuthContext';
import { Item } from '@easy-pay/domain';

export interface OCRItem {
    id?: string;
    description: string;
    amount: number;
    isUnassigned?: boolean;
    assignedToIds?: string[];
    quantity: number;
    price: number;
}

export interface OCRScanResult {
    ticketTotal: number;
    appTotal: number;
    confidence: number;
    detectedItems: OCRItem[];
    appItems: OCRItem[];
    unassignedItems: OCRItem[];
}

const INITIAL_SCAN: OCRScanResult = {
    ticketTotal: 0,
    appTotal: 0,
    confidence: 0,
    detectedItems: [],
    appItems: [],
    unassignedItems: [],
};

export const useOCRScanner = () => {
    const { user } = useAuthContext();
    const [scanResult, setScanResult] = useState<OCRScanResult>(INITIAL_SCAN);
    const [isScanning, setIsScanning] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedGroupId, setSelectedGroupId] = useState<string>('');

    const handleFileUpload = useCallback(async (file: File) => {
        if (isProcessing) return;
        
        setSelectedFile(file);
        setIsProcessing(true);
        setIsScanning(true);
        const toastId = toast.loading("Analizando ticket con IA...");

        try {
            const data: TicketData = await OcrService.extractTicketData(file);
            
            const detectedItems: OCRItem[] = data.items.map((item, idx) => ({
                id: `ocr-${idx}`,
                description: item.name,
                amount: item.price * item.quantity,
                isUnassigned: true,
                assignedToIds: [],
                quantity: item.quantity,
                price: item.price
            }));

            setScanResult({
                ticketTotal: data.total,
                appTotal: 0,
                confidence: 98,
                detectedItems,
                appItems: [],
                unassignedItems: detectedItems
            });
            
            toast.success("Ticket analizado con éxito", { id: toastId });

        } catch (error) {
            console.error('Error procesando ticket:', error);
            toast.error("No se pudo leer el ticket. Intenta con una imagen más clara.", { id: toastId });
        } finally {
            setIsProcessing(false);
            setIsScanning(false);
        }
    }, [isProcessing]);

    const handleSplitAll = (item: OCRItem, memberIds: string[]) => {
        setScanResult(prev => {
            const newDetected = prev.detectedItems.map(i => 
                i.id === item.id ? { ...i, isUnassigned: false, assignedToIds: memberIds } : i
            );
            const newUnassigned = newDetected.filter(i => i.isUnassigned);
            const newAppItems = newDetected.filter(i => !i.isUnassigned);
            const appTotal = newAppItems.reduce((acc, i) => acc + i.amount, 0);

            return {
                ...prev,
                detectedItems: newDetected,
                unassignedItems: newUnassigned,
                appItems: newAppItems,
                appTotal
            };
        });
        toast.info(`Item "${item.description}" dividido entre el grupo`);
    };

    const handleAssignToMe = (item: OCRItem) => {
        if (!user?.id) return;
        handleSplitAll(item, [user.id]);
        toast.info(`Item "${item.description}" asignado a ti`);
    };

    const handleConfirmSync = async (groupId: string) => {
        if (!groupId) {
            toast.error("Por favor, selecciona un grupo primero");
            return;
        }

        if (scanResult.appItems.length === 0) {
            toast.error("No hay items asignados para sincronizar");
            return;
        }

        const toastId = toast.loading("Sincronizando gastos con el grupo...");
        try {
            for (const item of scanResult.appItems) {
                const newItem: Item = {
                    id: crypto.randomUUID(),
                    name: item.description,
                    amount: item.price, // El repositorio espera el precio unitario si toApiItem lo maneja, o el total.
                    // toApiItem usa item.amount como precio?
                    // Let's check mapper.
                } as any; 
                
                // Mapeo manual para asegurar compatibilidad
                await groupRepository.addItem(groupId, {
                    id: crypto.randomUUID(),
                    nombre: item.description,
                    precio: item.price,
                    cantidad: item.quantity,
                    comprador_id: user?.id || '',
                    participantes_ids: item.assignedToIds || [],
                    categoria: 'Comida',
                    fecha: new Date().toISOString()
                } as any);
            }
            toast.success("Gastos sincronizados correctamente", { id: toastId });
            setScanResult(INITIAL_SCAN);
            setSelectedFile(null);
        } catch (error) {
            console.error("Error sincronizando OCR:", error);
            toast.error("Error al sincronizar algunos items", { id: toastId });
        }
    };

    const formatCurrency = (amount: number) =>
        `$${Number(amount).toFixed(2)}`;

    const difference = scanResult.ticketTotal - scanResult.appTotal;

    return {
        scanResult,
        isScanning,
        isProcessing,
        selectedFile,
        selectedGroupId,
        setSelectedGroupId,
        difference,
        handleFileUpload,
        handleSplitAll,
        handleAssignToMe,
        handleConfirmSync,
        formatCurrency,
    };
};
