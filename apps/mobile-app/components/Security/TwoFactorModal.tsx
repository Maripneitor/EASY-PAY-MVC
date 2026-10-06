import React, { useState, useEffect } from 'react';
import { 
    Modal, 
    View, 
    Text, 
    TouchableOpacity, 
    TextInput, 
    ActivityIndicator,
    Alert,
    Dimensions
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../src/infrastructure/context/ThemeContext';
import { userRepository } from '../../src/infrastructure/api/repositories/UserRepository';

const { height } = Dimensions.get('window');

interface TwoFactorModalProps {
    visible: boolean;
    onClose: () => void;
    onVerified: (code: string) => void;
    userId: string;
    actionTitle: string;
    actionDescription: string;
}

export const TwoFactorModal: React.FC<TwoFactorModalProps> = ({ 
    visible, 
    onClose, 
    onVerified, 
    userId,
    actionTitle,
    actionDescription
}) => {
    const { theme, fontScale } = useTheme();
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [step, setStep] = useState<'request' | 'verify'>('request');

    useEffect(() => {
        if (visible) {
            setStep('request');
            setCode('');
        }
    }, [visible]);

    const handleRequestCode = async () => {
        setIsLoading(true);
        try {
            await userRepository.setupTwoFactor(userId);
            setStep('verify');
        } catch (error: any) {
            const msg = error.response?.data?.detail || 'No se pudo enviar el código de verificación';
            Alert.alert('Error', msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyCode = async () => {
        if (code.length !== 6) return;

        setIsVerifying(true);
        try {
            const result = await userRepository.verifyTwoFactor(userId, code);
            if (result.status === 'success' || result.access_token) {
                onVerified(code);
                onClose();
            } else {
                Alert.alert('Error', 'Código inválido');
            }
        } catch (error: any) {
            const msg = error.response?.data?.detail || 'Código inválido o expirado';
            Alert.alert('Error', msg);
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <BlurView intensity={30} tint="dark" className="flex-1 justify-center items-center px-6">
                <View 
                    style={{ backgroundColor: theme.bg }} 
                    className="w-full max-w-md rounded-[40px] border border-white/10 p-8 shadow-2xl"
                >
                    {/* Header */}
                    <View className="items-center mb-6">
                        <View style={{ backgroundColor: theme.primary + '15' }} className="w-16 h-16 rounded-full items-center justify-center mb-4">
                            <MaterialIcons name="security" size={32} color={theme.primary} />
                        </View>
                        <Text style={{ color: theme.text }} className="text-xl font-black text-center">{actionTitle}</Text>
                        <Text style={{ color: theme.textSecondary }} className="text-xs text-center mt-2 font-medium px-4 opacity-70">
                            {actionDescription}
                        </Text>
                    </View>

                    {step === 'request' ? (
                        <View className="gap-6">
                            <Text style={{ color: theme.textSecondary }} className="text-center text-[10px] font-black uppercase tracking-widest leading-5">
                                Enviaremos un código de seguridad a tu correo electrónico registrado.
                            </Text>
                            
                            <TouchableOpacity 
                                onPress={handleRequestCode}
                                disabled={isLoading}
                                style={{ backgroundColor: theme.primary }}
                                className="w-full h-16 rounded-2xl items-center justify-center shadow-lg shadow-blue-500/20"
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="black" />
                                ) : (
                                    <Text className="text-black font-black uppercase tracking-widest">Enviar Código</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity onPress={onClose} className="items-center">
                                <Text style={{ color: theme.textSecondary }} className="text-xs font-bold">Cancelar</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View className="gap-8">
                            <View>
                                <Text style={{ color: theme.textSecondary }} className="text-[10px] font-black uppercase tracking-widest mb-3 ml-2">Ingresa el código</Text>
                                <TextInput 
                                    value={code}
                                    onChangeText={setCode}
                                    keyboardType="numeric"
                                    maxLength={6}
                                    style={{ backgroundColor: theme.cardSecondary, color: theme.text }}
                                    className="h-20 rounded-2xl font-black text-3xl text-center tracking-[10px] border border-white/5"
                                    placeholder="000000"
                                    placeholderTextColor={theme.textSecondary + '30'}
                                    autoFocus
                                />
                            </View>

                            <View className="gap-4">
                                <TouchableOpacity 
                                    onPress={handleVerifyCode}
                                    disabled={code.length !== 6 || isVerifying}
                                    style={{ backgroundColor: code.length === 6 ? theme.primary : theme.cardSecondary }}
                                    className="w-full h-16 rounded-2xl items-center justify-center shadow-lg"
                                >
                                    {isVerifying ? (
                                        <ActivityIndicator color="black" />
                                    ) : (
                                        <Text style={{ color: code.length === 6 ? 'black' : theme.textSecondary }} className="font-black uppercase tracking-widest">Verificar</Text>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity 
                                    onPress={() => setStep('request')}
                                    className="items-center"
                                >
                                    <Text style={{ color: theme.primary }} className="text-xs font-bold">Reenviar código</Text>
                                </TouchableOpacity>

                                <TouchableOpacity onPress={onClose} className="items-center mt-2">
                                    <Text style={{ color: theme.textSecondary }} className="text-xs font-bold">Cancelar</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>
            </BlurView>
        </Modal>
    );
};
