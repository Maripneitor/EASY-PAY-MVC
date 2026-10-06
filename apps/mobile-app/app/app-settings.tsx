import { useEasyPay } from '../context/EasyPayContext';
import React, { useState } from 'react';
import { 
    View, 
    Text, 
    ScrollView, 
    TouchableOpacity, 
    Switch, 
    Dimensions, 
    Pressable 
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../src/infrastructure/context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function AppSettingsScreen() {
    const { colorTheme, fontSize, theme, fontScale, setColorTheme, setFontSize } = useTheme();
    const { logout  } = useEasyPay();
    const router = useRouter();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    const SectionHeader = ({ title }: { title: string }) => (
        <Text 
            style={{ fontSize: 10 * fontScale, color: theme.textSecondary }} 
            className="font-black uppercase tracking-[3px] mb-4 ml-2"
        >
            {title}
        </Text>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
            <StatusBar style={theme.isDark ? "light" : "dark"} />
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={{ borderBottomColor: theme.border, height: 80 }} className="px-6 flex-row items-center justify-between border-b">
                <TouchableOpacity 
                    onPress={() => router.back()}
                    className="flex-row items-center gap-2"
                >
                    <MaterialIcons name="arrow-back" size={20} color={theme.textSecondary} />
                    <Text style={{ color: theme.textSecondary }} className="text-sm font-bold">Atrás</Text>
                </TouchableOpacity>
                <Text style={{ fontSize: 12 * fontScale, color: theme.text }} className="absolute left-0 right-0 text-center font-black tracking-[4px] uppercase -z-10">
                    Ajustes
                </Text>
            </View>

            <ScrollView 
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 24, paddingTop: 24 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Personalization Section */}
                <SectionHeader title="Apariencia" />
                <View style={{ backgroundColor: theme.cardSecondary, borderColor: theme.border }} className="p-6 rounded-[40px] border mb-10">
                    <Text style={{ color: theme.text, fontSize: 14 * fontScale }} className="font-black mb-6">Tema de Color</Text>
                    <View className="flex-row flex-wrap gap-4 mb-8">
                        {[
                            { id: 'light', color: '#2196F3', label: 'Claro' },
                            { id: 'default', color: '#38bdf8', label: 'Original' },
                            { id: 'vibrant', color: '#f87171', label: 'Vibrante' },
                            { id: 'serene', color: '#34d399', label: 'Sereno' },
                            { id: 'earth', color: '#fbbf24', label: 'Tierra' },
                            { id: 'pink', color: '#ff4081', label: 'Rosa' },
                        ].map((item) => (
                            <TouchableOpacity 
                                key={item.id} 
                                onPress={() => setColorTheme(item.id as any)}
                                className="items-center"
                                style={{ width: (SCREEN_WIDTH - 100) / 3 }}
                            >
                                <View 
                                    style={[
                                        { width: 45, height: 45, borderRadius: 12, backgroundColor: item.color, marginBottom: 8 },
                                        colorTheme === item.id && { borderWidth: 3, borderColor: theme.primary, transform: [{ scale: 1.1 }] }
                                    ]}
                                />
                                <Text style={{ color: colorTheme === item.id ? theme.primary : theme.textSecondary, fontSize: 9 * fontScale }} className="font-black uppercase tracking-widest text-center">
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={{ color: theme.text, fontSize: 14 * fontScale }} className="font-black mb-4">Tamaño de Texto</Text>
                    <View className="flex-row p-1.5 rounded-2xl" style={{ backgroundColor: theme.glassBg }}>
                        {(['small', 'medium', 'large'] as const).map((size) => (
                            <Pressable
                                key={size}
                                onPress={() => setFontSize(size)}
                                className="flex-1"
                            >
                                <View className={`py-3 rounded-xl items-center ${fontSize === size ? 'bg-white' : ''}`}>
                                    <Text style={{ color: fontSize === size ? '#0f172a' : '#64748b' }} className="font-black text-[10px] uppercase">{size === 'small' ? 'Chico' : size === 'medium' ? 'Normal' : 'Grande'}</Text>
                                </View>
                            </Pressable>
                        ))}
                    </View>
                </View>

                {/* Security & Features */}
                <SectionHeader title="Seguridad y Funciones" />
                <View style={{ backgroundColor: theme.cardSecondary, borderColor: theme.border }} className="p-2 rounded-[40px] border mb-10 overflow-hidden">
                    <TouchableOpacity 
                        onPress={() => router.push('/profile/change-password' as any)}
                        className="flex-row items-center justify-between p-6 border-b border-white/5"
                    >
                        <View className="flex-row items-center gap-4">
                            <View style={{ backgroundColor: theme.primary + '15' }} className="w-12 h-12 rounded-2xl items-center justify-center">
                                <MaterialIcons name="lock" size={24} color={theme.primary} />
                            </View>
                            <View>
                                <Text style={{ color: theme.text }} className="font-black text-sm uppercase tracking-wider">Cambiar Contraseña</Text>
                                <Text style={{ color: theme.textSecondary }} className="text-[10px] font-bold uppercase opacity-60">Actualiza tus credenciales</Text>
                            </View>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color={theme.textSecondary} />
                    </TouchableOpacity>

                    <View className="flex-row justify-between items-center p-6 border-b border-white/5">
                        <View className="flex-row items-center gap-4">
                            <View style={{ backgroundColor: '#10b98115' }} className="w-12 h-12 rounded-2xl items-center justify-center">
                                <MaterialIcons name="security" size={24} color="#10b981" />
                            </View>
                            <View>
                                <Text style={{ color: theme.text }} className="font-black text-sm uppercase tracking-wider">Verificación 2FA</Text>
                                <Text style={{ color: theme.textSecondary }} className="text-[10px] font-bold uppercase opacity-60">Seguridad en dos pasos</Text>
                            </View>
                        </View>
                        <Switch 
                            value={true} 
                            onValueChange={() => {}}
                            trackColor={{ false: "#767577", true: theme.primary }}
                            thumbColor={"#fff"}
                        />
                    </View>

                    <TouchableOpacity 
                        onPress={() => {
                            Alert.alert("Reporte PDF", "Generando reporte mensual de gastos... Esta función estará disponible en la próxima actualización móvil.");
                        }}
                        className="flex-row items-center justify-between p-6"
                    >
                        <View className="flex-row items-center gap-4">
                            <View style={{ backgroundColor: '#f59e0b15' }} className="w-12 h-12 rounded-2xl items-center justify-center">
                                <MaterialIcons name="picture-as-pdf" size={24} color="#f59e0b" />
                            </View>
                            <View>
                                <Text style={{ color: theme.text }} className="font-black text-sm uppercase tracking-wider">Reporte de Gastos</Text>
                                <Text style={{ color: theme.textSecondary }} className="text-[10px] font-bold uppercase opacity-60">Generar PDF del mes</Text>
                            </View>
                        </View>
                        <MaterialIcons name="download" size={24} color={theme.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Notifications */}
                <SectionHeader title="Preferencias" />
                <View style={{ backgroundColor: theme.cardSecondary, borderColor: theme.border }} className="p-6 rounded-[40px] border mb-10">
                    <View className="flex-row justify-between items-center">
                        <View>
                            <Text style={{ color: theme.text, fontSize: 14 * fontScale }} className="font-black">Notificaciones Push</Text>
                            <Text style={{ color: theme.textSecondary, fontSize: 10 * fontScale }} className="font-bold">Alertas de gastos y pagos</Text>
                        </View>
                        <Switch 
                            value={notificationsEnabled} 
                            onValueChange={setNotificationsEnabled}
                            trackColor={{ false: "#767577", true: theme.primary }}
                            thumbColor={notificationsEnabled ? "#fff" : "#f4f3f4"}
                        />
                    </View>
                </View>

                {/* Logout Button */}
                <TouchableOpacity 
                    onPress={async () => {
                        await logout();
                        router.replace('/');
                    }}
                    className="flex-row items-center justify-center gap-3 py-6 rounded-[32px] bg-rose-500/10 border border-rose-500/20 mb-10"
                >
                    <MaterialIcons name="logout" size={20} color="#f43f5e" />
                    <Text style={{ fontSize: 13 * fontScale }} className="text-rose-500 font-black uppercase tracking-[3px]">Cerrar Sesión</Text>
                </TouchableOpacity>

                <View className="items-center">
                    <Text className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">
                        Easy-Pay v2.4.0
                    </Text>
                    <Text className="text-slate-600/40 text-[8px] font-bold mt-1 uppercase">
                        Build 942 • Made with ❤️
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
