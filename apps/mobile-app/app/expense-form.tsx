import React, { useState } from 'react';
import { ScrollView, View, Text, Pressable, TextInput, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@easy-pay/ui';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { id: '1', name: 'Comida', icon: 'flatware', color: '#f97316' },
  { id: '2', name: 'Bebidas', icon: 'local-bar', color: '#3b82f6' },
  { id: '3', name: 'Transporte', icon: 'directions-car', color: '#a855f7' },
  { id: '4', name: 'Ocio', icon: 'movie', color: '#ec4899' },
  { id: '5', name: 'Propinas', icon: 'volunteer-activism', color: '#10b981' },
  { id: '6', name: 'Otros', icon: 'more-horiz', color: '#64748b' },
];

export default function RegisterExpenseScreen() {
    const [amount, setAmount] = useState('1,250.00');
    const [title, setTitle] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('1');

    return (
        <SafeAreaView className="flex-1 bg-[#0f172a]" edges={['top']}>
            <StatusBar style="light" />
            <Stack.Screen options={{ 
                headerShown: true,
                headerTitle: 'Detalles del Gasto',
                headerTintColor: 'white',
                headerStyle: { backgroundColor: '#0f172a' },
                headerLeft: () => (
                    <Pressable onPress={() => router.back()} className="ml-2">
                        <MaterialIcons name="close" size={24} color="white" />
                    </Pressable>
                )
            }} />
            
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <ScrollView 
                    className="flex-1"
                    contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 24 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Amount Hero Section */}
                    <View className="py-12 items-center">
                        <Text className="text-blue-500 text-[10px] font-black uppercase tracking-[4px] mb-2">Total a registrar</Text>
                        <View className="flex-row items-baseline">
                            <Text className="text-white text-3xl font-bold opacity-50 mr-1">$</Text>
                            <TextInput 
                                value={amount}
                                onChangeText={setAmount}
                                keyboardType="numeric"
                                className="text-white text-6xl font-black tracking-tighter"
                                style={{ minWidth: 100 }}
                            />
                        </View>
                    </View>

                    {/* Details Card */}
                    <View className="bg-slate-800/40 rounded-[32px] p-6 border border-white/5 shadow-2xl mb-8">
                        <View className="mb-6">
                            <Text className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-3 ml-1">Descripción</Text>
                            <TextInput 
                                value={title}
                                onChangeText={setTitle}
                                placeholder="¿En qué gastaste? Ej. Cena Grill"
                                placeholderTextColor="#475569"
                                className="bg-slate-900/50 border border-slate-700 text-white text-lg font-bold rounded-2xl p-4"
                            />
                        </View>
                        
                        <View className="h-[1px] bg-white/5 w-full mb-6" />
                        
                        <Text className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4 ml-1 text-center">Categoría</Text>
                        <View className="flex-row flex-wrap justify-between gap-y-6">
                            {CATEGORIES.map((cat) => (
                                <Pressable 
                                    key={cat.id} 
                                    onPress={() => setSelectedCategory(cat.id)}
                                    className="items-center w-[30%]"
                                >
                                    <View 
                                        className={`w-14 h-14 rounded-2xl items-center justify-center border-2 ${selectedCategory === cat.id ? 'bg-blue-600 border-blue-400' : 'bg-slate-900/40 border-transparent'}`}
                                    >
                                        <MaterialIcons name={cat.icon as any} size={24} color={selectedCategory === cat.id ? 'white' : '#475569'} />
                                    </View>
                                    <Text className={`text-[10px] font-bold mt-2 uppercase tracking-tight ${selectedCategory === cat.id ? 'text-white' : 'text-slate-500'}`}>{cat.name}</Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    {/* Split Preview */}
                    <View className="bg-emerald-500/10 px-6 py-4 rounded-2xl border border-emerald-500/20 flex-row items-center justify-center gap-3">
                        <MaterialIcons name="groups" size={20} color="#10b981" />
                        <Text className="text-emerald-400 font-bold text-xs">Se dividirá equitativamente entre 4 personas</Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Bottom Sticky Action Button */}
            <View className="absolute bottom-10 left-6 right-6">
                <Pressable 
                    onPress={() => {
                        // Logic to save expense
                        router.push('/(tabs)/');
                    }}
                    className="bg-blue-600 w-full py-5 rounded-2xl flex-row items-center justify-center gap-3 shadow-2xl shadow-blue-500/40 active:scale-95"
                >
                    <MaterialIcons name="check-circle" size={24} color="white" />
                    <Text className="text-white font-black text-lg uppercase tracking-widest">Confirmar Gasto</Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}
