import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/infrastructure/context/ThemeContext';
import { useEasyPay } from '../../context/EasyPayContext';

export default function TwoFactorSetupScreen() {
    const { theme, fontScale } = useTheme();
    const { user, setupTwoFactor, verifyTwoFactor } = useEasyPay();
    const router = useRouter();
    const [isEnabled, setIsEnabled] = useState(user?.two_factor?.enabled || false);
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [secret, setSecret] = useState<string | null>(null);
    const [verificationCode, setVerificationCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);

    const handleToggle = async (value: boolean) => {
        if (!user?.id) return;
        setIsLoading(true);
        try {
            if (value) {
                const result = await setupTwoFactor(user.id);
                if (result.qr_code) {
                    setQrCode(result.qr_code);
                    setSecret(result.secret || null);
                }
            } else {
                // If disabling, we might need a different endpoint or just update user
                // For now, let's assume toggle is for setup
                setQrCode(null);
                setSecret(null);
            }
            setIsEnabled(value);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'No se pudo iniciar la configuración de 2FA');
            setIsEnabled(!value);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerify = async () => {
        if (!user?.id) return;
        if (verificationCode.length !== 6) {
            Alert.alert('Error', 'Ingresa un código de 6 dígitos');
            return;
        }
        setIsVerifying(true);
        try {
            await verifyTwoFactor(user.id, verificationCode);
            Alert.alert('Éxito', '2FA verificado y activado correctamente');
            setQrCode(null);
            setSecret(null);
            setIsEnabled(true);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Código de verificación incorrecto');
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
            <Stack.Screen options={{ title: 'Seguridad 2FA', headerShown: false }} />
            
            <View style={{ height: 80, borderBottomColor: theme.border }} className="px-6 flex-row items-center justify-between border-b">
                <TouchableOpacity onPress={() => router.back()} className="flex-row items-center gap-2">
                    <MaterialIcons name="arrow-back" size={20} color={theme.textSecondary} />
                    <Text style={{ color: theme.textSecondary }} className="font-bold">Volver</Text>
                </TouchableOpacity>
                <Text style={{ fontSize: 16 * fontScale, color: theme.text }} className="font-black uppercase tracking-widest">Seguridad</Text>
                <View className="w-10" />
            </View>

            <ScrollView className="flex-1 px-6 pt-10" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                <View className="mb-10">
                    <Text style={{ fontSize: 10 * fontScale, color: theme.textSecondary }} className="font-black uppercase tracking-[3px] mb-4 ml-2">Autenticación de dos pasos</Text>
                    <View style={{ backgroundColor: theme.cardSecondary + '50', borderColor: theme.border + '20' }} className="p-8 rounded-[40px] border shadow-2xl backdrop-blur-xl flex-row items-center justify-between">
                        <View className="flex-1 pr-4">
                            <Text style={{ color: theme.text }} className="text-xl font-black mb-2">Estado</Text>
                            <Text style={{ color: theme.textSecondary }} className="text-xs font-medium leading-5">Añade una capa extra de seguridad a tu cuenta protegiéndola de accesos no autorizados.</Text>
                        </View>
                        {isLoading ? (
                            <ActivityIndicator color={theme.primary} />
                        ) : (
                            <Switch 
                                value={isEnabled} 
                                onValueChange={handleToggle}
                                trackColor={{ false: '#334155', true: theme.primary }}
                                thumbColor="white"
                            />
                        )}
                    </View>
                </View>

                {qrCode && (
                    <View style={{ backgroundColor: theme.cardSecondary + '50', borderColor: theme.border + '20' }} className="p-8 rounded-[40px] border items-center mb-10 shadow-2xl backdrop-blur-xl">
                        <Text style={{ color: theme.text }} className="text-2xl font-black mb-4 text-center">Configura tu App</Text>
                        <Text style={{ color: theme.textSecondary }} className="text-xs text-center mb-10 font-medium leading-5">Escanea el código QR o ingresa la clave en tu app de autenticación favorita.</Text>
                        
                        <View className="p-6 bg-white rounded-[40px] mb-10 shadow-xl">
                             <Ionicons name="qr-code" size={180} color="#0f172a" />
                        </View>

                        {secret && (
                            <View style={{ backgroundColor: theme.bg + '50' }} className="p-5 rounded-3xl mb-10 border border-white/5 w-full items-center">
                                <Text className="text-slate-500 text-[10px] font-black uppercase mb-2 tracking-widest">Clave de respaldo</Text>
                                <Text style={{ color: theme.text }} className="font-mono font-bold text-base tracking-widest">{secret}</Text>
                            </View>
                        )}

                        <View className="w-full">
                            <Text style={{ color: theme.textSecondary }} className="text-[10px] font-black uppercase mb-3 ml-2 self-start">Verificar Código</Text>
                            <TextInput
                                value={verificationCode}
                                onChangeText={setVerificationCode}
                                keyboardType="numeric"
                                maxLength={6}
                                style={{ backgroundColor: theme.bg + '80', color: theme.text, borderColor: theme.border + '30' }}
                                className="p-6 rounded-[28px] border font-black w-full text-center text-3xl tracking-[12px]"
                                placeholder="000000"
                                placeholderTextColor={theme.textSecondary + '20'}
                            />

                            <TouchableOpacity 
                                onPress={handleVerify}
                                disabled={isVerifying}
                                style={{ backgroundColor: theme.primary }}
                                className="mt-10 w-full py-6 rounded-[28px] items-center shadow-2xl shadow-blue-500/30"
                            >
                                {isVerifying ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text className="text-white font-black uppercase tracking-widest text-xs">Finalizar Configuración</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
