import React, { useState } from 'react';
import { ScrollView, View, Text, TextInput, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../src/infrastructure/context/ThemeContext';
import { useEasyPay } from '../context/EasyPayContext';

import OcrTicketScanner from '../components/OcrTicketScanner';
import { TicketData } from '../src/infrastructure/services/OcrService';

export default function CreateGroupScreen() {
    const { user, createGrupo } = useEasyPay();
    const { theme, fontScale } = useTheme();
    const [groupName, setGroupName] = useState('');
    const [groupDesc, setGroupDesc] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showOcr, setShowOcr] = useState(false);
    const [scannedTicket, setScannedTicket] = useState<TicketData | null>(null);

    const handleCreateGroup = async () => {
        if (!groupName.trim()) {
            Alert.alert('Error', 'Por favor ingresa un nombre para el grupo');
            return;
        }
        if (!user?.id) {
            Alert.alert('Error', 'Debes iniciar sesión para crear un grupo');
            return;
        }

        if (user?.isGuest) {
            Alert.alert('Acceso Denegado', 'Los invitados no pueden crear grupos. Por favor regístrate.');
            return;
        }

        setIsLoading(true);
        try {
            const items = scannedTicket?.items.map(it => ({
                nombre: it.name,
                precio: it.price,
                cantidad: it.quantity,
                categoria: 'Comida'
            })) || [];

            const groupId = await createGrupo(groupName, user.id, items);
            // Solución: Deferir la navegación para evitar race conditions y asegurar persistencia en backend
            setTimeout(() => {
                router.replace({ pathname: '/detalle-grupo', params: { id: groupId } });
            }, 150);
        } catch (error) {
            Alert.alert('Error', 'No se pudo crear el grupo. Revisa tu conexión.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOcrConfirm = (data: TicketData) => {
        setShowOcr(false);
        setScannedTicket(data);
        // Autocompletar el nombre con el restaurante detectado
        if (data.restaurantName && data.restaurantName !== 'Restaurante') {
            setGroupName(data.restaurantName);
        }
    };

    return (
        <SafeAreaView style={{ backgroundColor: theme.bg }} className="flex-1">
            <StatusBar style={theme.isDark ? 'light' : 'dark'} />
            <Stack.Screen options={{ headerShown: false }} />

            <View className="px-6 py-4 flex-row items-center justify-between border-b border-white/5 z-50">
                <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} className="w-10 h-10 rounded-xl items-center justify-center bg-slate-800/40">
                    <Ionicons name="chevron-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={{ color: theme.text }} className="text-lg font-black tracking-tight">Easy-Pay</Text>
                <View className="w-10" />
            </View>

            <ScrollView className="flex-1 px-6 pt-8" contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
                <View className="gap-8">
                    <View className="items-center gap-2">
                        <View style={{ backgroundColor: theme.primary + '15' }} className="w-20 h-20 rounded-[30px] items-center justify-center mb-2">
                            <MaterialIcons name="add-business" size={40} color={theme.primary} />
                        </View>
                        <Text style={{ color: theme.text }} className="text-3xl font-black tracking-tight text-center">
                            Crear Grupo
                        </Text>
                        <Text style={{ color: theme.textSecondary }} className="text-base text-center opacity-70">
                            Inicia una nueva sesión para dividir la cuenta con tus amigos.
                        </Text>
                    </View>

                    {/* Botón escanear ticket */}
                    <TouchableOpacity
                        onPress={() => setShowOcr(true)}
                        style={{ backgroundColor: theme.primary + '15', borderColor: theme.primary + '40' }}
                        className="flex-row items-center gap-4 p-5 rounded-[24px] border"
                    >
                        <View style={{ backgroundColor: theme.primary + '20' }} className="w-12 h-12 rounded-2xl items-center justify-center">
                            <MaterialIcons name="document-scanner" size={26} color={theme.primary} />
                        </View>
                        <View className="flex-1">
                            <Text style={{ color: theme.primary }} className="font-black text-base">
                                {scannedTicket ? '✅ Ticket escaneado' : 'Escanear Ticket'}
                            </Text>
                            <Text style={{ color: theme.textSecondary }} className="text-xs mt-0.5">
                                {scannedTicket
                                    ? `${scannedTicket.items.length} productos — Total $${scannedTicket.total.toFixed(2)}`
                                    : 'Detecta productos y precios automáticamente con OCR'}
                            </Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={20} color={theme.primary} />
                    </TouchableOpacity>

                    {/* Preview del ticket escaneado */}
                    {scannedTicket && (
                        <View
                            style={{ backgroundColor: theme.cardSecondary, borderColor: theme.border }}
                            className="rounded-[24px] border overflow-hidden"
                        >
                            <View style={{ borderBottomColor: theme.border }} className="px-5 py-4 border-b flex-row justify-between items-center">
                                <Text style={{ color: theme.text }} className="font-black">{scannedTicket.restaurantName}</Text>
                                <TouchableOpacity onPress={() => setScannedTicket(null)}>
                                    <MaterialIcons name="close" size={18} color={theme.textSecondary} />
                                </TouchableOpacity>
                            </View>
                            {scannedTicket.items.slice(0, 3).map((item, i) => (
                                <View key={i} style={{ borderBottomColor: theme.border }} className="flex-row justify-between px-5 py-3 border-b">
                                    <Text style={{ color: theme.textSecondary }} className="text-sm">{item.name}</Text>
                                    <Text style={{ color: theme.text }} className="font-bold text-sm">${(item.price * item.quantity).toFixed(2)}</Text>
                                </View>
                            ))}
                            {scannedTicket.items.length > 3 && (
                                <Text style={{ color: theme.textSecondary }} className="text-xs text-center py-2">
                                    +{scannedTicket.items.length - 3} más...
                                </Text>
                            )}
                            <View className="flex-row justify-between px-5 py-4">
                                <Text style={{ color: theme.text }} className="font-black">Total</Text>
                                <Text style={{ color: theme.primary }} className="font-black text-lg">${scannedTicket.total.toFixed(2)}</Text>
                            </View>
                        </View>
                    )}

                    <View className="gap-6">
                        <View className="gap-2">
                            <Text style={{ color: theme.textSecondary }} className="text-[10px] font-black uppercase tracking-[3px] mb-1 ml-1">
                                Nombre del Grupo
                            </Text>
                            <TextInput
                                value={groupName}
                                onChangeText={setGroupName}
                                placeholder="Ej. Restaurante Sonora Grill"
                                placeholderTextColor={theme.textSecondary + '40'}
                                style={{ backgroundColor: theme.cardSecondary, color: theme.text }}
                                className="w-full text-lg font-bold rounded-2xl p-5 border border-white/5"
                            />
                        </View>

                        <View className="gap-2">
                            <Text style={{ color: theme.textSecondary }} className="text-[10px] font-black uppercase tracking-[3px] mb-1 ml-1">
                                Descripción (Opcional)
                            </Text>
                            <TextInput
                                value={groupDesc}
                                onChangeText={setGroupDesc}
                                placeholder="Describe el propósito de este grupo..."
                                placeholderTextColor={theme.textSecondary + '40'}
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                                style={{ backgroundColor: theme.cardSecondary, color: theme.text }}
                                className="w-full text-base rounded-2xl p-5 h-32 border border-white/5"
                            />
                        </View>
                    </View>

                    <View className="bg-blue-500/10 p-6 rounded-3xl border border-blue-500/20">
                        <View className="flex-row items-center gap-3 mb-2">
                            <MaterialIcons name="info-outline" size={18} color={theme.primary} />
                            <Text style={{ color: theme.primary }} className="font-black text-xs uppercase tracking-widest">Rol: Líder</Text>
                        </View>
                        <Text style={{ color: theme.textSecondary }} className="text-xs leading-relaxed">
                            Al crear el grupo serás el Líder. Podrás escanear tickets, asignar platillos y cerrar la cuenta final.
                        </Text>
                    </View>

                    <TouchableOpacity
                        onPress={handleCreateGroup}
                        disabled={isLoading}
                        style={{ backgroundColor: theme.primary }}
                        className="w-full py-5 rounded-2xl shadow-xl shadow-blue-500/20 flex-row items-center justify-center gap-3 mt-4"
                    >
                        {isLoading ? (
                            <>
                                <ActivityIndicator color="white" />
                                <Text className="text-white font-black text-base">Procesando...</Text>
                            </>
                        ) : (
                            <Text className="text-white font-black text-base">Crear Grupo</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <OcrTicketScanner
                visible={showOcr}
                onClose={() => setShowOcr(false)}
                onConfirm={handleOcrConfirm}
                theme={theme}
            />
        </SafeAreaView>
    );
}
