import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    ScrollView, 
    TextInput,
    Image,
    Dimensions,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Alert
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../src/infrastructure/context/ThemeContext';
import { useEasyPay } from '../context/EasyPayContext';
import { groupRepository } from '../src/infrastructure/api/repositories/GroupRepository';

const { width } = Dimensions.get('window');

export default function NewExpenseScreen() {
    const { theme, fontScale } = useTheme();
    const { user, addItem } = useEasyPay();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams();
    
    const groupId = params.groupId as string;
    const [nombre, setNombre] = useState((params.name as string) || '');
    const [precio, setPrecio] = useState((params.amount as string) || '');
    const [cantidad, setCantidad] = useState(1);
    const [categoria, setCategoria] = useState((params.category as string) || 'Comida');
    
    const [members, setMembers] = useState<any[]>([]);
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const CATEGORIES = [
        { id: 'Comida', icon: 'restaurant', color: '#f59e0b' },
        { id: 'Transporte', icon: 'directions-car', color: '#3b82f6' },
        { id: 'Súper', icon: 'shopping-cart', color: '#10b981' },
        { id: 'Entretenimiento', icon: 'sports-esports', color: '#8b5cf6' },
        { id: 'Hogar', icon: 'home', color: '#ec4899' },
        { id: 'Otros', icon: 'more-horiz', color: '#64748b' }
    ];

    useEffect(() => {
        const fetchMembers = async () => {
            if (!groupId) {
                setIsLoading(false);
                return;
            }
            try {
                const groupData = await groupRepository.getGroup(groupId);
                const integrantes = groupData.integrantes || [];
                
                const sorted = [...integrantes].sort((a, b) => {
                    const idA = a.id || a;
                    const idB = b.id || b;
                    if (idA === user?.id) return -1;
                    if (idB === user?.id) return 1;
                    return 0;
                });
                
                setMembers(sorted);
                if (user?.id) {
                    setSelectedMembers([user.id]);
                }
            } catch (err) {
                console.error('Error fetching members:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchMembers();
    }, [groupId, user?.id]);

    const toggleMember = (memberId: string) => {
        setSelectedMembers(prev => 
            prev.includes(memberId) 
                ? prev.filter(id => id !== memberId) 
                : [...prev, memberId]
        );
    };

    const handleSave = async () => {
        if (!nombre) {
            Alert.alert('Error', 'Por favor ingresa un nombre para el gasto');
            return;
        }
        if (!precio || isNaN(parseFloat(precio))) {
            Alert.alert('Error', 'Por favor ingresa un precio válido');
            return;
        }
        if (selectedMembers.length === 0) {
            Alert.alert('Error', 'Debes seleccionar al menos una persona para dividir el gasto');
            return;
        }

        setIsSaving(true);
        try {
                await addItem({
                    nombre: nombre,
                    precio: parseFloat(precio),
                    cantidad: cantidad,
                    autorId: user?.id || '',
                    asignadoA: selectedMembers
                });
                
                // Deferir la navegación para evitar el choque con el teclado
                setTimeout(() => {
                    router.replace({ pathname: '/detalle-grupo', params: { id: groupId } });
                }, 150);
        } catch (err) {
            console.error('Error saving expense:', err);
            Alert.alert('Error', 'No se pudo guardar el gasto. Intenta de nuevo.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: theme.bg }}>
            <StatusBar style="light" />
            <Stack.Screen options={{ headerShown: false }} />
            
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                    {/* Header Premium */}
                    <View className="flex-row items-center justify-between px-6 py-4 w-full">
                        <TouchableOpacity 
                            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} 
                            style={{ backgroundColor: theme.cardSecondary }}
                            className="w-10 h-10 rounded-full items-center justify-center border border-white/5"
                        >
                            <Ionicons name="close" size={20} color={theme.text} />
                        </TouchableOpacity>
                        <Text style={{ color: theme.text, fontSize: 18 * fontScale }} className="font-black tracking-tight">Nuevo Gasto</Text>
                        <View className="w-10" />
                    </View>

                    <ScrollView 
                        className="flex-1" 
                        showsVerticalScrollIndicator={false} 
                        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 150, paddingTop: 10 }}
                    >
                        {/* Ticket Style Header */}
                        <View style={{ backgroundColor: theme.cardSecondary, borderColor: theme.border }} className="rounded-[40px] p-8 border mb-10 overflow-hidden relative">
                            <LinearGradient
                                colors={[theme.primary + '10', 'transparent']}
                                className="absolute inset-0"
                            />
                            
                            <View className="items-center mb-8">
                                <View style={{ backgroundColor: theme.primary }} className="w-14 h-14 rounded-2xl items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
                                    <MaterialIcons name="receipt-long" size={28} color="black" />
                                </View>
                                <Text style={{ color: theme.textSecondary }} className="text-[10px] font-black uppercase tracking-[4px]">Detalles del Ticket</Text>
                            </View>

                            <View className="gap-8">
                                {/* Name Input */}
                                <View>
                                    <Text style={{ color: theme.textSecondary }} className="text-[9px] font-black uppercase tracking-[2px] mb-3 ml-2">¿Qué compraste?</Text>
                                    <View style={{ backgroundColor: theme.bg }} className="rounded-2xl flex-row items-center px-5 border border-white/5">
                                        <FontAwesome5 name="shopping-bag" size={16} color={theme.primary} />
                                        <TextInput 
                                            value={nombre}
                                            onChangeText={setNombre}
                                            placeholder="Ej. Pizza, Uber, Cervezas..."
                                            placeholderTextColor={theme.textSecondary + '60'}
                                            style={{ color: theme.text }}
                                            className="flex-1 h-16 ml-3 font-bold text-base"
                                        />
                                    </View>
                                </View>

                                {/* Price & Qty Row */}
                                <View className="flex-row gap-4">
                                    <View className="flex-1">
                                        <Text style={{ color: theme.textSecondary }} className="text-[9px] font-black uppercase tracking-[2px] mb-3 ml-2">Precio Unitario</Text>
                                        <View style={{ backgroundColor: theme.bg }} className="rounded-2xl flex-row items-center px-5 border border-white/5 h-16">
                                            <Text style={{ color: theme.primary }} className="font-black text-lg mr-2">$</Text>
                                            <TextInput 
                                                value={precio}
                                                onChangeText={setPrecio}
                                                keyboardType="numeric"
                                                placeholder="0.00"
                                                placeholderTextColor={theme.textSecondary + '60'}
                                                style={{ color: theme.text }}
                                                className="flex-1 font-black text-xl"
                                            />
                                        </View>
                                    </View>
                                    <View className="w-[40%]">
                                        <Text style={{ color: theme.textSecondary }} className="text-[9px] font-black uppercase tracking-[2px] mb-3 ml-2">Cantidad</Text>
                                        <View style={{ backgroundColor: theme.bg }} className="rounded-2xl flex-row items-center justify-between px-2 border border-white/5 h-16">
                                            <TouchableOpacity 
                                                onPress={() => setCantidad(Math.max(1, cantidad - 1))}
                                                className="w-10 h-10 rounded-xl items-center justify-center bg-slate-800/50"
                                            >
                                                <MaterialIcons name="remove" size={18} color={theme.text} />
                                            </TouchableOpacity>
                                            <Text style={{ color: theme.text }} className="font-black text-lg">{cantidad}</Text>
                                            <TouchableOpacity 
                                                onPress={() => setCantidad(cantidad + 1)}
                                                className="w-10 h-10 rounded-xl items-center justify-center bg-slate-800/50"
                                            >
                                                <MaterialIcons name="add" size={18} color={theme.text} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            {/* Total Preview */}
                            <View className="mt-10 pt-8 border-t border-dashed border-white/10 items-center">
                                <Text style={{ color: theme.textSecondary }} className="text-[10px] font-black uppercase tracking-[2px] mb-2">Total del Item</Text>
                                <Text style={{ color: theme.primary }} className="text-4xl font-black">
                                    ${(parseFloat(precio || '0') * cantidad).toFixed(2)}
                                </Text>
                            </View>
                        </View>

                        {/* Category Section */}
                        <View className="mb-10">
                            <Text style={{ color: theme.text }} className="text-xl font-black mb-6 px-2">Categoría</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row px-2">
                                {CATEGORIES.map(cat => (
                                    <TouchableOpacity 
                                        key={cat.id}
                                        onPress={() => setCategoria(cat.id)}
                                        style={{ 
                                            backgroundColor: categoria === cat.id ? cat.color + '20' : theme.cardSecondary,
                                            borderColor: categoria === cat.id ? cat.color : 'transparent',
                                            width: 120,
                                            height: 100,
                                        }}
                                        className="mr-3 rounded-3xl border items-center justify-center gap-2"
                                    >
                                        <MaterialIcons name={cat.icon as any} size={28} color={categoria === cat.id ? cat.color : theme.textSecondary} />
                                        <Text 
                                            style={{ color: categoria === cat.id ? theme.text : theme.textSecondary }} 
                                            className="text-[9px] font-black uppercase tracking-widest text-center px-2"
                                            numberOfLines={2}
                                            adjustsFontSizeToFit
                                        >
                                            {cat.id}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Assignment Section */}
                        <View className="mb-10">
                            <View className="flex-row justify-between items-center mb-6 px-2">
                                <View>
                                    <Text style={{ color: theme.text }} className="text-xl font-black">¿Quiénes comparten?</Text>
                                    <Text style={{ color: theme.textSecondary }} className="text-xs font-medium">El gasto se dividirá entre {selectedMembers.length}</Text>
                                </View>
                                <TouchableOpacity 
                                    onPress={() => {
                                        if (selectedMembers.length === members.length) {
                                            setSelectedMembers([user?.id || '']);
                                        } else {
                                            setSelectedMembers(members.map(m => m.id || m));
                                        }
                                    }}
                                >
                                    <Text style={{ color: theme.primary }} className="font-bold text-sm uppercase tracking-wider">
                                        {selectedMembers.length === members.length ? 'Limpiar' : 'Todos'}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {isLoading ? (
                                <ActivityIndicator size="small" color={theme.primary} />
                            ) : (
                                <View className="flex-row flex-wrap gap-4 justify-between">
                                    {members.map(member => {
                                        const mId = member.id || member;
                                        const mNombre = member.nombre || 'Usuario';
                                        const isActive = selectedMembers.includes(mId);
                                        const isMe = mId === user?.id;

                                        return (
                                            <TouchableOpacity 
                                                key={mId}
                                                onPress={() => toggleMember(mId)}
                                                style={{ 
                                                    width: (width - 64) / 3,
                                                    backgroundColor: isActive ? theme.primary + '15' : theme.cardSecondary,
                                                    borderColor: isActive ? theme.primary + '50' : 'transparent'
                                                }}
                                                className="p-4 rounded-3xl border items-center gap-3 shadow-sm"
                                            >
                                                <View className="relative">
                                                    <View style={{ backgroundColor: isActive ? theme.primary : theme.card }} className="w-12 h-12 rounded-full items-center justify-center border-2 border-slate-900 shadow-sm">
                                                        <Text style={{ color: isActive ? 'black' : theme.textSecondary }} className="font-black text-lg">
                                                            {mNombre.charAt(0).toUpperCase()}
                                                        </Text>
                                                    </View>
                                                    {isActive && (
                                                        <View style={{ backgroundColor: theme.primary }} className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full items-center justify-center border-2 border-[#0f172a]">
                                                            <MaterialIcons name="check" size={10} color="black" />
                                                        </View>
                                                    )}
                                                </View>
                                                <Text style={{ color: isActive ? theme.text : theme.textSecondary }} className="text-[10px] font-black uppercase text-center" numberOfLines={1}>
                                                    {isMe ? 'Tú' : mNombre.split(' ')[0]}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            )}
                        </View>
                    </ScrollView>

                    {/* Footer Actions */}
                    <View 
                        style={{ 
                            backgroundColor: theme.bg, 
                            paddingBottom: insets.bottom + 16,
                            borderTopWidth: 1,
                            borderTopColor: theme.border + '15'
                        }} 
                        className="px-6 pt-6 flex-row gap-4"
                    >
                        <TouchableOpacity 
                            activeOpacity={0.8}
                            onPress={handleSave}
                            disabled={isSaving}
                            className="flex-1 h-16 rounded-2xl overflow-hidden shadow-xl shadow-blue-500/30"
                        >
                            <LinearGradient
                                colors={[theme.primary, '#3b82f6']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                className="w-full h-full items-center justify-center flex-row gap-2"
                            >
                                {isSaving ? (
                                    <ActivityIndicator color="black" />
                                ) : (
                                    <>
                                        <Text className="text-black font-black text-base uppercase tracking-widest">Registrar Gasto</Text>
                                        <Ionicons name="arrow-forward" size={18} color="black" />
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </KeyboardAvoidingView>
        </View>
    );
}
