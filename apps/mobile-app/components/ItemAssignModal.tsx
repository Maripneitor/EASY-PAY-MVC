import React, { useState, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, Modal, ScrollView, Alert, Dimensions, Platform
} from 'react-native';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { MotiView, AnimatePresence } from 'moti';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Member {
    id: string;
    nombre: string;
    color?: string;
}

interface Item {
    id: string;
    name: string;
    amount: number;
    assignedTo: string[];
}

interface Props {
    visible: boolean;
    onClose: () => void;
    item: Item | null;
    members: Member[];
    theme: any;
    onConfirm: (itemId: string, assignedTo: string[]) => Promise<void>;
}

export default function ItemAssignModal({ visible, onClose, item, members, theme, onConfirm }: Props) {
    const [selected, setSelected] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (item) setSelected(item.assignedTo ?? []);
    }, [item, visible]);

    if (!item) return null;

    const toggle = (memberId: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelected(prev =>
            prev.includes(memberId)
                ? prev.filter(id => id !== memberId)
                : [...prev, memberId]
        );
    };

    const selectAll = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setSelected(members.map(m => m.id));
    };
    
    const clearAll = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setSelected([]);
    };

    const perPersonAmount = selected.length > 0
        ? item.amount / selected.length
        : item.amount;

    const handleConfirm = async () => {
        if (selected.length === 0) {
            Alert.alert('Sin asignar', 'Selecciona al menos una persona para repartir este gasto.');
            return;
        }
        setLoading(true);
        try {
            await onConfirm(item.id, selected);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                onClose();
            }, 1200);
        } catch {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Error', 'No se pudo guardar la asignación.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal 
            visible={visible} 
            animationType="fade" 
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <TouchableOpacity 
                    activeOpacity={1} 
                    onPress={onClose} 
                    style={{ flex: 1 }} 
                />
                
                <MotiView
                    from={{ translateY: 300, opacity: 0 }}
                    animate={{ translateY: 0, opacity: 1 }}
                    exit={{ translateY: 300, opacity: 0 }}
                    transition={{ type: 'spring', damping: 20 }}
                    style={{ 
                        backgroundColor: theme.bg, 
                        borderTopLeftRadius: 32, 
                        borderTopRightRadius: 32,
                        maxHeight: '90%',
                        paddingBottom: Platform.OS === 'ios' ? 40 : 20
                    }}
                >
                    {/* Handle */}
                    <View style={{ width: 40, height: 4, backgroundColor: theme.border, borderRadius: 2, alignSelf: 'center', marginTop: 12 }} />

                    {/* Header */}
                    <View className="px-6 pt-4 pb-6 flex-row items-center justify-between">
                        <View>
                            <Text style={{ color: theme.textSecondary }} className="text-[10px] font-black uppercase tracking-[0.2em] mb-1">Repartir Item</Text>
                            <Text style={{ color: theme.text }} className="text-xl font-black">{item.name}</Text>
                        </View>
                        <TouchableOpacity 
                            onPress={onClose} 
                            style={{ backgroundColor: theme.cardSecondary }}
                            className="w-10 h-10 rounded-full items-center justify-center"
                        >
                            <Ionicons name="close" size={20} color={theme.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView className="px-6" showsVerticalScrollIndicator={false}>
                        {success ? (
                            <MotiView
                                from={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="items-center py-20"
                            >
                                <View className="w-24 h-24 bg-emerald-500/20 rounded-full items-center justify-center mb-6">
                                    <MaterialIcons name="check-circle" size={60} color="#10b981" />
                                </View>
                                <Text style={{ color: theme.text }} className="text-2xl font-black text-center uppercase tracking-tight">¡Asignado!</Text>
                                <Text style={{ color: theme.textSecondary }} className="text-center mt-2 font-bold opacity-60">Los saldos se han actualizado</Text>
                            </MotiView>
                        ) : (
                            <>
                                {/* Info Card */}
                                <View 
                                    style={{ 
                                        backgroundColor: theme.primary + '08', 
                                        borderColor: theme.primary + '20',
                                        borderWidth: 1,
                                        borderRadius: 24,
                                        padding: 20,
                                        marginBottom: 24
                                    }}
                                >
                                    <View className="flex-row justify-between items-center">
                                        <View>
                                            <Text style={{ color: theme.textSecondary }} className="text-[9px] font-black uppercase tracking-widest mb-1">Monto Total</Text>
                                            <Text style={{ color: theme.primary }} className="text-3xl font-black font-mono">${item.amount.toFixed(2)}</Text>
                                        </View>
                                        {selected.length > 0 && (
                                            <MotiView 
                                                from={{ scale: 0.8, opacity: 0 }} 
                                                animate={{ scale: 1, opacity: 1 }}
                                                style={{ backgroundColor: theme.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}
                                            >
                                                <Text className="text-white text-[10px] font-black uppercase tracking-widest">
                                                    ${perPersonAmount.toFixed(2)} c/u
                                                </Text>
                                            </MotiView>
                                        )}
                                    </View>
                                </View>

                                {/* Quick Actions */}
                                <View className="flex-row gap-3 mb-6">
                                    <TouchableOpacity
                                        onPress={selectAll}
                                        style={{ 
                                            backgroundColor: selected.length === members.length ? theme.primary : theme.cardSecondary,
                                            flex: 1,
                                            paddingVertical: 14,
                                            borderRadius: 16,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 8
                                        }}
                                    >
                                        <MaterialIcons name="groups" size={18} color={selected.length === members.length ? 'white' : theme.text} />
                                        <Text style={{ color: selected.length === members.length ? 'white' : theme.text }} className="font-black text-xs uppercase tracking-widest">Todos</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={clearAll}
                                        style={{ 
                                            backgroundColor: theme.cardSecondary,
                                            flex: 1,
                                            paddingVertical: 14,
                                            borderRadius: 16,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 8
                                        }}
                                    >
                                        <MaterialIcons name="person-remove" size={18} color={theme.textSecondary} />
                                        <Text style={{ color: theme.textSecondary }} className="font-black text-xs uppercase tracking-widest">Ninguno</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Members List */}
                                <Text style={{ color: theme.textSecondary }} className="text-[10px] font-black uppercase tracking-[0.15em] mb-4">
                                    Participantes ({selected.length})
                                </Text>

                                <View className="gap-3 pb-10">
                                    {members.map((member) => {
                                        const isSelected = selected.includes(member.id);
                                        const color = member.color || theme.primary;
                                        
                                        return (
                                            <TouchableOpacity
                                                key={member.id}
                                                onPress={() => toggle(member.id)}
                                                activeOpacity={0.7}
                                                style={{
                                                    backgroundColor: isSelected ? color + '10' : theme.cardSecondary,
                                                    borderColor: isSelected ? color : theme.border,
                                                    borderWidth: 1.5,
                                                    borderRadius: 20,
                                                    padding: 16,
                                                    flexDirection: 'row',
                                                    alignItems: 'center'
                                                }}
                                            >
                                                {/* Avatar */}
                                                <View 
                                                    style={{ backgroundColor: color, width: 44, height: 44, borderRadius: 22, marginRight: 16, alignItems: 'center', justifyCenter: 'center', shadowColor: color, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }}
                                                    className="items-center justify-center"
                                                >
                                                    <Text className="text-white font-black text-base">
                                                        {member.nombre?.substring(0, 1)?.toUpperCase() || '?'}
                                                    </Text>
                                                </View>

                                                {/* Info */}
                                                <View className="flex-1">
                                                    <Text style={{ color: theme.text }} className="font-black text-base">{member.nombre}</Text>
                                                    {isSelected && (
                                                        <MotiView from={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }}>
                                                            <Text style={{ color }} className="text-xs font-bold uppercase tracking-widest mt-0.5">
                                                                Paga ${perPersonAmount.toFixed(2)}
                                                            </Text>
                                                        </MotiView>
                                                    )}
                                                </View>

                                                {/* Checkbox */}
                                                <View 
                                                    style={{ 
                                                        width: 28, 
                                                        height: 28, 
                                                        borderRadius: 14, 
                                                        backgroundColor: isSelected ? color : 'transparent',
                                                        borderColor: isSelected ? color : theme.border,
                                                        borderWidth: 2,
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                >
                                                    {isSelected && <Ionicons name="checkmark" size={16} color="white" />}
                                                </View>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </>
                        )}
                    </ScrollView>

                    {/* Bottom Button */}
                    {!success && (
                        <View className="px-6 pt-4">
                            <TouchableOpacity
                                onPress={handleConfirm}
                                disabled={loading || selected.length === 0}
                                style={{ 
                                    backgroundColor: selected.length > 0 ? theme.primary : theme.cardSecondary,
                                    borderRadius: 20,
                                    paddingVertical: 20,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    shadowColor: theme.primary,
                                    shadowOffset: { width: 0, height: 10 },
                                    shadowOpacity: selected.length > 0 ? 0.3 : 0,
                                    shadowRadius: 20,
                                    elevation: 5
                                }}
                            >
                                {loading ? (
                                    <View className="flex-row items-center gap-3">
                                        <Text className="text-white font-black uppercase tracking-widest">Guardando...</Text>
                                    </View>
                                ) : (
                                    <Text 
                                        style={{ color: selected.length > 0 ? 'white' : theme.textSecondary }} 
                                        className="font-black text-base uppercase tracking-widest"
                                    >
                                        {selected.length > 0 
                                            ? `Confirmar (${selected.length})` 
                                            : 'Selecciona personas'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}
                </MotiView>
            </View>
        </Modal>
    );
}

