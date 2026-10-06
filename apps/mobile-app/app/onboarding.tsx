import React, { useState } from 'react';
import { 
    View, 
    Text, 
    ScrollView, 
    TouchableOpacity, 
    Image, 
    Dimensions, 
    TextInput 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { MaterialIcons, Ionicons, Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { MotiView, AnimatePresence } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
    const [step, setStep] = useState(1);
    const [name, setName] = useState('Mario');
    const [currency, setCurrency] = useState('MXN');

    const nextStep = () => {
        if (step < 3) {
            setStep(step + 1);
        } else {
            router.replace('/(tabs)/');
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F7F9FB' }} edges={['top']}>
            <StatusBar style="dark" />
            
            {/* Header / Stepper from Stitch */}
            <View className="px-6 py-4 flex-row justify-between items-center bg-[#F7F9FB]">
                <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#64748B" />
                </TouchableOpacity>
                <Text className="font-bold text-xl tracking-tight text-[#191C1E]">Easy-Pay</Text>
                <View className="w-10" />
            </View>
            
            {/* Onboarding Progress Stepper */}
            <View className="flex-row items-center justify-center space-x-2 py-4">
                <View className={`h-2 rounded-full ${step === 1 ? 'w-6 bg-[#0061a4]' : 'w-2 bg-[#0061a4]'}`} />
                <View className={`h-2 rounded-full ${step === 2 ? 'w-6 bg-[#0061a4]' : (step > 2 ? 'w-2 bg-[#0061a4]' : 'w-2 bg-[#E0E3E5]')}`} />
                <View className={`h-2 rounded-full ${step === 3 ? 'w-6 bg-[#0061a4]' : 'w-2 bg-[#E0E3E5]'}`} />
            </View>

            <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>
                <AnimatePresence exitBeforeEnter>
                    {step === 1 && (
                        <MotiView 
                            key="step1"
                            from={{ opacity: 0, translateY: 10 }}
                            animate={{ opacity: 1, translateY: 0 }}
                            exit={{ opacity: 0, translateY: -10 }}
                            className="flex-1"
                        >
                            <View className="items-center mb-10 text-center">
                                <Text className="font-bold text-3xl tracking-tight text-[#191C1E] mb-2">Completemos tu perfil</Text>
                                <Text className="text-[#404752] text-base">¿Cómo prefieres que te llamen?</Text>
                            </View>
                            
                            <View className="items-center mb-10">
                                <View className="relative w-32 h-32 rounded-full bg-[#E0E3E5] flex items-center justify-center shadow-sm">
                                    <MaterialIcons name="person" size={50} color="#707883" />
                                    <TouchableOpacity className="absolute bottom-0 right-0 w-10 h-10 bg-[#2196F3] rounded-full flex items-center justify-center shadow-md border-2 border-white">
                                        <MaterialIcons name="photo-camera" size={20} color="white" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View className="space-y-6">
                                <View className="space-y-1.5">
                                    <Text className="text-sm font-medium text-[#404752] px-1">Nombre Público</Text>
                                    <View className="bg-white rounded-xl px-4 py-4 shadow-sm border border-[#bfc7d4]/30">
                                        <TextInput 
                                            value={name}
                                            onChangeText={setName}
                                            className="text-[#191C1E] font-medium text-base"
                                            placeholder="Ej. Alex"
                                            placeholderTextColor="#bfc7d4"
                                        />
                                    </View>
                                </View>
                            </View>
                        </MotiView>
                    )}

                    {step === 2 && (
                        <MotiView 
                            key="step2"
                            from={{ opacity: 0, translateY: 10 }}
                            animate={{ opacity: 1, translateY: 0 }}
                            exit={{ opacity: 0, translateY: -10 }}
                            className="flex-1"
                        >
                            <View className="items-center mb-10 text-center">
                                <Text className="font-bold text-3xl tracking-tight text-[#191C1E] mb-2">Ajustes financieros</Text>
                                <Text className="text-[#404752] text-base">Configura tu moneda principal</Text>
                            </View>
                            
                            <View className="space-y-3">
                                {['MXN', 'USD', 'EUR'].map((curr) => (
                                    <TouchableOpacity 
                                        key={curr}
                                        onPress={() => setCurrency(curr)}
                                        className={`p-5 rounded-2xl border-2 flex-row items-center justify-between ${currency === curr ? 'bg-[#2196F3]/5 border-[#2196F3]' : 'bg-white border-transparent shadow-sm'}`}
                                    >
                                        <Text className={`font-bold text-lg ${currency === curr ? 'text-[#0061a4]' : 'text-[#404752]'}`}>{curr}</Text>
                                        {currency === curr && <Ionicons name="checkmark-circle" size={24} color="#0061a4" />}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </MotiView>
                    )}

                    {step === 3 && (
                        <MotiView 
                            key="step3"
                            from={{ opacity: 0, translateY: 10 }}
                            animate={{ opacity: 1, translateY: 0 }}
                            exit={{ opacity: 0, translateY: -10 }}
                            className="flex-1"
                        >
                            <View className="items-center mb-10 text-center">
                                <Text className="font-bold text-3xl tracking-tight text-[#191C1E] mb-2">Todo listo</Text>
                                <Text className="text-[#404752] text-base">¡Bienvenido a EasyPay!</Text>
                            </View>
                            
                            <View className="bg-emerald-50 rounded-3xl p-8 items-center border border-emerald-100">
                                <View className="w-20 h-20 bg-emerald-500 rounded-3xl items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
                                    <MaterialIcons name="celebration" size={40} color="white" />
                                </View>
                                <Text className="text-[#191C1E] font-bold text-2xl text-center mb-2">¡Configuración Exitosa!</Text>
                                <Text className="text-[#404752] text-center text-sm leading-relaxed">
                                    Tu perfil ha sido configurado correctamente.
                                </Text>
                            </View>
                        </MotiView>
                    )}
                </AnimatePresence>
            </ScrollView>

            {/* Footer Actions (Sticky bottom style from Stitch) */}
            <View className="px-6 pb-10 pt-4 bg-[#F7F9FB]">
                <View className="space-y-3">
                    <TouchableOpacity 
                        onPress={nextStep}
                        className="w-full bg-[#0061a4] py-4 rounded-2xl items-center justify-center shadow-lg active:scale-[0.98]"
                    >
                        <Text className="text-white font-bold text-lg">
                            {step === 3 ? 'Comenzar ahora' : 'Siguiente Paso'}
                        </Text>
                    </TouchableOpacity>
                    
                    {step < 3 && (
                        <TouchableOpacity 
                            onPress={nextStep}
                            className="w-full py-3 items-center"
                        >
                            <Text className="text-[#707883] font-bold text-sm">Omitir por ahora</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
}
