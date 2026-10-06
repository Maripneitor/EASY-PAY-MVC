import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons, Feather } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../src/infrastructure/context/ThemeContext';

export default function SecurityScreen() {
    const { theme, cycleTheme } = useTheme();
    const insets = useSafeAreaInsets();

    return (
        <SafeAreaView style={{ backgroundColor: theme.bg }} className="flex-1" edges={['top']}>
            <StatusBar style={theme.isDark ? "light" : "dark"} />
            <Stack.Screen options={{ headerShown: false, presentation: 'modal' }} />

            {/* Header */}
            <View className="px-6 py-4 flex-row items-center justify-between">
                <TouchableOpacity onPress={() => router.back()} style={{ backgroundColor: theme.glassBg, borderColor: theme.border }} className="w-10 h-10 rounded-full items-center justify-center border">
                    <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={{ color: theme.text }} className="text-xl font-black">Seguridad</Text>
                <TouchableOpacity 
                    onPress={cycleTheme}
                    style={{ backgroundColor: theme.primary }}
                    className="w-10 h-10 rounded-full items-center justify-center shadow-lg shadow-blue-500/20"
                >
                    <Ionicons name={theme.isDark ? "sunny" : "moon"} size={20} color="black" />
                </TouchableOpacity>
            </View>

            <ScrollView 
                className="flex-1 px-6" 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
            >
                <View className="items-center py-10">
                    <View style={{ backgroundColor: theme.primary + '20' }} className="w-24 h-24 rounded-full items-center justify-center mb-6">
                        <MaterialIcons name="verified-user" size={48} color={theme.primary} />
                    </View>
                    <Text style={{ color: theme.text }} className="text-2xl font-black text-center mb-2">Tus pagos están protegidos</Text>
                    <Text style={{ color: theme.textSecondary }} className="text-center px-4 leading-relaxed font-medium">Utilizamos estándares bancarios para proteger tu información financiera.</Text>
                </View>

                <View className="gap-4">
                    {[
                        { icon: 'lock', title: 'Cifrado de Extremo a Extremo', desc: 'Tus datos de tarjeta nunca se guardan en texto plano en nuestros servidores.' },
                        { icon: 'fingerprint', title: 'Verificación Biométrica', desc: 'Solicitamos FaceID o Huella antes de autorizar cualquier pago importante.' },
                        { icon: 'verified', title: 'Tokenización PCI-DSS', desc: 'Cumplimos con las normas internacionales de seguridad de datos de la industria de pagos.' },
                        { icon: 'smartphone', title: 'Sesiones Activas', desc: 'Gestiona qué dispositivos pueden realizar pagos con tu cuenta.' },
                    ].map((item, i) => (
                        <View key={i} style={{ backgroundColor: theme.cardSecondary, borderColor: theme.border }} className="border rounded-[32px] p-6 flex-row gap-5 items-center">
                            <View style={{ backgroundColor: theme.glassBg, borderColor: theme.border }} className="w-12 h-12 rounded-2xl items-center justify-center border">
                                <MaterialIcons name={item.icon as any} size={24} color={theme.textSecondary} />
                            </View>
                            <View className="flex-1">
                                <Text style={{ color: theme.text }} className="font-black text-base">{item.title}</Text>
                                <Text style={{ color: theme.textSecondary }} className="text-xs font-medium leading-relaxed mt-1">{item.desc}</Text>
                            </View>
                        </View>
                    ))}

                    <TouchableOpacity style={{ backgroundColor: theme.primary }} className="mt-10 p-6 rounded-[28px] items-center justify-center shadow-lg shadow-blue-500/20">
                        <Text className="text-black font-black uppercase tracking-widest text-[11px]">Verificar Identidad Ahora</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
