import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Image, Dimensions, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import { ocrRepository } from '../src/infrastructure/api/repositories/OcrRepository';
import { useEasyPay } from '../context/EasyPayContext';

import { OcrService } from '../src/infrastructure/services/OcrService';

const { width } = Dimensions.get('window');

export default function OCRScannerScreen() {
    const { groupId } = useLocalSearchParams();
    const { user } = useEasyPay();
    const [permission, requestPermission] = useCameraPermissions();
    const [isScanning, setIsScanning] = useState(false);
    const [scannedImage, setScannedImage] = useState<string | null>(null);
    const [scanData, setScanData] = useState<any>(null);
    const [hasError, setHasError] = useState(false);
    const cameraRef = useRef<any>(null);
    const router = useRouter();

    const processScan = async (base64: string) => {
        setIsScanning(true);
        setHasError(false);
        
        try {
            // Usamos OcrService que es más robusto y tiene lógica de limpieza de items
            const result = await OcrService.extractTicketData(base64);
            
            if (result && result.items && result.items.length > 0) {
                setScanData(result);
                setIsScanning(false);
            } else {
                // Fallback al repositorio si el servicio falla o no encuentra items
                const repoResult: any = await ocrRepository.scanTicket(
                    base64, 
                    groupId as string, 
                    user?.id
                );
                
                if (repoResult.success) {
                    setScanData(repoResult.data);
                    setIsScanning(false);
                } else {
                    throw new Error("No se detectaron items en el ticket");
                }
            }
        } catch (e: any) {
            console.error("OCR Scan Error:", e);
            setIsScanning(false);
            setHasError(true);
            Alert.alert(
                "Error en escaneo", 
                "No pudimos procesar el ticket con claridad. Intenta capturar la imagen más de cerca y con mejor luz, asegurándote de que los precios sean visibles.",
                [{ text: "OK" }]
            );
        }
    };

    if (!permission) {
        return <View className="flex-1 bg-[#0f172a]" />;
    }

    if (!permission.granted) {
        return (
            <View className="flex-1 bg-[#0f172a] items-center justify-center p-10">
                <View className="w-20 h-20 bg-blue-500/10 rounded-full items-center justify-center mb-8">
                    <MaterialIcons name="videocam-off" size={40} color="#3b82f6" />
                </View>
                <Text className="text-white text-2xl font-black text-center mb-4">Acceso a Cámara</Text>
                <Text className="text-slate-400 text-center text-base leading-6 mb-10">Necesitamos permiso para usar la cámara y así poder escanear tus tickets de forma automática.</Text>
                <Pressable 
                    onPress={requestPermission} 
                    className="bg-blue-600 px-10 py-5 rounded-2xl shadow-2xl shadow-blue-500/40 w-full"
                >
                    <Text className="text-white font-black text-center">CONCEDER PERMISO</Text>
                </Pressable>
                <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} className="mt-6 py-2">
                    <Text className="text-slate-500 font-bold">Ahora no</Text>
                </Pressable>
            </View>
        );
    }

    const takePicture = async () => {
        if (cameraRef.current) {
            try {
                const photo = await cameraRef.current.takePictureAsync({ 
                    quality: 0.8,
                    base64: true,
                    exif: false
                });
                if (!photo || !photo.uri) throw new Error("No se pudo capturar la imagen");
                
                setScannedImage(photo.uri);
                processScan(photo.base64);
            } catch (e) {
                console.error(e);
                Alert.alert("Error de Cámara", "No se pudo capturar la foto. Intenta de nuevo.");
            }
        }
    };

    return (
        <View className="flex-1 bg-black">
            <StatusBar style="light" />
            <Stack.Screen options={{ headerShown: false }} />
            
            {!scannedImage ? (
                <CameraView 
                    style={StyleSheet.absoluteFill} 
                    ref={cameraRef}
                    facing="back"
                >
                    <SafeAreaView className="flex-1 justify-between p-6" edges={['top', 'bottom']}>
                        <View className="flex-row justify-between items-center mt-4">
                            <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} className="w-12 h-12 bg-black/50 rounded-full items-center justify-center border border-white/10">
                                <MaterialIcons name="close" size={28} color="white" />
                            </Pressable>
                            <View className="bg-black/50 px-5 py-2.5 rounded-full border border-white/20">
                                <Text className="text-white text-[10px] font-black tracking-[2px] uppercase">AI Scanner Pro</Text>
                            </View>
                            <View className="w-12 h-12 bg-black/50 rounded-full items-center justify-center border border-white/10">
                                <MaterialIcons name="flash-on" size={24} color="#fbbf24" />
                            </View>
                        </View>

                        <View className="items-center w-full px-10">
                            <View 
                                className="w-full h-[480px] max-w-sm border-2 border-white/20 rounded-[40px] items-center justify-center relative bg-white/5"
                            >
                                <View className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-blue-500 rounded-tl-[30px]" />
                                <View className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-blue-500 rounded-tr-[30px]" />
                                <View className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-blue-500 rounded-bl-[30px]" />
                                <View className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-blue-500 rounded-br-[30px]" />
                                
                                <View className="w-full h-1 bg-blue-500/50 absolute shadow-glow" />
                            </View>
                            <View className="bg-blue-600/80 mt-10 px-6 py-3 rounded-2xl">
                                <Text className="text-white font-black text-xs tracking-widest uppercase">Detectando Recibo...</Text>
                            </View>
                        </View>

                        <View className="items-center mb-8">
                            <Pressable 
                                onPress={takePicture}
                                className="w-24 h-24 rounded-full border-4 border-white items-center justify-center bg-black/20"
                            >
                                <View className="w-18 h-18 rounded-full bg-white items-center justify-center shadow-2xl">
                                    <View className="w-16 h-16 rounded-full border-2 border-slate-200" />
                                </View>
                            </Pressable>
                            <Text className="text-white/60 text-[10px] font-black tracking-widest uppercase mt-4">Capturar para Procesar</Text>
                        </View>
                    </SafeAreaView>
                </CameraView>
            ) : (
                <View className="flex-1 bg-[#0f172a]">
                    <Image source={{ uri: scannedImage }} className="flex-1 opacity-60" resizeMode="cover" />
                    
                    {isScanning ? (
                        <View className="absolute inset-0 items-center justify-center">
                            <BlurView intensity={80} tint="dark" className="absolute inset-0" />
                            <View className="bg-slate-900/40 p-10 rounded-[50px] items-center border border-white/10 shadow-2xl">
                                <ActivityIndicator size="large" color="#3b82f6" />
                                <Text className="text-white text-xl font-black mt-8 text-center uppercase tracking-[3px]">Analizando ticket...</Text>
                                <Text className="text-slate-400 text-sm mt-3 text-center leading-5 px-4 font-medium italic">Nuestra IA está extrayendo productos, precios e impuestos...</Text>
                                
                                <View className="flex-row gap-1 mt-6">
                                    {[0, 1, 2].map(i => (
                                        <View key={i} className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                    ))}
                                </View>
                            </View>
                        </View>
                    ) : hasError ? (
                        <View className="absolute inset-0 items-center justify-center px-6">
                            <BlurView intensity={80} tint="dark" className="absolute inset-0" />
                            <View className="bg-slate-900/90 p-10 rounded-[50px] items-center border border-red-500/20 shadow-2xl w-full">
                                <View className="w-20 h-20 bg-red-500/10 rounded-full items-center justify-center mb-6">
                                    <MaterialIcons name="error-outline" size={40} color="#f43f5e" />
                                </View>
                                <Text className="text-white text-xl font-black text-center uppercase tracking-[2px]">Error de Lectura</Text>
                                <Text className="text-slate-400 text-sm mt-4 text-center leading-6 mb-8">
                                    No pudimos procesar el ticket. Asegúrate de tener buena iluminación y que el texto sea legible.
                                </Text>
                                
                                <Pressable 
                                    onPress={() => setScannedImage(null)}
                                    className="bg-blue-600 w-full py-5 rounded-2xl items-center mb-4"
                                >
                                    <Text className="text-white font-black">REINTENTAR CAPTURA</Text>
                                </Pressable>
                            </View>
                        </View>
                    ) : (
                        <SafeAreaView className="absolute inset-0 justify-end p-6" edges={['bottom']}>
                            <View className="bg-slate-900 border border-white/10 rounded-[45px] p-10 shadow-2xl">
                                <View className="flex-row items-center gap-5 mb-8">
                                    <View className="w-16 h-16 bg-emerald-500/10 rounded-3xl items-center justify-center border border-emerald-500/20">
                                        <MaterialIcons name="auto-awesome" size={32} color="#10b981" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-white font-black text-2xl tracking-tighter">Lectura Éxitosa</Text>
                                        <Text className="text-slate-400 text-sm font-bold opacity-70">{scanData?.items?.length || 0} ITEMS IDENTIFICADOS</Text>
                                    </View>
                                </View>
                                
                                <View className="bg-white/5 rounded-3xl p-6 mb-10 border border-white/5">
                                    <View className="flex-row justify-between mb-4">
                                        <Text className="text-slate-400 font-bold">Lugar</Text>
                                        <Text className="text-white font-black">{scanData?.restaurant_name || "Desconocido"}</Text>
                                    </View>
                                    <View className="flex-row justify-between pt-4 border-t border-white/5">
                                        <Text className="text-slate-400 font-bold text-lg">Total Ticket</Text>
                                        <Text className="text-emerald-400 font-black text-2xl">${(scanData?.total || 0).toFixed(2)}</Text>
                                    </View>
                                </View>

                                <View className="gap-4">
                                    <Pressable 
                                        onPress={() => router.replace({
                                            pathname: '/ocr-review',
                                            params: { scanData: JSON.stringify(scanData), groupId: groupId as string }
                                        })}
                                        className="bg-blue-600 py-6 rounded-[25px] items-center shadow-2xl shadow-blue-500/40 active:scale-95"
                                    >
                                        <Text className="text-white font-black text-lg uppercase tracking-widest">Revisar Resultados</Text>
                                    </Pressable>
                                    
                                    <Pressable 
                                        onPress={() => setScannedImage(null)}
                                        className="py-4 items-center bg-white/5 rounded-2xl border border-white/10"
                                    >
                                        <Text className="text-white font-black text-xs tracking-widest uppercase">Descartar y Repetir</Text>
                                    </Pressable>
                                </View>
                            </View>
                        </SafeAreaView>
                    )}
                </View>
            )}
        </View>
    );
}
