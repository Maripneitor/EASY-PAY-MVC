import { useEasyPay } from '../../context/EasyPayContext';
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Dimensions, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../src/infrastructure/context/ThemeContext';

import { groupRepository } from '../../src/infrastructure/api/repositories/GroupRepository';

import { MotiView } from 'moti';

export default function GroupListScreen() {
    const { theme, fontScale } = useTheme();
    const { user  } = useEasyPay();
    const insets = useSafeAreaInsets();

    const [activeTab, setActiveTab] = useState<'active' | 'closed'>('active');
    const [groups, setGroups] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Derived Friends logic removed to simplify UI

    const activeGroups = React.useMemo(() => 
        groups.filter(g => g.status === 'active' || g.status === 'settling'), 
    [groups]);
    
    const closedGroups = React.useMemo(() => 
        groups.filter(g => g.status === 'closed' || g.status === 'liquidated' || g.is_settled), 
    [groups]);

    const fetchGroups = useCallback(async () => {
        if (!user?.id) return;
        setIsLoading(true);
        try {
            const data = await groupRepository.findByUser(user.id);
            setGroups(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching groups:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchGroups();
    }, [fetchGroups]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchGroups();
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
            <StatusBar style={theme.isDark ? "light" : "dark"} />
            <Stack.Screen options={{ headerShown: false }} />
            <ScrollView 
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: insets.bottom + 120, paddingHorizontal: 24, paddingTop: 20 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
                }
            >
                <View className="flex-col gap-6 mb-8 py-4">
                    <View className="flex-row justify-between items-center">
                        <View>
                            <Text style={{ color: theme.text, fontSize: 32 * fontScale }} className="font-black tracking-tighter leading-none uppercase">Grupos</Text>
                            <Text style={{ color: theme.primary, fontSize: 9 * fontScale }} className="font-black uppercase tracking-[3px] mt-2">Gestión de Grupos</Text>
                        </View>
                        <TouchableOpacity 
                            onPress={() => router.push('/profile' as any)}
                            style={{ backgroundColor: theme.cardSecondary, borderColor: theme.border }}
                            className="w-10 h-10 rounded-full items-center justify-center border overflow-hidden"
                        >
                            {user?.nombre ? (
                                <View style={{ backgroundColor: theme.primary }} className="w-full h-full items-center justify-center">
                                    <Text className="text-white font-black text-xs">{user.nombre.charAt(0).toUpperCase()}</Text>
                                </View>
                            ) : (
                                <Ionicons name="person-outline" size={20} color={theme.textSecondary} />
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Tab Switcher */}
                    <View style={{ backgroundColor: theme.cardSecondary, borderColor: theme.border }} className="flex-row p-1.5 rounded-[24px] border mt-4">
                        <TouchableOpacity 
                            onPress={() => setActiveTab('active')}
                            style={{ backgroundColor: activeTab === 'active' ? theme.primary : 'transparent' }}
                            className="flex-1 py-3 rounded-[18px] items-center justify-center flex-row gap-2"
                        >
                            <MaterialIcons name="bolt" size={18} color={activeTab === 'active' ? 'black' : theme.textSecondary} />
                            <Text style={{ color: activeTab === 'active' ? 'black' : theme.textSecondary, fontSize: 10 * fontScale }} className="font-black uppercase tracking-widest">Activos</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            onPress={() => setActiveTab('closed')}
                            style={{ backgroundColor: activeTab === 'closed' ? theme.primary : 'transparent' }}
                            className="flex-1 py-3 rounded-[18px] items-center justify-center flex-row gap-2"
                        >
                            <MaterialIcons name="history" size={18} color={activeTab === 'closed' ? 'black' : theme.textSecondary} />
                            <Text style={{ color: activeTab === 'closed' ? 'black' : theme.textSecondary, fontSize: 10 * fontScale }} className="font-black uppercase tracking-widest">Historial</Text>
                        </TouchableOpacity>
                    </View>

                    {activeTab === 'active' && (
                        <View className="flex-row gap-3">
                            <TouchableOpacity 
                                onPress={() => router.push('/create-group')}
                                style={{ backgroundColor: theme.primary }}
                                className="flex-1 h-14 rounded-2xl items-center justify-center flex-row gap-2 shadow-lg shadow-blue-500/20"
                            >
                                <MaterialIcons name="add" size={20} color="black" />
                                <Text style={{ fontSize: 12 * fontScale }} className="font-black uppercase tracking-widest text-black">Nuevo Grupo</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                onPress={() => router.push('/join-code')}
                                style={{ backgroundColor: theme.cardSecondary, borderColor: theme.border }}
                                className="flex-1 h-14 rounded-2xl items-center justify-center border flex-row gap-2"
                            >
                                <MaterialIcons name="group-add" size={20} color={theme.primary} />
                                <Text style={{ color: theme.primary, fontSize: 12 * fontScale }} className="font-black uppercase tracking-widest">Unirse</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* List Container */}
                <View className="gap-6">
                    {isLoading ? (
                        <View className="py-20 items-center">
                            <ActivityIndicator size="large" color={theme.primary} />
                        </View>
                    ) : activeTab === 'active' ? (
                        activeGroups.length > 0 ? (
                            activeGroups.map((group) => (
                                <TouchableOpacity 
                                    key={group.id}
                                    onPress={() => router.push({ pathname: '/detalle-grupo', params: { id: group.id } })}
                                    activeOpacity={0.85}
                                    style={{ backgroundColor: theme.cardSecondary, borderColor: theme.border }}
                                    className="border rounded-[36px] p-6 flex-row items-center"
                                >
                                    <View style={{ backgroundColor: theme.glassBg }} className="w-16 h-16 rounded-[24px] items-center justify-center mr-5 border border-white/5">
                                        <MaterialIcons name="restaurant" size={32} color={theme.primary} />
                                    </View>
                                    <View className="flex-1">
                                        <Text style={{ color: theme.text, fontSize: 18 * fontScale }} className="font-black tracking-tight">{group.nombre || 'Grupo sin nombre'}</Text>
                                        <View className="flex-row items-center gap-2 mt-1">
                                            <Text style={{ color: theme.primary, fontSize: 9 * fontScale }} className="font-black uppercase tracking-widest">{group.codigo_invitacion || '---'}</Text>
                                            <Text style={{ color: theme.textSecondary, fontSize: 10 * fontScale }} className="font-medium">• {new Date(group.fecha_creacion).toLocaleDateString()}</Text>
                                        </View>
                                    </View>
                                    <View className="items-end">
                                        <Text style={{ 
                                            color: theme.text,
                                            fontSize: 16 * fontScale
                                        }} className="font-black">
                                            ${(group.total_gastado || 0).toFixed(2)}
                                        </Text>
                                        
                                        {/* Badge de Deuda/Cobro (Simulado con total_gastado para demo si no hay balance real) */}
                                        {group.status === 'active' && (
                                            <View style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }} className="px-2 py-0.5 rounded-lg mt-1.5 border border-white/5">
                                                <Text style={{ fontSize: 8 * fontScale, color: theme.primary }} className="font-black uppercase">Activo</Text>
                                            </View>
                                        )}
                                        {group.status === 'settling' && (
                                            <View style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }} className="px-2 py-0.5 rounded-lg mt-1.5 border border-white/5">
                                                <Text style={{ fontSize: 8 * fontScale, color: '#f59e0b' }} className="font-black uppercase">Liquidando</Text>
                                            </View>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <View className="items-center justify-center py-20">
                                <View style={{ backgroundColor: theme.glassBg }} className="w-24 h-24 rounded-[40px] items-center justify-center mb-6 border border-white/5">
                                    <MaterialCommunityIcons name="account-group-outline" size={48} color={theme.textSecondary} />
                                </View>
                                <Text style={{ color: theme.text, fontSize: 18 * fontScale }} className="font-black text-center mb-2">¡Aún no tienes grupos!</Text>
                                <Text style={{ color: theme.textSecondary, fontSize: 12 * fontScale }} className="text-center px-10 font-bold leading-5">
                                    Crea un grupo para empezar a dividir gastos con tus amigos de forma inteligente.
                                </Text>
                            </View>
                        )
                    ) : (
                        closedGroups.length > 0 ? (
                            closedGroups.map((group) => (
                                <TouchableOpacity 
                                    key={group.id}
                                    onPress={() => router.push({ pathname: '/detalle-grupo', params: { id: group.id } })}
                                    activeOpacity={0.85}
                                    style={{ backgroundColor: theme.cardSecondary, borderColor: theme.border, opacity: 0.8 }}
                                    className="border rounded-[36px] p-6 flex-row items-center"
                                >
                                    <View style={{ backgroundColor: theme.glassBg }} className="w-16 h-16 rounded-[24px] items-center justify-center mr-5 border border-white/5">
                                        <MaterialIcons name="history" size={32} color={theme.textSecondary} />
                                    </View>
                                    <View className="flex-1">
                                        <Text style={{ color: theme.text, fontSize: 18 * fontScale }} className="font-black tracking-tight">{group.nombre || 'Grupo sin nombre'}</Text>
                                        <View className="flex-row items-center gap-2 mt-1">
                                            <Text style={{ color: theme.textSecondary, fontSize: 10 * fontScale }} className="font-medium">Finalizado: {new Date(group.fecha_cierre || group.updatedAt || group.fecha_creacion).toLocaleDateString()}</Text>
                                        </View>
                                    </View>
                                    <View className="items-end">
                                        <Text style={{ 
                                            color: theme.textSecondary,
                                            fontSize: 16 * fontScale
                                        }} className="font-black">
                                            ${(group.total_gastado || 0).toFixed(2)}
                                        </Text>
                                        <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }} className="px-2 py-0.5 rounded-lg mt-1.5 border border-white/5">
                                            <Text style={{ fontSize: 8 * fontScale, color: '#10b981' }} className="font-black uppercase">Cerrado</Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <View className="items-center justify-center py-20">
                                <View style={{ backgroundColor: theme.glassBg }} className="w-24 h-24 rounded-[40px] items-center justify-center mb-6 border border-white/5">
                                    <MaterialIcons name="history" size={48} color={theme.textSecondary} />
                                </View>
                                <Text style={{ color: theme.text, fontSize: 18 * fontScale }} className="font-black text-center mb-2">Historial vacío</Text>
                                <Text style={{ color: theme.textSecondary, fontSize: 12 * fontScale }} className="text-center px-10 font-bold leading-5">
                                    Aquí aparecerán los grupos que hayas finalizado y saldado completamente.
                                </Text>
                            </View>
                        )
                    )}
                </View>

                {/* Suggested Action Bar (Only if groups exist) */}
                {groups.length > 0 && (
                    <View 
                        style={{ backgroundColor: theme.cardSecondary, borderColor: theme.border }}
                        className="mt-12 rounded-[40px] border p-8 items-center overflow-hidden"
                    >
                        <View style={{ backgroundColor: theme.primary + '10' }} className="absolute -top-10 -right-10 w-32 h-32 rounded-full" />
                        <Ionicons name="rocket-outline" size={32} color={theme.primary} />
                        <Text style={{ color: theme.text, fontSize: 15 * fontScale }} className="font-black text-center mt-4">¿Dividir un gasto rápido?</Text>
                        <Text style={{ color: theme.textSecondary, fontSize: 11 * fontScale }} className="text-center mt-2 px-4 leading-5 font-bold">Usa el botón QR o crea un grupo temporal para cobrar al instante.</Text>
                        <TouchableOpacity 
                            style={{ backgroundColor: theme.glassBg, borderColor: theme.border }}
                            className="mt-6 px-8 py-3 rounded-full border"
                        >
                            <Text style={{ color: theme.text, fontSize: 10 * fontScale }} className="font-black uppercase tracking-widest">Saber Más</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

        </SafeAreaView>
    );
}
