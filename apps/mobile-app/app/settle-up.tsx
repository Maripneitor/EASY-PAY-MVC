import { useEasyPay } from '../context/EasyPayContext';
import React, { useState, useMemo, useEffect } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    ScrollView, 
    Dimensions,
    Platform,
    ActivityIndicator,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../src/infrastructure/context/ThemeContext';

import { groupRepository } from '../src/infrastructure/api/repositories/GroupRepository';
import { getApiBaseUrl } from '../src/infrastructure/api/network.config';
import QRCode from 'react-native-qrcode-svg';
import { Modal } from 'react-native';
import { httpClient } from '../src/infrastructure/api/http-client';

import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

export default function SettleUpScreen() {
    const { theme, fontScale } = useTheme();
    const { 
        amount, 
        method, 
        groupId: paramGroupId, 
        creditorId: paramCreditorId,
        groupName: paramGroupName,
        creditorName: paramCreditorName
    } = useLocalSearchParams<{ 
        amount: string, 
        method: string, 
        groupId: string, 
        creditorId: string,
        groupName: string,
        creditorName: string
    }>();
    const { cards, isLoading: loadingCards } = useEasyPay();
    const { user } = useEasyPay();

    const [isConfirming, setIsConfirming] = useState(false);
    const [selectedAccounts, setSelectedAccounts] = useState<any[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [qrValue, setQrValue] = useState<string | null>(null);
    const [group, setGroup] = useState<any>(null);
    const [creditor, setCreditor] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const numericAmount = parseFloat(amount || '0');
    const defaultCard = useMemo(() => cards.find(c => c.isDefault) || cards[0], [cards]);

    useEffect(() => {
        fetchInitialData();
    }, [paramGroupId, paramCreditorId, user?.id]);

    const fetchInitialData = async () => {
        if (!user?.id) return;
        setLoadingData(true);
        setError(null);
        try {
            let gid = paramGroupId;
            let cid = paramCreditorId;

            // 1. Priorizar datos pasados por params
            if (gid && paramGroupName && paramCreditorName) {
                setGroup({ id: gid, nombre: paramGroupName });
                setCreditor({ id: cid, nombre: paramCreditorName });
                
                // Cargar datos extra en segundo plano (como cuentas bancarias)
                groupRepository.getGroup(gid).then(g => {
                    setGroup(g);
                    if (g.selected_bank_accounts) {
                        setSelectedAccounts(g.selected_bank_accounts);
                    }
                });
                setLoadingData(false);
                return;
            }

            // 2. Si no hay params, buscar en el balance del usuario
            if (!gid || !cid) {
                try {
                    const response = await httpClient.get(`/stats/user/${user.id}/balances`);
                    const balances = response.data;

                    if (balances && balances.length > 0) {
                        const firstDebt = balances.find((b: any) => b.balance < 0);
                        if (firstDebt) {
                            gid = firstDebt.group_id;
                            cid = firstDebt.creditor_id;
                        }
                    }
                } catch (e) {
                    console.log("No se pudo obtener balances automáticos:", e);
                }
            }

            // 3. Obtener datos del grupo y validar estado
            if (gid) {
                const groupData = await groupRepository.getGroup(gid);
                setGroup(groupData);

                const status = (groupData.status || groupData.estado || '').toLowerCase();
                if (status !== 'settling') {
                    Toast.show({ type: 'error', text1: 'Error', text2: 'Este grupo no está en fase de liquidación' });
                    router.back();
                    return;
                }

                if (groupData.selected_bank_accounts) {
                    setSelectedAccounts(groupData.selected_bank_accounts);
                }

                if (cid) {
                    const foundCreditor = groupData.participantes?.find((p: any) => p.id === cid) || 
                                          groupData.integrantes?.find((p: any) => p.id === cid);
                    setCreditor(foundCreditor || { id: cid, nombre: paramCreditorName || 'Miembro del Grupo' });
                } else {
                    const admin = groupData.participantes?.find((p: any) => p.id === groupData.admin_id) ||
                                  groupData.integrantes?.find((p: any) => p.id === groupData.admin_id);
                    setCreditor(admin);
                }
            } else {
                setError("No se encontró información de la deuda. Por favor, selecciona un grupo.");
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            setError("No se pudo cargar la información de liquidación.");
        } finally {
            setLoadingData(false);
        }
    };

    const copyToClipboard = async (text: string, label: string) => {
        await Clipboard.setStringAsync(text);
        Toast.show({
            type: 'info',
            text1: 'Copiado',
            text2: `${label} copiado al portapapeles.`
        });
    };

    const handleConfirm = async () => {
        if (!user || !group?.id || !creditor?.id) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Información incompleta para procesar el pago.'
            });
            return;
        }

        setIsConfirming(true);
        try {
            await groupRepository.createSettlement(group.id, {
                amount: numericAmount,
                method: method || 'cash',
                creditor_id: creditor.id
            });

            Toast.show({
                type: 'success',
                text1: '¡Éxito!',
                text2: 'Tu solicitud de pago ha sido enviada. El líder deberá aprobarla.'
            });
            
            // Navegar directamente sin depender del Toast
            router.replace({ pathname: '/detalle-grupo', params: { id: group.id } });
        } catch (error: any) {
            const msg = error.response?.data?.detail || 'No se pudo registrar el pago';
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: msg
            });
        } finally {
            setIsConfirming(false);
        }
    };

    const isActionDisabled = isConfirming || loadingData || !!error || (method === 'card' && !defaultCard);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges = {['top']}>
            <StatusBar style={theme.isDark ? "light" : "dark"} />
            <Stack.Screen options={{ headerShown: false }} />

            {/* TopAppBar */}
            <View className="flex-row items-center justify-between px-6 py-4 w-full">
                <TouchableOpacity 
                    onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
                    style={{ backgroundColor: theme.cardSecondary }}
                    className="w-10 h-10 rounded-full items-center justify-center"
                >
                    <MaterialIcons name="arrow-back" size={24} color={theme.primary} />
                </TouchableOpacity>
                <Text style={{ color: theme.text, fontSize: 18 * fontScale }} className="font-black tracking-tight flex-1 text-center pr-10">Liquidar Deuda</Text>
            </View>

            <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 150 }}>

                {/* Context Card - New Premium UI */}
                {loadingData ? (
                    <View style={{ backgroundColor: theme.cardSecondary }} className="rounded-[2.5rem] p-8 mb-8 items-center justify-center border border-white/5 h-32">
                        <ActivityIndicator color={theme.primary} />
                    </View>
                ) : group && creditor ? (
                    <View style={{ backgroundColor: theme.cardSecondary, borderColor: theme.border }} className="rounded-[2.5rem] p-6 mb-8 border flex-row items-center gap-4 shadow-sm">
                        <View style={{ backgroundColor: theme.primary + '15' }} className="w-16 h-16 rounded-[1.5rem] items-center justify-center border border-white/5">
                            <MaterialIcons name="person" size={32} color={theme.primary} />
                        </View>
                        <View className="flex-1">
                            <Text style={{ color: theme.textSecondary }} className="text-[10px] font-black uppercase tracking-widest mb-1">Pagas a:</Text>
                            <Text style={{ color: theme.text }} className="text-lg font-black leading-tight">{creditor.nombre}</Text>
                            <View className="flex-row items-center gap-1.5 mt-1.5 opacity-70">
                                <View style={{ backgroundColor: theme.primary + '30' }} className="px-2 py-0.5 rounded-lg">
                                    <Text style={{ color: theme.primary, fontSize: 9 * fontScale }} className="font-black uppercase">Grupo</Text>
                                </View>
                                <Text style={{ color: theme.textSecondary, fontSize: 12 * fontScale }} className="font-bold" numberOfLines={1}>{group.nombre}</Text>
                            </View>
                        </View>
                    </View>
                ) : null}

                {/* Error Banner */}
                {error && (
                    <View className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-[2.5rem] mb-8 items-center gap-3">
                        <View className="w-12 h-12 bg-rose-500/20 rounded-2xl items-center justify-center">
                            <MaterialIcons name="error-outline" size={28} color="#f43f5e" />
                        </View>
                        <Text className="text-rose-400 font-black text-center text-sm px-4">{error}</Text>
                        <TouchableOpacity 
                            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
                            className="mt-2 bg-rose-500/20 px-6 py-2 rounded-xl"
                        >
                            <Text className="text-rose-400 font-black text-xs uppercase">Regresar</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Summary Section */}
                <View className="flex flex-col items-center justify-center py-6 gap-2">
                    <Text style={{ color: theme.textSecondary }} className="text-sm font-medium tracking-wide">Total a Pagar</Text>
                    <Text style={{ fontSize: 56 * fontScale, color: theme.text }} className="font-black">${numericAmount.toFixed(2)}</Text>
                    <View className="w-12 h-1 bg-slate-500/20 rounded-full mt-2" />
                </View>

                {/* Payment Method Section */}
                {!error && (
                    <View className="gap-6 mt-6">
                        <View className="flex-row items-center gap-2">
                            <Text style={{ color: theme.text }} className="text-lg font-black">Método de Pago</Text>
                            <View className="h-px flex-1 bg-slate-500/10" />
                        </View>

                        {method === 'card' && (
                            <>
                                {loadingCards ? (
                                    <ActivityIndicator color={theme.primary} />
                                ) : defaultCard ? (
                                    <TouchableOpacity 
                                        onPress={() => router.push('/(tabs)/stats' as any)}
                                        style={{ backgroundColor: theme.cardSecondary, borderColor: theme.border }}
                                        className="rounded-[2rem] p-5 flex-row items-center justify-between border"
                                    >
                                        <View className="flex-row items-center gap-4">
                                            <View style={{ backgroundColor: theme.glassBg }} className="w-14 h-12 rounded-xl flex items-center justify-center border border-white/5">
                                                <MaterialIcons name="credit-card" size={26} color={theme.primary} />
                                            </View>
                                            <View>
                                                <Text style={{ color: theme.text }} className="font-black text-base">{defaultCard.brand} •••• {defaultCard.last4}</Text>
                                                <Text style={{ color: theme.textSecondary }} className="text-xs font-bold opacity-60">Titular: {defaultCard.holder}</Text>
                                            </View>
                                        </View>
                                        <MaterialIcons name="chevron-right" size={24} color={theme.textSecondary} />
                                    </TouchableOpacity>
                                ) : (
                                    <TouchableOpacity 
                                        onPress={() => router.push('/wallet/methods/new' as any)}
                                        style={{ backgroundColor: theme.cardSecondary, borderColor: theme.border }}
                                        className="w-full flex-row items-center justify-center gap-2 py-5 px-4 rounded-[2rem] border border-dashed"
                                    >
                                        <MaterialIcons name="add" size={20} color={theme.primary} />
                                        <Text style={{ color: theme.primary }} className="font-black uppercase tracking-widest text-xs">Agregar nueva tarjeta</Text>
                                    </TouchableOpacity>
                                )}
                            </>
                        )}

                        {method === 'cash' && (
                            <View 
                                style={{ backgroundColor: theme.cardSecondary, borderColor: theme.border }}
                                className="rounded-[2rem] p-5 flex-row items-center gap-4 border"
                            >
                                <View style={{ backgroundColor: theme.glassBg }} className="w-14 h-12 rounded-xl flex items-center justify-center border border-white/5">
                                    <MaterialIcons name="payments" size={26} color={theme.primary} />
                                </View>
                                <View>
                                    <Text style={{ color: theme.text }} className="font-black text-base">Efectivo</Text>
                                    <Text style={{ color: theme.textSecondary }} className="text-xs font-bold opacity-60">Registro de pago presencial</Text>
                                </View>
                            </View>
                        )}

                        {method === 'transfer' && (
                            <View className="gap-6">
                                <View 
                                    style={{ backgroundColor: theme.cardSecondary, borderColor: theme.border }}
                                    className="rounded-[2rem] p-5 flex-row items-center gap-4 border"
                                >
                                    <View style={{ backgroundColor: theme.glassBg }} className="w-14 h-12 rounded-xl flex items-center justify-center border border-white/5">
                                        <MaterialIcons name="account-balance" size={26} color={theme.primary} />
                                    </View>
                                    <View>
                                        <Text style={{ color: theme.text }} className="font-black text-base">Transferencia Bancaria</Text>
                                        <Text style={{ color: theme.textSecondary }} className="text-xs font-bold opacity-60">Cuentas habilitadas por el líder</Text>
                                    </View>
                                </View>

                                {loadingData ? (
                                    <ActivityIndicator color={theme.primary} className="py-10" />
                                ) : selectedAccounts.length > 0 ? (
                                    <View className="gap-4">
                                        {selectedAccounts.map((acc, index) => (
                                            <View key={index} style={{ backgroundColor: theme.card, borderColor: theme.border }} className="border rounded-[2.5rem] p-6 gap-6 shadow-sm">
                                                <View className="flex-row justify-between items-start">
                                                    <View className="flex-1">
                                                        <Text style={{ color: theme.primary }} className="font-black text-[10px] uppercase tracking-[0.2em] mb-2">{acc.entidad_financiera}</Text>
                                                        <Text style={{ color: theme.text }} className="font-black text-xl tracking-tight font-mono">{acc.clabe}</Text>
                                                    </View>
                                                    <View className="flex-row gap-2">
                                                        <TouchableOpacity 
                                                            onPress={() => setQrValue(acc.clabe)}
                                                            style={{ backgroundColor: theme.primary + '15' }}
                                                            className="w-12 h-12 rounded-2xl items-center justify-center border border-white/5"
                                                        >
                                                            <MaterialIcons name="qr-code-2" size={22} color={theme.primary} />
                                                        </TouchableOpacity>
                                                        <TouchableOpacity 
                                                            onPress={() => copyToClipboard(acc.clabe, 'CLABE')}
                                                            style={{ backgroundColor: theme.cardSecondary }}
                                                            className="w-12 h-12 rounded-2xl items-center justify-center border border-white/5"
                                                        >
                                                            <MaterialIcons name="content-copy" size={20} color={theme.primary} />
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>

                                                <View style={{ backgroundColor: theme.border }} className="h-px w-full opacity-10" />

                                                <View className="flex-row justify-between items-center">
                                                    <View>
                                                        <Text style={{ color: theme.textSecondary }} className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">Destinatario</Text>
                                                        <Text style={{ color: theme.text }} className="font-black text-xs">{creditor?.nombre || 'Líder del Grupo'}</Text>
                                                    </View>
                                                    <View className="items-end">
                                                        <Text style={{ color: theme.textSecondary }} className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">Tipo</Text>
                                                        <Text style={{ color: theme.text }} className="font-black text-xs">Clabe Interbancaria</Text>
                                                    </View>
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                ) : (
                                    <View style={{ backgroundColor: theme.cardSecondary }} className="p-10 rounded-[2.5rem] items-center border border-dashed border-slate-500/20">
                                        <View className="w-16 h-16 bg-slate-500/10 rounded-full items-center justify-center mb-4">
                                            <MaterialIcons name="info-outline" size={32} color={theme.textSecondary} style={{ opacity: 0.5 }} />
                                        </View>
                                        <Text style={{ color: theme.textSecondary }} className="text-center text-sm font-bold opacity-60 px-6">El líder aún no ha configurado cuentas para recibir pagos en este grupo.</Text>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>
                )}

                {/* Transaction Details */}
                {!error && (
                    <View style={{ backgroundColor: theme.cardSecondary, borderColor: theme.border }} className="rounded-[2rem] p-6 mt-10 border gap-4 shadow-sm">
                        <Text style={{ color: theme.text }} className="text-base font-black mb-2">Resumen de transacción</Text>
                        <View className="flex-row justify-between items-center">
                            <Text style={{ color: theme.textSecondary }} className="text-sm font-medium">Monto principal</Text>
                            <Text style={{ color: theme.text }} className="font-black text-sm">${numericAmount.toFixed(2)}</Text>
                        </View>
                        <View className="flex-row justify-between items-center">
                            <Text style={{ color: theme.textSecondary }} className="text-sm font-medium">Comisión de servicio</Text>
                            <Text style={{ color: '#10b981' }} className="font-black text-sm">GRATIS</Text>
                        </View>
                        <View style={{ backgroundColor: theme.border }} className="w-full h-px my-1 opacity-10" />
                        <View className="flex-row justify-between items-center mt-1">
                            <Text style={{ color: theme.text }} className="text-lg font-black">Total a pagar</Text>
                            <Text style={{ color: theme.primary }} className="font-black text-2xl">${numericAmount.toFixed(2)}</Text>
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Footer Action */}
            <View 
                style={{ backgroundColor: theme.bg, borderColor: theme.border }} 
                className="absolute bottom-0 w-full pt-4 pb-12 px-6 border-t"
            >
                <View className="flex-row items-center justify-center gap-2 mb-5 opacity-40">
                    <MaterialIcons name="shield" size={14} color={theme.textSecondary} />
                    <Text style={{ color: theme.textSecondary }} className="text-[10px] font-black uppercase tracking-[0.2em]">Easy-Pay Secure Protocol</Text>
                </View>

                <TouchableOpacity 
                    onPress={handleConfirm}
                    disabled={isActionDisabled}
                    activeOpacity={0.8}
                    className="w-full rounded-[2rem] overflow-hidden shadow-lg"
                    style={{ 
                        opacity: isActionDisabled ? 0.5 : 1,
                        shadowColor: theme.primary,
                        shadowOffset: { width: 0, height: 10 },
                        shadowOpacity: 0.2,
                        shadowRadius: 15,
                    }}
                >
                    <LinearGradient
                        colors={[theme.primary, theme.primary + 'DD']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        className="py-6 items-center justify-center"
                    >
                        {isConfirming ? (
                            <View className="flex-row items-center gap-3">
                                <ActivityIndicator color="black" />
                                <Text className="text-black font-black text-lg uppercase tracking-widest">Procesando...</Text>
                            </View>
                        ) : (
                            <View className="flex-row items-center gap-3">
                                <FontAwesome5 name="check-circle" size={18} color="black" />
                                <Text className="text-black font-black text-lg uppercase tracking-widest">Confirmar Pago</Text>
                            </View>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* QR Modal */}
            <Modal
                visible={!!qrValue}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setQrValue(null)}
            >
                <TouchableOpacity 
                    activeOpacity={1} 
                    onPress={() => setQrValue(null)}
                    className="flex-1 bg-black/90 items-center justify-center p-6"
                >
                    <View style={{ backgroundColor: theme.bg }} className="w-full max-w-sm rounded-[3.5rem] p-10 items-center gap-8 border border-white/10">
                        <View className="items-center">
                            <Text style={{ color: theme.primary }} className="font-black uppercase tracking-[0.3em] text-[10px] mb-2">Pago Inteligente</Text>
                            <Text style={{ color: theme.text }} className="font-black text-2xl tracking-tight">Escanear QR</Text>
                        </View>

                        <View className="p-8 bg-white rounded-[3rem] shadow-2xl">
                            {qrValue && <QRCode value={qrValue} size={180} color="black" backgroundColor="white" />}
                        </View>

                        <View className="items-center bg-slate-500/5 p-6 rounded-[2rem] w-full border border-white/5">
                            <Text style={{ color: theme.textSecondary }} className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-50">CLABE de Destino</Text>
                            <Text style={{ color: theme.text }} className="font-black text-xl font-mono tracking-tighter">{qrValue}</Text>
                        </View>

                        <TouchableOpacity 
                            onPress={() => setQrValue(null)}
                            style={{ backgroundColor: theme.cardSecondary }}
                            className="w-full py-5 rounded-[2rem] items-center border border-white/5"
                        >
                            <Text style={{ color: theme.textSecondary }} className="font-black uppercase tracking-widest text-xs">Cerrar</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}
