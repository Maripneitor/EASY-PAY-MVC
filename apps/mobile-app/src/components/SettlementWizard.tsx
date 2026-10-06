import { useEasyPay } from '../../context/EasyPayContext';
import React, { useState, useMemo } from 'react';
import { 
    View, 
    Text, 
    Modal, 
    TouchableOpacity, 
    ScrollView, 
    Dimensions,
    TextInput,
    Alert
} from 'react-native';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../infrastructure/context/ThemeContext';
import { ItemAssignModal } from '../../components/ItemAssignModal';


import { Item, Participant } from '../domain/types';

const { width, height } = Dimensions.get('window');

interface SettlementWizardProps {
    isOpen: boolean;
    onClose: () => void;
    groupId?: string;
    items?: Item[];
    members?: Participant[];
    onComplete?: () => void;
}

export const SettlementWizard: React.FC<SettlementWizardProps> = ({ 
    isOpen, 
    onClose,
    groupId,
    items,
    members,
    onComplete
}) => {
    const { theme, fontScale } = useTheme();
    const { user  } = useEasyPay();
    const { activeGrupo, startSettlement, closeGrupo: contextCloseGrupo, assignItem } = useEasyPay();

    // Fallback to context if props not provided
    const effectiveGroupId = groupId || activeGrupo?.id;
    const effectiveItems = items || activeGrupo?.items || [];
    const effectiveMembers = members || activeGrupo?.participantes || [];

    const [step, setStep] = useState(1);
    const [tipPercentage, setTipPercentage] = useState(10);
    const [customTip, setCustomTip] = useState('');
    const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [assigningItem, setAssigningItem] = useState<Item | null>(null);

    // Initial selected accounts (default)
    React.useEffect(() => {
        if (user?.bank_accounts) {
            const defaults = user.bank_accounts.filter((a: any) => a.is_default).map((a: any) => a.id);
            setSelectedAccounts(defaults);
        }
        
        // GRP-WIZ-07 / GRP-WIZ-08: Sugerencia automática de propina
        if (subtotal < 3000) {
            setTipPercentage(10);
        } else {
            setTipPercentage(5);
        }
    }, [user, subtotal]);

    if (!effectiveGroupId) return null;

    const unassignedItems = effectiveItems.filter(item => 
        !item.asignadoA || item.asignadoA.length === 0
    );

    const subtotal = effectiveItems.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
    const tipAmount = tipPercentage === -1 ? Number(customTip) || 0 : (subtotal * tipPercentage) / 100;
    const finalTotal = subtotal + tipAmount;

    // --- Calculation for summary ---
    const summary = effectiveMembers.map(member => {
        const spent = effectiveItems
            .filter(item => item.asignadoA?.includes(member.id))
            .reduce((acc, item) => acc + (item.precio * item.cantidad / item.asignadoA.length), 0);

        const shareOfTip = tipAmount / (effectiveMembers.length || 1);
        return {
            name: member.nombre,
            subtotal: spent,
            tip: shareOfTip,
            total: spent + shareOfTip
        };
    });

    const handleNext = () => setStep(s => s + 1);
    const handleBack = () => setStep(s => s - 1);

    const handleConfirm = async () => {
        if (selectedAccounts.length === 0) {
            Alert.alert("Error", "Debes seleccionar al menos una cuenta bancaria");
            return;
        }

        setIsProcessing(true);
        try {
            const accountsToShow = (user?.bank_accounts || []).filter((a: any) => selectedAccounts.includes(a.id));

            // 1. Iniciar liquidación con cuentas
            await startSettlement(accountsToShow);

            // 2. Cerrar grupo
            await contextCloseGrupo(tipAmount, finalTotal);

            Alert.alert("¡Éxito!", "El grupo ha sido liquidado correctamente.");
            if (onComplete) onComplete();
            onClose();
        } catch (error) {
            Alert.alert("Error", "No se pudo completar la liquidación.");
        } finally {
            setIsProcessing(false);
        }
    };

    const isNextDisabled = () => {
        if (step === 1) return unassignedItems.length > 0;
        if (step === 3) return selectedAccounts.length === 0;
        return false;
    };

    return (
        <Modal
            visible={isOpen}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-end bg-black/60">
                <View 
                    style={{ backgroundColor: theme.bg, borderTopLeftRadius: 40, borderTopRightRadius: 40, height: height * 0.85 }}
                    className="overflow-hidden"
                >
                    {/* Header */}
                    <View className="px-6 py-6 border-b border-white/5 flex-row items-center justify-between">
                        <View>
                            <Text style={{ color: theme.text, fontSize: 18 * fontScale }} className="font-black uppercase tracking-tighter">
                                Liquidación
                            </Text>
                            <Text style={{ color: theme.textSecondary, fontSize: 10 * fontScale }} className="font-black uppercase tracking-widest mt-1">
                                Paso {step} de 4
                            </Text>
                        </View>
                        <TouchableOpacity onPress={onClose} className="w-10 h-10 rounded-full bg-white/5 items-center justify-center">
                            <MaterialIcons name="close" size={24} color={theme.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Progress Bar */}
                    <View className="w-full h-1 bg-white/5">
                        <View 
                            style={{ width: `${(step / 4) * 100}%`, backgroundColor: theme.primary }} 
                            className="h-full"
                        />
                    </View>

                    <ScrollView className="flex-1 px-6 py-8" showsVerticalScrollIndicator={false}>
                        {step === 1 && (
                            <View className="gap-6">
                                <View className="items-center">
                                    <View className="w-20 h-20 rounded-[30px] bg-blue-500/10 items-center justify-center mb-4">
                                        <MaterialIcons name="fact-check" size={40} color="#3b82f6" />
                                    </View>
                                    <Text style={{ color: theme.text }} className="text-xl font-black uppercase text-center">Validación</Text>
                                    <Text style={{ color: theme.textSecondary }} className="text-sm font-medium text-center mt-2">
                                        Verifica que todos los ítems tengan un responsable.
                                    </Text>
                                </View>

                                {unassignedItems.length > 0 ? (
                                    <View className="bg-rose-500/10 p-6 rounded-[30px] border border-rose-500/20 flex-row gap-4">
                                        <MaterialIcons name="error-outline" size={24} color="#f43f5e" />
                                        <View className="flex-1">
                                            <Text className="text-rose-500 font-black uppercase text-xs">Items sin asignar</Text>
                                            <Text className="text-rose-500/60 text-[10px] font-bold mt-1">
                                                Hay {unassignedItems.length} items pendientes. Asígnalos antes de continuar.
                                            </Text>
                                        </View>
                                    </View>
                                ) : (
                                    <View className="bg-emerald-500/10 p-6 rounded-[30px] border border-emerald-500/20 items-center">
                                        <MaterialIcons name="check-circle" size={48} color="#10b981" />
                                        <Text className="text-emerald-500 font-black uppercase text-xs mt-3">¡Todo asignado!</Text>
                                    </View>
                                )}

                                <View className="gap-3 mt-4">
                                    <Text style={{ color: theme.textSecondary }} className="text-[10px] font-black uppercase tracking-widest px-2">Lista de Items</Text>
                                    {effectiveItems.map((item, i) => (
                                        <View key={i} style={{ backgroundColor: theme.cardSecondary }} className="p-5 rounded-[30px] border border-white/5 flex-row justify-between items-center">
                                            <View className="flex-1">
                                                <Text style={{ color: theme.text }} className="font-black text-sm uppercase">{item.nombre}</Text>
                                                <View className="flex-row flex-wrap gap-1 mt-1">
                                                    {item.asignadoA?.length > 0 ? (
                                                        item.asignadoA.map((id, j) => (
                                                            <View key={j} className="bg-white/5 px-2 py-0.5 rounded-md">
                                                                <Text style={{ color: theme.textSecondary }} className="text-[8px] font-black uppercase">
                                                                    {effectiveMembers.find(p => p.id === id)?.nombre?.split(' ')[0] || '?'}
                                                                </Text>
                                                            </View>
                                                        ))
                                                    ) : (
                                                        <TouchableOpacity 
                                                            onPress={() => setAssigningItem(item)}
                                                            className="bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20"
                                                        >
                                                            <Text className="text-rose-500 text-[8px] font-black uppercase">⚠️ Asignar ahora</Text>
                                                        </TouchableOpacity>
                                                    )}
                                                </View>
                                            </View>
                                            <Text style={{ color: theme.primary }} className="font-black font-mono text-base">${item.precio.toFixed(2)}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {step === 2 && (
                            <View className="gap-8">
                                <View className="items-center">
                                    <View className="w-20 h-20 rounded-[30px] bg-amber-500/10 items-center justify-center mb-4">
                                        <FontAwesome5 name="percentage" size={32} color="#f59e0b" />
                                    </View>
                                    <Text style={{ color: theme.text }} className="text-xl font-black uppercase text-center">Propina</Text>
                                    <Text style={{ color: theme.textSecondary }} className="text-sm font-medium text-center mt-2">
                                        Selecciona el porcentaje de gratificación.
                                    </Text>
                                </View>

                                <View className="flex-row flex-wrap gap-4 justify-center">
                                    {[5, 10, 15, -1].map((val) => (
                                        <TouchableOpacity
                                            key={val}
                                            onPress={() => setTipPercentage(val)}
                                            style={{ 
                                                backgroundColor: tipPercentage === val ? theme.primary : theme.cardSecondary,
                                                width: (width - 64) / 2,
                                                height: 80
                                            }}
                                            className="rounded-[24px] items-center justify-center border border-white/5 shadow-sm"
                                        >
                                            <Text 
                                                style={{ color: tipPercentage === val ? 'black' : theme.text }} 
                                                className="text-xl font-black"
                                            >
                                                {val === -1 ? 'Otro' : `${val}%`}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {tipPercentage === -1 && (
                                    <View style={{ backgroundColor: theme.cardSecondary }} className="p-6 rounded-[30px] border border-white/5">
                                        <Text style={{ color: theme.textSecondary }} className="text-[10px] font-black uppercase mb-2">Monto personalizado ($)</Text>
                                        <TextInput 
                                            keyboardType="numeric"
                                            value={customTip}
                                            onChangeText={setCustomTip}
                                            placeholder="0.00"
                                            placeholderTextColor={theme.textSecondary + '40'}
                                            style={{ color: theme.text, fontSize: 24, fontWeight: '900' }}
                                        />
                                    </View>
                                )}

                                <View style={{ backgroundColor: theme.cardSecondary }} className="p-8 rounded-[40px] border border-white/5 gap-4">
                                    <View className="flex-row justify-between">
                                        <Text style={{ color: theme.textSecondary }} className="font-bold uppercase text-[10px]">Subtotal</Text>
                                        <Text style={{ color: theme.text }} className="font-black font-mono">${subtotal.toFixed(2)}</Text>
                                    </View>
                                    <View className="flex-row justify-between">
                                        <Text style={{ color: theme.textSecondary }} className="font-bold uppercase text-[10px]">Propina</Text>
                                        <Text className="text-emerald-500 font-black font-mono">+${tipAmount.toFixed(2)}</Text>
                                    </View>
                                    <View className="h-[1px] bg-white/5 w-full my-2" />
                                    <View className="flex-row justify-between items-center">
                                        <Text style={{ color: theme.text }} className="font-black uppercase text-xs">Total Actualizado</Text>
                                        <Text style={{ color: theme.primary }} className="text-3xl font-black font-mono">${finalTotal.toFixed(2)}</Text>
                                    </View>
                                </View>
                            </View>
                        )}

                        {step === 3 && (
                            <View className="gap-6">
                                <View className="items-center">
                                    <View className="w-20 h-20 rounded-[30px] bg-indigo-500/10 items-center justify-center mb-4">
                                        <Ionicons name="card-outline" size={40} color="#6366f1" />
                                    </View>
                                    <Text style={{ color: theme.text }} className="text-xl font-black uppercase text-center">Cuentas Bancarias</Text>
                                    <Text style={{ color: theme.textSecondary }} className="text-sm font-medium text-center mt-2">
                                        ¿Dónde recibirás las transferencias?
                                    </Text>
                                </View>

                                <View className="gap-4">
                                    {!user?.bank_accounts || user.bank_accounts.length === 0 ? (
                                        <View className="p-10 border-2 border-dashed border-white/10 rounded-[40px] items-center">
                                            <Text style={{ color: theme.textSecondary }} className="text-center font-bold">No tienes cuentas registradas.</Text>
                                        </View>
                                    ) : (
                                        user.bank_accounts.map((acc: any) => (
                                            <TouchableOpacity 
                                                key={acc.id}
                                                onPress={() => {
                                                    if (selectedAccounts.includes(acc.id)) {
                                                        setSelectedAccounts(selectedAccounts.filter(id => id !== acc.id));
                                                    } else {
                                                        setSelectedAccounts([...selectedAccounts, acc.id]);
                                                    }
                                                }}
                                                style={{ 
                                                    backgroundColor: theme.cardSecondary,
                                                    borderColor: selectedAccounts.includes(acc.id) ? theme.primary : 'transparent',
                                                    borderWidth: 2
                                                }}
                                                className="p-6 rounded-[30px] flex-row items-center justify-between"
                                            >
                                                <View className="flex-row items-center gap-4">
                                                    <View className="w-10 h-10 rounded-xl bg-white/5 items-center justify-center">
                                                        <MaterialIcons name="account-balance" size={20} color={theme.textSecondary} />
                                                    </View>
                                                    <View>
                                                        <Text style={{ color: theme.text }} className="font-black text-sm uppercase">{acc.entidad_financiera}</Text>
                                                        <Text style={{ color: theme.textSecondary }} className="font-mono text-[10px]">{acc.clabe}</Text>
                                                    </View>
                                                </View>
                                                <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${selectedAccounts.includes(acc.id) ? 'bg-blue-500 border-blue-500' : 'border-white/10'}`}>
                                                    {selectedAccounts.includes(acc.id) && <MaterialIcons name="check" size={14} color="white" />}
                                                </View>
                                            </TouchableOpacity>
                                        ))
                                    )}
                                </View>
                            </View>
                        )}

                        {step === 4 && (
                            <View className="gap-6 pb-20">
                                <View className="flex-row items-center gap-4">
                                    <View className="w-12 h-12 rounded-2xl bg-emerald-500/10 items-center justify-center">
                                        <MaterialIcons name="list-alt" size={24} color="#10b981" />
                                    </View>
                                    <Text style={{ color: theme.text }} className="text-xl font-black uppercase">Resumen Final</Text>
                                </View>

                                <View style={{ backgroundColor: theme.cardSecondary }} className="rounded-[40px] border border-white/5 overflow-hidden">
                                    {summary.map((row, i) => (
                                        <View key={i} className={`p-6 flex-row justify-between items-center ${i !== summary.length - 1 ? 'border-b border-white/5' : ''}`}>
                                            <View>
                                                <Text style={{ color: theme.text }} className="font-black text-xs uppercase">{row.name}</Text>
                                                <Text style={{ color: theme.textSecondary }} className="text-[8px] font-bold">CON. ${row.subtotal.toFixed(2)} + PROP. ${row.tip.toFixed(2)}</Text>
                                            </View>
                                            <Text style={{ color: theme.text }} className="font-black font-mono text-sm">${row.total.toFixed(2)}</Text>
                                        </View>
                                    ))}
                                </View>

                                <View className="bg-blue-500/10 p-6 rounded-[30px] border border-blue-500/20 flex-row gap-4">
                                    <MaterialIcons name="info" size={20} color={theme.primary} />
                                    <Text style={{ color: theme.primary }} className="flex-1 text-[10px] font-black uppercase tracking-wider leading-4">
                                        Al confirmar, el grupo se cerrará y los miembros podrán ver su cuenta y pagar a las {selectedAccounts.length} cuentas seleccionadas.
                                    </Text>
                                </View>
                            </View>
                        )}
                    </ScrollView>

                    {/* Footer */}
                    <View className="px-6 py-8 border-t border-white/5 flex-row justify-between items-center bg-black/20">
                        <TouchableOpacity 
                            onPress={step === 1 ? onClose : handleBack}
                            className="flex-row items-center gap-2"
                        >
                            <MaterialIcons name="arrow-back" size={20} color={theme.textSecondary} />
                            <Text style={{ color: theme.textSecondary }} className="font-black uppercase text-[10px] tracking-widest">
                                {step === 1 ? 'Cancelar' : 'Anterior'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            disabled={isNextDisabled() || isProcessing}
                            onPress={step === 4 ? handleConfirm : handleNext}
                            style={{ backgroundColor: isNextDisabled() ? theme.textSecondary + '20' : theme.primary }}
                            className="px-8 py-5 rounded-[24px] flex-row items-center gap-3 shadow-lg"
                        >
                            <Text className="text-black font-black uppercase text-xs tracking-widest">
                                {isProcessing ? 'Procesando...' : step === 4 ? 'Confirmar' : 'Siguiente'}
                            </Text>
                            {!isProcessing && <MaterialIcons name="arrow-forward" size={18} color="black" />}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
            <ItemAssignModal 
                isVisible={!!assigningItem}
                item={assigningItem as any}
                members={effectiveMembers}
                onClose={() => setAssigningItem(null)}
                onAssign={async (itemId, participantIds) => {
                    await assignItem(itemId, participantIds);
                    setAssigningItem(null);
                }}
            />
        </Modal>
    );
};
