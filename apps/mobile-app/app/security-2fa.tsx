import { useEasyPay } from '../context/EasyPayContext';
import React, { useState, useRef, useEffect } from 'react';
import { ScrollView, View, Text, TextInput, Alert, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { getApiBaseUrl } from '../src/infrastructure/api/network.config';
import Toast from 'react-native-toast-message';

export default function Security2FAScreen() {
    const { userId, email, name } = useLocalSearchParams<{ userId: string, email: string, name: string }>();
    const { saveSession, verifyTwoFactor, setupTwoFactor } = useEasyPay();
    const router = useRouter();
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const insets = useSafeAreaInsets();
    const inputs = useRef<Array<TextInput | null>>([]);

    useEffect(() => {
        let timer: any;
        if (countdown > 0) {
            timer = setInterval(() => {
                setCountdown(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [countdown]);

    const updateCode = (value: string, index: number) => {
        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);

        if (value !== '' && index < 5) {
            inputs.current[index + 1]?.focus();
        }
    };

    const handleResendCode = async () => {
        if (countdown > 0 || loading) return;
        setLoading(true);
        try {
            const data = await setupTwoFactor(userId || 'pending');
            if (data.status === 'success') {
                Toast.show({
                    type: 'success',
                    text1: 'Código reenviado',
                    text2: 'Revisa tu bandeja de entrada.'
                });
                setCountdown(30); // Use 30s as standard or 5s as per user request (user asked for 5 in web, maybe mobile too)
            } else {
                Toast.show({ type: 'error', text1: 'Error', text2: data.message || 'No se pudo reenviar' });
            }
        } catch (err: any) {
            console.warn('Error reenviando código:', err);
            Toast.show({ type: 'error', text1: 'Error', text2: err.message || 'Error de conexión' });
        } finally {
            setLoading(false);
        }
    };

    const handleVerify2FA = async () => {
        const fullCode = code.join('');
        if (fullCode.length < 6) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Ingresa el código completo de 6 dígitos.'
            });
            return;
        }

        setVerifying(true);
        try {
            const data = await verifyTwoFactor(userId || 'pending', fullCode);
            if (data.status === 'success' || data.access_token) {
                await saveSession(data.access_token || 'demo-token', {
                    id: data.user?.id || data.user?._id || userId || 'unknown',
                    nombre: data.user?.nombre || name || 'Usuario',
                    email: data.user?.email || email || 'demo@easypay.com',
                    isGuest: false
                });

                router.replace('/(tabs)');
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: data.message || 'Código incorrecto.'
                });
            }
        } catch (err: any) {
            console.warn('Error verificando código:', err);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: err.message || 'No se pudo verificar el código.'
            });
        } finally {
            setVerifying(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }} edges={['top']}>
            <StatusBar style="light" />
            <Stack.Screen options={{ headerShown: false }} />

            <View className="px-6 py-4 flex-row justify-between items-center border-b border-white/5">
                <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 rounded-xl items-center justify-center bg-white/5 border border-white/10">
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <View className="flex-row items-center gap-2">
                    <Image 
                        source={require('../assets/images/logo-ep.png')} 
                        style={{ width: 28, height: 28 }}
                        resizeMode="contain"
                    />
                    <Text className="font-bold text-lg text-white tracking-tight">Easy-Pay</Text>
                </View>
                <View className="w-10" />
            </View>

            <ScrollView 
                className="flex-1 px-6"
                contentContainerStyle={{ 
                    flexGrow: 1, 
                    paddingVertical: 40,
                    paddingBottom: insets.bottom + 40
                }}
                showsVerticalScrollIndicator={false}
            >
                <View className="flex-row items-center justify-center gap-2 mb-12">
                    <View className="w-2 h-1.5 rounded-full bg-blue-500/30" />
                    <View className="w-8 h-1.5 rounded-full bg-blue-500" />
                </View>

                <View className="mb-10">
                    <Text className="text-3xl font-bold text-white mb-3 tracking-tight">Verificación</Text>
                    <Text className="text-slate-400 text-base leading-relaxed">
                        Introduce el código de 6 dígitos que enviamos a <Text className="text-blue-400 font-bold">{email || 'tu correo'}</Text>
                    </Text>
                </View>

                <View className="bg-slate-800/40 rounded-[32px] p-8 border border-white/10 items-center">
                    <View className="w-16 h-16 rounded-2xl bg-blue-500/10 items-center justify-center mb-8 border border-blue-500/20">
                        <Ionicons name="mail-open" size={32} color="#3b82f6" />
                    </View>

                    <View className="flex-row justify-center items-center gap-2">
                        {code.map((char, i) => (
                            <React.Fragment key={i}>
                                {i === 3 && <View className="w-1.5 h-1 bg-slate-700 mx-1" />}
                                <TextInput 
                                    ref={(el) => { inputs.current[i] = el; }}
                                    value={char}
                                    onChangeText={(v) => updateCode(v, i)}
                                    keyboardType="numeric"
                                    maxLength={1}
                                    autoFocus={i === 0}
                                    style={{ textAlignVertical: 'center', includeFontPadding: false }}
                                    className="w-11 h-14 bg-slate-900/50 border border-slate-700 rounded-xl text-center text-xl font-bold text-white focus:border-blue-500"
                                    selectionColor="#3b82f6"
                                />
                            </React.Fragment>
                        ))}
                    </View>

                    <View className="mt-10 items-center">
                        <Text className="text-slate-500 text-sm mb-2">¿No recibiste nada?</Text>
                        <TouchableOpacity 
                            onPress={handleResendCode}
                            disabled={loading || countdown > 0}
                            className="flex-row items-center gap-2"
                        >
                            {loading ? <ActivityIndicator size="small" color="#3b82f6" /> : (
                                <Text className={`font-bold ${countdown > 0 ? 'text-slate-600' : 'text-blue-400'}`}>
                                    {countdown > 0 ? `Reenviar en ${countdown}s` : 'Reenviar código'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                <Text className="text-slate-500 text-xs text-center mt-12 px-10 leading-relaxed">
                    Si no encuentras el correo, revisa tu carpeta de <Text className="font-bold">Spam</Text> o Correo no deseado.
                </Text>
            </ScrollView>

            <View style={{ paddingBottom: insets.bottom + 20 }} className="px-6 pt-4">
                <TouchableOpacity 
                    onPress={handleVerify2FA}
                    disabled={verifying}
                    className="w-full h-16 bg-blue-500 rounded-2xl flex-row justify-center items-center overflow-hidden"
                >
                    {verifying ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white font-bold text-base uppercase tracking-widest">Validar Acceso</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
