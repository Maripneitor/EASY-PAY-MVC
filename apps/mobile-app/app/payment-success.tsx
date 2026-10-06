import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { MotiView, AnimatePresence } from 'moti';
import { useTheme } from '../src/infrastructure/context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PaymentSuccessScreen() {
    const { theme, fontScale } = useTheme();

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' }}>
            <StatusBar style="light" />
            <Stack.Screen options={{ headerShown: false }} />

            <MotiView
                from={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 12 }}
                style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}
                className="w-40 h-40 rounded-[60px] items-center justify-center mb-10 border border-emerald-500/20"
            >
                <Ionicons name="checkmark-seal" size={100} color="#10B981" />
            </MotiView>

            <View style={{ paddingHorizontal: 40 }} className="items-center">
                <MotiView
                    from={{ translateY: 20, opacity: 0 }}
                    animate={{ translateY: 0, opacity: 1 }}
                    transition={{ delay: 200 }}
                    className="items-center"
                >
                    <Text style={{ fontSize: 36 * fontScale, color: theme.text }} className="font-black text-center mb-4">
                        ¡Pago Exitoso!
                    </Text>
                    <Text style={{ fontSize: 16 * fontScale, color: theme.textSecondary }} className="text-center leading-relaxed mb-16">
                        Tu pago ha sido registrado correctamente. El saldo del grupo ha sido actualizado en tiempo real.
                    </Text>
                </MotiView>

                <MotiView
                    from={{ translateY: 20, opacity: 0 }}
                    animate={{ translateY: 0, opacity: 1 }}
                    transition={{ delay: 400 }}
                    className="w-full"
                >
                    <TouchableOpacity
                        onPress={() => router.replace('/(tabs)/')}
                        style={{ backgroundColor: theme.primary }}
                        className="h-20 rounded-3xl items-center justify-center shadow-2xl"
                    >
                        <Text style={{ fontSize: 13 * fontScale }} className="text-white font-black uppercase tracking-[3px]">
                            Volver al Inicio
                        </Text>
                    </TouchableOpacity>
                </MotiView>
            </View>
        </SafeAreaView>
    );
}
