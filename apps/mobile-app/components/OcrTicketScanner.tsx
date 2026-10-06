import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    ScrollView,
    ActivityIndicator,
    Alert,
    Image,
    TextInput,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

import OcrService, { TicketData, TicketItem } from '../src/infrastructure/services/OcrService';

interface Props {
    visible: boolean;
    onClose: () => void;
    onConfirm: (data: TicketData) => void;
    theme: any;
}

type Step = 'select' | 'preview' | 'processing' | 'result' | 'edit';

export default function OcrTicketScanner({ visible, onClose, onConfirm, theme }: Props) {
    const [step, setStep] = useState<Step>('select');
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [ticketData, setTicketData] = useState<TicketData | null>(null);
    const [editableItems, setEditableItems] = useState<TicketItem[]>([]);

    const reset = () => {
        setStep('select');
        setImageUri(null);
        setTicketData(null);
        setEditableItems([]);
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const pickImage = async (source: 'camera' | 'gallery') => {
        try {
            const uri = source === 'camera'
                ? await OcrService.pickFromCamera()
                : await OcrService.pickFromGallery();

            if (!uri) return;
            setImageUri(uri);
            setStep('preview');
        } catch (e: any) {
            Alert.alert('Error', e.message ?? 'No se pudo obtener la imagen.');
        }
    };

    const processImage = async () => {
        if (!imageUri) return;
        setStep('processing');
        try {
            const data = await OcrService.extractTicketData(imageUri);
            setTicketData(data);
            setEditableItems(data.items);
            setStep('result');
        } catch (e) {
            Alert.alert('Error', 'No se pudo procesar el ticket. Intenta con una foto más clara.');
            setStep('preview');
        }
    };

    const updateItem = (index: number, field: keyof TicketItem, value: string) => {
        setEditableItems(prev => prev.map((item, i) =>
            i === index
                ? { ...item, [field]: field === 'name' ? value : parseFloat(value) || 0 }
                : item
        ));
    };

    const removeItem = (index: number) => {
        setEditableItems(prev => prev.filter((_, i) => i !== index));
    };

    const addItem = () => {
        setEditableItems(prev => [...prev, { name: '', price: 0, quantity: 1 }]);
    };

    const handleConfirm = () => {
        if (!ticketData) return;
        const finalTotal = editableItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
        onConfirm({
            ...ticketData,
            items: editableItems,
            total: finalTotal,
        });
        reset();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={handleClose}>
            <View style={{ flex: 1, backgroundColor: theme.bg }}>

                {/* Header */}
                <View style={{ borderBottomColor: theme.border }} className="flex-row items-center justify-between px-6 py-5 border-b">
                    <TouchableOpacity onPress={handleClose} className="w-10 h-10 rounded-full bg-white/5 items-center justify-center">
                        <Ionicons name="close" size={22} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={{ color: theme.text }} className="font-black text-lg tracking-tight">
                        {step === 'select' && 'Escanear Ticket'}
                        {step === 'preview' && 'Confirmar Foto'}
                        {step === 'processing' && 'Analizando...'}
                        {step === 'result' && 'Ticket Detectado'}
                        {step === 'edit' && 'Editar Items'}
                    </Text>
                    <View className="w-10" />
                </View>

                <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120 }}>

                    {/* PASO 1: Seleccionar fuente */}
                    {step === 'select' && (
                        <View className="px-6 pt-6">
                            <View className="items-center mb-10">
                                <View style={{ backgroundColor: theme.primary + '20' }} className="w-24 h-24 rounded-[36px] items-center justify-center mb-4">
                                    <MaterialIcons name="document-scanner" size={48} color={theme.primary} />
                                </View>
                                <Text style={{ color: theme.text }} className="text-2xl font-black text-center">
                                    ¿Cómo quieres subir el ticket?
                                </Text>
                                <Text style={{ color: theme.textSecondary }} className="text-center text-sm mt-2 px-8">
                                    Tomaremos la foto y detectaremos automáticamente los productos y precios.
                                </Text>
                            </View>

                            <View className="gap-4">
                                <TouchableOpacity
                                    onPress={() => pickImage('camera')}
                                    style={{ backgroundColor: theme.primary }}
                                    className="flex-row items-center gap-4 p-6 rounded-[28px]"
                                >
                                    <View className="w-14 h-14 bg-white/20 rounded-2xl items-center justify-center">
                                        <Ionicons name="camera" size={28} color="white" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-white font-black text-lg">Tomar Foto</Text>
                                        <Text className="text-white/70 text-xs mt-0.5">Usa la cámara para capturar el ticket</Text>
                                    </View>
                                    <MaterialIcons name="chevron-right" size={24} color="white" />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => pickImage('gallery')}
                                    style={{ backgroundColor: theme.cardSecondary, borderColor: theme.border }}
                                    className="flex-row items-center gap-4 p-6 rounded-[28px] border"
                                >
                                    <View style={{ backgroundColor: theme.primary + '20' }} className="w-14 h-14 rounded-2xl items-center justify-center">
                                        <Ionicons name="images" size={28} color={theme.primary} />
                                    </View>
                                    <View className="flex-1">
                                        <Text style={{ color: theme.text }} className="font-black text-lg">Desde Galería</Text>
                                        <Text style={{ color: theme.textSecondary }} className="text-xs mt-0.5">Selecciona una foto existente</Text>
                                    </View>
                                    <MaterialIcons name="chevron-right" size={24} color={theme.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            <View style={{ backgroundColor: '#f59e0b20', borderColor: '#f59e0b30' }} className="mt-6 p-4 rounded-2xl border flex-row gap-3">
                                <MaterialIcons name="tips-and-updates" size={18} color="#f59e0b" />
                                <Text className="text-yellow-500/80 text-xs flex-1">
                                    Para mejores resultados asegúrate de que el ticket esté bien iluminado y sin dobleces.
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* PASO 2: Preview de la imagen */}
                    {step === 'preview' && imageUri && (
                        <View className="px-6 pt-6">
                            <Image
                                source={{ uri: imageUri }}
                                className="w-full rounded-[28px]"
                                style={{ height: 400 }}
                                resizeMode="cover"
                            />
                            <View className="gap-3 mt-6">
                                <TouchableOpacity
                                    onPress={processImage}
                                    style={{ backgroundColor: theme.primary }}
                                    className="py-5 rounded-2xl items-center"
                                >
                                    <Text className="text-white font-black text-base">Analizar Ticket</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setStep('select')}
                                    style={{ backgroundColor: theme.cardSecondary }}
                                    className="py-4 rounded-2xl items-center"
                                >
                                    <Text style={{ color: theme.textSecondary }} className="font-bold">Tomar otra foto</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* PASO 3: Procesando */}
                    {step === 'processing' && (
                        <View className="items-center justify-center px-6 pt-20">
                            <View style={{ backgroundColor: theme.primary + '15' }} className="w-32 h-32 rounded-full items-center justify-center mb-6">
                                <ActivityIndicator size="large" color={theme.primary} />
                            </View>
                            <Text style={{ color: theme.text }} className="text-xl font-black text-center mb-2">
                                Analizando ticket...
                            </Text>
                            <Text style={{ color: theme.textSecondary }} className="text-center text-sm px-10">
                                Detectando productos, precios y totales automáticamente.
                            </Text>
                        </View>
                    )}

                    {/* PASO 4: Resultado */}
                    {step === 'result' && ticketData && (
                        <View className="px-6 pt-6">
                            {/* Nombre del restaurante */}
                            <View style={{ backgroundColor: theme.primary + '15', borderColor: theme.primary + '30' }} className="p-5 rounded-[24px] border mb-5">
                                <Text style={{ color: theme.primary }} className="text-[10px] font-black uppercase tracking-widest mb-1">Establecimiento</Text>
                                <Text style={{ color: theme.text }} className="text-xl font-black">{ticketData.restaurantName}</Text>
                            </View>

                            {/* Items detectados */}
                            <Text style={{ color: theme.textSecondary }} className="text-[10px] font-black uppercase tracking-widest mb-3">
                                Productos detectados ({editableItems.length})
                            </Text>

                            <View style={{ backgroundColor: theme.cardSecondary, borderColor: theme.border }} className="rounded-[24px] border overflow-hidden mb-5">
                                {editableItems.map((item, index) => (
                                    <View
                                        key={index}
                                        style={{ borderBottomColor: theme.border }}
                                        className={`flex-row items-center p-4 ${index < editableItems.length - 1 ? 'border-b' : ''}`}
                                    >
                                        <View className="flex-1">
                                            <Text style={{ color: theme.text }} className="font-bold text-sm">{item.name}</Text>
                                            {item.quantity > 1 && (
                                                <Text style={{ color: theme.textSecondary }} className="text-xs">x{item.quantity}</Text>
                                            )}
                                        </View>
                                        <Text style={{ color: theme.primary }} className="font-black text-base ml-4">
                                            ${(item.price * item.quantity).toFixed(2)}
                                        </Text>
                                    </View>
                                ))}
                            </View>

                            {/* Totales */}
                            <View style={{ backgroundColor: theme.cardSecondary, borderColor: theme.border }} className="rounded-[24px] border p-5 mb-5">
                                {ticketData.subtotal > 0 && (
                                    <View className="flex-row justify-between mb-2">
                                        <Text style={{ color: theme.textSecondary }} className="text-sm">Subtotal</Text>
                                        <Text style={{ color: theme.text }} className="font-bold">${ticketData.subtotal.toFixed(2)}</Text>
                                    </View>
                                )}
                                {ticketData.tax > 0 && (
                                    <View className="flex-row justify-between mb-2">
                                        <Text style={{ color: theme.textSecondary }} className="text-sm">Impuesto</Text>
                                        <Text style={{ color: theme.text }} className="font-bold">${ticketData.tax.toFixed(2)}</Text>
                                    </View>
                                )}
                                {ticketData.tip > 0 && (
                                    <View className="flex-row justify-between mb-2">
                                        <Text style={{ color: theme.textSecondary }} className="text-sm">Propina</Text>
                                        <Text style={{ color: theme.text }} className="font-bold">${ticketData.tip.toFixed(2)}</Text>
                                    </View>
                                )}
                                <View style={{ borderTopColor: theme.border }} className="flex-row justify-between pt-3 mt-2 border-t">
                                    <Text style={{ color: theme.text }} className="font-black text-base">Total</Text>
                                    <Text style={{ color: theme.primary }} className="font-black text-xl">${ticketData.total.toFixed(2)}</Text>
                                </View>
                            </View>

                            <TouchableOpacity
                                onPress={() => setStep('edit')}
                                style={{ borderColor: theme.border }}
                                className="flex-row items-center justify-center gap-2 py-3 rounded-2xl border mb-3"
                            >
                                <MaterialIcons name="edit" size={16} color={theme.textSecondary} />
                                <Text style={{ color: theme.textSecondary }} className="font-bold text-sm">Editar items</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* PASO 5: Editar items */}
                    {step === 'edit' && (
                        <View className="px-6 pt-6">
                            <Text style={{ color: theme.textSecondary }} className="text-[10px] font-black uppercase tracking-widest mb-4">
                                Editar productos
                            </Text>

                            {editableItems.map((item, index) => (
                                <View key={index} style={{ backgroundColor: theme.cardSecondary, borderColor: theme.border }} className="rounded-[20px] border p-4 mb-3">
                                    <View className="flex-row items-center gap-2 mb-3">
                                        <TextInput
                                            value={item.name}
                                            onChangeText={v => updateItem(index, 'name', v)}
                                            style={{ color: theme.text, backgroundColor: theme.bg }}
                                            className="flex-1 font-bold p-2 rounded-xl text-sm"
                                            placeholder="Nombre del producto"
                                            placeholderTextColor={theme.textSecondary}
                                        />
                                        <TouchableOpacity onPress={() => removeItem(index)} className="w-8 h-8 bg-red-500/10 rounded-full items-center justify-center">
                                            <MaterialIcons name="close" size={16} color="#ef4444" />
                                        </TouchableOpacity>
                                    </View>
                                    <View className="flex-row gap-3">
                                        <View className="flex-1">
                                            <Text style={{ color: theme.textSecondary }} className="text-[10px] font-black uppercase mb-1">Precio</Text>
                                            <TextInput
                                                value={item.price.toString()}
                                                onChangeText={v => updateItem(index, 'price', v)}
                                                style={{ color: theme.text, backgroundColor: theme.bg }}
                                                className="font-bold p-2 rounded-xl text-sm"
                                                keyboardType="decimal-pad"
                                            />
                                        </View>
                                        <View className="flex-1">
                                            <Text style={{ color: theme.textSecondary }} className="text-[10px] font-black uppercase mb-1">Cantidad</Text>
                                            <TextInput
                                                value={item.quantity.toString()}
                                                onChangeText={v => updateItem(index, 'quantity', v)}
                                                style={{ color: theme.text, backgroundColor: theme.bg }}
                                                className="font-bold p-2 rounded-xl text-sm"
                                                keyboardType="number-pad"
                                            />
                                        </View>
                                    </View>
                                </View>
                            ))}

                            <TouchableOpacity
                                onPress={addItem}
                                style={{ borderColor: theme.primary + '50' }}
                                className="flex-row items-center justify-center gap-2 py-4 rounded-2xl border border-dashed mb-4"
                            >
                                <Ionicons name="add-circle-outline" size={20} color={theme.primary} />
                                <Text style={{ color: theme.primary }} className="font-bold">Agregar item</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => setStep('result')}
                                style={{ backgroundColor: theme.cardSecondary }}
                                className="py-4 rounded-2xl items-center"
                            >
                                <Text style={{ color: theme.text }} className="font-bold">← Volver al resumen</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Botones de acción al final del scroll */}
                    {(step === 'result' || step === 'edit') && (
                        <View className="px-6 pb-20 pt-4">
                            <TouchableOpacity
                                onPress={handleConfirm}
                                style={{ backgroundColor: theme.primary }}
                                className="py-5 rounded-2xl items-center shadow-xl"
                            >
                                <Text className="text-white font-black text-base">
                                    Usar este ticket ({editableItems.length} items)
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
            </View>
        </Modal>
    );
}
