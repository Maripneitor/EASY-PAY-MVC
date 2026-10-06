import React, { useState } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    ActivityIndicator, 
    Alert,
    ScrollView
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'react-native';
import { useEasyPay } from '../context/EasyPayContext';

export default function SecuritySetupScreen() {
    const router = useRouter();
    const { userId, email, name } = useLocalSearchParams<{ userId: string, email: string, name: string }>();
    const [loading, setLoading] = useState(false);
    const { setupTwoFactor } = useEasyPay();
    const insets = useSafeAreaInsets();
    
    const handleSendCode = async () => {
        setLoading(true);
        try {
            const data = await setupTwoFactor(userId || 'pending');

            if (data.status === 'success') {
                router.push({
                    pathname: '/security-2fa',
                    params: { userId, email, name }
                });
            } else {
                throw new Error(data.message || 'Error en el servidor');
            }
        } catch (err: any) {
            console.warn('⚠️ Error en 2FA Setup:', err);
            Alert.alert('Error', err.message || 'No se pudo enviar el código. Revisa tu conexión.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }} edges={['top']}>
            <StatusBar style="light" />
            
            {/* Top Bar */}
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
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
            >
                {/* Stepper */}
                <View className="flex-row items-center justify-center gap-2 my-12">
                    <View className="w-8 h-1.5 rounded-full bg-blue-500" />
                    <View className="w-2 h-1.5 rounded-full bg-white/10" />
                </View>

                {/* Title Section */}
                <View className="mb-10">
                    <Text className="text-3xl font-bold text-white mb-3 tracking-tight">Seguridad de la cuenta</Text>
                    <Text className="text-slate-400 text-base leading-relaxed">
                        Para proteger tu dinero y tus datos, necesitamos verificar tu identidad mediante un código de seguridad.
                    </Text>
                </View>

                {/* Main Card */}
                <View className="bg-slate-800/40 rounded-[32px] p-8 border border-white/10">
                    <View className="w-16 h-16 rounded-2xl bg-blue-500/10 items-center justify-center mb-6 border border-blue-500/20">
                        <MaterialIcons name="security" size={32} color="#3b82f6" />
                    </View>

                    <Text className="text-xl font-bold text-white mb-2">Verificación en dos pasos</Text>
                    <Text className="text-slate-400 text-sm leading-relaxed mb-8">
                        Recibirás un código único en tu correo electrónico cada vez que realices una acción importante.
                    </Text>

                    {/* Email Box */}
                    <View className="bg-slate-900/50 rounded-2xl p-5 flex-row items-center border border-white/5">
                        <View className="w-10 h-10 rounded-full bg-blue-500 items-center justify-center mr-4">
                            <MaterialIcons name="email" size={20} color="white" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-0.5">Correo registrado</Text>
                            <Text className="text-white font-medium text-sm" numberOfLines={1}>{email || 'tu-correo@ejemplo.com'}</Text>
                        </View>
                    </View>
                </View>

                {/* Footer Info */}
                <View className="mt-12 flex-row items-center gap-3 bg-blue-500/5 p-4 rounded-2xl border border-blue-500/10">
                    <MaterialIcons name="info" size={20} color="#3b82f6" />
                    <Text className="text-blue-200/60 text-xs flex-1 leading-relaxed">
                        Easy-Pay utiliza cifrado de grado bancario para todas las comunicaciones y transacciones.
                    </Text>
                </View>
            </ScrollView>

            {/* CTA Button */}
            <View style={{ paddingBottom: insets.bottom + 20 }} className="px-6 pt-4">
                <TouchableOpacity 
                    onPress={handleSendCode}
                    disabled={loading}
                    className="w-full h-16 bg-blue-500 rounded-2xl flex-row justify-center items-center overflow-hidden"
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <Text className="text-white font-bold text-base mr-2">Configurar Seguridad</Text>
                            <MaterialIcons name="chevron-right" size={24} color="white" />
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
