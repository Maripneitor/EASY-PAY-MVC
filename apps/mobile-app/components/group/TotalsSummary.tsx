import React from 'react';
import { View, Text } from 'react-native';
// // import { MotiView, AnimatePresence } from 'moti';
const MotiView = ({ children, style, ...props }: any) => <View style={style} {...props}>{children}</View>;
const AnimatePresence = ({ children }: any) => children;
import { useTheme } from '../../src/infrastructure/context/ThemeContext';

interface TotalsSummaryProps {
    subtotal: number;
    tax: number;
    service: number;
    tip: number;
    total: number;
    paidAmount: number;
    pendingAmount: number;
    items?: any[];
    members?: any[];
}

export const TotalsSummary: React.FC<TotalsSummaryProps> = ({ 
    subtotal = 0, 
    tax = 0, 
    service = 0, 
    tip = 0, 
    total = 0, 
    paidAmount = 0, 
    pendingAmount = 0,
    items = [],
    members = []
}) => {
    const { theme, fontScale } = useTheme();
    
    // Safety guards for division by zero
    const safeTotal = total > 0 ? total : 1;
    const paidProgress = Math.min(100, Math.max(0, (paidAmount / safeTotal) * 100));
    const pendingProgress = Math.min(100, Math.max(0, (pendingAmount / safeTotal) * 100));

    return (
        <MotiView 
            from={{ opacity: 0, translateY: 20 }} 
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500 }}
            className="gap-y-8 px-6 pt-4 pb-10"
        >
            {/* Summary Card (Bento-style) */}
            <View 
                style={{ backgroundColor: theme.card }} 
                className="rounded-xl p-6 flex-col gap-5 relative overflow-hidden shadow-xs"
            >
                {/* Subtle glow effect */}
                <View className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
                
                <Text style={{ color: theme.text, fontSize: 18 * fontScale, fontFamily: 'Manrope' }} className="font-extrabold tracking-tight mb-2">Desglose de Cuenta</Text>
                
                <View className="gap-y-3">
                    <View className="flex-row justify-between items-center px-1">
                        <Text style={{ color: theme.textSecondary, fontSize: 14 * fontScale, fontFamily: 'Inter' }} className="font-medium">Subtotal</Text>
                        <Text style={{ color: theme.text, fontSize: 16 * fontScale, fontFamily: 'Manrope' }} className="font-bold">${subtotal.toFixed(2)}</Text>
                    </View>
                    <View className="flex-row justify-between items-center px-1">
                        <Text style={{ color: theme.textSecondary, fontSize: 14 * fontScale, fontFamily: 'Inter' }} className="font-medium">IVA (12%)</Text>
                        <Text style={{ color: theme.text, fontSize: 16 * fontScale, fontFamily: 'Manrope' }} className="font-bold">${tax.toFixed(2)}</Text>
                    </View>
                    <View className="flex-row justify-between items-center px-1">
                        <Text style={{ color: theme.textSecondary, fontSize: 14 * fontScale, fontFamily: 'Inter' }} className="font-medium">Servicio (5%)</Text>
                        <Text style={{ color: theme.text, fontSize: 16 * fontScale, fontFamily: 'Manrope' }} className="font-bold">${service.toFixed(2)}</Text>
                    </View>
                    <View className="flex-row justify-between items-center px-1">
                        <Text style={{ color: theme.textSecondary, fontSize: 14 * fontScale, fontFamily: 'Inter' }} className="font-medium">Propina (Opcional)</Text>
                        <Text style={{ color: theme.text, fontSize: 16 * fontScale, fontFamily: 'Manrope' }} className="font-bold">${tip.toFixed(2)}</Text>
                    </View>
                </View>

                {/* Total General Callout */}
                <View 
                    style={{ backgroundColor: theme.cardSecondary }} 
                    className="mt-2 -mx-6 -mb-6 px-6 py-6 flex-row justify-between items-end rounded-b-xl"
                >
                    <Text style={{ color: theme.textSecondary, fontSize: 16 * fontScale, fontFamily: 'Inter' }} className="font-bold">Total General</Text>
                    <Text style={{ color: theme.primary, fontSize: 32 * fontScale, fontFamily: 'Manrope' }} className="font-black tracking-tight">${total.toFixed(2)}</Text>
                </View>
            </View>

            {/* Aportes Section */}
            <View>
                <Text style={{ color: theme.text, fontSize: 18 * fontScale, fontFamily: 'Manrope' }} className="font-extrabold mb-4 tracking-tight px-1">Aportes de Miembros</Text>
                <View className="flex-row gap-x-4 mb-8">
                    {/* Pagado Card */}
                    <View 
                        style={{ backgroundColor: theme.card }} 
                        className="flex-1 rounded-xl p-5 flex-col gap-1.5 relative overflow-hidden shadow-xs"
                    >
                        <View className="absolute top-0 left-0 w-1 h-full bg-[#10B981] opacity-80" />
                        <Text style={{ color: theme.textSecondary, fontSize: 10 * fontScale, fontFamily: 'Inter' }} className="uppercase tracking-wider font-semibold">Pagado</Text>
                        <Text style={{ color: theme.text, fontSize: 22 * fontScale, fontFamily: 'Manrope' }} className="font-bold tracking-tight">${paidAmount.toFixed(2)}</Text>
                        <View style={{ backgroundColor: theme.cardSecondary }} className="w-full h-1 rounded-full mt-2 overflow-hidden">
                            <MotiView 
                                from={{ width: '0%' }}
                                animate={{ width: `${paidProgress}%` }}
                                transition={{ type: 'timing', duration: 1000 }}
                                style={{ backgroundColor: '#10B981' }} 
                                className="h-full rounded-full" 
                            />
                        </View>
                    </View>

                    {/* Pendiente Card */}
                    <View 
                        style={{ backgroundColor: theme.cardSecondary }} 
                        className="flex-1 rounded-xl p-5 flex-col gap-1.5 relative overflow-hidden border border-outline-variant/15"
                    >
                        <View className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
                        <Text style={{ color: '#D97706', fontSize: 10 * fontScale, fontFamily: 'Inter' }} className="uppercase tracking-wider font-semibold">Pendiente</Text>
                        <Text style={{ color: theme.text, fontSize: 22 * fontScale, fontFamily: 'Manrope' }} className="font-bold tracking-tight">${pendingAmount.toFixed(2)}</Text>
                        <View style={{ backgroundColor: theme.card }} className="w-full h-1 rounded-full mt-2 overflow-hidden">
                            <MotiView 
                                from={{ width: '0%' }}
                                animate={{ width: `${pendingProgress}%` }}
                                transition={{ type: 'timing', duration: 1000 }}
                                style={{ backgroundColor: '#F59E0B' }} 
                                className="h-full rounded-full" 
                            />
                        </View>
                    </View>
                </View>

                {/* Shared Items Breakdown */}
                <Text style={{ color: theme.text, fontSize: 18 * fontScale, fontFamily: 'Manrope' }} className="font-extrabold mb-4 tracking-tight px-1">Desglose por Ítem</Text>
                <View className="gap-y-3">
                    {items.map((item, idx) => {
                        const assignedIds = item.asignadoA || item.participantes_ids || [];
                        const itemParticipants = members.filter(m => assignedIds.includes(m.id));
                        const price = item.precio || item.monto || 0;
                        const qty = item.cantidad || 1;
                        const itemTotal = price * qty;
                        const sharePerPerson = itemParticipants.length > 0 ? itemTotal / itemParticipants.length : 0;

                        return (
                            <View 
                                key={item.id || idx}
                                style={{ backgroundColor: theme.card }}
                                className="p-4 rounded-2xl border border-white/5 flex-row justify-between items-center"
                            >
                                <View className="flex-1 pr-4">
                                    <Text style={{ color: theme.text }} className="font-bold text-sm mb-1">{item.nombre || item.descripcion}</Text>
                                    <View className="flex-row items-center gap-1.5">
                                        <View className="flex-row -space-x-2 mr-1">
                                            {itemParticipants.slice(0, 3).map((p, pIdx) => (
                                                <View 
                                                    key={p.id || pIdx}
                                                    style={{ backgroundColor: p.color || theme.primary, borderColor: theme.card }}
                                                    className="w-5 h-5 rounded-full border-2 items-center justify-center"
                                                >
                                                    <Text className="text-[8px] font-black text-white">
                                                        {(p.nombre || 'U').charAt(0).toUpperCase()}
                                                    </Text>
                                                </View>
                                            ))}
                                            {itemParticipants.length > 3 && (
                                                <View 
                                                    style={{ backgroundColor: '#333', borderColor: theme.card }}
                                                    className="w-5 h-5 rounded-full border-2 items-center justify-center"
                                                >
                                                    <Text className="text-[6px] font-black text-white">+{itemParticipants.length - 3}</Text>
                                                </View>
                                            )}
                                        </View>
                                        <Text style={{ color: theme.textSecondary }} className="text-[10px] font-medium">
                                            {itemParticipants.length} {itemParticipants.length === 1 ? 'persona' : 'personas'} • ${sharePerPerson.toFixed(2)} c/u
                                        </Text>
                                    </View>
                                </View>
                                <View className="items-end">
                                    <Text style={{ color: theme.text }} className="font-black text-base">${itemTotal.toFixed(2)}</Text>
                                    <Text style={{ color: theme.textSecondary }} className="text-[10px] opacity-50">{qty} x ${price.toFixed(2)}</Text>
                                </View>
                            </View>
                        );
                    })}
                </View>
            </View>
        </MotiView>
    );
};
