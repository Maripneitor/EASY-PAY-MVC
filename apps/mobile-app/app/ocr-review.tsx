import { useEasyPay } from '../context/EasyPayContext';
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MotiView, AnimatePresence } from 'moti';
import { useTheme } from '../src/infrastructure/context/ThemeContext';

const { width } = Dimensions.get('window');

interface ScannedItem {
    name: string;
    price: number;
    quantity: number;
    id: string;
}

export default function OCRReviewScreen() {
    const { theme, fontScale } = useTheme();
    const { addItems, activeGrupo, user } = useEasyPay();
    const { scanData: scanDataRaw, groupId } = useLocalSearchParams();
    const router = useRouter();
    
    const [items, setItems] = useState<ScannedItem[]>([]);
    const [restaurant, setRestaurant] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (scanDataRaw) {
            try {
                const parsed = JSON.parse(scanDataRaw as string);
                setRestaurant(parsed.restaurant_name || "Restaurante");
                const mappedItems = (parsed.items || []).map((item: any, index: number) => ({
                    id: `scan-${index}`,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity || 1
                }));
                setItems(mappedItems);
            } catch (e) {
                console.error("Error parsing scanData", e);
                Alert.alert("Error", "No se pudieron cargar los datos del escaneo.");
            }
        }
    }, [scanDataRaw]);

    const handleConfirm = async (splitAll: boolean = false) => {
        if (items.length === 0) return;
        
        setIsLoading(true);
        try {
            const memberIds = splitAll ? activeGrupo?.participantes?.map(p => p.id) || [] : [];
            
            const itemsToAdd = items.map(item => ({
                nombre: item.name,
                precio: item.price,
                cantidad: item.quantity,
                autorId: user?.id || activeGrupo?.liderId || '1',
                asignadoA: memberIds
            }));

            await addItems(itemsToAdd);
            
            Alert.alert(
                "¡Éxito!", 
                `${items.length} ítems agregados al grupo${splitAll ? ' y repartidos entre todos' : ''}.`,
                [
                    { text: "Cerrar", onPress: () => router.replace({ pathname: '/detalle-grupo', params: { id: groupId || 'current' } }) }
                ]
            );
        } catch (e) {
            console.error(e);
            Alert.alert("Error", "Ocurrió un error al agregar los ítems al grupo.");
        } finally {
            setIsLoading(false);
        }
    };

    const removeItem = (id: string) => {
        setItems(prev => prev.filter(item => item.id !== id));
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
            <StatusBar style={theme.isDark ? "light" : "dark"} />
            <Stack.Screen options={{ headerShown: false }} />

            <View className="px-6 py-4 flex-row items-center border-b border-white/5">
                <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 rounded-xl bg-slate-800/40 items-center justify-center">
                    <Ionicons name="arrow-back" size={20} color={theme.text} />
                </TouchableOpacity>
                <View className="ml-4 flex-1">
                    <Text style={{ color: theme.text }} className="text-xl font-black">Revisión OCR</Text>
                    <Text style={{ color: theme.textSecondary }} className="text-[10px] font-black uppercase tracking-widest">{restaurant}</Text>
                </View>
            </View>

            <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
                <MotiView 
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    className="gap-6"
                >
                    {/* Resumen de Hallazgos */}
                    <View style={{ backgroundColor: theme.cardSecondary + '40' }} className="p-6 rounded-[32px] border border-white/5 flex-row items-center justify-between">
                        <View>
                            <Text style={{ color: theme.textSecondary }} className="text-[10px] font-black uppercase tracking-widest mb-1">Items Detectados</Text>
                            <Text style={{ color: theme.text }} className="text-3xl font-black">{items.length}</Text>
                        </View>
                        <View className="items-end">
                            <Text style={{ color: theme.textSecondary }} className="text-[10px] font-black uppercase tracking-widest mb-1">Total Estimado</Text>
                            <Text style={{ color: theme.primary }} className="text-3xl font-black">
                                ${items.reduce((acc, item) => acc + (item.price * item.quantity), 0).toFixed(2)}
                            </Text>
                        </View>
                    </View>

                    {/* Quick Action */}
                    <View className="bg-blue-500/10 p-4 rounded-2xl border border-blue-500/20 flex-row items-center gap-3">
                        <MaterialIcons name="info" size={20} color={theme.primary} />
                        <Text style={{ color: theme.textSecondary, fontSize: 11 }} className="flex-1 font-bold">
                            Puedes agregar los ítems y repartirlos equitativamente entre todos los miembros ahora mismo.
                        </Text>
                    </View>

                    {/* Lista de Comparación */}
                    <View className="gap-4 pb-40">
                        {items.map((item) => (
                            <View 
                                key={item.id}
                                style={{ backgroundColor: theme.cardSecondary, borderColor: theme.border + '20' }}
                                className="p-5 rounded-[32px] border flex-row items-center gap-4"
                            >
                                <View className="w-12 h-12 rounded-2xl bg-slate-800 items-center justify-center">
                                    <Text className="text-white font-black">{item.quantity}x</Text>
                                </View>

                                <View className="flex-1">
                                    <Text style={{ color: theme.text }} className="text-base font-black" numberOfLines={1}>
                                        {item.name}
                                    </Text>
                                    <Text style={{ color: theme.primary }} className="text-sm font-black mt-1">
                                        ${item.price.toFixed(2)}
                                    </Text>
                                </View>

                                <TouchableOpacity 
                                    onPress={() => removeItem(item.id)}
                                    className="w-10 h-10 rounded-full bg-red-500/10 items-center justify-center border border-red-500/20"
                                >
                                    <MaterialIcons name="delete-outline" size={20} color="#ef4444" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                </MotiView>
            </ScrollView>

            <View className="px-8 pb-10 absolute bottom-0 left-0 right-0 gap-3">
                <TouchableOpacity 
                    onPress={() => handleConfirm(true)}
                    disabled={isLoading || items.length === 0}
                    style={{ 
                        backgroundColor: theme.bg,
                        borderColor: theme.primary,
                        borderWidth: 2
                    }}
                    className="w-full py-5 rounded-[28px] items-center flex-row justify-center gap-3"
                >
                    <Text style={{ color: theme.primary }} className="font-black uppercase tracking-[2px]">Dividir entre todos</Text>
                    <MaterialIcons name="groups" size={20} color={theme.primary} />
                </TouchableOpacity>

                <TouchableOpacity 
                    onPress={() => handleConfirm(false)}
                    disabled={isLoading || items.length === 0}
                    style={{ 
                        backgroundColor: items.length > 0 ? theme.primary : theme.textSecondary + '20',
                        shadowColor: theme.primary,
                        shadowOffset: { width: 0, height: 10 },
                        shadowOpacity: 0.3,
                        shadowRadius: 20
                    }}
                    className="w-full py-6 rounded-[30px] items-center flex-row justify-center gap-3 elevation-5"
                >
                    {isLoading ? (
                        <ActivityIndicator color="black" />
                    ) : (
                        <>
                            <Text className="text-black font-black uppercase tracking-[2px]">Añadir sin asignar</Text>
                            <Ionicons name="add-circle" size={20} color="black" />
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
