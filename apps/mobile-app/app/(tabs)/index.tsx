import { useEasyPay } from '../../context/EasyPayContext';
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { 
    ScrollView, 
    View, 
    Text, 
    Pressable, 
    Dimensions, 
    Image, 
    Animated, 
    TouchableOpacity, 
    StyleSheet,
    RefreshControl,
    ActivityIndicator,
    Platform,
    Modal
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../src/infrastructure/context/ThemeContext';


import { groupRepository } from '../../src/infrastructure/api/repositories/GroupRepository';
import { statsRepository } from '../../src/infrastructure/api/repositories/StatsRepository';
import { toTitleCase } from '../../src/infrastructure/utils/format';
import Toast from 'react-native-toast-message';

const { width: windowWidth } = Dimensions.get('window');
const width = Platform.OS === 'web' ? Math.min(windowWidth, 480) : windowWidth;
const CARD_WIDTH = width * 0.82;
const CARD_SPACING = (width - CARD_WIDTH) / 2;

// --- Dashboard Component ---
export default function DashboardScreen() {
    const { theme, fontScale, cycleTheme } = useTheme();
    const { user  } = useEasyPay();
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const [refreshing, setRefreshing] = useState(false);
    const [isBalanceVisible, setIsBalanceVisible] = useState(true);
    const scrollX = useRef(new Animated.Value(0)).current;

    // Fetch real data from repository
    const [userGroups, setUserGroups] = useState<any[]>([]);
    const [userStats, setUserStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchGroupsAndStats = useCallback(async () => {
        if (!user?.id) return;
        setIsLoading(true);
        try {
            const [rawGroups, statsRes] = await Promise.all([
                groupRepository.findByUser(user.id),
                statsRepository.getUserStats(user.id)
            ]);
            
            const groups = Array.isArray(rawGroups) ? rawGroups : [];
            
            // Enriquecer grupos con balances para identificar deudas
            const groupsWithBalances = await Promise.all(groups.map(async (g) => {
                // Solo buscamos balances si el grupo no está ya saldado
                if (g.is_settled) return g;
                try {
                    const bRes = await groupRepository.getBalances(g.id);
                    return { ...g, balances: bRes.balance_detallado || [] };
                } catch (e) {
                    return g;
                }
            }));

            setUserGroups(groupsWithBalances);
            setUserStats(statsRes);
        } catch (err) {
            console.error('❌ Dashboard: Error fetching data:', err);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchGroupsAndStats();
    }, [fetchGroupsAndStats]);

    const STATS = [
        { id: '1', label: 'Total Gastado', amount: userStats?.total_spent || 0, color: [theme.primary, `${theme.primary}80`], icon: 'account-balance-wallet', trend: `${userGroups.length} Grupos` },
        { id: '2', label: 'Te deben', amount: userStats?.owed_to_user || 0, color: ['#10b981', '#059669'], icon: 'trending-up', trend: 'Saldos +' },
        { id: '3', label: 'Debes', amount: userStats?.user_owes || 0, color: ['#f43f5e', '#e11d48'], icon: 'trending-down', trend: 'Pendiente -' },
        { id: '4', label: 'Grupos Activos', amount: userGroups.filter(g => !g.is_settled).length, color: ['#8b5cf6', '#7c3aed'], icon: 'groups', trend: 'En curso' },
    ];

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchGroupsAndStats();
    }, [fetchGroupsAndStats]);

    // Calcular deudas activas (donde el usuario debe dinero)
    const activeDebts = useMemo(() => {
        if (!userGroups || !user) return [];
        
        const debts = [];
        for (const group of userGroups) {
            // Solo grupos en fase de liquidación
            const status = (group.status || group.estado || '').toLowerCase();
            if (status !== 'settling') continue;

            const myBalance = group.balances?.find((b: any) => b.usuario_id === user.id)?.balance || 0;
            
            if (myBalance < -0.01) { // Deuda real
                const creditor = group.balances?.find((b: any) => b.balance > 0);
                debts.push({
                    groupId: group.id,
                    groupName: group.nombre,
                    amount: Math.abs(myBalance),
                    creditorId: creditor?.usuario_id,
                    creditorName: creditor?.persona || 'Líder del Grupo'
                });
            }
        }
        return debts;
    }, [userGroups, user]);

    const [showDebtSelector, setShowDebtSelector] = useState(false);

    const handleCreateGrupo = () => {
        router.push('/create-group' as any);
    };

    const handleSettlePress = () => {
        if (activeDebts.length === 0) {
            Toast.show({
                type: 'info',
                text1: 'Sin deudas pendientes',
                text2: '¡No le debes nada a nadie! 🎉'
            });
            return;
        }
        
        if (activeDebts.length === 1) {
            router.push({
                pathname: '/settle-up',
                params: {
                    groupId: activeDebts[0].groupId,
                    creditorId: activeDebts[0].creditorId,
                    amount: activeDebts[0].amount.toString(),
                    groupName: activeDebts[0].groupName,
                    creditorName: activeDebts[0].creditorName
                }
            });
        } else {
            setShowDebtSelector(true);
        }
    };

    const QUICK_ACTIONS = [
        { id: 'group', label: 'Nuevo Grupo', icon: 'group-add', action: handleCreateGrupo, color: theme.primary },
        { id: 'join', label: 'Unirse a Grupo', icon: 'group-add', route: '/join-code', color: '#10b981' },
        { id: 'settle', label: 'Liquidar Deuda', icon: 'handshake', action: handleSettlePress, color: '#a855f7' },
    ];

    const renderHeader = () => (
        <View style={{ backgroundColor: theme.bg }} className="px-6 py-8 flex-row justify-between items-center w-full">
            <View className="flex-1 flex-row items-center gap-3 pr-2">
                <TouchableOpacity 
                    activeOpacity={0.7}
                    onPress={cycleTheme}
                    style={{ backgroundColor: theme.primary, width: 40, height: 40 }} 
                    className="w-10 h-10 rounded-xl items-center justify-center shadow-lg shadow-pink-500/20 overflow-hidden"
                >
                    <Image 
            source={require('../../assets/images/logo-ep.png')} 
            style={{ width: '100%', height: '100%' }}
            resizeMode="contain" 
        />
                </TouchableOpacity>
                <View className="flex-1">
                    <Text 
                        numberOfLines={1} 
                        style={{ fontSize: 20 * fontScale, color: theme.text }} 
                        className="font-black tracking-tighter"
                    >
                        Hola, {user?.nombre ? toTitleCase(user.nombre).split(' ')[0] : 'Usuario'}
                    </Text>
                    <Text style={{ fontSize: 9 * fontScale, color: theme.primary }} className="font-black uppercase tracking-[3px]">Easy-Pay Dashboard</Text>
                </View>
            </View>

            <View className="flex-row gap-3 items-center">
                <TouchableOpacity 
                    onPress={() => setIsBalanceVisible(!isBalanceVisible)}
                    activeOpacity={0.7}
                    style={{ backgroundColor: theme.cardSecondary, borderColor: theme.border }}
                    className="w-11 h-11 rounded-xl items-center justify-center border"
                >
                    <MaterialIcons name={isBalanceVisible ? "visibility" : "visibility-off"} size={20} color={theme.primary} />
                </TouchableOpacity>

                <TouchableOpacity 
                    onPress={() => router.push('/profile' as any)}
                    style={{ backgroundColor: theme.cardSecondary, borderColor: theme.border }}
                    className="w-11 h-11 rounded-full items-center justify-center border overflow-hidden"
                >
                    {user?.nombre ? (
                        <View style={{ backgroundColor: theme.primary }} className="w-full h-full items-center justify-center">
                            <Text className="text-white font-black text-xs">{user.nombre.charAt(0).toUpperCase()}</Text>
                        </View>
                    ) : (
                        <MaterialIcons name="person" size={20} color={theme.textSecondary} />
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
            <StatusBar style={theme.isDark ? "light" : "dark"} />

            {renderHeader()}

            <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: insets.bottom + 150 }}
                refreshControl={
                    <RefreshControl 
                        refreshing={refreshing} 
                        onRefresh={onRefresh} 
                        tintColor={theme.primary}
                        colors={[theme.primary]}
                    />
                }
            >
                {/* 1. Resumen Financiero */}
                <View className="mt-4">
                    <Animated.ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        snapToInterval={CARD_WIDTH + 14}
                        decelerationRate="fast"
                        contentContainerStyle={{ paddingHorizontal: CARD_SPACING }}
                        onScroll={Animated.event(
                            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                            { useNativeDriver: true }
                        )}
                        scrollEventThrottle={16}
                    >
                        {STATS.map((item, index) => {
                            const inputRange = [
                                (index - 1) * (CARD_WIDTH + 14),
                                index * (CARD_WIDTH + 14),
                                (index + 1) * (CARD_WIDTH + 14)
                            ];
                            const scale = scrollX.interpolate({
                                inputRange,
                                outputRange: [0.95, 1, 0.95],
                                extrapolate: 'clamp'
                            });

                            return (
                                <Animated.View key={item.id} style={{ width: CARD_WIDTH, transform: [{ scale }] }} className="mr-3.5">
                                    <LinearGradient
                                        colors={item.color as any}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={styles.cardGradient}
                                        className="h-44 rounded-[50px] p-7 justify-between relative overflow-hidden"
                                    >
                                        <View className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                                        <View className="flex-row items-center justify-between">
                                            <View className="flex-row items-center gap-2.5">
                                                <View className="w-9 h-9 bg-white/20 rounded-xl items-center justify-center">
                                                    <MaterialIcons name={item.icon as any} size={20} color="white" />
                                                </View>
                                                <Text style={{ fontSize: 10 * fontScale }} className="text-white/80 font-black uppercase tracking-wider">{item.label}</Text>
                                            </View>
                                        </View>
                                        <View>
                                            <Text 
                                                style={{ fontSize: 40 * fontScale }} 
                                                className="text-white font-black"
                                            >
                                                {isBalanceVisible ? `$${(userStats?.totalBalance || 0).toFixed(2)}` : `$ ***.**`}
                                            </Text>
                                            <View style={{ backgroundColor: theme.glassBg }} className="px-2 py-0.5 rounded-full self-start mt-2">
                                                <Text style={{ fontSize: 10 * fontScale }} className="text-white font-bold">{item.trend}</Text>
                                            </View>
                                        </View>
                                    </LinearGradient>
                                </Animated.View>
                            );
                        })}
                    </Animated.ScrollView>

                </View>

                {/* 3. Acciones Rápidas */}
                <View className="px-6 mt-10">
                    <Text style={{ fontSize: 10 * fontScale, color: theme.textSecondary }} className="font-black uppercase tracking-[3px] mb-6">Operaciones Rápidas</Text>
                    <View className="flex-row justify-between">
                        {QUICK_ACTIONS.map(action => (
                            <TouchableOpacity 
                                key={action.id}
                                onPress={() => action.action ? action.action() : router.push(action.route as any)}
                                style={{ alignItems: 'center' }}
                                activeOpacity={0.7}
                            >
                                <View 
                                    style={{ backgroundColor: theme.glassBg, borderColor: theme.border, ...styles.actionShadow }}
                                    className="w-16 h-16 rounded-[24px] items-center justify-center mb-3 border border-white/5"
                                >
                                    {action.id === 'settle' ? (
                                        <FontAwesome5 name="handshake" size={24} color={action.color} />
                                    ) : (
                                        <MaterialIcons name={action.icon as any} size={28} color={action.color} />
                                    )}
                                </View>
                                <Text style={{ fontSize: 10 * fontScale, color: theme.text }} className="font-bold tracking-tight">{action.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
                {/* 3. Actividad Reciente */}
                <View className="px-6 mt-12 pb-20">
                    <View className="flex-row justify-between items-center mb-6">
                        <Text style={{ fontSize: 10 * fontScale, color: theme.textSecondary }} className="font-black uppercase tracking-[3px]">Actividad Reciente</Text>
                        <Pressable 
                            onPress={() => router.push('/(tabs)/payments')}
                        >
                            <View>
                                <Text style={{ fontSize: 11 * fontScale, color: theme.primary }} className="font-black">VER TODO</Text>
                            </View>
                        </Pressable>
                    </View>

                    <View className="gap-4">
                        {isLoading ? (
                            <ActivityIndicator size="large" color={theme.primary} />
                        ) : userGroups.length > 0 ? (
                            userGroups.map(item => (
                                <Pressable 
                                    key={item.id}
                                    onPress={() => router.push({ pathname: '/detalle-grupo', params: { id: item.id } })}
                                >
                                    <View 
                                        style={{ 
                                            backgroundColor: theme.cardSecondary, 
                                            borderColor: theme.border,
                                            borderWidth: 1,
                                            borderRadius: 24,
                                            padding: 20,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            marginBottom: 12
                                        }}
                                    >
                                        <View style={{ backgroundColor: theme.glassBg }} className="w-14 h-14 rounded-[20px] items-center justify-center">
                                            <MaterialIcons name="restaurant" size={26} color={theme.primary} />
                                        </View>
                                        <View className="flex-1">
                                            <Text style={{ fontSize: 15 * fontScale, color: theme.text }} className="font-black tracking-tight">{item.nombre || 'Sin nombre'}</Text>
                                            <View className="flex-row items-center gap-2 mt-1">
                                                <Text style={{ fontSize: 9 * fontScale, color: theme.primary }} className="font-black uppercase tracking-widest">{item.codigo_invitacion}</Text>
                                                <Text style={{ fontSize: 10 * fontScale }} className="text-slate-500 font-medium">• {new Date(item.fecha_creacion).toLocaleDateString()}</Text>
                                            </View>
                                        </View>
                                        <View className="items-end">
                                            <Text style={{ 
                                                fontSize: 15 * fontScale, 
                                                color: theme.text 
                                            }} className="font-black">
                                                {isBalanceVisible ? `$${(item.total_gastado || 0).toFixed(2)}` : `$ ***.**`}
                                            </Text>
                                            <View style={{ backgroundColor: item.is_settled ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)' }} className="px-2 py-0.5 rounded-lg mt-1.5 border border-white/5">
                                                <Text style={{ fontSize: 8 * fontScale, color: item.is_settled ? '#10b981' : '#f59e0b' }} className="font-black uppercase">{item.is_settled ? 'Saldado' : 'Activo'}</Text>
                                            </View>
                                        </View>
                                    </View>
                                </Pressable>
                            ))
                        ) : (
                            <View className="items-center py-12 px-6">
                                <View style={{ backgroundColor: theme.glassBg }} className="w-20 h-20 rounded-full items-center justify-center mb-4 border border-white/5">
                                    <MaterialCommunityIcons name="ghost" size={40} color={theme.textSecondary} />
                                </View>
                                <Text style={{ color: theme.text, fontSize: 14 * fontScale }} className="font-black text-center mb-1">¡Aún no hay actividad!</Text>
                                <Text style={{ color: theme.textSecondary, fontSize: 11 * fontScale }} className="text-center px-10 font-bold">Crea tu primer grupo para empezar a dividir gastos.</Text>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* Debt Selector Modal */}
            <Modal
                visible={showDebtSelector}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowDebtSelector(false)}
            >
                <TouchableOpacity 
                    activeOpacity={1} 
                    onPress={() => setShowDebtSelector(false)}
                    className="flex-1 bg-black/60 justify-end"
                >
                    <View style={{ backgroundColor: theme.bg }} className="w-full rounded-t-[40px] p-8 pb-12 shadow-2xl">
                        <View className="w-12 h-1.5 bg-slate-500/20 rounded-full self-center mb-8" />
                        
                        <Text style={{ color: theme.text }} className="text-2xl font-black mb-2">Liquidar Deuda</Text>
                        <Text style={{ color: theme.textSecondary }} className="text-sm font-medium mb-8">Selecciona qué cuenta deseas saldar ahora:</Text>

                        <ScrollView className="max-h-96" showsVerticalScrollIndicator={false}>
                            <View className="gap-4">
                                {activeDebts.map((debt) => (
                                    <TouchableOpacity 
                                        key={debt.groupId}
                                        onPress={() => {
                                            setShowDebtSelector(false);
                                            router.push({
                                                pathname: '/settle-up',
                                                params: {
                                                    groupId: debt.groupId,
                                                    creditorId: debt.creditorId,
                                                    amount: debt.amount.toString(),
                                                    groupName: debt.groupName,
                                                    creditorName: debt.creditorName
                                                }
                                            });
                                        }}
                                        style={{ backgroundColor: theme.cardSecondary, borderColor: theme.border }}
                                        className="p-6 rounded-[32px] border flex-row items-center gap-4"
                                    >
                                        <View style={{ backgroundColor: theme.primary + '20' }} className="w-12 h-12 rounded-2xl items-center justify-center">
                                            <MaterialIcons name="account-balance-wallet" size={24} color={theme.primary} />
                                        </View>
                                        <View className="flex-1">
                                            <Text style={{ color: theme.text }} className="font-black text-base">{debt.groupName}</Text>
                                            <Text style={{ color: theme.textSecondary }} className="text-xs font-bold uppercase tracking-widest opacity-60">Pagas a {debt.creditorName}</Text>
                                        </View>
                                        <Text style={{ color: theme.primary }} className="font-black text-lg">${debt.amount.toFixed(2)}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>

                        <TouchableOpacity 
                            onPress={() => setShowDebtSelector(false)}
                            style={{ backgroundColor: theme.cardSecondary }}
                            className="mt-8 py-5 rounded-[24px] items-center"
                        >
                            <Text style={{ color: theme.textSecondary }} className="font-black uppercase tracking-[3px] text-xs">Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    cardGradient: {
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.3,
                shadowRadius: 15,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    actionShadow: {
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 5,
            },
            android: {
                elevation: 3,
            },
        }),
    }
});
