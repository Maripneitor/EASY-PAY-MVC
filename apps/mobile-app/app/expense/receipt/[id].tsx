import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, Image } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MotiView } from 'moti';
import { useTheme } from '@/src/infrastructure/context/ThemeContext';
import { useEasyPay } from '../../../context/EasyPayContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ReceiptDetailScreen() {
    const { id, groupId } = useLocalSearchParams<{ id: string, groupId: string }>();
    const { theme, fontScale } = useTheme();
    const { activeGrupo } = useEasyPay();
    const router = useRouter();

    const item = activeGrupo?.items?.find(i => i.id === id);

    if (!item) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} className="items-center justify-center">
                <Text style={{ color: theme.text }}>No se encontró el ítem.</Text>
                <TouchableOpacity onPress={() => router.back()} className="mt-4">
                    <Text style={{ color: theme.primary }}>Regresar</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const participantsCount = item.asignadoA?.length || 0;
    const share = participantsCount > 0 ? (item.precio * item.cantidad) / participantsCount : 0;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
            <StatusBar style={theme.isDark ? "light" : "dark"} />
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View className="px-6 py-4 flex-row items-center justify-between">
                <TouchableOpacity onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={{ color: theme.text, fontSize: 14 * fontScale }} className="font-black uppercase tracking-widest">Detalle de Gasto</Text>
                <TouchableOpacity>
                    <MaterialIcons name="share" size={24} color={theme.textSecondary} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20 }}>
                {/* Receipt Card */}
                <MotiView 
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    style={{ backgroundColor: theme.card, borderColor: theme.border }}
                    className="rounded-[40px] border p-8 items-center relative overflow-hidden"
                >
                    <View className="absolute top-0 left-0 right-0 h-2 bg-emerald-500" />
                    
                    <View style={{ backgroundColor: theme.glassBg }} className="w-20 h-20 rounded-[24px] items-center justify-center mb-6">
                        <MaterialIcons name="receipt" size={40} color={theme.primary} />
                    </View>

                    <Text style={{ color: theme.text, fontSize: 24 * fontScale }} className="font-black text-center mb-2">{item.nombre}</Text>
                    <Text style={{ color: theme.textSecondary, fontSize: 12 * fontScale }} className="font-black uppercase tracking-widest mb-6">{activeGrupo?.nombre}</Text>
                    
                    <View className="w-full border-t border-dashed border-white/10 my-6" />
                    
                    <View className="w-full gap-4">
                        <View className="flex-row justify-between">
                            <Text style={{ color: theme.textSecondary }} className="font-bold">Fecha y Hora</Text>
                            <Text style={{ color: theme.text }} className="font-black text-right">
                                {new Date().toLocaleDateString('es-MX')}
                            </Text>
                        </View>
                        <View className="flex-row justify-between">
                            <Text style={{ color: theme.textSecondary }} className="font-bold">Estado</Text>
                            <View className="bg-emerald-500/10 px-3 py-1 rounded-lg">
                                <Text className="text-emerald-500 text-[10px] font-black uppercase">Completado</Text>
                            </View>
                        </View>
                        <View className="flex-row justify-between">
                            <Text style={{ color: theme.textSecondary }} className="font-bold">Origen</Text>
                            <Text style={{ color: theme.text }} className="font-black text-right">Saldo Easy-Pay</Text>
                        </View>
                        <View className="flex-row justify-between">
                            <Text style={{ color: theme.textSecondary }} className="font-bold">Destino</Text>
                            <Text style={{ color: theme.text }} className="font-black text-right">Grupo: {activeGrupo?.nombre}</Text>
                        </View>
                    </View>

                    <View className="w-full mt-8">
                        <Text style={{ color: theme.textSecondary, fontSize: 10 * fontScale }} className="font-black uppercase tracking-[3px] mb-6">División del Gasto</Text>
                        <View className="bg-black/5 rounded-3xl p-4 gap-3">
                            {(item.asignadoA || []).map((pId: string, idx: number) => {
                                const member = activeGrupo?.participantes?.find((m: any) => (m.id || m.usuario_id) === pId);
                                return (
                                    <View key={idx} className="flex-row justify-between items-center">
                                        <View className="flex-row items-center gap-3">
                                            <View style={{ backgroundColor: member?.color || theme.primary }} className="w-6 h-6 rounded-lg items-center justify-center">
                                                <Text className="text-white font-black text-[10px]">{member?.nombre?.charAt(0).toUpperCase() || '?'}</Text>
                                            </View>
                                            <Text style={{ color: theme.text }} className="font-bold text-xs uppercase">{member?.nombre || `Usuario ${idx+1}`}</Text>
                                        </View>
                                        <Text style={{ color: theme.text }} className="font-black text-xs">${share.toFixed(2)}</Text>
                                    </View>
                                );
                            })}
                        </View>
                        <View className="flex-row justify-between items-center bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10 mt-2">
                            <Text className="text-emerald-500 font-black text-[10px] uppercase tracking-widest">Total a repartir</Text>
                            <Text className="text-emerald-500 font-black text-lg">${((item.precio || 0) * (item.cantidad || 1)).toFixed(2)}</Text>
                        </View>
                    </View>
                    
                    <View className="w-full border-t border-dashed border-white/10 my-6" />
                    
                    <View className="w-full items-center">
                        <Text style={{ color: theme.textSecondary, fontSize: 10 * fontScale }} className="font-black uppercase tracking-widest mb-4">N.° de operación</Text>
                        <Text style={{ color: theme.text, fontSize: 14 * fontScale }} className="font-mono font-black mb-4 uppercase">{item.id.substring(0, 12)}</Text>
                        <View style={{ backgroundColor: theme.glassBg }} className="p-4 rounded-3xl">
                            <Ionicons name="qr-code-outline" size={100} color={theme.text} />
                        </View>
                    </View>
                </MotiView>

                <TouchableOpacity 
                    className="mt-10 mb-20 py-5 rounded-[24px] items-center"
                    style={{ backgroundColor: theme.glassBg, borderColor: theme.border, borderWidth: 1 }}
                >
                    <Text style={{ color: theme.text, fontSize: 12 * fontScale }} className="font-black uppercase tracking-widest">Descargar Comprobante</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}
