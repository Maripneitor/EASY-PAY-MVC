import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useTheme } from '../../src/infrastructure/context/ThemeContext';
import { useRouter } from 'expo-router';
import ItemAssignModal from '../ItemAssignModal';
import { EditItemModal } from './EditItemModal';
import * as Haptics from 'expo-haptics';
import { Item, Participant } from '../../src/domain/types';

interface VirtualTicketCardProps {
    items: Item[];
    serviceFee: number;
    groupId: string;
    members: Participant[];
    onAssign?: (itemId: string, assignedTo: string[]) => Promise<void>;
    onEdit?: (itemId: string, data: any) => Promise<void>;
    canEdit?: boolean;
}

export const VirtualTicketCard: React.FC<VirtualTicketCardProps> = ({
    items, serviceFee, groupId, members = [], onAssign, onEdit, canEdit
}) => {
    const { theme, fontScale } = useTheme();
    const router = useRouter();
    const [assignModal, setAssignModal] = useState<{ visible: boolean; item: Item | null }>({
        visible: false, item: null,
    });
    const [editModal, setEditModal] = useState<{ visible: boolean; item: Item | null }>({
        visible: false, item: null,
    });

    const handleAssign = async (itemId: string, assignedTo: string[]) => {
        if (onAssign) await onAssign(itemId, assignedTo);
        setAssignModal({ visible: false, item: null });
    };

    const handleEdit = async (itemId: string, data: any) => {
        if (onEdit) await onEdit(itemId, data);
        setEditModal({ visible: false, item: null });
    };

    const getMemberColor = (memberId: string) => {
        const member = members.find(m => m.id === memberId);
        return member?.color || theme.primary;
    };

    const getMemberName = (memberId: string) => {
        const member = members.find(m => m.id === memberId);
        return member?.nombre?.substring(0, 2)?.toUpperCase() ?? '??';
    };

    return (
        <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400 }}
            className="px-0 pt-2"
        >
            {/* Header section with Add Button */}
            <View className="flex-row justify-between items-center mb-6 px-2">
                <View>
                    <Text style={{ color: theme.text, fontSize: 18 * fontScale }} className="font-black uppercase tracking-tighter">
                        Cuenta Virtual
                    </Text>
                    <Text style={{ color: theme.textSecondary, fontSize: 10 * fontScale }} className="font-black uppercase tracking-widest mt-1 opacity-60">
                        Asigna o edita ítems de la cuenta
                    </Text>
                </View>
                <View className="flex-row gap-2">
                    <TouchableOpacity
                        onPress={() => router.push(`/ocr-scanner?groupId=${groupId}`)}
                        style={{ backgroundColor: '#10b98120', borderColor: '#10b98130' }}
                        className="flex-row items-center gap-2 px-4 py-2 rounded-xl border"
                    >
                        <MaterialIcons name="document-scanner" size={18} color="#10b981" />
                        <Text style={{ color: '#10b981', fontSize: 12 * fontScale }} className="font-black uppercase tracking-widest">Escanear</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => router.push({ pathname: '/agregar-gasto', params: { groupId } })}
                        style={{ backgroundColor: theme.primary + '15' }}
                        className="flex-row items-center gap-2 px-4 py-2 rounded-xl"
                    >
                        <Ionicons name="add" size={18} color={theme.primary} />
                        <Text style={{ color: theme.primary, fontSize: 12 * fontScale }} className="font-black uppercase tracking-widest">Añadir</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View className="gap-y-4">
                {items.map((item) => {
                    const totalAmount = (item.precio || 0) * (item.cantidad || 1);
                    return (
                        <View
                            key={item.id}
                            style={{ backgroundColor: theme.cardSecondary, borderColor: theme.border }}
                            className="p-5 rounded-[32px] border shadow-sm"
                        >
                            <View className="flex-row justify-between items-start mb-4">
                                <TouchableOpacity 
                                    className="flex-1 pr-4"
                                    onPress={() => router.push(`/expense/receipt/${item.id}?groupId=${groupId}`)}
                                >
                                    <Text style={{ color: theme.text, fontSize: 16 * fontScale }} className="font-black uppercase tracking-tight">
                                        {item.nombre}
                                    </Text>
                                    <Text style={{ color: theme.textSecondary, fontSize: 12 * fontScale }} className="font-bold opacity-60 mt-0.5">
                                        {item.cantidad} x ${item.precio?.toFixed(2) || '0.00'}
                                    </Text>
                                </TouchableOpacity>
                                <Text style={{ color: theme.primary, fontSize: 18 * fontScale }} className="font-black font-mono">
                                    ${totalAmount.toFixed(2)}
                                </Text>
                            </View>

                            <View className="flex-row justify-between items-center pt-3 border-t border-white/5">
                                {/* Avatars Section */}
                                <View className="flex-row items-center flex-1">
                                    <View className="flex-row -space-x-2 mr-3">
                                        {item.asignadoA?.slice(0, 4).map((id, idx) => (
                                            <View
                                                key={idx}
                                                style={{
                                                    backgroundColor: getMemberColor(id),
                                                    borderColor: theme.cardSecondary,
                                                }}
                                                className="w-8 h-8 rounded-full border-2 items-center justify-center shadow-sm"
                                            >
                                                <Text className="text-[10px] font-black text-white">
                                                    {getMemberName(id)}
                                                </Text>
                                            </View>
                                        ))}
                                        {item.asignadoA?.length > 4 && (
                                            <View
                                                style={{ backgroundColor: theme.textSecondary, borderColor: theme.cardSecondary }}
                                                className="w-8 h-8 rounded-full border-2 items-center justify-center"
                                            >
                                                <Text className="text-[8px] font-black text-white">+{item.asignadoA.length - 4}</Text>
                                            </View>
                                        )}
                                        {(!item.asignadoA || item.asignadoA.length === 0) && (
                                            <View className="flex-row items-center gap-1.5 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
                                                <View className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                                <Text className="text-rose-500 text-[9px] font-black uppercase tracking-widest">Sin asignar</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>

                                {/* Action Buttons */}
                                <View className="flex-row gap-2">
                                    <TouchableOpacity
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            setAssignModal({ visible: true, item });
                                        }}
                                        style={{ backgroundColor: theme.bg }}
                                        className="w-10 h-10 rounded-xl items-center justify-center border border-white/5"
                                    >
                                        <MaterialIcons name="people" size={18} color={theme.textSecondary} />
                                    </TouchableOpacity>
                                    
                                    {canEdit && (
                                        <TouchableOpacity
                                            onPress={() => {
                                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                setEditModal({ visible: true, item });
                                            }}
                                            style={{ backgroundColor: theme.bg }}
                                            className="w-10 h-10 rounded-xl items-center justify-center border border-white/5"
                                        >
                                            <MaterialIcons name="edit" size={18} color={theme.textSecondary} />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        </View>
                    );
                })}
            </View>

            {/* Total Summary Mini-Card */}
            <View
                style={{ backgroundColor: theme.primary + '10', borderColor: theme.primary + '20' }}
                className="mt-8 p-6 rounded-[32px] border border-dashed flex-row justify-between items-center"
            >
                <View>
                    <Text style={{ color: theme.textSecondary }} className="text-[10px] font-black uppercase tracking-widest mb-1">Cargos de servicio</Text>
                    <Text style={{ color: theme.text }} className="text-lg font-black font-mono">+${serviceFee.toFixed(2)}</Text>
                </View>
                <View className="items-end">
                    <Text style={{ color: theme.primary }} className="text-[10px] font-black uppercase tracking-widest mb-1">Subtotal Neto</Text>
                    <Text style={{ color: theme.primary }} className="text-2xl font-black font-mono">
                        ${(items.reduce((acc, item) => acc + ((item.precio || 0) * (item.cantidad || 1)), 0)).toFixed(2)}
                    </Text>
                </View>
            </View>

            {/* Modals */}
            {assignModal.item && (
                <ItemAssignModal
                    visible={assignModal.visible}
                    onClose={() => setAssignModal({ visible: false, item: null })}
                    item={{
                        id: assignModal.item.id,
                        name: assignModal.item.nombre,
                        amount: (assignModal.item.precio || 0) * (assignModal.item.cantidad || 1),
                        assignedTo: assignModal.item.asignadoA || []
                    }}
                    members={members as any}
                    theme={theme}
                    onConfirm={(itemId, assignedIds) => handleAssign(itemId, assignedIds)}
                />
            )}

            {editModal.item && (
                <EditItemModal
                    isVisible={editModal.visible}
                    onClose={() => setEditModal({ visible: false, item: null })}
                    item={editModal.item}
                    onSave={handleEdit}
                />
            )}
        </MotiView>
    );
};

