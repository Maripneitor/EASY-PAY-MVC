import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Share, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons, Feather } from '@expo/vector-icons';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function HistoryDetailScreen() {
    const { id } = useLocalSearchParams();
    
    const tx = {
        title: 'Pago a Ana',
        amount: -320.00,
        date: 'Hoy, 12:30 PM',
        group: 'Comida Grupal',
        status: 'Completado',
        method: 'Visa ****4242',
        type: 'user',
        ref: 'TRX-948201-EP',
        category: 'Alimentos y Bebidas'
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Detalle del pago en EasyPay: ${tx.title} por $${Math.abs(tx.amount).toFixed(2)}. REF: ${tx.ref}`,
            });
        } catch (error) {
            Alert.alert(error.message);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-[#0d1425]" edges={['top']}>
            <StatusBar style="light" />
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View className="px-6 py-4 flex-row items-center justify-between">
                <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-white/5 rounded-full items-center justify-center border border-white/10">
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text className="text-white text-xl font-black">Detalle de Pago</Text>
                <TouchableOpacity 
                    onPress={handleShare}
                    className="w-10 h-10 bg-white/5 rounded-full items-center justify-center border border-white/10"
                >
                    <Feather name="share" size={20} color="white" />
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
                <View className="items-center py-12">
                    <View className="w-20 h-20 bg-emerald-500/10 rounded-[32px] items-center justify-center mb-6">
                        <MaterialIcons name="check-circle" size={40} color="#10b981" />
                    </View>
                    <Text className={`text-5xl font-black ${tx.amount > 0 ? 'text-emerald-400' : 'text-slate-100'}`}>
                        ${Math.abs(tx.amount).toFixed(2)}
                    </Text>
                    <Text className="text-slate-500 text-sm font-bold mt-2">Operación Exitosa • {tx.date}</Text>
                </View>

                <View className="gap-4 pb-20">
                    {/* Main transaction details */}
                    <View className="bg-white/5 border border-white/10 rounded-[32px] p-8">
                        <View className="gap-6">
                            <View>
                                <Text className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1.5">Concepto</Text>
                                <Text className="text-white font-black text-lg">{tx.title}</Text>
                                <Text className="text-slate-400 text-xs mt-0.5">{tx.category} • {tx.group}</Text>
                            </View>

                            <View className="flex-row justify-between">
                                <View>
                                    <Text className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1.5">Método usado</Text>
                                    <View className="flex-row items-center gap-2">
                                        <FontAwesome5 name="cc-visa" size={14} color="white" />
                                        <Text className="text-white font-bold">{tx.method}</Text>
                                    </View>
                                </View>
                                <View className="items-end">
                                    <Text className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1.5">Estado</Text>
                                    <View className="bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                                        <Text className="text-emerald-500 text-[9px] font-black uppercase">{tx.status}</Text>
                                    </View>
                                </View>
                            </View>

                            <View className="border-t border-white/5 pt-6">
                                <Text className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1.5">Referencia</Text>
                                <Text className="text-slate-400 font-mono text-xs">{tx.ref}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Quick shortcuts from history detail */}
                    <View className="gap-3 mt-4">
                        <TouchableOpacity className="bg-white/5 border border-white/10 p-5 rounded-3xl flex-row items-center justify-between">
                            <View className="flex-row items-center gap-4">
                                <MaterialIcons name="receipt" size={22} color="#94a3b8" />
                                <Text className="text-white font-bold">Ver comprobante PDF</Text>
                            </View>
                            <MaterialIcons name="file-download" size={20} color="#334155" />
                        </TouchableOpacity>

                        <TouchableOpacity className="bg-white/5 border border-white/10 p-5 rounded-3xl flex-row items-center justify-between">
                            <View className="flex-row items-center gap-4">
                                <MaterialIcons name="report-problem" size={22} color="#94a3b8" />
                                <Text className="text-white font-bold">Reportar un problema</Text>
                            </View>
                            <MaterialIcons name="chevron-right" size={20} color="#334155" />
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

import { FontAwesome5 } from '@expo/vector-icons';
