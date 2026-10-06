import { useEasyPay } from '../../context/EasyPayContext';
import React, { useState } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    ScrollView, 
    TextInput,
    Dimensions,
    ActivityIndicator,
    Alert
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { MaterialIcons, Ionicons, Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../src/infrastructure/context/ThemeContext';

import { userRepository } from '../../src/infrastructure/api/repositories/UserRepository';
import { TwoFactorModal } from '../../components/Security/TwoFactorModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function EditProfileScreen() {
    const { theme, fontScale } = useTheme();
    const { user, saveSession  } = useEasyPay();
    const insets = useSafeAreaInsets();

    // Perfil State
    const [nombre, setNombre] = useState(user?.nombre || '');
    const [email, setEmail] = useState(user?.email || '');
    // Financial State
    const [bankAccounts, setBankAccounts] = useState<any[]>(user?.bank_accounts || []);

    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);

    const validate = () => {
        if (!nombre.trim()) {
            Alert.alert('Validación', 'El nombre es obligatorio');
            return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Alert.alert('Validación', 'Formato de correo electrónico inválido');
            return false;
        }

        // Validar cuentas bancarias
        for (const acc of bankAccounts) {
            if (!acc.beneficiario || !acc.clabe || !acc.entidad_financiera) {
                Alert.alert('Validación', 'Todos los campos de las cuentas bancarias son obligatorios');
                return false;
            }
            if (acc.clabe.length !== 18) {
                Alert.alert('Validación', 'La CLABE debe tener 18 dígitos');
                return false;
            }
        }

        return true;
    };

    const handleSaveProfile = async () => {
        if (!validate()) return;
        setIs2FAModalOpen(true);
    };

    const onVerified = async (vCode: string) => {
        setIs2FAModalOpen(false);
        setIsSavingProfile(true);
        try {
            const result = await userRepository.updateUser({
                nombre,
                email,
                bank_accounts: bankAccounts,
                verification_code: vCode
            });

            if (result.status === 'success') {
                await saveSession(result.new_token || result.token || '', {
                    ...user,
                    nombre,
                    email,
                    bank_accounts: bankAccounts
                });

                Alert.alert('Éxito', 'Perfil actualizado correctamente');
                router.back();
            } else {
                Alert.alert('Error', result.message || 'No se pudo actualizar el perfil');
            }
        } catch (err: any) {
            const msg = err.response?.data?.detail || err.message || 'No se pudo conectar con el servidor';
            Alert.alert('Error', msg);
        } finally {
            setIsSavingProfile(false);
        }
    };

    const addBankAccount = () => {
        if (bankAccounts.length >= 3) {
            Alert.alert('Límite alcanzado', 'Solo puedes registrar hasta 3 cuentas bancarias.');
            return;
        }
        setBankAccounts([...bankAccounts, { 
            id: Math.random().toString(36).substr(2, 9), 
            beneficiario: nombre, 
            clabe: '', 
            entidad_financiera: '',
            is_default: bankAccounts.length === 0
        }]);
    };

    const removeBankAccount = (id: string) => {
        setBankAccounts(bankAccounts.filter(a => a.id !== id));
    };

    const updateBankAccount = (id: string, field: string, value: string) => {
        setBankAccounts(bankAccounts.map(a => a.id === id ? { ...a, [field]: value } : a));
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
            <StatusBar style={theme.isDark ? "light" : "dark"} />
            <Stack.Screen options={{ headerShown: false }} />

            <View style={{ height: 70 }} className="flex-row items-center justify-between px-6 w-full border-b border-white/5">
                <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 rounded-full items-center justify-center">
                    <MaterialIcons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={{ color: theme.text, fontSize: 16 * fontScale }} className="font-black uppercase tracking-[3px] flex-1 text-center pr-10">Perfil</Text>
            </View>

            <ScrollView 
                className="flex-1" 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={{ paddingBottom: 150, paddingHorizontal: 24, paddingTop: 24 }}
            >
                {/* User Avatar Header */}
                <View className="items-center mb-10">
                    <View style={{ backgroundColor: theme.cardSecondary, borderColor: theme.primary + '30' }} className="w-24 h-24 rounded-[32px] items-center justify-center border-2 mb-4">
                        <Text style={{ color: theme.primary }} className="text-4xl font-black">{nombre?.charAt(0).toUpperCase() || 'U'}</Text>
                        <TouchableOpacity className="absolute -bottom-2 -right-2 bg-blue-500 w-10 h-10 rounded-2xl items-center justify-center border-4" style={{ borderColor: theme.bg }}>
                            <MaterialIcons name="photo-camera" size={18} color="white" />
                        </TouchableOpacity>
                    </View>
                    <Text style={{ color: theme.text }} className="text-2xl font-black tracking-tight">{nombre || 'Usuario'}</Text>
                    <Text style={{ color: theme.textSecondary }} className="text-xs font-bold opacity-60 uppercase tracking-widest mt-1">{email || 'tu@email.com'}</Text>
                </View>

                {/* Form Area: Basic Info */}
                <Text style={{ color: theme.textSecondary, fontSize: 10 * fontScale }} className="font-black uppercase tracking-[3px] mb-4 ml-2">Información Básica</Text>
                <View style={{ backgroundColor: theme.cardSecondary, borderColor: theme.border }} className="rounded-[40px] p-8 border mb-10 gap-8">
                    <View>
                        <Text style={{ color: theme.textSecondary }} className="text-[9px] font-black uppercase tracking-[2px] mb-3 ml-1">Nombre Completo</Text>
                        <TextInput 
                            value={nombre}
                            onChangeText={setNombre}
                            style={{ backgroundColor: theme.bg, color: theme.text }}
                            className="px-6 py-4 rounded-2xl font-bold text-sm border border-white/5"
                            placeholder="Tu nombre..."
                        />
                    </View>

                    <View>
                        <Text style={{ color: theme.textSecondary }} className="text-[9px] font-black uppercase tracking-[2px] mb-3 ml-1">Email</Text>
                        <TextInput 
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            style={{ backgroundColor: theme.bg, color: theme.text }}
                            className="px-6 py-4 rounded-2xl font-bold text-sm border border-white/5"
                            placeholder="tu@email.com..."
                        />
                    </View>
                </View>

                {/* Financial Profile */}
                <View className="flex-row justify-between items-center mb-4 px-2">
                    <Text style={{ color: theme.textSecondary, fontSize: 10 * fontScale }} className="font-black uppercase tracking-[3px]">Cuentas Bancarias ({bankAccounts.length}/3)</Text>
                    <TouchableOpacity onPress={addBankAccount} disabled={bankAccounts.length >= 3}>
                        <View style={{ backgroundColor: theme.primary + (bankAccounts.length >= 3 ? '20' : '10') }} className="px-4 py-1.5 rounded-full">
                            <Text style={{ color: bankAccounts.length >= 3 ? theme.textSecondary : theme.primary }} className="text-[10px] font-black uppercase">Añadir</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {bankAccounts.length === 0 ? (
                    <View style={{ backgroundColor: theme.cardSecondary, borderColor: theme.border, borderStyle: 'dashed' }} className="rounded-[40px] p-10 border items-center mb-10">
                        <MaterialIcons name="account-balance" size={40} color={theme.textSecondary} className="opacity-20 mb-4" />
                        <Text style={{ color: theme.textSecondary }} className="text-xs font-bold text-center">No has registrado cuentas para recibir pagos.</Text>
                    </View>
                ) : (
                    bankAccounts.map((acc, index) => (
                        <View 
                            key={acc.id} 
                            style={{ backgroundColor: theme.cardSecondary, borderColor: theme.border }} 
                            className="rounded-[40px] p-8 border mb-6 gap-6"
                        >
                            <View className="flex-row justify-between items-center">
                                <View className="flex-row items-center gap-3">
                                    <View style={{ backgroundColor: theme.primary }} className="w-8 h-8 rounded-lg items-center justify-center">
                                        <Text className="text-black font-black text-xs">{index + 1}</Text>
                                    </View>
                                    <Text style={{ color: theme.text }} className="font-black text-sm uppercase tracking-wider">{acc.entidad_financiera || 'Nueva Cuenta'}</Text>
                                </View>
                                <TouchableOpacity onPress={() => removeBankAccount(acc.id)}>
                                    <MaterialIcons name="delete-sweep" size={24} color="#f43f5e" />
                                </TouchableOpacity>
                            </View>

                            <View>
                                <Text style={{ color: theme.textSecondary }} className="text-[8px] font-black uppercase tracking-[2px] mb-2 ml-1">Banco / Institución</Text>
                                <TextInput 
                                    value={acc.entidad_financiera}
                                    onChangeText={(v) => updateBankAccount(acc.id, 'entidad_financiera', v)}
                                    style={{ backgroundColor: theme.bg, color: theme.text }}
                                    className="px-5 py-3 rounded-xl font-bold text-xs border border-white/5"
                                    placeholder="Ej. BBVA, Santander..."
                                />
                            </View>

                            <View>
                                <Text style={{ color: theme.textSecondary }} className="text-[8px] font-black uppercase tracking-[2px] mb-2 ml-1">CLABE Interbancaria</Text>
                                <TextInput 
                                    value={acc.clabe}
                                    onChangeText={(v) => updateBankAccount(acc.id, 'clabe', v)}
                                    keyboardType="numeric"
                                    maxLength={18}
                                    style={{ backgroundColor: theme.bg, color: theme.text }}
                                    className="px-5 py-3 rounded-xl font-mono font-bold text-xs border border-white/5"
                                    placeholder="000000000000000000"
                                />
                            </View>

                            <View>
                                <Text style={{ color: theme.textSecondary }} className="text-[8px] font-black uppercase tracking-[2px] mb-2 ml-1">Beneficiario</Text>
                                <TextInput 
                                    value={acc.beneficiario}
                                    onChangeText={(v) => updateBankAccount(acc.id, 'beneficiario', v)}
                                    style={{ backgroundColor: theme.bg, color: theme.text }}
                                    className="px-5 py-3 rounded-xl font-bold text-xs border border-white/5"
                                    placeholder="Nombre del titular..."
                                />
                            </View>
                        </View>
                    ))
                )}

                {/* Password Section */}
                <TouchableOpacity 
                    onPress={() => router.push('/profile/change-password')}
                    style={{ backgroundColor: theme.cardSecondary, borderColor: theme.border }}
                    className="rounded-[32px] p-6 border flex-row justify-between items-center mb-10"
                >
                    <View className="flex-row items-center gap-4">
                        <View className="w-12 h-12 bg-blue-500/10 rounded-2xl items-center justify-center">
                            <Feather name="shield" size={22} color={theme.primary} />
                        </View>
                        <View>
                            <Text style={{ color: theme.text }} className="font-black text-sm uppercase tracking-wider">Seguridad</Text>
                            <Text style={{ color: theme.textSecondary }} className="text-[10px] font-bold uppercase opacity-60">Cambiar Contraseña</Text>
                        </View>
                    </View>
                    <MaterialIcons name="chevron-right" size={24} color={theme.textSecondary} />
                </TouchableOpacity>

                <View className="items-center opacity-40 mb-10">
                    <Feather name="lock" size={20} color={theme.textSecondary} />
                    <Text style={{ color: theme.textSecondary }} className="text-[9px] font-bold text-center mt-3 px-10 uppercase tracking-widest leading-4">
                        Tus datos financieros son privados y solo se comparten con los miembros de tus grupos durante el proceso de liquidación.
                    </Text>
                </View>
            </ScrollView>

            <View 
                style={{ backgroundColor: theme.bg, paddingBottom: insets.bottom + 16, borderTopWidth: 1, borderTopColor: theme.border + '10' }} 
                className="absolute bottom-0 w-full px-6 pt-6"
            >
                <TouchableOpacity 
                    activeOpacity={0.8}
                    onPress={handleSaveProfile}
                    disabled={isSavingProfile}
                    className="w-full h-16 rounded-[24px] overflow-hidden shadow-2xl"
                >
                    <LinearGradient
                        colors={[theme.primary, theme.primary]}
                        style={{ opacity: isSavingProfile ? 0.6 : 1 }}
                        className="w-full h-full items-center justify-center"
                    >
                        {isSavingProfile ? (
                            <ActivityIndicator color="black" />
                        ) : (
                            <Text className="text-black font-black text-xs uppercase tracking-[4px]">Guardar Cambios</Text>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            <TwoFactorModal 
                visible={is2FAModalOpen}
                onClose={() => setIs2FAModalOpen(false)}
                onVerified={onVerified}
                userId={user?.id || ''}
                actionTitle="Confirmar Cambios"
                actionDescription="Por seguridad, ingresa tu código de verificación para actualizar tu perfil."
            />
        </SafeAreaView>
    );
}
