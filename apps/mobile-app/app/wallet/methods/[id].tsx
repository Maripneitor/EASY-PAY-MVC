import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons, Feather } from '@expo/vector-icons';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

export default function MethodDetailScreen() {
    const { id } = useLocalSearchParams();
    const [method, setMethod] = React.useState<any>(null);

    React.useEffect(() => {
        // Here we would fetch the card from the API
        console.log('Fetching card with id:', id);
    }, [id]);

    if (!method) {
        return (
            <SafeAreaView className="flex-1 bg-[#0d1425] items-center justify-center">
                <Text className="text-white font-bold">Cargando detalles...</Text>
            </SafeAreaView>
        );
    }

    const handleDelete = () => {
        Alert.alert(
            "Eliminar Método",
            "¿Estás seguro de que quieres eliminar esta tarjeta? Esta acción no se puede deshacer.",
            [
                { text: "Cancelar", style: "cancel" },
                { text: "Eliminar", style: "destructive", onPress: () => router.back() }
            ]
        );
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
                <Text className="text-white text-xl font-black">Detalle de Tarjeta</Text>
                <TouchableOpacity className="w-10 h-10 bg-white/5 rounded-full items-center justify-center border border-white/10">
                    <Feather name="edit-3" size={20} color="white" />
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
                <View className="mt-10 mb-10">
                    <LinearGradient
                        colors={method.colors as any}
                        className="w-full h-52 rounded-[40px] p-8 shadow-2xl relative overflow-hidden"
                    >
                        <View className="flex-row justify-between items-start mb-8">
                            <Image 
                                source={{ uri: 'https://img.icons8.com/color/96/chip.png' }}
                                className="w-12 h-10"
                            />
                            <Text className="text-white font-black italic text-2xl">{method.type}</Text>
                        </View>
                        <Text className="text-white font-mono text-2xl tracking-[4px] mb-8">**** **** **** {method.last4}</Text>
                        <View className="flex-row justify-between items-end">
                            <View>
                                <Text className="text-white/40 text-[9px] font-black uppercase tracking-widest mb-1">Titular</Text>
                                <Text className="text-white font-black text-sm uppercase">{method.holder}</Text>
                            </View>
                            <View className="items-end">
                                <Text className="text-white/40 text-[9px] font-black uppercase tracking-widest mb-1">Vence</Text>
                                <Text className="text-white font-black text-sm">{method.expiry}</Text>
                            </View>
                        </View>
                    </LinearGradient>
                </View>

                <View className="gap-4">
                    <View className="bg-white/5 border border-white/10 rounded-[32px] p-6">
                        <Text className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-6">Configuración</Text>
                        
                        <TouchableOpacity className="flex-row items-center justify-between py-4 border-b border-white/5">
                            <View className="flex-row items-center gap-4">
                                <MaterialIcons name="star-outline" size={24} color="#94a3b8" />
                                <Text className="text-white font-bold">Establecer como predeterminada</Text>
                            </View>
                            <View className={`w-10 h-6 rounded-full p-1 ${method.default ? 'bg-blue-600' : 'bg-slate-700'}`}>
                                <View className={`w-4 h-4 bg-white rounded-full ${method.default ? 'self-end' : ''}`} />
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity className="flex-row items-center justify-between py-4 border-b border-white/5">
                            <View className="flex-row items-center gap-4">
                                <MaterialIcons name="lock-outline" size={24} color="#94a3b8" />
                                <Text className="text-white font-bold">Bloquear tarjeta temporalmente</Text>
                            </View>
                            <MaterialIcons name="chevron-right" size={20} color="#334155" />
                        </TouchableOpacity>

                        <TouchableOpacity 
                            onPress={handleDelete}
                            className="flex-row items-center gap-4 py-4"
                        >
                            <MaterialIcons name="delete-outline" size={24} color="#f43f5e" />
                            <Text className="text-rose-500 font-bold">Eliminar tarjeta de la cartera</Text>
                        </TouchableOpacity>
                    </View>

                    <View className="bg-blue-600/5 border border-blue-500/10 rounded-[32px] p-6 mt-4">
                        <Text className="text-blue-400 font-black text-[10px] uppercase tracking-widest mb-2">Seguridad</Text>
                        <Text className="text-slate-500 text-xs leading-relaxed font-medium">Esta tarjeta está protegida con tokenización PCI. Los pagos requieren validación biométrica.</Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
