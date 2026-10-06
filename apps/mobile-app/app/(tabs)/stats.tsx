import { useEasyPay, PaymentMethod } from '../../context/EasyPayContext';
import React, { useEffect, useState } from 'react';
import { PieChart } from 'react-native-chart-kit';
import { 
    View, 
    Text, 
    ScrollView, 
    TouchableOpacity, 
    Dimensions,
    ActivityIndicator,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../../src/infrastructure/context/ThemeContext';

import { getApiBaseUrl } from '../../src/infrastructure/api/network.config';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const METHOD_META: Record<PaymentMethod, { label: string; icon: string; color: string }> = {
    cash:     { label: 'Efectivo',      icon: 'payments',      color: '#4ade80' },
    card:     { label: 'Tarjeta',       icon: 'credit-card',   color: '#60a5fa' },
    transfer: { label: 'Transferencia', icon: 'swap-horiz',    color: '#a78bfa' },
};

const STATUS_META = {
    pending:              { label: 'Pendiente',   color: '#f59e0b' },
    waiting_confirmation: { label: 'Confirmando', color: '#60a5fa' },
    confirmed:            { label: 'Confirmado',  color: '#4ade80' },
    rejected:             { label: 'Rechazado',   color: '#ef4444' },
};

export default function StatsScreen() {
    const { theme, fontScale } = useTheme();
    const { user  } = useEasyPay();
    const { payments  } = useEasyPay();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadStats = async () => {
            if (!user?.id) return;
            try {
                const response = await fetch(`${getApiBaseUrl()}/stats/user/${user.id}`);
                const data = await response.json();
                setStats(data);
            } catch (error) {
                console.error("Error loading stats:", error);
                setStats(null);
            } finally {
                setLoading(false);
            }
        };
        loadStats();
    }, [user?.id]);

    const handleExportPDF = () => {
        Alert.alert("Reporte PDF", "Generando reporte mensual de gastos... Esta función estará disponible en la próxima actualización móvil.");
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center" style={{ backgroundColor: theme.bg }}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    const CategoryIcon = ({ name }: { name: string }) => {
        const icons: any = {
            'Comida': 'restaurant',
            'Transporte': 'directions-car',
            'Entretenimiento': 'sports-esports',
            'Súper': 'shopping-cart',
            'Hogar': 'home',
            'Salud': 'medical-services',
            'Viajes': 'flight',
            'Otros': 'more-horiz'
        };
        return <MaterialIcons name={icons[name] || 'receipt'} size={20} color={theme.textSecondary} />;
    };

    const userId = user?.id ?? '';
    const allPayments = payments.filter(p => p.fromUserId === userId || p.toUserId === userId);

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: theme.bg }}>
            <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View className="mb-8 flex-row justify-between items-center">
                    <View className="flex-1">
                        <Text style={{ color: theme.text, fontSize: 32 * fontScale }} className="font-black tracking-tight leading-none uppercase">Estadísticas</Text>
                        <Text style={{ color: theme.primary, fontSize: 9 * fontScale }} className="font-black uppercase tracking-[3px] mt-2">Resumen Financiero</Text>
                    </View>
                    <View className="flex-row gap-3">
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
                        <TouchableOpacity 
                            onPress={handleExportPDF}
                            style={{ backgroundColor: theme.cardSecondary, borderColor: theme.border }} 
                            className="w-10 h-10 rounded-xl items-center justify-center border"
                        >
                            <MaterialIcons name="picture-as-pdf" size={20} color={theme.primary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Summary Cards */}
                <View className="flex-row gap-4 mb-8">
                    <View style={{ backgroundColor: theme.card }} className="flex-1 p-6 rounded-[2.5rem] border border-white/5">
                        <View style={{ backgroundColor: '#10b98115' }} className="w-10 h-10 rounded-xl items-center justify-center mb-4">
                            <MaterialIcons name="trending-up" size={20} color="#10b981" />
                        </View>
                        <Text style={{ color: theme.textSecondary, fontSize: 10 * fontScale }} className="font-black uppercase tracking-widest opacity-60 mb-1">Te deben</Text>
                        <Text style={{ color: '#10b981', fontSize: 18 * fontScale }} className="font-black">${stats?.owed_to_user?.toFixed(2)}</Text>
                    </View>
                    <View style={{ backgroundColor: theme.card }} className="flex-1 p-6 rounded-[2.5rem] border border-white/5">
                        <View style={{ backgroundColor: '#f43f5e15' }} className="w-10 h-10 rounded-xl items-center justify-center mb-4">
                            <MaterialIcons name="trending-down" size={20} color="#f43f5e" />
                        </View>
                        <Text style={{ color: theme.textSecondary, fontSize: 10 * fontScale }} className="font-black uppercase tracking-widest opacity-60 mb-1">Debes</Text>
                        <Text style={{ color: '#f43f5e', fontSize: 18 * fontScale }} className="font-black">${stats?.user_owes?.toFixed(2)}</Text>
                    </View>
                </View>

                {/* Main Spent Card */}
                <LinearGradient 
                    colors={['#0f172a', '#1e3a8a', '#1e40af']} 
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="p-8 rounded-[3rem] mb-8 shadow-xl shadow-blue-500/20"
                >
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-white/60 font-black uppercase tracking-[0.3em] text-[10px]">Gasto Total Histórico</Text>
                        <FontAwesome5 name="wallet" size={20} color="white" />
                    </View>
                    <Text className="text-white font-black text-4xl tracking-tighter">${stats?.total_spent?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</Text>
                    <View className="flex-row items-center mt-4">
                        <Ionicons name="arrow-up" size={14} color="#34d399" />
                        <Text className="text-[#34d399] font-black text-[10px] uppercase ml-1">Análisis Dinámico</Text>
                    </View>
                </LinearGradient>

                {/* Categories */}
                <View className="mb-8">
                    <View className="flex-row justify-between items-center mb-6">
                        <Text style={{ color: theme.text, fontSize: 18 * fontScale }} className="font-black tracking-tight">Por Categoría</Text>
                    </View>

                    <View style={{ backgroundColor: theme.card }} className="p-6 rounded-[2.5rem] border border-white/5">
                        {stats?.by_category?.length > 0 && (
                            <View style={{ alignItems: 'center', marginBottom: 20 }}>
                                <PieChart
                                    data={stats.by_category.map((cat: any, index: number) => ({
                                        name: cat.category,
                                        population: cat.amount,
                                        color: index === 0 ? theme.primary : index === 1 ? '#10b981' : index === 2 ? '#f59e0b' : '#6366f1',
                                        legendFontColor: theme.textSecondary,
                                        legendFontSize: 11
                                    }))}
                                    width={width - 80}
                                    height={180}
                                    chartConfig={{
                                        color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                                    }}
                                    accessor={"population"}
                                    backgroundColor={"transparent"}
                                    paddingLeft={"15"}
                                    absolute
                                />
                            </View>
                        )}
                        {(stats?.by_category?.length > 0) ? stats.by_category.map((cat: any, index: number) => (
                            <View key={index} className="mb-6 last:mb-0">
                                <View className="flex-row justify-between items-center mb-2">
                                    <View className="flex-row items-center">
                                        <CategoryIcon name={cat.category} />
                                        <Text style={{ color: theme.text }} className="font-bold ml-3 text-sm">{cat.category}</Text>
                                    </View>
                                    <Text style={{ color: theme.textSecondary }} className="font-black text-xs">${cat.amount}</Text>
                                </View>
                                <View className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                    <View 
                                        className="h-full rounded-full" 
                                        style={{ 
                                            width: `${cat.percentage}%`, 
                                            backgroundColor: index === 0 ? theme.primary : index === 1 ? '#10b981' : index === 2 ? '#f59e0b' : '#6366f1' 
                                        }} 
                                    />
                                </View>
                            </View>
                        )) : (
                            <Text style={{ color: theme.textSecondary }} className="text-center py-4">No hay datos de categorías aún.</Text>
                        )}
                    </View>
                </View>

                {/* Historial de Pagos */}
                <View className="mb-10">
                    <Text style={{ color: theme.text, fontSize: 18 * fontScale }} className="font-black tracking-tight mb-6">Historial de Pagos</Text>
                    {allPayments.length === 0 ? (
                        <View style={{ backgroundColor: theme.card, borderColor: theme.border }} className="border rounded-[2.5rem] p-10 items-center">
                            <MaterialIcons name="history" size={36} color={theme.textSecondary} />
                            <Text style={{ color: theme.text }} className="font-black mt-3 text-center">Sin actividad</Text>
                        </View>
                    ) : (
                        <View style={{ backgroundColor: theme.card, borderColor: theme.border }} className="border rounded-[2.5rem] overflow-hidden p-2">
                            {allPayments.map((tx, i) => {
                                const method = METHOD_META[tx.method] || METHOD_META.cash;
                                const status = STATUS_META[tx.status as keyof typeof STATUS_META] || STATUS_META.pending;
                                const isOutgoing = tx.fromUserId === userId;
                                return (
                                    <View
                                        key={tx.id}
                                        className={`p-5 flex-row items-center justify-between mb-2 rounded-[2rem] ${i % 2 === 0 ? 'bg-white/5' : ''}`}
                                    >
                                        <View className="flex-row items-center gap-4 flex-1">
                                            <View style={{ backgroundColor: method.color + '15' }} className="w-12 h-12 rounded-2xl items-center justify-center">
                                                <MaterialIcons name={method.icon as any} size={20} color={method.color} />
                                            </View>
                                            <View className="flex-1">
                                                <Text style={{ fontSize: 14 * fontScale, color: theme.text }} className="font-black" numberOfLines={1}>
                                                    {isOutgoing ? `A: ${tx.toUserName}` : `De: ${tx.fromUserName}`}
                                                </Text>
                                                <Text style={{ color: theme.textSecondary }} className="text-xs mt-0.5">{tx.groupName}</Text>
                                            </View>
                                        </View>
                                        <View className="items-end ml-4">
                                            <Text style={{ color: isOutgoing ? '#ef4444' : '#4ade80' }} className="font-black text-sm">
                                                {isOutgoing ? '-' : '+'}${tx.amount.toFixed(2)}
                                            </Text>
                                            <Text style={{ color: status.color }} className="text-[8px] font-black uppercase mt-1">{status.label}</Text>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    )}
                </View>

                <View className="h-20" />
            </ScrollView>
        </SafeAreaView>
    );
}
