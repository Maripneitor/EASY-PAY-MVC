import React, { useState, useEffect } from 'react';
import { 
    ScrollView, 
    View, 
    Text, 
    TextInput, 
    KeyboardAvoidingView, 
    Platform,
    ActivityIndicator,
    TouchableOpacity,
    Dimensions,
    StyleSheet
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons, Ionicons, Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { MotiView, AnimatePresence } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { useEasyPay } from '../context/EasyPayContext';
import { userRepository } from '../src/infrastructure/api/repositories/UserRepository';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

export default function PasswordRecoveryScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { saveSession } = useEasyPay();
    
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [email, setEmail] = useState('');
    const [userId, setUserId] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [showPassword, setShowPassword] = useState(false);

    const [tempToken, setTempToken] = useState<string | null>(null);
    const [tempUser, setTempUser] = useState<any | null>(null);

    useEffect(() => {
        let timer: any;
        if (countdown > 0) {
            timer = setInterval(() => {
                setCountdown(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [countdown]);

    const handleRequestReset = async () => {
        if (!email) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Ingresa tu email' });
            return;
        }
        setLoading(true);
        try {
            const data = await userRepository.requestPasswordReset(email);
            
            if (data.status === 'success') {
                Toast.show({ type: 'success', text1: 'Código enviado', text2: 'Revisa tu correo' });
                if (data.user_id) {
                    setUserId(data.user_id);
                    setStep(2);
                    setCountdown(5);
                }
            } else {
                Toast.show({ type: 'error', text1: 'Error', text2: data.message || 'Error al solicitar' });
            }
        } catch (error: any) {
            Toast.show({ type: 'error', text1: 'Error', text2: error.message || 'Error de conexión' });
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        if (countdown > 0) return;
        setResending(true);
        try {
            await userRepository.requestPasswordReset(email);
            Toast.show({ type: 'success', text1: 'Código reenviado' });
            setCountdown(5);
        } catch (error: any) {
            Toast.show({ type: 'error', text1: 'Error', text2: error.message || 'Error al reenviar' });
        } finally {
            setResending(false);
        }
    };

    const handleVerifyCode = async () => {
        if (code.length < 6) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Ingresa el código de 6 dígitos' });
            return;
        }
        setLoading(true);
        try {
            const data = await userRepository.verifyTwoFactor(userId, code);
            
            if (data.status === 'success') {
                Toast.show({ type: 'success', text1: 'Verificado', text2: 'Código correcto' });
                if (data.access_token) {
                    setTempToken(data.access_token);
                    setTempUser(data.user);
                }
                setStep(3);
            } else {
                Toast.show({ type: 'error', text1: 'Error', text2: data.message || 'Código inválido' });
            }
        } catch (error: any) {
            Toast.show({ type: 'error', text1: 'Error', text2: error.message || 'Error al verificar' });
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (newPassword.length < 8) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'La contraseña debe tener al menos 8 caracteres' });
            return;
        }
        if (newPassword !== confirmPassword) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Las contraseñas no coinciden' });
            return;
        }
        
        setLoading(true);
        try {
            const res = await userRepository.changePassword(userId, { 
                new_password: newPassword,
                confirm_password: confirmPassword
            });
            
            Toast.show({ type: 'success', text1: '¡Éxito!', text2: 'Contraseña actualizada' });

            if (tempToken && tempUser) {
                await saveSession(tempToken, {
                    id: tempUser.id || tempUser._id || userId,
                    nombre: tempUser.nombre || 'Usuario',
                    email: tempUser.email || email,
                    isGuest: false
                });
                router.replace('/(tabs)');
            } else {
                router.replace('/login');
            }
        } catch (error: any) {
            Toast.show({ type: 'error', text1: 'Error', text2: error.message || 'Error al cambiar contraseña' });
        } finally {
            setLoading(false);
        }
    };

    const renderStep1 = () => (
        <MotiView from={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="gap-6">
            <View className="items-center mb-4">
                <View className="w-20 h-20 bg-blue-500/10 rounded-3xl items-center justify-center mb-6 border border-blue-500/20">
                    <MaterialIcons name="lock-reset" size={40} color="#3b82f6" />
                </View>
                <Text className="text-white text-2xl font-black text-center tracking-tight">¿Olvidaste tu contraseña?</Text>
                <Text className="text-slate-400 text-center mt-3 leading-relaxed">
                    No te preocupes. Introduce tu email y te enviaremos un código para restablecerla.
                </Text>
            </View>

            <View>
                <Text className="text-slate-300 text-sm font-medium mb-2 ml-1">Email</Text>
                <View className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex-row items-center">
                    <MaterialIcons name="mail" size={20} color="#64748b" />
                    <TextInput 
                        placeholder="tu@ejemplo.com"
                        placeholderTextColor="#475569"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        className="flex-1 ml-4 text-white font-bold"
                        value={email}
                        onChangeText={setEmail}
                    />
                </View>
            </View>

            <TouchableOpacity onPress={handleRequestReset} disabled={loading || !email} activeOpacity={0.8}>
                <LinearGradient colors={['#3b82f6', '#1d4ed8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} className="h-16 rounded-2xl items-center justify-center shadow-lg shadow-blue-500/20">
                    {loading ? <ActivityIndicator color="white" /> : (
                        <Text className="text-white font-bold text-lg">Enviar Código</Text>
                    )}
                </LinearGradient>
            </TouchableOpacity>
        </MotiView>
    );

    const renderStep2 = () => (
        <MotiView from={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="gap-6">
            <View className="items-center mb-4">
                <View className="w-20 h-20 bg-blue-500/10 rounded-3xl items-center justify-center mb-6 border border-blue-500/20">
                    <MaterialIcons name="mark-email-read" size={40} color="#3b82f6" />
                </View>
                <Text className="text-white text-2xl font-black text-center tracking-tight">Ingresa el código</Text>
                <Text className="text-slate-400 text-center mt-3 leading-relaxed">
                    Hemos enviado un código de verificación a <Text className="text-blue-400 font-bold">{email}</Text>
                </Text>
            </View>

            <View>
                <Text className="text-slate-300 text-sm font-medium mb-2 ml-1">Código de 6 dígitos</Text>
                <View className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex-row items-center">
                    <MaterialIcons name="key" size={20} color="#64748b" />
                    <TextInput 
                        placeholder="123456"
                        placeholderTextColor="#475569"
                        keyboardType="numeric"
                        maxLength={6}
                        className="flex-1 ml-4 text-white font-black text-2xl tracking-[10px] text-center"
                        value={code}
                        onChangeText={setCode}
                    />
                </View>
            </View>

            <TouchableOpacity onPress={handleVerifyCode} disabled={loading || code.length < 6} activeOpacity={0.8}>
                <LinearGradient colors={['#3b82f6', '#1d4ed8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} className="h-16 rounded-2xl items-center justify-center shadow-lg shadow-blue-500/20">
                    {loading ? <ActivityIndicator color="white" /> : (
                        <Text className="text-white font-bold text-lg">Verificar Código</Text>
                    )}
                </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
                onPress={handleResendCode}
                disabled={loading || resending || countdown > 0}
                className="items-center mt-2"
            >
                <Text className={`font-bold ${countdown > 0 ? 'text-slate-600' : 'text-blue-400'}`}>
                    {countdown > 0 ? `Reenviar en ${countdown}s` : '¿No recibiste el código? Reenviar'}
                </Text>
            </TouchableOpacity>
        </MotiView>
    );

    const renderStep3 = () => (
        <MotiView from={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="gap-6">
            <View className="items-center mb-4">
                <View className="w-20 h-20 bg-green-500/10 rounded-3xl items-center justify-center mb-6 border border-green-500/20">
                    <MaterialIcons name="security" size={40} color="#10b981" />
                </View>
                <Text className="text-white text-2xl font-black text-center tracking-tight">Nueva contraseña</Text>
                <Text className="text-slate-400 text-center mt-3 leading-relaxed">
                    Ingresa tu nueva contraseña para acceder a tu cuenta de forma segura.
                </Text>
            </View>

            <View className="gap-4">
                <View>
                    <Text className="text-slate-300 text-sm font-medium mb-2 ml-1">Contraseña nueva</Text>
                    <View className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex-row items-center">
                        <MaterialIcons name="lock" size={20} color="#64748b" />
                        <TextInput 
                            placeholder="••••••••"
                            placeholderTextColor="#475569"
                            secureTextEntry={!showPassword}
                            className="flex-1 ml-4 text-white font-bold"
                            value={newPassword}
                            onChangeText={setNewPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                            <Feather name={showPassword ? "eye-off" : "eye"} size={18} color="#64748b" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View>
                    <Text className="text-slate-300 text-sm font-medium mb-2 ml-1">Confirmar contraseña</Text>
                    <View className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex-row items-center">
                        <MaterialIcons name="lock-outline" size={20} color="#64748b" />
                        <TextInput 
                            placeholder="••••••••"
                            placeholderTextColor="#475569"
                            secureTextEntry={!showPassword}
                            className="flex-1 ml-4 text-white font-bold"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                        />
                    </View>
                </View>
            </View>

            <TouchableOpacity onPress={handleChangePassword} disabled={loading || !newPassword || !confirmPassword} activeOpacity={0.8}>
                <LinearGradient colors={['#10b981', '#059669']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} className="h-16 rounded-2xl items-center justify-center shadow-lg shadow-green-500/20">
                    {loading ? <ActivityIndicator color="white" /> : (
                        <Text className="text-white font-bold text-lg">Actualizar Contraseña</Text>
                    )}
                </LinearGradient>
            </TouchableOpacity>
        </MotiView>
    );

    return (
        <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
            <StatusBar style="light" />
            
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView 
                    className="flex-1"
                    contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }}
                    showsVerticalScrollIndicator={false}
                >
                    <TouchableOpacity 
                        onPress={() => step === 1 ? router.back() : setStep(prev => (prev - 1) as any)}
                        className="w-12 h-12 bg-slate-800/50 border border-white/10 rounded-2xl items-center justify-center mb-8"
                    >
                        <MaterialIcons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>

                    <View className="bg-slate-800/40 border border-white/10 rounded-[40px] p-8 shadow-2xl overflow-hidden relative">
                        {/* Background blobs for premium feel */}
                        <View className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16" />
                        <View className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/5 rounded-full -ml-12 -mb-12" />

                        <AnimatePresence exitBeforeEnter>
                            {step === 1 && renderStep1()}
                            {step === 2 && renderStep2()}
                            {step === 3 && renderStep3()}
                        </AnimatePresence>
                    </View>

                    <View className="items-center mt-12">
                        <Text className="text-slate-600 text-[10px] font-black uppercase tracking-[3px]">
                            Secure ID Recovery • Easy-Pay Shield
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
            <Toast />
        </View>
    );
}
