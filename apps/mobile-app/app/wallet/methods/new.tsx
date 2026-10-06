import { useEasyPay } from '../../../context/EasyPayContext';
import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity, ScrollView,
    TextInput, Dimensions, Alert, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { useTheme } from '../../../src/infrastructure/context/ThemeContext';

import { TwoFactorModal } from '../../../components/Security/TwoFactorModal';

const { width } = Dimensions.get('window');

export default function RegisterCardScreen() {
    const { theme, fontScale } = useTheme();
    const { user  } = useEasyPay();
    const { addCard  } = useEasyPay();

    const [cardNumber, setCardNumber] = useState('');
    const [cardName, setCardName] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [docNumber, setDocNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);

    const brand = MercadoPagoService.detectCardBrand(cardNumber);
    const isSantander = cardNumber.replace(/\s/g, '').startsWith('5579') || cardNumber.replace(/\s/g, '').startsWith('5434');

    const brandColors: Record<string, string[]> = {
        visa:       ['#1a1f71', '#2196F3'],
        mastercard: ['#eb001b', '#f79e1b'],
        amex:       ['#007bc1', '#00b4d8'],
        santander:  ['#ec0000', '#b30000'],
        'credit-card': [theme.primary, '#4f46e5'],
    };

    const cardColors = isSantander ? brandColors.santander : (brandColors[brand] ?? brandColors['credit-card']);

    const isValid = cardNumber.replace(/\s/g, '').length === 16
        && cardName.length > 2
        && expiry.length === 5
        && cvv.length >= 3;

    const handleSave = async () => {
        if (!isValid) {
            Alert.alert('Datos incompletos', 'Por favor completa todos los campos correctamente.');
            return;
        }
        setIs2FAModalOpen(true);
    };

    const onVerified = async () => {
        setIs2FAModalOpen(false);
        setLoading(true);
        try {
            const [month, year] = expiry.split('/');
            // Tokenizar con MercadoPago para no guardar datos sensibles
            const token = await MercadoPagoService.createCardToken({
                cardNumber: cardNumber.replace(/\s/g, ''),
                expirationMonth: month,
                expirationYear: `20${year}`,
                securityCode: cvv,
                cardholderName: cardName,
                docType: 'RFC',
                docNumber: docNumber || 'XAXX010101000',
            });

            // Guardar en el contexto (sin datos sensibles, solo los visibles)
            addCard({
                token,
                last4: cardNumber.replace(/\s/g, '').slice(-4),
                brand: isSantander ? 'SANTANDER' : (brand === 'credit-card' ? 'CARD' : brand.toUpperCase()),
                holder: cardName.toUpperCase(),
                expiry,
                colors: cardColors,
            });

            Alert.alert('✅ Tarjeta guardada', 'Tu tarjeta fue agregada exitosamente.', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (e: any) {
            Alert.alert('Error', e.message ?? 'No se pudo guardar la tarjeta. Verifica los datos.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
            <StatusBar style={theme.isDark ? 'light' : 'dark'} />
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View className="flex-row items-center justify-between px-6 py-4 w-full">
                <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 rounded-full items-center justify-center">
                    <MaterialIcons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={{ color: theme.text, fontSize: 18 * fontScale }} className="font-black tracking-tight flex-1 text-center pr-10">
                    Nueva Tarjeta
                </Text>
            </View>

            <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 150, paddingTop: 10 }}>

                {/* Preview de tarjeta */}
                <MotiView
                    from={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-10 items-center"
                >
                    <LinearGradient
                        colors={cardColors as any}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        className="w-full h-56 rounded-[32px] p-8 justify-between shadow-2xl relative overflow-hidden"
                    >
                        <View className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24" />
                        <View className="flex-row justify-between items-start">
                            <View className="w-14 h-10 bg-white/20 rounded-lg items-center justify-center">
                                <MaterialIcons name="contactless" size={28} color="white" />
                            </View>
                            <Text className="text-white font-black italic text-xl uppercase">
                                {isSantander ? 'SANTANDER' : (brand === 'credit-card' ? 'CARD' : brand)}
                            </Text>
                        </View>
                        <View>
                            <Text className="text-white font-mono text-2xl tracking-[4px] mb-4">
                                {cardNumber || '**** **** **** ****'}
                            </Text>
                            <View className="flex-row justify-between">
                                <View>
                                    <Text className="text-white/40 text-[8px] font-black uppercase tracking-widest mb-1">TITULAR</Text>
                                    <Text className="text-white font-black uppercase text-xs">{cardName || 'NOMBRE TITULAR'}</Text>
                                </View>
                                <View className="items-end">
                                    <Text className="text-white/40 text-[8px] font-black uppercase tracking-widest mb-1">EXPIRA</Text>
                                    <Text className="text-white font-black uppercase text-xs">{expiry || 'MM/YY'}</Text>
                                </View>
                            </View>
                        </View>
                    </LinearGradient>
                </MotiView>

                {/* Formulario */}
                <View style={{ backgroundColor: theme.cardSecondary, borderColor: theme.border }} className="rounded-[28px] border p-6 gap-5">

                    {/* Número */}
                    <View>
                        <Text style={{ color: theme.textSecondary }} className="text-[10px] font-black uppercase tracking-[3px] mb-3">Número de tarjeta</Text>
                        <View style={{ backgroundColor: theme.bg }} className="flex-row items-center px-5 py-4 rounded-2xl">
                            <MaterialIcons name="credit-card" size={20} color={theme.textSecondary} style={{ marginRight: 12 }} />
                            <TextInput
                                value={cardNumber}
                                onChangeText={v => setCardNumber(MercadoPagoService.formatCardNumber(v))}
                                keyboardType="numeric"
                                maxLength={19}
                                placeholder="1234 5678 9012 3456"
                                placeholderTextColor="#475569"
                                style={{ color: theme.text, flex: 1, fontWeight: 'bold', fontFamily: 'monospace' }}
                            />
                        </View>
                    </View>

                    {/* Nombre */}
                    <View>
                        <Text style={{ color: theme.textSecondary }} className="text-[10px] font-black uppercase tracking-[3px] mb-3">Nombre del titular</Text>
                        <View style={{ backgroundColor: theme.bg }} className="flex-row items-center px-5 py-4 rounded-2xl">
                            <MaterialIcons name="person-outline" size={20} color={theme.textSecondary} style={{ marginRight: 12 }} />
                            <TextInput
                                value={cardName}
                                onChangeText={setCardName}
                                autoCapitalize="characters"
                                placeholder="JUAN PEREZ"
                                placeholderTextColor="#475569"
                                style={{ color: theme.text, flex: 1, fontWeight: 'bold' }}
                            />
                        </View>
                    </View>

                    {/* Expiración + CVV */}
                    <View className="flex-row gap-4">
                        <View className="flex-1">
                            <Text style={{ color: theme.textSecondary }} className="text-[10px] font-black uppercase tracking-[3px] mb-3">Expiración</Text>
                            <View style={{ backgroundColor: theme.bg }} className="flex-row items-center px-5 py-4 rounded-2xl">
                                <TextInput
                                    value={expiry}
                                    onChangeText={v => setExpiry(MercadoPagoService.formatExpiry(v))}
                                    keyboardType="numeric"
                                    maxLength={5}
                                    placeholder="MM/YY"
                                    placeholderTextColor="#475569"
                                    style={{ color: theme.text, flex: 1, fontWeight: 'bold', textAlign: 'center' }}
                                />
                            </View>
                        </View>
                        <View className="flex-1">
                            <Text style={{ color: theme.textSecondary }} className="text-[10px] font-black uppercase tracking-[3px] mb-3">CVV</Text>
                            <View style={{ backgroundColor: theme.bg }} className="flex-row items-center px-5 py-4 rounded-2xl">
                                <TextInput
                                    value={cvv}
                                    onChangeText={setCvv}
                                    keyboardType="numeric"
                                    maxLength={4}
                                    secureTextEntry
                                    placeholder="•••"
                                    placeholderTextColor="#475569"
                                    style={{ color: theme.text, flex: 1, fontWeight: 'bold', textAlign: 'center' }}
                                />
                            </View>
                        </View>
                    </View>

                    {/* RFC/CURP */}
                    <View>
                        <Text style={{ color: theme.textSecondary }} className="text-[10px] font-black uppercase tracking-[3px] mb-3">RFC / CURP</Text>
                        <View style={{ backgroundColor: theme.bg }} className="flex-row items-center px-5 py-4 rounded-2xl">
                            <MaterialIcons name="badge" size={20} color={theme.textSecondary} style={{ marginRight: 12 }} />
                            <TextInput
                                value={docNumber}
                                onChangeText={setDocNumber}
                                autoCapitalize="characters"
                                placeholder="XAXX010101000"
                                placeholderTextColor="#475569"
                                style={{ color: theme.text, flex: 1, fontWeight: 'bold' }}
                            />
                        </View>
                    </View>
                </View>

                {/* Seguridad */}
                <View className="flex-row items-center gap-3 px-4 mt-5 opacity-60">
                    <Ionicons name="shield-checkmark-outline" size={20} color={theme.textSecondary} />
                    <Text style={{ color: theme.textSecondary }} className="text-[10px] font-medium flex-1">
                        Tus datos están protegidos bajo estándares PCI-DSS. Nunca almacenamos tu número completo.
                    </Text>
                </View>
            </ScrollView>

            {/* Botón guardar */}
            <View style={{ backgroundColor: theme.bg, borderColor: theme.border }} className="absolute bottom-0 w-full px-6 py-8 border-t">
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={loading || !isValid}
                    activeOpacity={0.8}
                    className="w-full h-16 rounded-2xl overflow-hidden shadow-xl"
                    style={{ opacity: loading || !isValid ? 0.5 : 1 }}
                >
                    <LinearGradient
                        colors={[theme.primary, theme.primary + 'CC']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        className="w-full h-full items-center justify-center"
                    >
                        {loading
                            ? <ActivityIndicator color="white" />
                            : <Text className="text-white font-black text-base uppercase tracking-widest">Guardar Tarjeta</Text>}
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            <TwoFactorModal 
                visible={is2FAModalOpen}
                onClose={() => setIs2FAModalOpen(false)}
                onVerified={onVerified}
                userId={user?.id || ''}
                actionTitle="Verificar Identidad"
                actionDescription="Para agregar un nuevo método de pago, por favor verifica tu identidad."
            />
        </SafeAreaView>
    );
}
