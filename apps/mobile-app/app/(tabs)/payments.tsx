import { useEasyPay, Payment, PaymentMethod, timeAgoPayment } from '../../context/EasyPayContext';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    ScrollView, View, Text, TouchableOpacity, Animated,
    Dimensions, Modal, TextInput, ActivityIndicator, Alert, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView, AnimatePresence } from 'moti';
import { useTheme } from '../../src/infrastructure/context/ThemeContext';
import Toast from 'react-native-toast-message';
import { groupRepository } from '../../src/infrastructure/api/repositories/GroupRepository';
import { useNotifications } from '../../src/infrastructure/context/NotificationContext';
import MercadoPagoModal from '../../components/MercadoPagoModal';
import { MPPaymentResult } from '../../src/infrastructure/services/MercadoPagoService';
import { toTitleCase } from '../../src/infrastructure/utils/format';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;
const CARD_SPACING = (width - CARD_WIDTH) / 2;

const METHOD_META: Record<PaymentMethod, { label: string; icon: string; color: string }> = {
    cash:     { label: 'Efectivo',      icon: 'payments',      color: '#4ade80' },
    card:     { label: 'Tarjeta',       icon: 'credit-card',   color: '#60a5fa' },
    transfer: { label: 'Transferencia', icon: 'swap-horiz',    color: '#a78bfa' },
};

const STATUS_META = {
    pending:              { label: 'Pendiente',   color: '#f59e0b' },
    waiting_confirmation: { label: 'Confirmando', color: '#60a5fa' },
    confirmed:            { label: 'Confirmado',  color: '#4ade80' },
    rejected:             { label: 'Rechazado',   color: '#ef4444' },
};

// ── Modal de pago en efectivo con testigo ─────────────────────────────────────
function CashPaymentModal({
    visible, onClose, debt, theme, userId, userName,
}: {
    visible: boolean; onClose: () => void; debt: any;
    theme: any; userId: string; userName: string;
}) {
    const { initiatePayment  } = useEasyPay();
    const [note, setNote] = useState('');
    const [witnessName, setWitnessName] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handlePay = async () => {
        if (!debt) return;
        setLoading(true);
        try {
            await initiatePayment({
                debtId: debt.id,
                groupId: debt.groupId,
                groupName: debt.groupName,
                fromUserId: userId,
                fromUserName: userName,
                toUserId: debt.toUserId,
                toUserName: debt.toUserName,
                amount: debt.amount,
                method: 'cash',
                note,
                witnessName: witnessName || undefined,
                concept: debt.concept,
            });
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                setNote('');
                setWitnessName('');
                onClose();
            }, 2000);
        } catch {
            Alert.alert('Error', 'No se pudo registrar el pago.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <View style={{ flex: 1, backgroundColor: theme.bg }}>
                <View style={{ borderBottomColor: theme.border }} className="flex-row items-center justify-between px-6 py-5 border-b">
                    <TouchableOpacity onPress={onClose} className="w-10 h-10 rounded-full bg-white/5 items-center justify-center">
                        <Ionicons name="close" size={22} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={{ color: theme.text }} className="font-black text-lg">Pago en Efectivo</Text>
                    <View className="w-10" />
                </View>

                <ScrollView className="flex-1 px-6 pt-6" contentContainerStyle={{ paddingBottom: 120 }}>
                    {success ? (
                        <MotiView from={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="items-center py-20">
                            <View className="w-24 h-24 bg-green-500/20 rounded-full items-center justify-center mb-4">
                                <MaterialIcons name="check-circle" size={56} color="#4ade80" />
                            </View>
                            <Text style={{ color: theme.text }} className="text-2xl font-black text-center">¡Pago registrado!</Text>
                            <Text style={{ color: theme.textSecondary }} className="text-center mt-2 px-8">
                                {witnessName
                                    ? `Esperando confirmación de ${toTitleCase(witnessName)} y ${toTitleCase(debt?.toUserName)}`
                                    : `Esperando confirmación de ${toTitleCase(debt?.toUserName)}`}
                            </Text>
                        </MotiView>
                    ) : (
                        <>
                            <View style={{ backgroundColor: '#4ade8015', borderColor: '#4ade8030' }} className="p-6 rounded-[28px] border items-center mb-6">
                                <Text style={{ color: theme.textSecondary }} className="text-xs font-black uppercase tracking-widest mb-1">Monto a pagar</Text>
                                <Text className="text-green-400 text-4xl font-black">${debt?.amount?.toFixed(2)}</Text>
                                <Text style={{ color: theme.textSecondary }} className="text-sm mt-1">a {toTitleCase(debt?.toUserName)} · {debt?.groupName}</Text>
                            </View>

                            {/* Testigo */}
                            <View style={{ backgroundColor: '#f59e0b10', borderColor: '#f59e0b30' }} className="p-5 rounded-[24px] border mb-6">
                                <View className="flex-row items-center gap-2 mb-3">
                                    <MaterialIcons name="visibility" size={18} color="#f59e0b" />
                                    <Text style={{ color: '#f59e0b' }} className="font-black text-sm">Testigo del pago (opcional)</Text>
                                </View>
                                <Text style={{ color: theme.textSecondary }} className="text-xs mb-3">
                                    Agrega un testigo del grupo que confirme que realizaste el pago en efectivo.
                                </Text>
                                <TextInput
                                    value={witnessName}
                                    onChangeText={setWitnessName}
                                    placeholder="Nombre del testigo"
                                    placeholderTextColor={theme.textSecondary}
                                    style={{ color: theme.text, backgroundColor: theme.bg }}
                                    className="p-3 rounded-xl font-bold text-sm"
                                />
                            </View>

                            <Text style={{ color: theme.textSecondary }} className="text-[10px] font-black uppercase tracking-widest mb-3">Nota (opcional)</Text>
                            <TextInput
                                value={note}
                                onChangeText={setNote}
                                placeholder="Ej. Te pagué en el café..."
                                placeholderTextColor={theme.textSecondary}
                                style={{ color: theme.text, backgroundColor: theme.cardSecondary, borderColor: theme.border }}
                                className="p-4 rounded-2xl font-bold text-sm border mb-6"
                                multiline
                            />
                        </>
                    )}
                </ScrollView>

                {!success && (
                    <View style={{ backgroundColor: theme.bg, borderTopColor: theme.border }} className="px-6 pb-10 pt-4 border-t">
                        <TouchableOpacity onPress={handlePay} disabled={loading} className="bg-green-500 py-5 rounded-2xl items-center">
                            {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-black text-base">Confirmar Pago en Efectivo</Text>}
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </Modal>
    );
}

// ── Modal selector de método de pago ──────────────────────────────────────────
function PaymentMethodSelector({
    visible, onClose, debt, theme, onSelectCash, onSelectMP,
}: {
    visible: boolean; onClose: () => void; debt: any; theme: any;
    onSelectCash: () => void; onSelectMP: () => void;
}) {
    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <View style={{ flex: 1, backgroundColor: theme.bg }}>
                <View style={{ borderBottomColor: theme.border }} className="flex-row items-center justify-between px-6 py-5 border-b">
                    <TouchableOpacity onPress={onClose} className="w-10 h-10 rounded-full bg-white/5 items-center justify-center">
                        <Ionicons name="close" size={22} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={{ color: theme.text }} className="font-black text-lg">¿Cómo quieres pagar?</Text>
                    <View className="w-10" />
                </View>

                <View className="px-6 pt-10 gap-4">
                    {/* Monto */}
                    <View style={{ backgroundColor: theme.cardSecondary, borderColor: theme.border }} className="p-5 rounded-[24px] border items-center mb-4">
                        <Text style={{ color: theme.textSecondary }} className="text-xs font-black uppercase tracking-widest mb-1">Total a pagar</Text>
                        <Text style={{ color: theme.primary }} className="text-3xl font-black">${debt?.amount?.toFixed(2)}</Text>
                        <Text style={{ color: theme.textSecondary }} className="text-sm mt-1">a {toTitleCase(debt?.toUserName)} · {debt?.groupName}</Text>
                    </View>

                    {/* Efectivo */}
                    <TouchableOpacity
                        onPress={() => { onClose(); onSelectCash(); }}
                        style={{ backgroundColor: '#4ade8015', borderColor: '#4ade8030' }}
                        className="flex-row items-center gap-4 p-6 rounded-[28px] border"
                    >
                        <View className="w-14 h-14 bg-green-500/20 rounded-2xl items-center justify-center">
                            <MaterialIcons name="payments" size={28} color="#4ade80" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-green-400 font-black text-lg">Efectivo</Text>
                            <Text style={{ color: theme.textSecondary }} className="text-xs mt-0.5">Con testigo opcional que confirme el pago</Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color="#4ade80" />
                    </TouchableOpacity>

                    {/* MercadoPago */}
                    <TouchableOpacity
                        onPress={() => { onClose(); onSelectMP(); }}
                        style={{ backgroundColor: '#009ee315', borderColor: '#009ee330' }}
                        className="flex-row items-center gap-4 p-6 rounded-[28px] border"
                    >
                        <View className="w-14 h-14 rounded-2xl items-center justify-center overflow-hidden" style={{ backgroundColor: '#009ee3' }}>
                            <Text className="text-white font-black text-xs">MP</Text>
                        </View>
                        <View className="flex-1">
                            <Text style={{ color: '#009ee3' }} className="font-black text-lg">MercadoPago</Text>
                            <Text style={{ color: theme.textSecondary }} className="text-xs mt-0.5">Tarjeta, OXXO o Transferencia SPEI</Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color="#009ee3" />
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

// ── Modal de confirmación ─────────────────────────────────────────────────────
function ConfirmationModal({
    visible, payment, onClose, userId, theme,
    onConfirmReceiver, onConfirmWitness, onReject,
}: {
    visible: boolean; payment: Payment | null; onClose: () => void;
    userId: string; theme: any; onConfirmReceiver: () => void;
    onConfirmWitness: () => void; onReject: () => void;
}) {
    if (!payment) return null;
    const isReceiver = payment.toUserId === userId;
    const isWitness = payment.witnessId === userId;
    const method = METHOD_META[payment.method];

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <View style={{ flex: 1, backgroundColor: theme.bg }}>
                <View style={{ borderBottomColor: theme.border }} className="flex-row items-center justify-between px-6 py-5 border-b">
                    <TouchableOpacity onPress={onClose} className="w-10 h-10 rounded-full bg-white/5 items-center justify-center">
                        <Ionicons name="close" size={22} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={{ color: theme.text }} className="font-black text-lg">
                        {isReceiver ? 'Confirmar recepción' : 'Confirmar como testigo'}
                    </Text>
                    <View className="w-10" />
                </View>

                <ScrollView className="flex-1 px-6 pt-8" contentContainerStyle={{ paddingBottom: 120 }}>
                    <View className="items-center mb-8">
                        <View style={{ backgroundColor: method.color + '15' }} className="w-20 h-20 rounded-full items-center justify-center mb-4">
                            <MaterialIcons name={method.icon as any} size={40} color={method.color} />
                        </View>
                        <Text style={{ color: theme.text }} className="text-3xl font-black">${payment.amount.toFixed(2)}</Text>
                        <Text style={{ color: theme.textSecondary }} className="text-sm mt-1">{payment.groupName}</Text>
                    </View>

                    <View style={{ backgroundColor: theme.cardSecondary, borderColor: theme.border }} className="rounded-[28px] border p-5 mb-6">
                        {[
                            { label: 'De', value: toTitleCase(payment.fromUserName) },
                            { label: 'Para', value: toTitleCase(payment.toUserName) },
                            { label: 'Método', value: method.label, color: method.color },
                        ].map((row, i) => (
                            <View key={i} className="flex-row justify-between mb-3">
                                <Text style={{ color: theme.textSecondary }} className="text-xs font-bold">{row.label}</Text>
                                <Text style={{ color: row.color ?? theme.text }} className="font-black">{row.value}</Text>
                            </View>
                        ))}
                        {payment.note && (
                            <View className="flex-row justify-between">
                                <Text style={{ color: theme.textSecondary }} className="text-xs font-bold">Nota</Text>
                                <Text style={{ color: theme.text }} className="font-bold text-sm flex-1 text-right ml-4">{payment.note}</Text>
                            </View>
                        )}
                    </View>

                    {isReceiver && !payment.receiverConfirmed && (
                        <View style={{ backgroundColor: '#4ade8010', borderColor: '#4ade8030' }} className="p-5 rounded-[24px] border mb-4">
                            <Text className="text-green-400 font-black text-sm mb-1">¿Recibiste este pago?</Text>
                            <Text style={{ color: theme.textSecondary }} className="text-xs">
                                Al confirmar, se registrará que recibiste ${payment.amount.toFixed(2)} de {payment.fromUserName}.
                            </Text>
                        </View>
                    )}
                    {isWitness && !payment.witnessConfirmed && (
                        <View style={{ backgroundColor: '#f59e0b10', borderColor: '#f59e0b30' }} className="p-5 rounded-[24px] border mb-4">
                            <Text className="text-yellow-400 font-black text-sm mb-1">Eres testigo de este pago</Text>
                            <Text style={{ color: theme.textSecondary }} className="text-xs">
                                ¿Fuiste testigo de que {payment.fromUserName} pagó ${payment.amount.toFixed(2)} a {payment.toUserName}?
                            </Text>
                        </View>
                    )}
                </ScrollView>

                <View style={{ backgroundColor: theme.bg, borderTopColor: theme.border }} className="px-6 pb-10 pt-4 border-t gap-3">
                    {isReceiver && !payment.receiverConfirmed && (
                        <TouchableOpacity onPress={onConfirmReceiver} className="bg-green-500 py-5 rounded-2xl items-center">
                            <Text className="text-white font-black text-base">✅ Sí, lo recibí</Text>
                        </TouchableOpacity>
                    )}
                    {isWitness && !payment.witnessConfirmed && (
                        <TouchableOpacity onPress={onConfirmWitness} className="bg-yellow-500 py-5 rounded-2xl items-center">
                            <Text className="text-white font-black text-base">👁 Confirmar como testigo</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={onReject} style={{ backgroundColor: theme.cardSecondary }} className="py-4 rounded-2xl items-center">
                        <Text className="text-red-400 font-bold">No confirmar / Rechazar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

// ── Pantalla principal ────────────────────────────────────────────────────────
export default function PaymentsScreen() {
    const { theme, fontScale } = useTheme();
    const { user } = useEasyPay();
    const { debts, payments, cards,
        addDebt, removeDebt,
        getDebtsByUser, getTotalOwed, getTotalToReceive,
        pendingConfirmations,
        confirmPaymentAsReceiver, confirmPaymentAsWitness, rejectPayment,
        initiatePayment, fetchFinancialData, fetchPendingSettlements,
     } = useEasyPay();
    const scrollX = useRef(new Animated.Value(0)).current;
    const [refreshing, setRefreshing] = useState(false);

    const userId = user?.id ?? '';
    const userName = user?.nombre ?? 'Usuario';
    const userEmail = (user as any)?.email ?? 'usuario@easypay.com';

    // Modales
    const [selectorModal, setSelectorModal] = useState<{ visible: boolean; debt: any }>({ visible: false, debt: null });
    const [cashModal, setCashModal] = useState<{ visible: boolean; debt: any }>({ visible: false, debt: null });
    const [mpModal, setMpModal] = useState<{ visible: boolean; debt: any }>({ visible: false, debt: null });
    const [confirmModal, setConfirmModal] = useState<{ visible: boolean; payment: Payment | null }>({ visible: false, payment: null });

    const myDebts = getDebtsByUser(userId);
    const totalOwed = getTotalOwed(userId);
    const totalToReceive = getTotalToReceive(userId);
    const pending = pendingConfirmations(userId);
    const allPayments = payments.filter(p => p.fromUserId === userId || p.toUserId === userId);

    const refreshData = async () => {
        setRefreshing(true);
        try {
            await Promise.all([
                fetchFinancialData(),
                fetchPendingSettlements()
            ]);
        } finally {
            setRefreshing(false);
        }
    };

    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useFocusEffect(
        useCallback(() => {
            refreshData();
            
            intervalRef.current = setInterval(() => {
                console.log('[Polling] Actualizando pagos y pendientes...');
                fetchFinancialData();
                fetchPendingSettlements();
            }, 15000);

            return () => {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }
            };
        }, [])
    );

    // Tarjetas ya no se muestran en esta vista

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
            <StatusBar style="light" />
            <Stack.Screen options={{ headerShown: false }} />

            <ScrollView 
                className="flex-1" 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={{ paddingBottom: 150 }}
                refreshControl={
                    <RefreshControl 
                        refreshing={refreshing} 
                        onRefresh={refreshData} 
                        tintColor={theme.primary} 
                    />
                }
            >

                {/* Header */}
                <View className="px-6 py-8 flex-row justify-between items-center">
                    <View>
                        <Text style={{ fontSize: 32 * fontScale, color: theme.text }} className="font-black tracking-tighter leading-none">HISTORIAL</Text>
                        <Text style={{ fontSize: 9 * fontScale, color: theme.primary }} className="font-black uppercase tracking-[3px] mt-2">Personal & Grupos</Text>
                    </View>
                    <View className="flex-row gap-2">
                        <TouchableOpacity style={{ backgroundColor: theme.cardSecondary, borderColor: theme.border }} className="w-12 h-12 rounded-[18px] items-center justify-center border">
                            <MaterialIcons name="security" size={24} color={theme.textSecondary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={refreshData}
                            disabled={refreshing}
                            style={{ backgroundColor: '#f59e0b20', borderColor: '#f59e0b40', opacity: refreshing ? 0.5 : 1 }}
                            className="w-12 h-12 rounded-[18px] items-center justify-center border"
                        >
                            <MaterialIcons name="refresh" size={24} color="#f59e0b" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Resumen */}
                <View className="px-6 mb-8 flex-row gap-4">
                    <View style={{ backgroundColor: '#ef444415', borderColor: '#ef444430' }} className="flex-1 p-5 rounded-[24px] border">
                        <Text className="text-red-400 text-[10px] font-black uppercase tracking-widest mb-1">Debes</Text>
                        <Text className="text-red-400 text-2xl font-black">${totalOwed.toFixed(2)}</Text>
                        <Text style={{ color: theme.textSecondary }} className="text-xs mt-1">{myDebts.length} deudas</Text>
                    </View>
                    <View style={{ backgroundColor: '#4ade8015', borderColor: '#4ade8030' }} className="flex-1 p-5 rounded-[24px] border">
                        <Text className="text-green-400 text-[10px] font-black uppercase tracking-widest mb-1">Te deben</Text>
                        <Text className="text-green-400 text-2xl font-black">${totalToReceive.toFixed(2)}</Text>
                        <Text style={{ color: theme.textSecondary }} className="text-xs mt-1">Por cobrar</Text>
                    </View>
                </View>

                {/* Confirmaciones pendientes */}
                {pending.length > 0 && (
                    <View className="px-6 mb-8">
                        <Text style={{ color: theme.textSecondary }} className="text-[10px] font-black uppercase tracking-widest mb-3">
                            Requieren tu confirmación ({pending.length})
                        </Text>
                        {pending.map(p => (
                            <TouchableOpacity
                                key={p.id}
                                onPress={() => setConfirmModal({ visible: true, payment: p })}
                                style={{ backgroundColor: '#f59e0b10', borderColor: '#f59e0b40' }}
                                className="flex-row items-center p-4 rounded-[24px] border mb-3"
                            >
                                <View className="w-12 h-12 bg-yellow-500/20 rounded-2xl items-center justify-center mr-3">
                                    <MaterialIcons name="pending-actions" size={24} color="#f59e0b" />
                                </View>
                                <View className="flex-1">
                                    <Text style={{ color: theme.text }} className="font-black text-sm">{p.fromUserName} pagó ${p.amount.toFixed(2)}</Text>
                                    <Text style={{ color: theme.textSecondary }} className="text-xs mt-0.5">{p.groupName} · {METHOD_META[p.method].label}</Text>
                                </View>
                                <Text className="text-yellow-400 font-black text-xs">Confirmar →</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Mis deudas */}
                <View className="px-6 mb-8">
                    <Text style={{ color: theme.textSecondary }} className="text-[10px] font-black uppercase tracking-widest mb-3">
                        Balances Pendientes ({myDebts.length})
                    </Text>
                    {myDebts.length === 0 ? (
                        <View style={{ backgroundColor: theme.cardSecondary, borderColor: theme.border }} className="border rounded-[28px] p-8 items-center">
                            <MaterialIcons name="check-circle" size={36} color="#4ade80" />
                            <Text style={{ color: theme.text }} className="font-black mt-3">¡Sin deudas pendientes!</Text>
                        </View>
                    ) : myDebts.map(debt => (
                        <MotiView
                            key={debt.id}
                            from={{ opacity: 0, translateX: -10 }}
                            animate={{ opacity: 1, translateX: 0 }}
                            style={{ backgroundColor: theme.cardSecondary, borderColor: theme.border }}
                            className="border rounded-[24px] p-5 mb-3 flex-row items-center"
                        >
                            <View className="w-12 h-12 bg-red-500/10 rounded-2xl items-center justify-center mr-3">
                                <MaterialIcons name="payment" size={24} color="#ef4444" />
                            </View>
                            <View className="flex-1">
                                <Text style={{ color: theme.text }} className="font-black text-sm">{debt.groupName}</Text>
                                <Text style={{ color: theme.textSecondary }} className="text-xs mt-0.5">A: {toTitleCase(debt.toUserName)} · {debt.concept}</Text>
                            </View>
                            <View className="items-end ml-3">
                                <Text className="text-red-400 font-black text-lg">${debt.amount.toFixed(2)}</Text>
                                {/* BOTÓN PAGAR — abre selector de método */}
                                <TouchableOpacity
                                    onPress={() => setSelectorModal({ visible: true, debt })}
                                    style={{ backgroundColor: theme.primary }}
                                    className="px-3 py-1.5 rounded-xl mt-1"
                                >
                                    <Text className="text-white font-black text-[10px]">PAGAR</Text>
                                </TouchableOpacity>
                            </View>
                        </MotiView>
                    ))}
                </View>

                {/* Historial */}
                <View className="px-6 mb-10">
                    <Text style={{ color: theme.textSecondary }} className="text-[10px] font-black uppercase tracking-widest mb-4">
                        Actividad de Pagos ({allPayments.length})
                    </Text>
                    {allPayments.length === 0 ? (
                        <View style={{ backgroundColor: theme.cardSecondary, borderColor: theme.border }} className="border rounded-[28px] p-10 items-center">
                            <MaterialIcons name="history" size={36} color={theme.textSecondary} />
                            <Text style={{ color: theme.text }} className="font-black mt-3 text-center">Sin actividad</Text>
                            <Text style={{ color: theme.textSecondary }} className="text-center text-xs mt-2 px-6">Cuando registres pagos aparecerán aquí.</Text>
                        </View>
                    ) : (
                        <View style={{ backgroundColor: theme.cardSecondary, borderColor: theme.border }} className="border rounded-[40px] overflow-hidden p-2">
                            {allPayments.map((tx, i) => {
                                const method = METHOD_META[tx.method];
                                const status = STATUS_META[tx.status];
                                const isOutgoing = tx.fromUserId === userId;
                                return (
                                    <TouchableOpacity
                                        key={tx.id}
                                        onPress={() => tx.status === 'waiting_confirmation' && (tx.toUserId === userId || tx.witnessId === userId)
                                            ? setConfirmModal({ visible: true, payment: tx }) : null}
                                        className={`p-5 flex-row items-center justify-between mb-2 rounded-[32px] ${i % 2 === 0 ? 'bg-white/5' : ''}`}
                                    >
                                        <View className="flex-row items-center gap-4 flex-1">
                                            <View style={{ backgroundColor: method.color + '15' }} className="w-14 h-14 rounded-[20px] items-center justify-center">
                                                <MaterialIcons name={method.icon as any} size={24} color={method.color} />
                                            </View>
                                            <View className="flex-1">
                                                <Text style={{ fontSize: 14 * fontScale, color: theme.text }} className="font-black" numberOfLines={1}>
                                                    {isOutgoing ? `→ ${toTitleCase(tx.toUserName)}` : `← ${toTitleCase(tx.fromUserName)}`}
                                                </Text>
                                                <Text style={{ color: theme.textSecondary }} className="text-xs mt-0.5">{tx.groupName}</Text>
                                                <View className="flex-row items-center gap-2 mt-1">
                                                    <Text style={{ color: status.color }} className="text-[9px] font-black uppercase">{status.label}</Text>
                                                    <Text className="text-slate-600 text-[9px]">· {timeAgoPayment(tx.createdAt)}</Text>
                                                </View>
                                            </View>
                                        </View>
                                        <Text style={{ color: isOutgoing ? '#ef4444' : '#4ade80' }} className="font-black text-base ml-4">
                                            {isOutgoing ? '-' : '+'}${tx.amount.toFixed(2)}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* ── Modales ── */}

            {/* 1. Selector de método */}
            <PaymentMethodSelector
                visible={selectorModal.visible}
                onClose={() => setSelectorModal({ visible: false, debt: null })}
                debt={selectorModal.debt}
                theme={theme}
                onSelectCash={() => setCashModal({ visible: true, debt: selectorModal.debt })}
                onSelectMP={() => setMpModal({ visible: true, debt: selectorModal.debt })}
            />

            {/* 2. Pago en efectivo con testigo */}
            <CashPaymentModal
                visible={cashModal.visible}
                onClose={() => setCashModal({ visible: false, debt: null })}
                debt={cashModal.debt}
                theme={theme}
                userId={userId}
                userName={userName}
            />

            {/* 3. MercadoPago (tarjeta, OXXO, SPEI) */}
            <MercadoPagoModal
                visible={mpModal.visible}
                onClose={() => setMpModal({ visible: false, debt: null })}
                amount={mpModal.debt?.amount ?? 0}
                concept={mpModal.debt?.concept ?? 'Easy-Pay'}
                payerEmail={userEmail}
                payerName={userName}
                theme={theme}
                onSuccess={async (result: MPPaymentResult) => {
                    if (result.status === 'approved') {
                        // Pago aprobado — registrar en historial y eliminar deuda
                        if (mpModal.debt) {
                            await initiatePayment({
                                debtId: mpModal.debt.id,
                                groupId: mpModal.debt.groupId,
                                groupName: mpModal.debt.groupName,
                                fromUserId: userId,
                                fromUserName: userName,
                                toUserId: mpModal.debt.toUserId,
                                toUserName: mpModal.debt.toUserName,
                                amount: mpModal.debt.amount,
                                method: 'card',
                                concept: mpModal.debt.concept,
                                note: `MercadoPago ID: ${result.id}`,
                                receiverConfirmed: true,
                                witnessConfirmed: true,
                            } as any);
                            removeDebt(mpModal.debt.id);
                        }
                    }
                    setMpModal({ visible: false, debt: null });
                }}
            />

            {/* 4. Confirmación receptor/testigo */}
            <ConfirmationModal
                visible={confirmModal.visible}
                payment={confirmModal.payment}
                onClose={() => setConfirmModal({ visible: false, payment: null })}
                userId={userId}
                theme={theme}
                onConfirmReceiver={() => {
                    if (confirmModal.payment) confirmPaymentAsReceiver(confirmModal.payment.id);
                    setConfirmModal({ visible: false, payment: null });
                }}
                onConfirmWitness={() => {
                    if (confirmModal.payment) confirmPaymentAsWitness(confirmModal.payment.id);
                    setConfirmModal({ visible: false, payment: null });
                }}
                onReject={() => {
                    if (confirmModal.payment) rejectPayment(confirmModal.payment.id);
                    setConfirmModal({ visible: false, payment: null });
                }}
            />
        </SafeAreaView>
    );
}
