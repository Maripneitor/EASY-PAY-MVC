import { useEasyPay } from '../../context/EasyPayContext';
import React from 'react';
import { View, Text, ScrollView, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { useTheme } from '../../src/infrastructure/context/ThemeContext';

import { useProfileStats } from '../../src/infrastructure/hooks/useProfileStats';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function StatsScreen() {
    const { theme, fontScale } = useTheme();
    const { user  } = useEasyPay();
    const { stats, isLoading } = useProfileStats(user?.id);
    const router = useRouter();

    const chartConfig = {
        backgroundGradientFrom: theme.cardSecondary,
        backgroundGradientTo: theme.cardSecondary,
        color: (opacity = 1) => theme.primary,
        labelColor: (opacity = 1) => theme.textSecondary,
        strokeWidth: 2,
        barPercentage: 0.5,
        useShadowColorFromDataset: false,
    };

    if (isLoading) {
        return (
            <View style={{ flex: 1, backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    const pieData = stats?.categories.map(cat => ({
        name: cat.name,
        amount: cat.amount,
        color: cat.color,
        legendFontColor: theme.textSecondary,
        legendFontSize: 12
    })) || [];

    const barData = {
        labels: stats?.monthly_activity.map(m => m.month) || [],
        datasets: [
            {
                data: stats?.monthly_activity.map(m => m.amount) || []
            }
        ]
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
            <Stack.Screen options={{ title: 'Historial', headerShown: false }} />

            <View style={{ height: 80, borderBottomColor: theme.border }} className="px-6 flex-row items-center justify-between border-b">
                <TouchableOpacity onPress={() => router.back()} className="flex-row items-center gap-2">
                    <MaterialIcons name="arrow-back" size={20} color={theme.textSecondary} />
                    <Text style={{ color: theme.textSecondary }} className="font-bold">Volver</Text>
                </TouchableOpacity>
                <Text style={{ fontSize: 16 * fontScale, color: theme.text }} className="font-black uppercase tracking-widest">Análisis</Text>
                <View className="w-10" />
            </View>

            <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                {/* BENTO GRID START */}
                <View className="flex-row gap-4 mb-6">
                    {/* Main Total Card (Large) */}
                    <View style={{ backgroundColor: theme.cardSecondary + '80', borderColor: theme.border + '20' }} className="flex-1 p-6 rounded-[40px] border shadow-2xl backdrop-blur-xl">
                        <View className="flex-row items-center gap-3 mb-4">
                            <View style={{ backgroundColor: theme.primary }} className="w-10 h-10 rounded-2xl items-center justify-center">
                                <MaterialIcons name="account-balance-wallet" size={20} color="white" />
                            </View>
                            <Text style={{ color: theme.textSecondary }} className="text-[10px] font-black uppercase tracking-[2px]">Total Gastado</Text>
                        </View>
                        <Text style={{ color: theme.text, fontSize: 36 * fontScale }} className="font-black tracking-tighter">
                            ${Number(stats?.total_spent || 0).toFixed(2)}
                        </Text>
                        <Text style={{ color: theme.primary }} className="text-[10px] font-bold mt-1">Sincronizado hoy</Text>
                    </View>
                </View>

                <View className="flex-row gap-4 mb-6">
                    {/* Categories Card (Wide) */}
                    <View style={{ backgroundColor: theme.cardSecondary + '80', borderColor: theme.border + '20' }} className="w-full p-6 rounded-[40px] border shadow-2xl backdrop-blur-xl">
                        <Text style={{ fontSize: 10 * fontScale, color: theme.textSecondary }} className="font-black uppercase tracking-[3px] mb-6">Distribución por Categoría</Text>
                        <View className="items-center">
                            <PieChart
                                data={pieData}
                                width={SCREEN_WIDTH - 100}
                                height={200}
                                chartConfig={{...chartConfig, backgroundGradientFrom: 'transparent', backgroundGradientTo: 'transparent'}}
                                accessor={"amount"}
                                backgroundColor={"transparent"}
                                paddingLeft={"15"}
                                center={[10, 0]}
                                absolute
                            />
                        </View>
                    </View>
                </View>

                <View className="flex-row gap-4 mb-6">
                    {/* Activity Card (Wide) */}
                    <View style={{ backgroundColor: theme.cardSecondary + '80', borderColor: theme.border + '20' }} className="w-full p-6 rounded-[40px] border shadow-2xl backdrop-blur-xl">
                        <Text style={{ fontSize: 10 * fontScale, color: theme.textSecondary }} className="font-black uppercase tracking-[3px] mb-6">Actividad Mensual</Text>
                        <View className="items-center">
                            <BarChart
                                data={barData}
                                width={SCREEN_WIDTH - 100}
                                height={220}
                                yAxisLabel="$"
                                chartConfig={{...chartConfig, backgroundGradientFrom: 'transparent', backgroundGradientTo: 'transparent'}}
                                verticalLabelRotation={0}
                                fromZero
                                style={{
                                    marginVertical: 8,
                                    borderRadius: 16
                                }}
                            />
                        </View>
                    </View>
                </View>

                {/* Insights Bento Card */}
                <View style={{ backgroundColor: theme.primary + '15', borderColor: theme.primary + '30' }} className="p-8 rounded-[40px] border flex-row items-center justify-between">
                    <View className="flex-1">
                        <Text style={{ color: theme.text }} className="text-lg font-black">Tu Insight</Text>
                        <Text style={{ color: theme.textSecondary }} className="text-xs font-medium mt-1">Has ahorrado un 12% comparado con el mes anterior usando Easy-Pay.</Text>
                    </View>
                    <View style={{ backgroundColor: theme.primary }} className="w-14 h-14 rounded-full items-center justify-center shadow-lg shadow-blue-500/30">
                        <MaterialIcons name="trending-up" size={28} color="white" />
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
