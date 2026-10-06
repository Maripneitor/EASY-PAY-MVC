import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../../src/infrastructure/context/ThemeContext';

interface ClosedGroupSummaryProps {
    group: any;
    onBack: () => void;
}

export const ClosedGroupSummary: React.FC<ClosedGroupSummaryProps> = ({ group, onBack }) => {
    const { theme, fontScale } = useTheme();
    
    // Calcular quién pagó y quién no
    const paymentStatus = useMemo(() => {
        const members = group.participantes || group.integrantes || [];
        const settlements = group.settlements || [];
        
        return members.map((member: any) => {
            const paidSettlements = settlements.filter((s: any) => 
                (s.payer_id === member.id || s.payer_id === member.user_id) && s.status === 'approved'
            );
            const totalPaid = paidSettlements.reduce((sum: number, s: any) => sum + s.amount, 0);
            const owed = Math.abs(member.balance || member.debt || 0);
            
            return {
                ...member,
                hasPaid: totalPaid >= (owed - 0.01), // margen de error para flotantes
                totalPaid
            };
        });
    }, [group]);

    const handleExportPDF = async () => {
        // En una implementación real, aquí generaríamos el PDF.
        // Por ahora simulamos con un Share simple del resumen de texto.
        const summaryText = `Resumen del Grupo: ${group.nombre}\n` +
            `Finalizado el: ${new Date(group.fecha_cierre || group.updatedAt).toLocaleDateString()}\n` +
            `Total: $${(group.total || group.total_gastado || 0).toFixed(2)}\n\n` +
            `Pagos:\n` +
            paymentStatus.map(m => `- ${m.nombre}: ${m.hasPaid ? 'Saldado' : 'Pendiente'}`).join('\n');

        try {
            await Share.share({
                message: summaryText,
                title: `Resumen ${group.nombre}`
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
            {/* Header */}
            <View className="px-6 py-4 flex-row items-center justify-between border-b border-white/5">
                <TouchableOpacity 
                    onPress={onBack}
                    className="w-10 h-10 rounded-xl items-center justify-center bg-slate-800/40"
                >
                    <MaterialIcons name="arrow-back-ios" size={20} color={theme.text} style={{ marginLeft: 6 }} />
                </TouchableOpacity>
                <View className="items-center">
                    <Text style={{ color: theme.text, fontSize: 18 * fontScale }} className="font-black">
                        {group.nombre}
                    </Text>
                    <Text style={{ color: theme.primary, fontSize: 9 * fontScale }} className="font-black uppercase tracking-widest">Resumen Final</Text>
                </View>
                <TouchableOpacity 
                    onPress={handleExportPDF}
                    className="w-10 h-10 rounded-xl items-center justify-center bg-blue-500/10"
                >
                    <MaterialIcons name="share" size={20} color={theme.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
                {/* Badge de estado */}
                <View className="items-center my-6">
                    <View className="bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20 flex-row items-center gap-2">
                        <MaterialIcons name="check-circle" size={16} color="#10b981" />
                        <Text style={{ color: '#10b981', fontSize: 12 * fontScale }} className="font-black uppercase tracking-widest">
                            Finalizado el {new Date(group.fecha_cierre || group.updatedAt).toLocaleDateString()}
                        </Text>
                    </View>
                </View>

                {/* Resumen de pagos por miembro */}
                <View style={{ backgroundColor: theme.cardSecondary }} className="rounded-[32px] p-6 mb-6 border border-white/5">
                    <Text style={{ color: theme.text, fontSize: 14 * fontScale }} className="font-black uppercase tracking-widest mb-4">Estado de Pagos</Text>
                    {paymentStatus.map((member: any) => (
                        <View key={member.id} className="flex-row justify-between items-center py-4 border-b border-white/5 last:border-0">
                            <View className="flex-row items-center gap-3">
                                <View style={{ backgroundColor: member.color || theme.primary + '20' }} className="w-8 h-8 rounded-lg items-center justify-center">
                                    <Text style={{ color: member.color || theme.primary }} className="font-black text-xs">
                                        {member.nombre?.charAt(0)?.toUpperCase() || '?'}
                                    </Text>
                                </View>
                                <View>
                                    <Text style={{ color: theme.text }} className="font-bold">{member.nombre}</Text>
                                    {member.id === (group.admin_id || group.liderId) && (
                                        <Text style={{ color: '#f59e0b', fontSize: 8 * fontScale }} className="font-black uppercase tracking-tighter">Líder</Text>
                                    )}
                                </View>
                            </View>
                            <View className="flex-row items-center gap-3">
                                <Text style={{ color: theme.text }} className="font-black">${Math.abs(member.balance || member.debt || 0).toFixed(2)}</Text>
                                {member.hasPaid ? (
                                    <MaterialIcons name="check-circle" size={20} color="#10b981" />
                                ) : (
                                    <MaterialIcons name="pending" size={20} color="#f59e0b" />
                                )}
                            </View>
                        </View>
                    ))}
                </View>

                {/* Desglose de gastos */}
                <View style={{ backgroundColor: theme.cardSecondary }} className="rounded-[32px] p-6 mb-6 border border-white/5">
                    <Text style={{ color: theme.text, fontSize: 14 * fontScale }} className="font-black uppercase tracking-widest mb-4">Desglose de Gastos</Text>
                    {group.items?.map((item: any) => (
                        <View key={item.id} className="flex-row justify-between py-3 border-b border-white/5 last:border-0">
                            <View className="flex-1 pr-4">
                                <Text style={{ color: theme.text }} className="font-bold">{item.nombre}</Text>
                                <Text style={{ color: theme.textSecondary, fontSize: 10 * fontScale }} className="font-medium">
                                    {item.nombres_participantes?.join(', ') || 'Todos'}
                                </Text>
                            </View>
                            <Text style={{ color: theme.text }} className="font-black">${(item.precio * (item.cantidad || 1)).toFixed(2)}</Text>
                        </View>
                    ))}
                    
                    {/* Totales finales */}
                    <View className="mt-6 pt-6 border-t border-white/10">
                        <View className="flex-row justify-between mb-2">
                            <Text style={{ color: theme.textSecondary }} className="font-bold">Subtotal</Text>
                            <Text style={{ color: theme.text }} className="font-bold">${(group.subtotal || 0).toFixed(2)}</Text>
                        </View>
                        <View className="flex-row justify-between mb-2">
                            <Text style={{ color: theme.textSecondary }} className="font-bold">Propina ({group.tip_percentage || 10}%)</Text>
                            <Text style={{ color: theme.text }} className="font-bold">${(group.tip || group.propina || 0).toFixed(2)}</Text>
                        </View>
                        <View className="flex-row justify-between mt-4 pt-4 border-t border-white/10">
                            <Text style={{ color: theme.text, fontSize: 20 * fontScale }} className="font-black uppercase tracking-tighter">Total</Text>
                            <Text style={{ color: theme.primary, fontSize: 20 * fontScale }} className="font-black">
                                ${(group.total || group.total_gastado || 0).toFixed(2)}
                            </Text>
                        </View>
                    </View>
                </View>

                <TouchableOpacity 
                    onPress={handleExportPDF}
                    style={{ backgroundColor: theme.primary }}
                    className="w-full py-5 rounded-[24px] items-center justify-center flex-row gap-3 mb-10"
                >
                    <MaterialIcons name="picture-as-pdf" size={20} color="black" />
                    <Text className="text-black font-black uppercase tracking-widest">Compartir Resumen</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};
