import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons, Feather, Ionicons } from '@expo/vector-icons';
import { MotiView, AnimatePresence } from 'moti';
import { useTheme } from '../../src/infrastructure/context/ThemeContext';
import { useEasyPay } from '../../context/EasyPayContext';

const { width } = Dimensions.get('window');

export default function ChangePasswordScreen() {
    const { theme, fontScale } = useTheme();
    const { user, changePassword } = useEasyPay();
    const router = useRouter();
    
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const passwordStrength = () => {
        if (!newPassword) return 0;
        let score = 0;
        if (newPassword.length >= 8) score += 1;
        if (/[A-Z]/.test(newPassword)) score += 1;
        if (/[0-9]/.test(newPassword)) score += 1;
        if (/[^A-Za-z0-9]/.test(newPassword)) score += 1;
        return score;
    };

    const getStrengthColor = () => {
        const score = passwordStrength();
        if (score <= 1) return '#f43f5e';
        if (score <= 2) return '#f59e0b';
        if (score <= 3) return '#3b82f6';
        return '#10b981';
    };

    const handleSave = async () => {
        if (!newPassword || !confirmPassword) {
            Alert.alert('Error', 'Todos los campos son obligatorios');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'Las contraseñas no coinciden');
            return;
        }
        if (newPassword.length < 8) {
            Alert.alert('Error', 'La contraseña debe tener al menos 8 caracteres');
            return;
        }

        if (!user?.id) {
            Alert.alert('Error', 'No se pudo identificar al usuario');
            return;
        }

        setIsLoading(true);
        try {
            await changePassword(user.id, { 
                new_password: newPassword, 
                confirm_password: confirmPassword 
            });
            Alert.alert('Éxito', 'Contraseña actualizada correctamente', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'No se pudo cambiar la contraseña. Inténtalo de nuevo.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
            <Stack.Screen options={{ title: 'Cambiar Contraseña', headerShown: false }} />
            
            <MotiView 
                from={{ opacity: 0, translateY: -20 }}
                animate={{ opacity: 1, translateY: 0 }}
                style={{ height: 80, borderBottomColor: theme.border + '20' }} 
                className="px-6 flex-row items-center justify-between border-b"
            >
                <TouchableOpacity 
                    onPress={() => router.back()} 
                    className="w-10 h-10 rounded-xl bg-slate-800/40 items-center justify-center"
                >
                    <MaterialIcons name="arrow-back-ios" size={18} color={theme.text} style={{ marginLeft: 5 }} />
                </TouchableOpacity>
                <Text style={{ fontSize: 16 * fontScale, color: theme.text }} className="font-black uppercase tracking-[2px]">Seguridad</Text>
                <View className="w-10" />
            </MotiView>

            <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
                <MotiView
                    from={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'timing', duration: 400 }}
                >
                    <View style={{ backgroundColor: theme.cardSecondary + '40' }} className="p-8 rounded-[40px] border border-white/5 relative overflow-hidden">
                        <View className="absolute top-[-20] right-[-20] opacity-5">
                            <Ionicons name="shield-checkmark" size={150} color={theme.primary} />
                        </View>

                        <Text style={{ fontSize: 10 * fontScale, color: theme.textSecondary }} className="font-black uppercase tracking-[3px] mb-8">Actualizar Contraseña</Text>

                        <View className="gap-6">
                            <View>
                                <Text style={{ color: theme.textSecondary }} className="text-[10px] font-black uppercase mb-3 ml-2">Nueva Contraseña</Text>
                                <View className="relative">
                                    <TextInput
                                        secureTextEntry={!showPassword}
                                        value={newPassword}
                                        onChangeText={setNewPassword}
                                        style={{ backgroundColor: theme.bg + '60', color: theme.text, borderColor: theme.border + '20' }}
                                        className="p-6 rounded-[24px] border font-bold pr-16"
                                        placeholder="••••••••"
                                        placeholderTextColor={theme.textSecondary + '30'}
                                    />
                                    <TouchableOpacity 
                                        onPress={() => setShowPassword(!showPassword)}
                                        className="absolute right-6 top-6"
                                    >
                                        <Feather name={showPassword ? "eye" : "eye-off"} size={20} color={theme.textSecondary} />
                                    </TouchableOpacity>
                                </View>

                                {/* Strength Bar */}
                                <View className="mt-4 px-2 flex-row gap-1">
                                    {[1, 2, 3, 4].map(i => (
                                        <View 
                                            key={i} 
                                            style={{ 
                                                height: 4, 
                                                flex: 1, 
                                                backgroundColor: i <= passwordStrength() ? getStrengthColor() : theme.border + '20',
                                                borderRadius: 2
                                            }} 
                                        />
                                    ))}
                                </View>
                            </View>

                            <View>
                                <Text style={{ color: theme.textSecondary }} className="text-[10px] font-black uppercase mb-3 ml-2">Confirmar Nueva</Text>
                                <TextInput
                                    secureTextEntry={!showPassword}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    style={{ backgroundColor: theme.bg + '60', color: theme.text, borderColor: theme.border + '20' }}
                                    className="p-6 rounded-[24px] border font-bold"
                                    placeholder="••••••••"
                                    placeholderTextColor={theme.textSecondary + '30'}
                                />
                            </View>

                            <TouchableOpacity 
                                onPress={handleSave}
                                disabled={isLoading}
                                style={{ backgroundColor: theme.primary, shadowColor: theme.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 }}
                                className="mt-6 py-6 rounded-[28px] items-center elevation-5"
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="black" />
                                ) : (
                                    <View className="flex-row items-center gap-3">
                                        <Text className="text-black font-black uppercase tracking-widest text-xs">Guardar Cambios</Text>
                                        <Feather name="check-circle" size={16} color="black" />
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </MotiView>

                <MotiView 
                    from={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 400 }}
                    className="mt-10 px-4 items-center"
                >
                    <View className="w-12 h-12 bg-slate-800/40 rounded-full items-center justify-center mb-4">
                        <MaterialIcons name="security" size={24} color={theme.textSecondary} />
                    </View>
                    <Text style={{ color: theme.textSecondary }} className="text-[11px] font-bold text-center px-10 leading-4">
                        Tu contraseña se cifra automáticamente antes de guardarse. Requerimos al menos 8 caracteres para tu seguridad.
                    </Text>
                </MotiView>
            </ScrollView>
        </SafeAreaView>
    );
}
