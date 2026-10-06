import React, { useState } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    ScrollView, 
    TextInput,
    Switch,
    Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../src/infrastructure/context/ThemeContext';

const { width } = Dimensions.get('window');

export default function OnboardingAccountScreen() {
    const { theme, fontScale } = useTheme();
    const [nombre, setNombre] = useState('');
    const [is2faEnabled, setIs2faEnabled] = useState(false);
    const [isFaceIdEnabled, setIsFaceIdEnabled] = useState(true);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
            <StatusBar style={theme.isDark ? "light" : "dark"} />
            <Stack.Screen options={{ headerShown: false }} />
            
            <ScrollView className="flex-1 px-8" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 150 }}>
                {/* Progress Header */}
                <View className="py-10">
                    <View className="flex-row items-center justify-between mb-8">
                        <View className="flex-row gap-2">
                            {[1, 2, 3].map(step => (
                                <View 
                                    key={step} 
                                    style={{ 
                                        width: step === 2 ? 32 : 8,
                                        backgroundColor: step === 2 ? theme.primary : theme.textSecondary + '40'
                                    }} 
                                    className="h-2 rounded-full"
                                />
                            ))}
                        </View>
                        <Text style={{ color: theme.textSecondary }} className="text-xs font-black uppercase tracking-widest">Paso 02 de 03</Text>
                    </View>

                    <Text style={{ color: theme.text, fontSize: 32 * fontScale }} className="font-black tracking-tighter leading-none mb-4">Configura tu{'\n'}cuenta</Text>
                    <Text style={{ color: theme.textSecondary }} className="text-base font-medium">Personaliza tu perfil y asegura tu cuenta antes de empezar.</Text>
                </View>

                {/* Profile Photo Section */}
                <View className="items-center mb-10">
                    <TouchableOpacity 
                        style={{ backgroundColor: theme.cardSecondary, borderColor: theme.border }}
                        className="w-32 h-32 rounded-[40px] items-center justify-center border-2 border-dashed relative"
                    >
                        <MaterialIcons name="add-a-photo" size={32} color={theme.primary} />
                        <View style={{ backgroundColor: theme.primary }} className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl items-center justify-center border-4 border-slate-900 shadow-lg">
                            <MaterialIcons name="add" size={20} color="black" />
                        </View>
                    </TouchableOpacity>
                    <Text style={{ color: theme.textSecondary }} className="text-xs font-black uppercase tracking-[3px] mt-6">Sube tu foto de perfil</Text>
                </View>

                {/* Form Fields */}
                <View className="gap-10">
                    <View>
                        <Text style={{ color: theme.textSecondary }} className="text-[10px] font-black uppercase tracking-[3px] mb-3 ml-1">Cómo quieres que te llamen</Text>
                        <View style={{ backgroundColor: theme.cardSecondary, borderColor: theme.border }} className="flex-row items-center border rounded-2xl px-5 py-2">
                            <MaterialIcons name="person-outline" size={20} color={theme.textSecondary} className="mr-3" />
                            <TextInput 
                                value={nombre}
                                onChangeText={setNombre}
                                placeholder="Tu nombre o apodo"
                                placeholderTextColor={theme.textSecondary + '60'}
                                style={{ flex: 1, color: theme.text, height: 48, fontWeight: 'bold', fontSize: 16 }}
                            />
                        </View>
                    </View>

                    {/* Security Toggles */}
                    <View className="gap-6">
                        <Text style={{ color: theme.textSecondary }} className="text-[10px] font-black uppercase tracking-[3px] ml-1">Seguridad Avanzada</Text>
                        
                        <View style={{ backgroundColor: theme.cardSecondary, borderColor: theme.border }} className="p-6 rounded-3xl border flex-row items-center justify-between">
                            <View className="flex-row items-center gap-4 flex-1">
                                <View style={{ backgroundColor: '#8b5cf620' }} className="w-12 h-12 rounded-2xl items-center justify-center">
                                    <MaterialIcons name="phonelink-lock" size={24} color="#a78bfa" />
                                </View>
                                <View className="flex-1">
                                    <Text style={{ color: theme.text }} className="font-bold">Verificación 2FA</Text>
                                    <Text style={{ color: theme.textSecondary }} className="text-xs">Código vía SMS o App</Text>
                                </View>
                            </View>
                            <Switch 
                                value={is2faEnabled} 
                                onValueChange={setIs2faEnabled}
                                trackColor={{ false: '#334155', true: theme.primary }}
                                thumbColor="white"
                            />
                        </View>

                        <View style={{ backgroundColor: theme.cardSecondary, borderColor: theme.border }} className="p-6 rounded-3xl border flex-row items-center justify-between">
                            <View className="flex-row items-center gap-4 flex-1">
                                <View style={{ backgroundColor: '#3b82f620' }} className="w-12 h-12 rounded-2xl items-center justify-center">
                                    <MaterialIcons name="face" size={24} color="#60a5fa" />
                                </View>
                                <View className="flex-1">
                                    <Text style={{ color: theme.text }} className="font-bold">FaceID / Biometría</Text>
                                    <Text style={{ color: theme.textSecondary }} className="text-xs">Acceso rápido y seguro</Text>
                                </View>
                            </View>
                            <Switch 
                                value={isFaceIdEnabled} 
                                onValueChange={setIsFaceIdEnabled}
                                trackColor={{ false: '#334155', true: theme.primary }}
                                thumbColor="white"
                            />
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Footer */}
            <View 
                style={{ backgroundColor: theme.bg, borderColor: theme.border }} 
                className="absolute bottom-0 w-full p-8 border-t"
            >
                <TouchableOpacity 
                    onPress={() => router.push('/(tabs)')}
                    style={{ backgroundColor: theme.primary }}
                    className="w-full py-5 rounded-[1.5rem] items-center shadow-xl shadow-blue-500/20"
                >
                    <Text className="text-black font-black text-base uppercase tracking-widest">Finalizar configuración</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
