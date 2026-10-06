import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { useTheme } from '../../../src/infrastructure/context/ThemeContext';
import { useEasyPay } from '../../../context/EasyPayContext';
import { SyncStatus } from '../../../src/components/SyncStatus';
import { groupRepository } from '../../../src/infrastructure/api/repositories/GroupRepository';

const { width } = Dimensions.get('window');

export default function GroupDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { theme, fontScale } = useTheme();
    
    // Adaptamos el uso de contextos al proyecto actual (EasyPayContext)
    const { 
        user, 
        activeGrupo, 
        isLoading, 
        loadGroupDetails, 
        closeGrupo 
    } = useEasyPay();

    const [activeTab, setActiveTab] = useState<'members' | 'items' | 'totals'>('items');

    useEffect(() => {
        if (id) {
            loadGroupDetails(id as string);
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
                            // Usamos los totales actuales del grupo
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

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
            <StatusBar style={theme.isDark ? "light" : "dark"} />
            
            <SyncStatus />

            {/* Cabecera unificada */}
            <View className="px-6 py-4 flex-row items-center justify-between">
                <TouchableOpacity 
                    onPress={() => router.back()} 
                    className="w-10 h-10 rounded-xl items-center justify-center bg-slate-800/40"
                >
                    <MaterialIcons name="arrow-back-ios" size={20} color={theme.text} style={{ marginLeft: 6 }} />
                </TouchableOpacity>
                <View className="items-center">
                    <Text style={{ color: theme.text, fontSize: 18 * fontScale }} className="font-black">
                        {activeGrupo.nombre}
                    </Text>
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
                            className={`flex-1 py-3 items-center rounded-xl ${activeTab === tab ? 'bg-slate-800 shadow-sm' : ''}`}
                        >
                            <Text style={{ 
                                color: activeTab === tab ? theme.text : theme.textSecondary, 
                                fontSize: 10 * fontScale 
                            }} className="font-black uppercase tracking-widest">
                                {tab === 'members' ? 'Miembros' : tab === 'items' ? 'Ítems' : 'Totales'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Cuerpo Principal */}
            <ScrollView className="px-6" showsVerticalScrollIndicator={false}>
                {activeTab === 'items' && (
                    <View className="gap-4 pb-40">
                        {activeGrupo.items?.length > 0 ? (
                            activeGrupo.items.map((item: any) => (
                                <View 
                                    key={item.id} 
                                    style={{ backgroundColor: theme.cardSecondary }} 
                                    className="p-5 rounded-[40px] border border-white/10 flex-row items-center justify-between"
                                >
                                    <View className="flex-1">
                                        <Text style={{ color: theme.text }} className="text-lg font-black">{item.nombre}</Text>
                                        <Text style={{ color: theme.textSecondary }} className="text-xs font-bold opacity-60">
                                            {item.cantidad} x ${item.precio}
                                        </Text>
                                    </View>
                                    <View className="items-end">
                                        <Text style={{ color: theme.primary }} className="font-black text-lg">
                                            ${(item.precio * item.cantidad).toFixed(2)}
                                        </Text>
                                        {isLeader && (
                                            <TouchableOpacity className="mt-1">
                                                <MaterialIcons name="more-vert" size={20} color={theme.textSecondary} />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            ))
                        ) : (
                            <View className="items-center py-20 opacity-40">
                                <FontAwesome5 name="receipt" size={60} color={theme.textSecondary} />
                                <Text style={{ color: theme.textSecondary }} className="mt-4 font-black">No hay ítems aún</Text>
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
                                className="p-5 rounded-[40px] border border-white/10 flex-row items-center gap-4"
                            >
                                <View 
                                    style={{ backgroundColor: member.color || theme.primary }} 
                                    className="w-12 h-12 rounded-2xl items-center justify-center"
                                >
                                    <Text className="text-white font-black text-lg">
                                        {(member.nombre || 'U').charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                                <View className="flex-1">
                                    <Text style={{ color: theme.text }} className="text-base font-black">
                                        {member.nombre || 'Usuario'}
                                    </Text>
                                    <Text style={{ color: theme.textSecondary }} className="text-xs font-bold opacity-60 uppercase">
                                        {member.role === 'leader' ? 'Líder del grupo' : 'Participante'}
                                    </Text>
                                </View>
                                {member.status === 'online' && (
                                    <View className="w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900" />
                                )}
                                {isLeader && member.id !== user?.id && (
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
                        <View style={{ backgroundColor: theme.cardSecondary }} className="p-8 rounded-[50px] border border-white/10">
                            <View className="flex-row justify-between mb-4">
                                <Text style={{ color: theme.textSecondary }} className="font-bold">Subtotal</Text>
                                <Text style={{ color: theme.text }} className="font-black">${(activeGrupo.subtotal || 0).toFixed(2)}</Text>
                            </View>
                            <View className="flex-row justify-between mb-6">
                                <Text style={{ color: theme.textSecondary }} className="font-bold">Propina sugerida</Text>
                                <Text style={{ color: theme.text }} className="font-black">${(activeGrupo.propina || 0).toFixed(2)}</Text>
                            </View>
                            <View className="h-[1px] bg-white/5 w-full mb-6" />
                            <View className="flex-row justify-between items-center">
                                <Text style={{ color: theme.text }} className="text-xl font-black">Total</Text>
                                <Text style={{ color: theme.primary }} className="text-3xl font-black">${(activeGrupo.total || 0).toFixed(2)}</Text>
                            </View>
                        </View>
                        
                        {isLeader && (
                            <View className="bg-blue-500/10 p-6 rounded-[32px] border border-blue-500/20">
                                <View className="flex-row items-center gap-3 mb-2">
                                    <MaterialIcons name="info" size={20} color={theme.primary} />
                                    <Text style={{ color: theme.primary }} className="font-black text-xs uppercase tracking-widest">Zona del Administrador</Text>
                                </View>
                                <Text style={{ color: theme.textSecondary }} className="text-xs font-medium leading-4">
                                    Como líder, puedes cerrar el grupo para que todos reciban su cuenta final y métodos de pago.
                                </Text>
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>

            {/* Botón de acción final (Solo para líderes) */}
            {isLeader && activeGrupo.status !== 'CERRADA' && activeGrupo.status !== 'closed' && activeGrupo.status !== 'liquidated' && (
                <View className="absolute bottom-10 left-6 right-6">
                    <TouchableOpacity 
                        onPress={handleCloseGroup} 
                        activeOpacity={0.8}
                        style={{ backgroundColor: theme.primary, shadowColor: theme.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 }} 
                        className="w-full py-6 rounded-[32px] items-center justify-center flex-row gap-3"
                    >
                        <MaterialIcons name="lock" size={20} color="black" />
                        <Text className="text-black font-black uppercase tracking-widest text-base">Cerrar y Dividir</Text>
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
}
