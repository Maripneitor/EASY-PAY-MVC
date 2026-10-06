import { useEasyPay } from '../../context/EasyPayContext';
import { groupRepository } from '../../src/infrastructure/api/repositories/GroupRepository';
import React, { useState } from 'react';
import { 
    View, 
    Text, 
    Modal, 
    TouchableOpacity, 
    TextInput, 
    ScrollView, 
    KeyboardAvoidingView, 
    Platform,
    ActivityIndicator
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../src/infrastructure/context/ThemeContext';

import { MotiView, AnimatePresence } from 'moti';
import { getApiBaseUrl } from '../../src/infrastructure/api/network.config';

interface AddExpenseModalProps {
    isVisible: boolean;
    onClose: () => void;
    members: { id: string, nombre: string }[];
    groupId: string;
    onSuccess: () => void;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ 
    isVisible, 
    onClose, 
    members, 
    groupId,
    onSuccess
}) => {
    const { theme, fontScale } = useTheme();
    const { user  } = useEasyPay();
    const [nombre, setNombre] = useState('');
    const [precio, setPrecio] = useState('');
    const [categoria, setCategoria] = useState('Comida');
    const [loading, setLoading] = useState(false);
    const [selectedMembers, setSelectedMembers] = useState<string[]>(members.map(m => m.id));

    const CATEGORIES = [
        { id: 'Comida', icon: 'restaurant', color: '#f59e0b' },
        { id: 'Transporte', icon: 'directions-car', color: '#3b82f6' },
        { id: 'Súper', icon: 'shopping-cart', color: '#10b981' },
        { id: 'Entretenimiento', icon: 'sports-esports', color: '#8b5cf6' },
        { id: 'Hogar', icon: 'home', color: '#ec4899' },
        { id: 'Otros', icon: 'more-horiz', color: '#64748b' }
    ];

    const toggleMember = (id: string) => {
        setSelectedMembers(prev => 
            prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
        );
    };

    const handleSubmit = async () => {
        if (!nombre || !precio || selectedMembers.length === 0) return;

        setLoading(true);
        try {
            const itemData = {
                nombre: nombre.trim(),
                precio: parseFloat(precio),
                cantidad: 1,
                categoria: categoria,
                autorId: user?.id || 'me', 
                asignadoA: selectedMembers
            };

            await groupRepository.addItem(groupId, itemData);
            
            onSuccess();
            onClose();
            setNombre('');
            setPrecio('');
            setCategoria('Comida');
        } catch (error) {
            console.error(error);
            alert('Error al registrar gasto');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={isVisible} transparent animationType="fade">
            <View className="flex-1 bg-black/60 justify-end">
                <TouchableOpacity 
                    activeOpacity={1} 
                    className="absolute inset-0" 
                    onPress={onClose} 
                />

                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="w-full"
                >
                    <MotiView 
                        from={{ translateY: 300 }}
                        animate={{ translateY: 0 }}
                        style={{ backgroundColor: theme.card }}
                        className="rounded-t-[3rem] p-8 pb-12 border-t"
                        style={{ borderTopColor: theme.border, backgroundColor: theme.card }}
                    >
                        {/* Handle */}
                        <View className="w-12 h-1.5 bg-white/10 rounded-full self-center mb-8" />

                        <Text style={{ color: theme.text, fontSize: 24 * fontScale }} className="font-black mb-2 tracking-tight">Nuevo Gasto</Text>
                        <Text style={{ color: theme.textSecondary, fontSize: 12 * fontScale }} className="font-bold uppercase tracking-widest mb-8 opacity-60">Registro Manual</Text>

                        <ScrollView showsVerticalScrollIndicator={false} className="max-h-[500px]">
                            {/* Concepto */}
                            <View className="mb-6">
                                <Text style={{ color: theme.textSecondary, fontSize: 10 * fontScale }} className="font-black uppercase tracking-widest mb-2 ml-1">¿Qué se compró?</Text>
                                <View style={{ backgroundColor: theme.cardSecondary, borderColor: theme.border }} className="flex-row items-center p-5 rounded-2xl border">
                                    <MaterialIcons name="receipt" size={20} color={theme.primary} />
                                    <TextInput 
                                        placeholder="Ej. Cena con amigos"
                                        placeholderTextColor="#475569"
                                        style={{ flex: 1, marginLeft: 12, color: theme.text, fontWeight: 'bold' }}
                                        value={nombre}
                                        onChangeText={setNombre}
                                    />
                                </View>
                            </View>

                            {/* Monto */}
                            <View className="mb-8">
                                <Text style={{ color: theme.textSecondary, fontSize: 10 * fontScale }} className="font-black uppercase tracking-widest mb-2 ml-1">Monto Total</Text>
                                <View style={{ backgroundColor: theme.cardSecondary, borderColor: theme.border }} className="flex-row items-center p-5 rounded-2xl border">
                                    <MaterialIcons name="attach-money" size={20} color={theme.primary} />
                                    <TextInput 
                                        placeholder="0.00"
                                        placeholderTextColor="#475569"
                                        keyboardType="decimal-pad"
                                        style={{ flex: 1, marginLeft: 12, color: theme.text, fontSize: 24, fontWeight: '900' }}
                                        value={precio}
                                        onChangeText={setPrecio}
                                    />
                                </View>
                            </View>

                            {/* Categoría */}
                            <View className="mb-8">
                                <Text style={{ color: theme.textSecondary, fontSize: 10 * fontScale }} className="font-black uppercase tracking-widest mb-4 ml-1">Categoría</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                                    {CATEGORIES.map(cat => (
                                        <TouchableOpacity 
                                            key={cat.id}
                                            onPress={() => setCategoria(cat.id)}
                                            style={{ 
                                                backgroundColor: categoria === cat.id ? cat.color + '20' : theme.cardSecondary,
                                                borderColor: categoria === cat.id ? cat.color : 'transparent'
                                            }}
                                            className="mr-3 px-6 py-4 rounded-3xl border items-center gap-2"
                                        >
                                            <MaterialIcons name={cat.icon as any} size={24} color={categoria === cat.id ? cat.color : theme.textSecondary} />
                                            <Text style={{ color: categoria === cat.id ? theme.text : theme.textSecondary }} className="text-[10px] font-black uppercase tracking-widest">{cat.id}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            {/* Participantes */}
                            <Text style={{ color: theme.textSecondary, fontSize: 10 * fontScale }} className="font-black uppercase tracking-widest mb-4 ml-1">Dividir entre</Text>
                            <View className="flex-row flex-wrap gap-3 mb-10">
                                {members.map(member => {
                                    const isSelected = selectedMembers.includes(member.id);
                                    return (
                                        <TouchableOpacity 
                                            key={member.id}
                                            onPress={() => toggleMember(member.id)}
                                            style={{ 
                                                backgroundColor: isSelected ? theme.primary : theme.cardSecondary,
                                                borderColor: isSelected ? theme.primary : theme.border
                                            }}
                                            className="px-6 py-3 rounded-2xl border"
                                        >
                                            <Text style={{ 
                                                color: isSelected ? 'white' : theme.textSecondary,
                                                fontSize: 12 * fontScale,
                                                fontWeight: '900'
                                            }}>
                                                {member.nombre}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </ScrollView>

                        <TouchableOpacity 
                            onPress={handleSubmit}
                            disabled={loading || !nombre || !precio || selectedMembers.length === 0}
                            style={{ 
                                backgroundColor: theme.primary,
                                opacity: (loading || !nombre || !precio || selectedMembers.length === 0) ? 0.4 : 1
                            }}
                            className="w-full h-16 rounded-2xl items-center justify-center shadow-xl shadow-blue-500/20"
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={{ color: 'white', fontSize: 14 * fontScale }} className="font-black uppercase tracking-widest">Confirmar Gasto</Text>
                            )}
                        </TouchableOpacity>
                    </MotiView>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
};
