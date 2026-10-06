import { useEasyPay } from '../../context/EasyPayContext';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Dimensions, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MotiView } from 'moti';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTheme } from '../../src/infrastructure/context/ThemeContext';

import { groupRepository } from '../../src/infrastructure/api/repositories/GroupRepository';

const { width, height } = Dimensions.get('window');

export default function QRScreen() {
    const { theme, fontScale } = useTheme();
    const { user  } = useEasyPay();
    const router = useRouter();
    const [code, setCode] = useState('');
    const [isJoining, setIsJoining] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [permission, requestPermission] = useCameraPermissions();

    const handleJoinGroup = async (groupCode: string) => {
        const finalCode = groupCode.trim().toUpperCase();
        if (finalCode.length < 4) return; // Permitir flexibilidad pero mínimo 4

        if (!user) {
            Alert.alert('Error', 'Debes iniciar sesión para unirte a un grupo');
            return;
        }

        setIsJoining(true);
        try {
            const group = await groupRepository.joinGroup(finalCode, {
                id: user.id,
                nombre: user.nombre,
                email: user.email,
                avatar: user.avatar || ''
            } as any);

            if (group && group.id) {
                Alert.alert('¡Éxito!', `Te has unido al grupo ${group.name}`);
                setShowScanner(false);
                router.replace({ pathname: '/(tabs)/groups' } as any);
            }
        } catch (error: any) {
            const message = error.response?.data?.detail || 'No se pudo unir al grupo. Verifica el código.';
            Alert.alert('Error', message);
        } finally {
            setIsJoining(false);
        }
    };

    const handleOpenScanner = async () => {
        if (!permission?.granted) {
            const res = await requestPermission();
            if (!res.granted) {
                Alert.alert('Permiso denegado', 'Se necesita acceso a la cámara para escanear códigos QR.');
                return;
            }
        }
        setShowScanner(true);
    };

    if (showScanner) {
        return (
            <View className="flex-1 bg-black">
                <StatusBar style={theme.isDark ? "light" : "dark"} />
                <CameraView
                    style={StyleSheet.absoluteFill}
                    facing="back"
                    onBarcodeScanned={({ data }) => {
                        if (isJoining) return;
                        // El código QR puede ser el código directo o un link. 
                        // Extraer el código (suponiendo que es el data directo por ahora)
                        handleJoinGroup(data);
                    }}
                />

                {/* Overlay del Scanner */}
                <SafeAreaView className="flex-1 justify-between p-6">
                    <View className="flex-row items-center justify-between">
                        <TouchableOpacity onPress={() => setShowScanner(false)} className="w-12 h-12 rounded-full bg-black/50 items-center justify-center">
                            <Ionicons name="close" size={28} color="white" />
                        </TouchableOpacity>
                        <Text className="text-white font-black text-lg">Escanear QR</Text>
                        <View className="w-12" />
                    </View>

                    <View className="items-center justify-center">
                        <View className="w-64 h-64 border-2 border-white/50 rounded-[40px] border-dashed items-center justify-center">
                            <View className="w-full h-0.5 bg-blue-500 absolute" />
                        </View>
                        <Text className="text-white/70 text-center mt-10 font-bold">Apunta al código QR del grupo</Text>
                    </View>

                    <View className="items-center mb-10">
                        {isJoining && <ActivityIndicator size="large" color="#3b82f6" />}
                    </View>
                </SafeAreaView>
            </View>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View className="px-6 py-6 flex-row items-center justify-between">
                <TouchableOpacity onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back-ios" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={{ color: theme.text, fontSize: 18 * fontScale }} className="font-black">Unirse a Grupo</Text>
                <View className="w-6" />
            </View>

            <View className="flex-1 items-center justify-center px-10">
                {/* QR Scanner Mockup / Trigger */}
                <TouchableOpacity 
                    onPress={handleOpenScanner}
                    className="relative items-center justify-center mb-12"
                >
                    <MotiView 
                        animate={{ 
                            scale: [1, 1.05, 1],
                            opacity: [0.5, 1, 0.5]
                        }}
                        transition={{ 
                            loop: true,
                            duration: 2000,
                            type: 'timing'
                        }}
                        style={{ borderColor: theme.primary }}
                        className="w-64 h-64 border-2 rounded-[40px] border-dashed items-center justify-center"
                    >
                        <MaterialIcons name="qr-code-scanner" size={80} color={theme.primary} />
                    </MotiView>

                    {/* Corners */}
                    <View style={[styles.cornerTL, { borderColor: theme.primary }]} className="border-t-4 border-l-4 rounded-tl-3xl absolute -top-2 -left-2 w-12 h-12" />
                    <View style={[styles.cornerTR, { borderColor: theme.primary }]} className="border-t-4 border-r-4 rounded-tr-3xl absolute -top-2 -right-2 w-12 h-12" />
                    <View style={[styles.cornerBL, { borderColor: theme.primary }]} className="border-b-4 border-l-4 rounded-bl-3xl absolute -bottom-2 -left-2 w-12 h-12" />
                    <View style={[styles.cornerBR, { borderColor: theme.primary }]} className="border-b-4 border-r-4 rounded-br-3xl absolute -bottom-2 -right-2 w-12 h-12" />

                    <View style={{ backgroundColor: theme.primary }} className="absolute -bottom-4 px-6 py-2 rounded-full">
                        <Text className="text-black font-black text-[10px] uppercase tracking-widest">Abrir Cámara</Text>
                    </View>
                </TouchableOpacity>

                <Text style={{ color: theme.textSecondary, fontSize: 12 * fontScale }} className="text-center font-bold mb-10 px-6 leading-5">
                    Apunta con tu cámara al código QR del grupo o ingresa el código manual abajo.
                </Text>

                {/* Manual Code Input */}
                <View style={{ backgroundColor: theme.cardSecondary, borderColor: theme.border }} className="w-full flex-row items-center px-6 py-4 rounded-[24px] border border-dashed">
                    <MaterialIcons name="tag" size={20} color={theme.primary} className="mr-3" />
                    <TextInput 
                        placeholder="CÓDIGO DE 8 DÍGITOS"
                        placeholderTextColor={theme.textSecondary + '80'}
                        value={code}
                        onChangeText={setCode}
                        style={{ 
                            color: theme.primary, 
                            fontSize: 20 * fontScale,
                            letterSpacing: 8
                        }}
                        className="flex-1 font-black uppercase"
                        maxLength={8}
                        editable={!isJoining}
                        autoCapitalize="characters"
                    />
                </View>

                <TouchableOpacity 
                    onPress={() => handleJoinGroup(code)}
                    disabled={code.length < 4 || isJoining}
                    style={{ backgroundColor: code.length >= 4 ? theme.primary : theme.glassBg }}
                    className="w-full py-5 rounded-[24px] items-center mt-6 shadow-xl shadow-blue-500/10"
                >
                    {isJoining ? (
                        <ActivityIndicator color="black" />
                    ) : (
                        <Text style={{ color: code.length >= 4 ? 'black' : theme.textSecondary }} className="font-black uppercase tracking-[4px]">Unirse Ahora</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    cornerTL: { },
    cornerTR: { },
    cornerBL: { },
    cornerBR: { },
});
