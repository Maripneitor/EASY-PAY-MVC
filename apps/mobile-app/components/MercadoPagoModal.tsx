import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity, Modal, ScrollView,
    TextInput, ActivityIndicator, Alert
} from 'react-native';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { MotiView } from 'moti';
import MercadoPagoService, { MPPaymentResult } from '../src/infrastructure/services/MercadoPagoService';

type Tab = 'card' | 'oxxo' | 'spei';

interface Props {
    visible: boolean;
    onClose: () => void;
    amount: number;
    concept: string;
    payerEmail: string;
    payerName: string;
    theme: any;
    onSuccess: (result: MPPaymentResult) => void;
}

// ── Resultado exitoso ────────────────────────────────────────────────────────
function SuccessView({ result, theme, onClose }: { result: MPPaymentResult; theme: any; onClose: () => void }) {
    const isOxxo = result.paymentMethod === 'oxxo';
    const isSpei = result.paymentMethod === 'clabe';

    return (
        <MotiView from={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="px-6 pt-10 items-center">
            <View style={{ backgroundColor: isOxxo || isSpei ? '#f59e0b20' : '#4ade8020' }} className="w-24 h-24 rounded-full items-center justify-center mb-6">
                <MaterialIcons
                    name={isOxxo ? 'store' : isSpei ? 'account-balance' : 'check-circle'}
                    size={56}
                    color={isOxxo || isSpei ? '#f59e0b' : '#4ade80'}
                />
            </View>

            <Text style={{ color: theme.text }} className="text-2xl font-black text-center mb-2">
                {result.status === 'approved' ? '¡Pago aprobado!' : isOxxo ? 'Referencia OXXO generada' : 'CLABE generada'}
            </Text>
            <Text style={{ color: theme.textSecondary }} className="text-center text-sm mb-8">
                ${result.amount.toFixed(2)} · ID: {result.id}
            </Text>

            {/* OXXO Code */}
            {isOxxo && result.oxxoCode && (
                <View style={{ backgroundColor: theme.cardSecondary, borderColor: theme.border }} className="w-full p-6 rounded-[24px] border mb-6">
                    <Text style={{ color: theme.textSecondary }} className="text-[10px] font-black uppercase tracking-widest mb-3 text-center">
                        Código de barras OXXO
                    </Text>
                    <Text style={{ color: theme.text }} className="font-black text-center text-lg tracking-widest mb-2">
                        {result.oxxoCode}
                    </Text>
                    {result.oxxoExpiresAt && (
                        <Text style={{ color: theme.textSecondary }} className="text-xs text-center">
                            Vence: {new Date(result.oxxoExpiresAt).toLocaleDateString('es-MX')}
                        </Text>
                    )}
                    <View style={{ backgroundColor: '#f59e0b10' }} className="mt-4 p-3 rounded-xl">
                        <Text className="text-yellow-500 text-xs text-center font-bold">
                            Muestra este código en cualquier OXXO para pagar
                        </Text>
                    </View>
                </View>
            )}

            {/* SPEI CLABE */}
            {isSpei && result.clabe && (
                <View style={{ backgroundColor: theme.cardSecondary, borderColor: theme.border }} className="w-full p-6 rounded-[24px] border mb-6">
                    <Text style={{ color: theme.textSecondary }} className="text-[10px] font-black uppercase tracking-widest mb-3 text-center">
                        CLABE Interbancaria
                    </Text>
                    <Text style={{ color: theme.text }} className="font-black text-center text-base tracking-widest mb-1">
                        {result.clabe}
                    </Text>
                    <Text style={{ color: theme.textSecondary }} className="text-xs text-center mb-3">
                        Banco: {result.bankName ?? 'STP'}
                    </Text>
                    <View style={{ backgroundColor: '#60a5fa10' }} className="p-3 rounded-xl">
                        <Text className="text-blue-400 text-xs text-center font-bold">
                            Transfiere exactamente ${result.amount.toFixed(2)} desde tu banco
                        </Text>
                    </View>
                </View>
            )}

            <TouchableOpacity onPress={onClose} style={{ backgroundColor: theme.primary }} className="w-full py-5 rounded-2xl items-center">
                <Text className="text-white font-black text-base">Cerrar</Text>
            </TouchableOpacity>
        </MotiView>
    );
}

// ── Formulario tarjeta ────────────────────────────────────────────────────────
function CardForm({
    theme,
    onSubmit,
    loading,
}: {
    theme: any;
    onSubmit: (data: any) => void;
    loading: boolean;
}) {
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [name, setName] = useState('');
    const [docNumber, setDocNumber] = useState('');

    const brand = MercadoPagoService.detectCardBrand(cardNumber);
    const brandColor = brand === 'visa' ? '#1a1f71' : brand === 'mastercard' ? '#eb001b' : '#2196F3';

    return (
        <View className="gap-4">
            {/* Preview de tarjeta */}
            <View style={{ backgroundColor: brandColor }} className="h-36 rounded-[28px] p-6 relative overflow-hidden mb-2">
                <View className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10" />
                <View className="flex-row justify-between items-start mb-4">
                    <MaterialIcons name="contactless" size={28} color="white" />
                    <Text className="text-white font-black italic text-lg uppercase">{brand}</Text>
                </View>
                <Text className="text-white font-mono text-xl tracking-[4px]">
                    {cardNumber || '**** **** **** ****'}
                </Text>
                <View className="flex-row justify-between mt-3">
                    <Text className="text-white/60 text-xs">{name || 'NOMBRE TITULAR'}</Text>
                    <Text className="text-white/60 text-xs">{expiry || 'MM/AA'}</Text>
                </View>
            </View>

            {/* Número de tarjeta */}
            <View>
                <Text style={{ color: theme.textSecondary }} className="text-[10px] font-black uppercase tracking-widest mb-2">Número de tarjeta</Text>
                <TextInput
                    value={cardNumber}
                    onChangeText={v => setCardNumber(MercadoPagoService.formatCardNumber(v))}
                    placeholder="1234 5678 9012 3456"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="numeric"
                    maxLength={19}
                    style={{ color: theme.text, backgroundColor: theme.cardSecondary, borderColor: theme.border }}
                    className="p-4 rounded-2xl border font-mono text-base"
                />
            </View>

            <View className="flex-row gap-3">
                <View className="flex-1">
                    <Text style={{ color: theme.textSecondary }} className="text-[10px] font-black uppercase tracking-widest mb-2">Vencimiento</Text>
                    <TextInput
                        value={expiry}
                        onChangeText={v => setExpiry(MercadoPagoService.formatExpiry(v))}
                        placeholder="MM/AA"
                        placeholderTextColor={theme.textSecondary}
                        keyboardType="numeric"
                        maxLength={5}
                        style={{ color: theme.text, backgroundColor: theme.cardSecondary, borderColor: theme.border }}
                        className="p-4 rounded-2xl border font-mono"
                    />
                </View>
                <View className="flex-1">
                    <Text style={{ color: theme.textSecondary }} className="text-[10px] font-black uppercase tracking-widest mb-2">CVV</Text>
                    <TextInput
                        value={cvv}
                        onChangeText={setCvv}
                        placeholder="123"
                        placeholderTextColor={theme.textSecondary}
                        keyboardType="numeric"
                        maxLength={4}
                        secureTextEntry
                        style={{ color: theme.text, backgroundColor: theme.cardSecondary, borderColor: theme.border }}
                        className="p-4 rounded-2xl border font-mono"
                    />
                </View>
            </View>

            <View>
                <Text style={{ color: theme.textSecondary }} className="text-[10px] font-black uppercase tracking-widest mb-2">Nombre del titular</Text>
                <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Como aparece en la tarjeta"
                    placeholderTextColor={theme.textSecondary}
                    autoCapitalize="characters"
                    style={{ color: theme.text, backgroundColor: theme.cardSecondary, borderColor: theme.border }}
                    className="p-4 rounded-2xl border font-bold"
                />
            </View>

            <View>
                <Text style={{ color: theme.textSecondary }} className="text-[10px] font-black uppercase tracking-widest mb-2">RFC / CURP</Text>
                <TextInput
                    value={docNumber}
                    onChangeText={setDocNumber}
                    placeholder="Tu RFC o CURP"
                    placeholderTextColor={theme.textSecondary}
                    autoCapitalize="characters"
                    style={{ color: theme.text, backgroundColor: theme.cardSecondary, borderColor: theme.border }}
                    className="p-4 rounded-2xl border font-bold"
                />
            </View>

            <TouchableOpacity
                onPress={() => onSubmit({ cardNumber, expiry, cvv, name, docNumber })}
                disabled={loading || !cardNumber || !expiry || !cvv || !name}
                style={{ backgroundColor: theme.primary, opacity: loading || !cardNumber || !expiry || !cvv || !name ? 0.5 : 1 }}
                className="py-5 rounded-2xl items-center mt-2"
            >
                {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-black text-base">Pagar con tarjeta</Text>}
            </TouchableOpacity>
        </View>
    );
}

// ── Pantalla principal del modal ──────────────────────────────────────────────
export default function MercadoPagoModal({
    visible, onClose, amount, concept, payerEmail, payerName, theme, onSuccess
}: Props) {
    const [tab, setTab] = useState<Tab>('card');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<MPPaymentResult | null>(null);

    const reset = () => { setResult(null); setTab('card'); };
    const handleClose = () => { reset(); onClose(); };

    const handleCardSubmit = async (cardData: any) => {
        setLoading(true);
        try {
            const [month, year] = cardData.expiry.split('/');
            const token = await MercadoPagoService.createCardToken({
                cardNumber: cardData.cardNumber,
                expirationMonth: month,
                expirationYear: `20${year}`,
                securityCode: cardData.cvv,
                cardholderName: cardData.name,
                docType: 'RFC',
                docNumber: cardData.docNumber || '000000000000',
            });
            const res = await MercadoPagoService.payWithCard(amount, token, payerEmail, concept);
            setResult(res);
            onSuccess(res);
        } catch (e: any) {
            Alert.alert('Error', e.message ?? 'No se pudo procesar el pago.');
        } finally {
            setLoading(false);
        }
    };

    const handleOxxo = async () => {
        setLoading(true);
        try {
            const res = await MercadoPagoService.payWithOxxo(amount, payerEmail, payerName, concept);
            setResult(res);
            onSuccess(res);
        } catch (e: any) {
            Alert.alert('Error', e.message ?? 'No se pudo generar la referencia OXXO.');
        } finally {
            setLoading(false);
        }
    };

    const handleSpei = async () => {
        setLoading(true);
        try {
            const res = await MercadoPagoService.payWithSpei(amount, payerEmail, concept);
            setResult(res);
            onSuccess(res);
        } catch (e: any) {
            Alert.alert('Error', e.message ?? 'No se pudo generar la CLABE.');
        } finally {
            setLoading(false);
        }
    };

    const TABS = [
        { id: 'card' as Tab,  label: 'Tarjeta',      icon: 'credit-card',    color: '#60a5fa' },
        { id: 'oxxo' as Tab,  label: 'OXXO',         icon: 'store',          color: '#f59e0b' },
        { id: 'spei' as Tab,  label: 'Transferencia', icon: 'account-balance', color: '#a78bfa' },
    ];

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
            <View style={{ flex: 1, backgroundColor: theme.bg }}>
                {/* Header */}
                <View style={{ borderBottomColor: theme.border }} className="flex-row items-center justify-between px-6 py-5 border-b">
                    <TouchableOpacity onPress={handleClose} className="w-10 h-10 rounded-full bg-white/5 items-center justify-center">
                        <Ionicons name="close" size={22} color={theme.text} />
                    </TouchableOpacity>
                    <View className="items-center">
                        <Text style={{ color: theme.text }} className="font-black text-lg">Pagar con MercadoPago</Text>
                        <Text style={{ color: theme.primary }} className="font-black text-sm">${amount.toFixed(2)}</Text>
                    </View>
                    <View className="w-10" />
                </View>

                {result ? (
                    <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 60 }}>
                        <SuccessView result={result} theme={theme} onClose={handleClose} />
                    </ScrollView>
                ) : (
                    <>
                        {/* Tabs */}
                        <View className="flex-row px-6 pt-5 gap-3 mb-2">
                            {TABS.map(t => {
                                const active = tab === t.id;
                                return (
                                    <TouchableOpacity
                                        key={t.id}
                                        onPress={() => setTab(t.id)}
                                        style={{
                                            backgroundColor: active ? t.color + '20' : theme.cardSecondary,
                                            borderColor: active ? t.color : theme.border,
                                        }}
                                        className="flex-1 py-3 rounded-2xl items-center border"
                                    >
                                        <MaterialIcons name={t.icon as any} size={20} color={active ? t.color : theme.textSecondary} />
                                        <Text style={{ color: active ? t.color : theme.textSecondary }} className="text-[9px] font-black mt-1 uppercase">{t.label}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <ScrollView className="flex-1 px-6 pt-4" contentContainerStyle={{ paddingBottom: 60 }}>
                            {tab === 'card' && (
                                <CardForm theme={theme} onSubmit={handleCardSubmit} loading={loading} />
                            )}

                            {tab === 'oxxo' && (
                                <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} className="items-center pt-6">
                                    <View className="w-24 h-24 bg-yellow-500/10 rounded-full items-center justify-center mb-6">
                                        <MaterialIcons name="store" size={48} color="#f59e0b" />
                                    </View>
                                    <Text style={{ color: theme.text }} className="text-xl font-black text-center mb-2">Pagar en OXXO</Text>
                                    <Text style={{ color: theme.textSecondary }} className="text-center text-sm px-8 mb-8">
                                        Generamos un código de barras que puedes usar en cualquier tienda OXXO para pagar ${amount.toFixed(2)}.
                                    </Text>
                                    <View style={{ backgroundColor: theme.cardSecondary, borderColor: theme.border }} className="w-full p-5 rounded-[24px] border mb-8">
                                        <View className="flex-row items-center gap-3 mb-3">
                                            <MaterialIcons name="check" size={18} color="#4ade80" />
                                            <Text style={{ color: theme.text }} className="font-bold text-sm">Sin cuenta bancaria</Text>
                                        </View>
                                        <View className="flex-row items-center gap-3 mb-3">
                                            <MaterialIcons name="check" size={18} color="#4ade80" />
                                            <Text style={{ color: theme.text }} className="font-bold text-sm">Paga en efectivo</Text>
                                        </View>
                                        <View className="flex-row items-center gap-3">
                                            <MaterialIcons name="check" size={18} color="#4ade80" />
                                            <Text style={{ color: theme.text }} className="font-bold text-sm">Válido por 3 días</Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity
                                        onPress={handleOxxo}
                                        disabled={loading}
                                        className="w-full py-5 rounded-2xl items-center bg-yellow-500"
                                    >
                                        {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-black text-base">Generar código OXXO</Text>}
                                    </TouchableOpacity>
                                </MotiView>
                            )}

                            {tab === 'spei' && (
                                <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} className="items-center pt-6">
                                    <View className="w-24 h-24 bg-purple-500/10 rounded-full items-center justify-center mb-6">
                                        <MaterialIcons name="account-balance" size={48} color="#a78bfa" />
                                    </View>
                                    <Text style={{ color: theme.text }} className="text-xl font-black text-center mb-2">Transferencia SPEI</Text>
                                    <Text style={{ color: theme.textSecondary }} className="text-center text-sm px-8 mb-8">
                                        Generamos una CLABE interbancaria para que transfieras ${amount.toFixed(2)} desde cualquier banco mexicano.
                                    </Text>
                                    <View style={{ backgroundColor: theme.cardSecondary, borderColor: theme.border }} className="w-full p-5 rounded-[24px] border mb-8">
                                        <View className="flex-row items-center gap-3 mb-3">
                                            <MaterialIcons name="check" size={18} color="#4ade80" />
                                            <Text style={{ color: theme.text }} className="font-bold text-sm">BBVA, Banorte, HSBC y más</Text>
                                        </View>
                                        <View className="flex-row items-center gap-3 mb-3">
                                            <MaterialIcons name="check" size={18} color="#4ade80" />
                                            <Text style={{ color: theme.text }} className="font-bold text-sm">Acreditación inmediata</Text>
                                        </View>
                                        <View className="flex-row items-center gap-3">
                                            <MaterialIcons name="check" size={18} color="#4ade80" />
                                            <Text style={{ color: theme.text }} className="font-bold text-sm">Sin comisiones</Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity
                                        onPress={handleSpei}
                                        disabled={loading}
                                        className="w-full py-5 rounded-2xl items-center bg-purple-500"
                                    >
                                        {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-black text-base">Generar CLABE SPEI</Text>}
                                    </TouchableOpacity>
                                </MotiView>
                            )}
                        </ScrollView>
                    </>
                )}
            </View>
        </Modal>
    );
}
