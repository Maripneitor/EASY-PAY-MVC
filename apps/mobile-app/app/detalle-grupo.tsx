import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, Alert, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { MotiView } from 'moti';

import { useTheme } from '../src/infrastructure/context/ThemeContext';
import { useEasyPay } from '../context/EasyPayContext';
import { SyncStatus } from '../src/components/SyncStatus';
import { groupRepository } from '../src/infrastructure/api/repositories/GroupRepository';
import { VirtualTicketCard } from '../components/group/VirtualTicketCard';
import { AddExpenseModal } from '../components/group/AddExpenseModal';
import { TotalsSummary } from '../components/group/TotalsSummary';

const { width } = Dimensions.get('window');

export default function GroupDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { theme, fontScale } = useTheme();
    
    const { 
        user, 
        activeGrupo, 
        isLoading, 
        loadGroupDetails, 
        closeGrupo,
        assignItem,
        updateItem,
        calculateUserDebt
    } = useEasyPay();

    const [activeTab, setActiveTab] = useState<'members' | 'items' | 'totals'>('items');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        if (id) {
            loadGroupDetails(id as string);
        }
    }, [id]);

    const onRefresh = useCallback(async () => {
        if (id) {
            setIsRefreshing(true);
            await loadGroupDetails(id as string);
            setIsRefreshing(false);
        }
    }, [id]);

    const handleRemoveMember = async (memberId: string, memberName: string) => {
        Alert.alert(
            "Eliminar Miembro",
            `¿Estás seguro de que deseas eliminar a ${memberName} del grupo?`,
            [
                { text: "Cancelar", style: "cancel" },
                { 
                    text: "Eliminar", 
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await groupRepository.removeMember(id as string, memberId);
                            Alert.alert("Éxito", "Miembro eliminado correctamente");
                            loadGroupDetails(id as string);
                        } catch (err: any) {
                            Alert.alert("Error", err.response?.data?.detail || "No se pudo eliminar al miembro. Verifica si tiene gastos asignados.");
                        }
                    }
                }
            ]
        );
    };

    const handleCloseGroup = () => {
        if (!activeGrupo) return;
        
        Alert.alert(
            "Cerrar Grupo",
            "¿Estás seguro de que deseas cerrar el grupo y dividir los gastos?",
            [
                { text: "Cancelar", style: "cancel" },
                { 
                    text: "Cerrar", 
                    onPress: async () => {
                        try {
                            await closeGrupo(activeGrupo.propina || 0, activeGrupo.total || 0);
                            Alert.alert("Éxito", "Grupo cerrado. Ahora los miembros pueden pagar.");
                            loadGroupDetails(activeGrupo.id);
                        } catch (err) {
                            Alert.alert("Error", "No se pudo cerrar el grupo.");
                        }
                    }
                }
            ]
        );
    };

    if (isLoading || !activeGrupo) {
        return (
            <View style={{ flex: 1, backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    const isLeader = activeGrupo.liderId === user?.id || activeGrupo.admin_id === user?.id;
    const isSettling = activeGrupo.status === 'settling';
    const isClosed = activeGrupo.status === 'closed' || activeGrupo.status === 'liquidated';

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
            <StatusBar style={theme.isDark ? "light" : "dark"} />
            
            {/* <SyncStatus /> */}

            {/* Header */}
            <View className="px-6 py-4 flex-row items-center justify-between">
                <TouchableOpacity 
                    onPress={() => router.replace('/(tabs)/groups')} 
                    className="w-10 h-10 rounded-xl items-center justify-center bg-slate-800/40"
                >
                    <MaterialIcons name="arrow-back-ios" size={20} color={theme.text} style={{ marginLeft: 6 }} />
                </TouchableOpacity>
                <View className="items-center flex-1 mx-4">
                    <Text style={{ color: theme.text, fontSize: 18 * fontScale }} className="font-black" numberOfLines={1}>
                        {activeGrupo.nombre}
                    </Text>
                    <View className="flex-row items-center gap-1 opacity-60">
                        <View className={`w-1.5 h-1.5 rounded-full ${isSettling ? 'bg-amber-500' : isClosed ? 'bg-red-500' : 'bg-emerald-500'}`} />
                        <Text style={{ color: theme.textSecondary, fontSize: 10 }} className="font-bold uppercase tracking-widest">
                            {isSettling ? 'En Liquidación' : isClosed ? 'Cerrado' : 'Activo'}
                        </Text>
                    </View>
                </View>
                <View className="bg-blue-500/10 px-3 py-2 rounded-xl">
                    <Text style={{ color: theme.primary }} className="text-[10px] font-black tracking-widest">
                        #{activeGrupo.codigo || activeGrupo.codigo_invitacion}
                    </Text>
                </View>
            </View>

            {/* Selector de Pestañas */}
            <View className="px-6 py-4">
                <View className="flex-row bg-slate-900/50 p-1 rounded-2xl border border-white/5">
                    {(['members', 'items', 'totals'] as const).map(tab => (
                        <TouchableOpacity 
                            key={tab}
                            onPress={() => setActiveTab(tab)}
                            className={`flex-1 py-3 items-center rounded-xl relative`}
                        >
                            {activeTab === tab && (
                                <MotiView 
                                    from={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ type: 'timing', duration: 200 }}
                                    className="absolute inset-0 bg-slate-800 rounded-xl shadow-sm border border-white/10"
                                />
                            )}
                            <Text style={{ 
                                color: activeTab === tab ? theme.text : theme.textSecondary, 
                                fontSize: 10 * fontScale 
                            }} className="font-black uppercase tracking-widest z-10">
                                {tab === 'members' ? 'Miembros' : tab === 'items' ? 'Ítems' : 'Totales'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Cuerpo Principal */}
            <ScrollView 
                className="px-6" 
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
            >
                {activeTab === 'items' && (
                    <View className="pb-40">
                        {activeGrupo.items?.length > 0 ? (
                            <VirtualTicketCard 
                                items={activeGrupo.items}
                                serviceFee={activeGrupo.service || activeGrupo.propina || 0}
                                groupId={activeGrupo.id}
                                members={activeGrupo.participantes}
                                canEdit={isLeader && !isClosed}
                                onAssign={assignItem}
                                onEdit={updateItem}
                            />
                        ) : (
                            <View className="items-center py-20 opacity-40">
                                <FontAwesome5 name="receipt" size={60} color={theme.textSecondary} />
                                <Text style={{ color: theme.textSecondary }} className="mt-4 font-black">No hay ítems aún</Text>
                                {isLeader && (
                                    <TouchableOpacity 
                                        onPress={() => setShowAddModal(true)}
                                        className="mt-6 bg-blue-500/10 px-6 py-3 rounded-2xl border border-blue-500/20"
                                    >
                                        <Text style={{ color: theme.primary }} className="font-black uppercase tracking-widest text-xs">Agregar primer ítem</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                    </View>
                )}

                {activeTab === 'members' && (
                    <View className="gap-4 pb-40">
                        {activeGrupo.participantes?.map((member: any) => (
                            <View 
                                key={member.id} 
                                style={{ backgroundColor: theme.cardSecondary }} 
                                className="p-5 rounded-[32px] border border-white/5 flex-row items-center gap-4"
                            >
                                <View 
                                    style={{ backgroundColor: member.color || theme.primary }} 
                                    className="w-12 h-12 rounded-2xl items-center justify-center shadow-sm shadow-black/20"
                                >
                                    <Text className="text-white font-black text-lg">
                                        {(member.nombre || 'U').charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                                <View className="flex-1">
                                    <Text style={{ color: theme.text }} className="text-base font-black">
                                        {member.nombre || 'Usuario'}
                                    </Text>
                                    <View className="flex-row items-center gap-2">
                                        <Text style={{ color: theme.textSecondary }} className="text-[10px] font-bold opacity-60 uppercase tracking-wider">
                                            {member.role === 'leader' || member.id === activeGrupo.admin_id ? 'Líder del grupo' : 'Participante'}
                                        </Text>
                                        <View className="w-1 h-1 rounded-full bg-slate-600" />
                                        <Text style={{ color: theme.primary }} className="text-[11px] font-black font-mono">
                                            Debe ${(member.debt || 0).toFixed(2)}
                                        </Text>
                                    </View>
                                </View>
                                {isLeader && member.id !== user?.id && !isClosed && (
                                    <TouchableOpacity 
                                        onPress={() => handleRemoveMember(member.id, member.nombre)}
                                        className="p-3 bg-red-500/10 rounded-2xl"
                                    >
                                        <MaterialIcons name="person-remove" size={18} color="#ef4444" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))}
                    </View>
                )}

                {activeTab === 'totals' && (
                    <View className="gap-6 pb-40">
                        <TotalsSummary 
                            subtotal={activeGrupo.subtotal || 0}
                            tax={activeGrupo.tax || 0}
                            service={activeGrupo.service || activeGrupo.propina || 0}
                            tip={activeGrupo.propina || 0}
                            total={activeGrupo.total || 0}
                            paidAmount={0}
                            pendingAmount={activeGrupo.total || 0}
                            items={activeGrupo.items || []}
                            members={activeGrupo.participantes || []}
                        />
                        
                        {isLeader && !isClosed && (
                            <View className="bg-blue-500/10 p-6 rounded-[32px] border border-blue-500/20">
                                <View className="flex-row items-center gap-3 mb-2">
                                    <MaterialIcons name="info" size={20} color={theme.primary} />
                                    <Text style={{ color: theme.primary }} className="font-black text-xs uppercase tracking-widest">Zona del Administrador</Text>
                                </View>
                                <Text style={{ color: theme.textSecondary }} className="text-xs font-medium leading-5">
                                    Como líder, puedes cerrar el grupo para que todos reciban su cuenta final y métodos de pago. Una vez cerrado, no se podrán agregar más ítems.
                                </Text>
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>

            {/* Acciones Flotantes */}
            <View className="absolute bottom-10 left-6 right-6 flex-row gap-3">
                {isLeader && !isClosed && !isSettling && (
                    <TouchableOpacity 
                        onPress={() => setShowAddModal(true)}
                        style={{ backgroundColor: theme.cardSecondary }}
                        className="w-16 h-16 rounded-[24px] items-center justify-center border border-white/10 shadow-lg"
                    >
                        <Ionicons name="add" size={30} color={theme.primary} />
                    </TouchableOpacity>
                )}
                
                {isLeader && !isClosed && !isSettling && (
                    <TouchableOpacity 
                        onPress={handleCloseGroup} 
                        activeOpacity={0.8}
                        style={{ backgroundColor: theme.primary, shadowColor: theme.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 }} 
                        className="flex-1 py-6 rounded-[24px] items-center justify-center flex-row gap-3"
                    >
                        <MaterialIcons name="lock" size={20} color="black" />
                        <Text className="text-black font-black uppercase tracking-widest text-sm">Cerrar y Dividir</Text>
                    </TouchableOpacity>
                )}

                {!isLeader && isSettling && (
                    <TouchableOpacity 
                        onPress={() => router.push({ pathname: '/settle-up', params: { groupId: activeGrupo.id } })} 
                        activeOpacity={0.8}
                        style={{ backgroundColor: theme.primary, shadowColor: theme.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 }} 
                        className="flex-1 py-6 rounded-[24px] items-center justify-center flex-row gap-3"
                    >
                        <MaterialIcons name="payments" size={20} color="black" />
                        <Text className="text-black font-black uppercase tracking-widest text-sm">
                            Liquidar Mi Parte (${(calculateUserDebt(user?.id || '') || 0).toFixed(2)})
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Modales */}
            <AddExpenseModal 
                isVisible={showAddModal}
                onClose={() => setShowAddModal(false)}
                members={activeGrupo.participantes}
                groupId={activeGrupo.id}
                onSuccess={() => loadGroupDetails(activeGrupo.id)}
            />
        </SafeAreaView>
    );
}
