import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MotiView, AnimatePresence } from 'moti';
import { useTheme } from '../src/infrastructure/context/ThemeContext';
import { useEasyPay } from '../context/EasyPayContext';

const { width, height } = Dimensions.get('window');

export default function ScanQRScreen() {
    const { theme, fontScale } = useTheme();
    const { joinGrupo, activeGrupo } = useEasyPay();
    const router = useRouter();
    const [scanned, setScanned] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleScan = async (code: string = 'MOCK123') => {
        setLoading(true);
        try {
            const success = await joinGrupo(code);
            if (success) {
                setScanned(true);
                setTimeout(() => {
                    router.replace({ pathname: '/detalle-grupo', params: { id: activeGrupo?.id || 'current' } });
                }, 800);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: 'black' }} edges={['top']}>
            <StatusBar style="light" />
            <Stack.Screen options={{ headerShown: false }} />

            <View className="px-6 py-4 flex-row items-center z-10 absolute top-12 left-0 right-0">
                <TouchableOpacity onPress={() => router.back()} className="p-3 bg-white/10 rounded-full border border-white/20">
                    <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
                <Text style={{ color: 'white', fontSize: 18 * fontScale }} className="font-black ml-4">Escanear Grupo</Text>
            </View>

            <View className="flex-1 items-center justify-center">
                <MotiView 
                    from={{ opacity: 0.5, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'timing', duration: 1500, loop: true }}
                    style={{ borderColor: theme.primary, borderWidth: 4 }}
                    className="w-72 h-72 rounded-[40px] items-center justify-center border-dashed"
                >
                    <View className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 rounded-tl-xl" style={{ borderColor: theme.primary }} />
                    <View className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 rounded-tr-xl" style={{ borderColor: theme.primary }} />
                    <View className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 rounded-bl-xl" style={{ borderColor: theme.primary }} />
                    <View className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 rounded-br-xl" style={{ borderColor: theme.primary }} />
                    
                    <MotiView 
                        animate={{ translateY: [-100, 100] }}
                        transition={{ type: 'timing', duration: 2500, loop: true }}
                        className="w-full h-1 bg-blue-500/50 shadow-2xl shadow-blue-500"
                    />
                </MotiView>

                <View className="mt-12 px-12">
                    <Text style={{ color: 'white' }} className="text-center font-bold text-lg">Apunta al código QR</Text>
                    <Text style={{ color: 'white' }} className="text-center opacity-60 mt-2">El código se encuentra en la pantalla del líder del Grupo.</Text>
                </View>

                <TouchableOpacity 
                    onPress={() => handleScan()}
                    disabled={loading}
                    className="mt-12 bg-white/10 px-6 py-4 rounded-2xl border border-white/20"
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={{ color: 'white' }} className="font-black tracking-widest">PROBAR ESCANEO</Text>
                    )}
                </TouchableOpacity>
            </View>

            <AnimatePresence>
                {scanned && (
                    <MotiView 
                        from={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-black/80 items-center justify-center z-50"
                    >
                        <MotiView 
                            from={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            style={{ backgroundColor: theme.primary }}
                            className="w-20 h-20 rounded-full items-center justify-center"
                        >
                            <MaterialIcons name="check" size={40} color="black" />
                        </MotiView>
                        <Text style={{ color: 'white' }} className="mt-6 text-xl font-black">¡Código Identificado!</Text>
                    </MotiView>
                )}
            </AnimatePresence>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    scanner: {
        width: 300,
        height: 300,
        borderRadius: 40,
        position: 'relative',
    },
});
