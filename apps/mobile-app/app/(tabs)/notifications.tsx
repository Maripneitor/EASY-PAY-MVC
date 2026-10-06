import React, { useMemo } from 'react';
import {
    ScrollView,
    View,
    Text,
    Pressable,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { MotiView, AnimatePresence } from 'moti';
import { useTheme } from '../../src/infrastructure/context/ThemeContext';
import { useNotifications, timeAgo } from '../../src/infrastructure/context/NotificationContext';
import { AppNotification } from '../../src/infrastructure/services/NotificationService';
import { groupRepository } from '../../src/infrastructure/api/repositories/GroupRepository';
import { useEasyPay } from '../../context/EasyPayContext';
import { Alert } from 'react-native';

const { width } = Dimensions.get('window');

// ── Sección de deudas ────────────────────────────────────────────────────────
function DebtsSummary({ notifications }: { notifications: AppNotification[] }) {
    const { theme } = useTheme();
    const router = useRouter();

    const debts = useMemo(() =>
        notifications.filter(n => n.type === 'payment_due'),
    [notifications]);

    const totalOwed = useMemo(() =>
        debts.reduce((acc, n) => {
            const raw = n.amount?.replace(/[^0-9.]/g, '') ?? '0';
            return acc + parseFloat(raw);
        }, 0),
    [debts]);

    if (debts.length === 0) return null;

    return (
        <MotiView
            from={{ opacity: 0, translateY: -10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400 }}
            style={{ backgroundColor: '#ef444415', borderColor: '#ef444430' }}
            className="mx-0 mb-6 p-5 rounded-[28px] border"
        >
            <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center gap-2">
                    <View className="w-8 h-8 bg-red-500/20 rounded-full items-center justify-center">
                        <MaterialIcons name="payment" size={18} color="#ef4444" />
                    </View>
                    <Text style={{ color: '#ef4444' }} className="font-black text-sm uppercase tracking-wider">
                        Debes pagar
                    </Text>
                </View>
                <Text style={{ color: '#ef4444' }} className="font-black text-lg">
                    ${totalOwed.toFixed(2)}
                </Text>
            </View>

            {debts.map(debt => (
                <TouchableOpacity
                    key={debt.id}
                    onPress={() => router.push('/(tabs)/payments' as any)}
                    className="flex-row justify-between items-center py-3 border-t border-red-500/10"
                >
                    <View className="flex-1">
                        <Text style={{ color: '#fca5a5' }} className="font-bold text-sm">{debt.groupName ?? 'Grupo'}</Text>
                        <Text className="text-red-400/60 text-xs mt-0.5">A: {debt.userName ?? 'Desconocido'}</Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                        <Text style={{ color: '#ef4444' }} className="font-black">{debt.amount}</Text>
                        <MaterialIcons name="chevron-right" size={16} color="#ef4444" />
                    </View>
                </TouchableOpacity>
            ))}

            <TouchableOpacity
                onPress={() => router.push('/(tabs)/payments' as any)}
                className="mt-4 bg-red-500/20 py-3 rounded-2xl items-center"
            >
                <Text className="text-red-400 font-black text-xs uppercase tracking-widest">
                    Ver en Cartera →
                </Text>
            </TouchableOpacity>
        </MotiView>
    );
}

// ── Tarjeta individual ───────────────────────────────────────────────────────
function NotificationCard({
    n,
    theme,
    onMarkRead,
    onRemove,
    onAccept,
    accepting,
    accepted,
}: {
    n: AppNotification;
    theme: any;
    onMarkRead: () => void;
    onRemove: () => void;
    onAccept: () => void;
    accepting: boolean;
    accepted: boolean;
    onReject?: () => void;
    rejecting?: boolean;
}) {
    const router = useRouter();

    const getInitials = (name?: string) => {
        if (!name) return '??';
        return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    };

    const isInvitation = n.type === 'invitation';
    const isPaymentRequest = n.type === 'payment_received' || n.data?.type === 'settlement_request';

    return (
        <AnimatePresence>
            <MotiView
                from={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8, height: 0 }}
                transition={{ type: 'timing', duration: 350 }}
                className="relative mb-4 overflow-hidden"
            >
                {!n.read && (
                    <View
                        style={{ backgroundColor: theme.primary }}
                        className="absolute z-10 left-0 top-6 w-1 h-10 rounded-full"
                    />
                )}

                <Pressable
                    onPress={() => {
                        onMarkRead();
                        if (!isInvitation || accepted) {
                            if (n.route) router.push(n.route as any);
                        }
                    }}
                    style={{
                        backgroundColor: theme.cardSecondary,
                        borderColor: !n.read ? `${theme.primary}25` : theme.border,
                    }}
                    className="border rounded-[28px] p-5 flex-row gap-4 items-center"
                >
                    {/* Icono / Avatar */}
                    {isInvitation ? (
                        <View className="w-14 h-14 rounded-full overflow-hidden border-2 border-slate-700/50 items-center justify-center bg-slate-800">
                            {n.avatar ? (
                                <Image source={{ uri: n.avatar }} className="w-full h-full" />
                            ) : (
                                <Text className="text-white font-black text-lg">
                                    {getInitials(n.userName ?? n.title)}
                                </Text>
                            )}
                        </View>
                    ) : (
                        <View
                            className="w-14 h-14 rounded-[22px] items-center justify-center"
                            style={{
                                backgroundColor: `${n.iconColor ?? '#2196F3'}15`,
                                borderWidth: 1,
                                borderColor: `${n.iconColor ?? '#2196F3'}30`,
                            }}
                        >
                            <MaterialIcons
                                name={(n.icon ?? 'notifications') as any}
                                size={28}
                                color={n.iconColor ?? '#2196F3'}
                            />
                        </View>
                    )}

                    {/* Contenido */}
                    <View className="flex-1">
                        {accepted ? (
                            <MotiView
                                from={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex-row items-center gap-2"
                            >
                                <MaterialIcons name="check-circle" size={16} color="#4ade80" />
                                <Text style={{ color: '#4ade80' }} className="font-black text-sm uppercase tracking-widest">
                                    ¡Te uniste!
                                </Text>
                            </MotiView>
                        ) : (
                            <>
                                <View className="flex-row justify-between items-start">
                                    <View className="flex-1">
                                        <Text style={{ color: theme.text }} className="font-bold text-sm leading-tight">
                                            {n.title}
                                        </Text>
                                        <Text className="text-slate-500 text-xs mt-1">{n.body}</Text>
                                        <Text className="text-slate-600 text-[10px] mt-1 font-bold uppercase tracking-widest">
                                            {timeAgo(n.timestamp)}
                                        </Text>
                                    </View>
                                    {(!n.read || n.type === 'alert') && (
                                        <TouchableOpacity
                                            onPress={onRemove}
                                            className="ml-2 bg-white/5 p-1.5 rounded-full"
                                        >
                                            <MaterialIcons name="close" size={14} color={theme.textSecondary} />
                                        </TouchableOpacity>
                                    )}
                                </View>

                                {(isInvitation || isPaymentRequest) && (
                                    <View className="flex-row gap-3 mt-4">
                                        <TouchableOpacity
                                            onPress={onAccept}
                                            disabled={accepting}
                                            style={{ backgroundColor: isPaymentRequest ? '#10b981' : theme.primary }}
                                            className="px-6 py-2.5 rounded-2xl flex-row items-center justify-center gap-2 min-w-[100px]"
                                        >
                                            {accepting ? (
                                                <ActivityIndicator size="small" color="white" />
                                            ) : (
                                                <>
                                                    {isPaymentRequest && <MaterialIcons name="check" size={14} color="white" />}
                                                    <Text className="text-white font-black text-[10px] uppercase">
                                                        {isPaymentRequest ? 'Aprobar' : 'Aceptar'}
                                                    </Text>
                                                </>
                                            )}
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={isPaymentRequest ? onReject : onRemove}
                                            disabled={rejecting}
                                            className="bg-white/5 border border-white/10 px-6 py-2.5 rounded-2xl flex-row items-center justify-center gap-2"
                                        >
                                            {rejecting ? (
                                                <ActivityIndicator size="small" color="#ef4444" />
                                            ) : (
                                                <>
                                                    {isPaymentRequest && <MaterialIcons name="close" size={14} color="#ef4444" />}
                                                    <Text className={isPaymentRequest ? "text-red-400 font-bold text-[10px] uppercase" : "text-slate-400 font-bold text-[10px] uppercase"}>
                                                        {isPaymentRequest ? 'Rechazar' : 'Rechazar'}
                                                    </Text>
                                                </>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                )}

                                {/* Badge de monto si existe */}
                                {n.amount && n.type !== 'payment_due' && (
                                    <View className="mt-2 self-start">
                                        <Text
                                            style={{ color: n.iconColor ?? '#4ade80' }}
                                            className="font-black text-base"
                                        >
                                            {n.amount}
                                        </Text>
                                    </View>
                                )}
                            </>
                        )}
                    </View>
                </Pressable>
            </MotiView>
        </AnimatePresence>
    );
}

// ── Pantalla principal ───────────────────────────────────────────────────────
export default function NotificationsScreen() {
    const { theme, fontScale } = useTheme();
    const {
        notifications,
        markAsRead,
        markAllAsRead,
        removeNotification,
    } = useNotifications();

    const [acceptingIds, setAcceptingIds] = React.useState<string[]>([]);
    const [rejectingIds, setRejectingIds] = React.useState<string[]>([]);
    const [acceptedIds, setAcceptedIds] = React.useState<string[]>([]);
    const { user } = useEasyPay();

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleAccept = async (n: AppNotification) => {
        const id = n.id;
        if (n.type === 'payment_received' || n.data?.type === 'settlement_request') {
            const settlementId = n.data?.settlement_id;
            const groupId = n.data?.group_id;
            if (!settlementId || !groupId || !user?.id) {
                Alert.alert("Error", "No se encontró información del pago");
                return;
            }

            try {
                setAcceptingIds(prev => [...prev, id]);
                await groupRepository.approveSettlement(groupId, settlementId, user.id);
                setAcceptedIds(prev => [...prev, id]);
                markAsRead(id);
            } catch (err: any) {
                Alert.alert("Error", err.message || "No se pudo aprobar el pago");
            } finally {
                setAcceptingIds(prev => prev.filter(x => x !== id));
            }
            return;
        }

        // Invitación u otros
        setAcceptingIds(prev => [...prev, id]);
        setTimeout(() => {
            setAcceptingIds(prev => prev.filter(x => x !== id));
            setAcceptedIds(prev => [...prev, id]);
            markAsRead(id);
        }, 1500);
    };

    const handleReject = async (n: AppNotification) => {
        const id = n.id;
        const settlementId = n.data?.settlement_id;
        const groupId = n.data?.group_id;

        if (!settlementId || !groupId || !user?.id) {
            removeNotification(id);
            return;
        }

        Alert.prompt(
            "Rechazar Pago",
            "¿Por qué rechazas este pago?",
            [
                { text: "Cancelar", style: "cancel" },
                { 
                    text: "Rechazar", 
                    style: "destructive",
                    onPress: async (reason) => {
                        try {
                            setRejectingIds(prev => [...prev, id]);
                            await groupRepository.rejectSettlement(groupId, settlementId, user.id, reason || "Pago no verificado");
                            removeNotification(id);
                        } catch (err: any) {
                            Alert.alert("Error", err.message || "No se pudo rechazar el pago");
                        } finally {
                            setRejectingIds(prev => prev.filter(x => x !== id));
                        }
                    }
                }
            ]
        );
    };

    // Separa deudas del resto para mostrarlas arriba
    const debtNotifs = notifications.filter(n => n.type === 'payment_due');
    const otherNotifs = notifications.filter(n => n.type !== 'payment_due');

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
            <StatusBar style={theme.isDark ? 'light' : 'dark'} />

            {/* Header */}
            <View className="px-6 py-6 flex-row justify-between items-center">
                <View className="flex-row items-center gap-3">
                    <Text
                        style={{ fontSize: 12 * fontScale, color: theme.text }}
                        className="font-black tracking-[4px]"
                    >
                        ALERTAS
                    </Text>
                    {unreadCount > 0 && (
                        <MotiView
                            from={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            style={{ backgroundColor: theme.primary }}
                            className="px-2.5 py-0.5 rounded-full"
                        >
                            <Text className="text-white text-[10px] font-black">{unreadCount}</Text>
                        </MotiView>
                    )}
                </View>
                {unreadCount > 0 && (
                    <TouchableOpacity onPress={markAllAsRead}>
                        <Text
                            style={{ fontSize: 11 * fontScale, color: theme.primary }}
                            className="font-black uppercase tracking-wider"
                        >
                            Marcar todas
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView
                className="flex-1 px-6"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 150 }}
            >
                {/* Resumen de deudas */}
                <DebtsSummary notifications={debtNotifs} />

                {/* Lista de notificaciones */}
                {otherNotifs.length > 0 ? (
                    <View className="mt-2">
                        {otherNotifs.map(n => (
                            <NotificationCard
                                key={n.id}
                                n={n}
                                theme={theme}
                                onMarkRead={() => markAsRead(n.id)}
                                onRemove={() => removeNotification(n.id)}
                                onAccept={() => handleAccept(n)}
                                onReject={() => handleReject(n)}
                                accepting={acceptingIds.includes(n.id)}
                                rejecting={rejectingIds.includes(n.id)}
                                accepted={acceptedIds.includes(n.id)}
                            />
                        ))}
                    </View>
                ) : (
                    !debtNotifs.length && (
                        <View className="items-center justify-center py-20 opacity-40">
                            <View className="bg-slate-800/50 w-20 h-20 rounded-full items-center justify-center mb-6">
                                <MaterialIcons name="notifications-none" size={40} color={theme.textSecondary} />
                            </View>
                            <Text style={{ color: theme.text }} className="font-black text-center mb-1">
                                Todo al día
                            </Text>
                            <Text style={{ color: theme.textSecondary }} className="text-center font-bold text-xs px-10">
                                No tienes notificaciones pendientes.
                            </Text>
                        </View>
                    )
                )}

                {notifications.length > 0 && (
                    <View className="items-center py-10 opacity-30">
                        <Text className="text-slate-500 font-black uppercase tracking-widest text-[9px]">
                            Fin del historial
                        </Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
