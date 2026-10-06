import { useEasyPay } from '../../context/EasyPayContext';
import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    ScrollView, 
    TouchableOpacity, 
    Dimensions, 
    StyleSheet,
    Image as RNImage
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../src/infrastructure/context/ThemeContext';

import { groupRepository } from '../../src/infrastructure/api/repositories/GroupRepository';
import { paymentRepository } from '../../src/infrastructure/api/repositories/PaymentRepository';
import { toTitleCase } from '../../src/infrastructure/utils/format';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProfileScreen() {
    const { theme, fontScale } = useTheme();
    const { user, logout } = useEasyPay();
    const router = useRouter();
    const [userGroups, setUserGroups] = useState<any[]>([]);
    const [realStats, setRealStats] = useState({ total_spent: 0, group_count: 0 });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            if (!user?.id) return;
            try {
                const [groups, stats] = await Promise.all([
                    groupRepository.findByUser(user.id),
                    paymentRepository.getStats(user.id)
                ]);
                setUserGroups(Array.isArray(groups) ? groups : []);
                setRealStats({
                    total_spent: stats.total_spent || 0,
                    group_count: Array.isArray(groups) ? groups.length : 0
                });
            } catch (err) {
                console.error('Error fetching profile stats:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStats();
    }, [user?.id]);

    const SectionHeader = ({ title }: { title: string }) => (
        <Text 
            style={{ fontSize: 10 * fontScale, color: theme.textSecondary }} 
            className="font-black uppercase tracking-[3px] mb-4 ml-2"
        >
            {title}
        </Text>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
            <StatusBar style={theme.isDark ? "light" : "dark"} />
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={{ borderBottomColor: theme.border, height: 80 }} className="px-6 flex-row items-center justify-between border-b">
                <TouchableOpacity 
                    onPress={() => router.back()}
                    className="flex-row items-center gap-2"
                >
                    <MaterialIcons name="arrow-back" size={20} color={theme.textSecondary} />
                    <Text style={{ color: theme.textSecondary }} className="text-sm font-bold">Volver</Text>
                </TouchableOpacity>
                <Text style={{ fontSize: 12 * fontScale, color: theme.text }} className="absolute left-0 right-0 text-center font-black tracking-[4px] uppercase -z-10">
                    Mi Perfil
                </Text>
                <TouchableOpacity 
                    onPress={() => router.push('/app-settings')}
                    style={{ backgroundColor: theme.glassBg, borderColor: theme.border }}
                    className="w-10 h-10 rounded-xl items-center justify-center border"
                >
                    <Ionicons name="settings-outline" size={20} color={theme.textSecondary} />
                </TouchableOpacity>
            </View>

            <ScrollView 
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 24, paddingTop: 24 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Profile Card */}
                <View 
                    style={{ backgroundColor: theme.cardSecondary, borderColor: theme.border }}
                    className="p-8 rounded-[40px] border items-center mb-10 overflow-hidden"
                >
                    <View style={{ backgroundColor: `${theme.primary}10` }} className="absolute top-0 right-0 w-48 h-48 rounded-full -mr-24 -mt-24" />

                    <View className="relative mb-6">
                        <View style={{ borderColor: theme.primary, backgroundColor: theme.card }} className="w-28 h-28 rounded-[40px] p-1 border-2 overflow-hidden shadow-2xl items-center justify-center">
                            {user?.nombre ? (
                                <View style={{ backgroundColor: theme.primary }} className="w-full h-full items-center justify-center rounded-[36px]">
                                    <Text className="text-white font-black text-4xl">{user.nombre.charAt(0).toUpperCase()}</Text>
                                </View>
                            ) : (
                                <MaterialIcons name="person" size={60} color={theme.textSecondary} />
                            )}
                        </View>
                        <View className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 rounded-full border-4" style={{ borderColor: theme.bg }} />
                    </View>

                    <Text 
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.5}
                        style={{ fontSize: 24 * fontScale, color: theme.text }} 
                        className="font-black tracking-tight mb-1"
                    >
                        {user?.nombre ? toTitleCase(user.nombre) : 'Usuario'}
                    </Text>
                    <Text style={{ fontSize: 13 * fontScale, color: theme.textSecondary }} className="font-black uppercase tracking-widest mb-6">{user?.email || 'Personal Account'}</Text>

                    <View className="flex-row gap-3">
                        <TouchableOpacity 
                            onPress={() => router.push('/profile/edit' as any)}
                            style={{ backgroundColor: theme.primary }}
                            className="px-6 py-3 rounded-full shadow-lg"
                        >
                            <Text style={{ color: 'white', fontSize: 11 * fontScale }} className="font-black uppercase tracking-wider">Editar Perfil</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Resumen Stats */}
                <SectionHeader title="Resumen" />
                <View className="flex-row flex-wrap gap-4 mb-10">
                    <View style={{ backgroundColor: theme.cardSecondary, width: (SCREEN_WIDTH - 64) / 2, borderColor: theme.border }} className="p-5 rounded-[32px] border">
                        <View className="flex-row justify-between items-center mb-2">
                            <Text className="text-slate-400 text-[10px] font-black uppercase">Gastado</Text>
                            <MaterialIcons name="payments" size={16} color={theme.primary} />
                        </View>
                        <Text style={{ fontSize: 18 * fontScale, color: theme.text }} className="font-mono font-black">
                            ${isLoading ? '...' : realStats.total_spent.toFixed(2)}
                        </Text>
                    </View>
                    <View style={{ backgroundColor: theme.cardSecondary, width: (SCREEN_WIDTH - 64) / 2, borderColor: theme.border }} className="p-5 rounded-[32px] border">
                        <View className="flex-row justify-between items-center mb-2">
                            <Text className="text-slate-400 text-[10px] font-black uppercase">Grupos</Text>
                            <MaterialIcons name="groups" size={16} color={theme.primary} />
                        </View>
                        <Text style={{ fontSize: 18 * fontScale, color: theme.text }} className="font-mono font-black">
                            {isLoading ? '...' : userGroups.length}
                        </Text>
                    </View>
                </View>

                {/* Account Actions */}
                <SectionHeader title="Cuenta" />
                <View style={{ backgroundColor: theme.cardSecondary, borderColor: theme.border }} className="p-2 rounded-[40px] border mb-10 overflow-hidden">
                    <TouchableOpacity 
                        onPress={() => router.push('/profile/edit' as any)}
                        className="flex-row items-center justify-between p-6 border-b border-white/5"
                    >
                        <View className="flex-row items-center gap-4">
                            <View style={{ backgroundColor: '#6366f115' }} className="w-12 h-12 rounded-2xl items-center justify-center">
                                <MaterialIcons name="account-balance" size={24} color="#6366f1" />
                            </View>
                            <View>
                                <Text style={{ color: theme.text }} className="font-black text-sm uppercase tracking-wider">Perfil Financiero</Text>
                                <Text style={{ color: theme.textSecondary }} className="text-[10px] font-bold uppercase opacity-60">Mis cuentas bancarias</Text>
                            </View>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color={theme.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity 
                        onPress={() => router.push('/(tabs)/payments' as any)}
                        className="flex-row items-center justify-between p-6"
                    >
                        <View className="flex-row items-center gap-4">
                            <View style={{ backgroundColor: '#10b98115' }} className="w-12 h-12 rounded-2xl items-center justify-center">
                                <MaterialIcons name="history" size={24} color="#10b981" />
                            </View>
                            <View>
                                <Text style={{ color: theme.text }} className="font-black text-sm uppercase tracking-wider">Historial de Pagos</Text>
                                <Text style={{ color: theme.textSecondary }} className="text-[10px] font-bold uppercase opacity-60">Actividad de cartera</Text>
                            </View>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color={theme.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Logout Button */}
                <TouchableOpacity 
                    onPress={async () => {
                        await logout();
                        router.replace('/');
                    }}
                    className="flex-row items-center justify-center gap-3 py-6 rounded-[32px] bg-rose-500/10 border border-rose-500/20 mb-10"
                >
                    <MaterialIcons name="logout" size={20} color="#f43f5e" />
                    <Text style={{ fontSize: 13 * fontScale }} className="text-rose-500 font-black uppercase tracking-[3px]">Cerrar Sesión</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}
