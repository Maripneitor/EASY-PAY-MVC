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
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../src/infrastructure/context/ThemeContext';
import { groupRepository } from '../../src/infrastructure/api/repositories/GroupRepository';

interface EditGroupModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    group: any;
}

export const EditGroupModal: React.FC<EditGroupModalProps> = ({ 
    visible, 
    onClose, 
    onSuccess, 
    group
}) => {
    const { theme, fontScale } = useTheme();
    const [name, setName] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (visible && group) {
            setName(group.nombre || '');
        }
    }, [visible, group?.id]);

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'El nombre no puede estar vacío');
            return;
        }

        setIsSaving(true);
        try {
            await groupRepository.updateGroup(group.id, { nombre: name });
            onSuccess();
            onClose();
        } catch (error) {
            Alert.alert('Error', 'No se pudo actualizar el grupo');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <BlurView intensity={20} tint="dark" className="flex-1 justify-center px-6">
                <View 
                    style={{ backgroundColor: theme.bg }} 
                    className="w-full rounded-[32px] border border-white/10 p-8 shadow-2xl"
                >
                    <Text style={{ color: theme.text }} className="text-xl font-black mb-6">Editar Grupo</Text>

                    <View className="mb-8">
                        <Text style={{ color: theme.textSecondary }} className="text-[10px] font-black uppercase tracking-widest mb-3">Nombre del Grupo</Text>
                        <View style={{ backgroundColor: theme.cardSecondary }} className="rounded-2xl px-5 py-4">
                            <TextInput 
                                value={name}
                                onChangeText={setName}
                                style={{ color: theme.text }}
                                className="font-bold text-base"
                                placeholder="Nombre del grupo"
                                placeholderTextColor={theme.textSecondary + '50'}
                                autoFocus
                            />
                        </View>
                    </View>

                    <View className="flex-row gap-4">
                        <TouchableOpacity 
                            onPress={onClose}
                            style={{ backgroundColor: theme.cardSecondary }}
                            className="flex-1 h-14 rounded-xl items-center justify-center"
                        >
                            <Text style={{ color: theme.text }} className="font-black uppercase text-[10px] tracking-widest">Cancelar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            onPress={handleSave}
                            disabled={isSaving}
                            style={{ backgroundColor: theme.primary }}
                            className="flex-1 h-14 rounded-xl items-center justify-center"
                        >
                            {isSaving ? (
                                <ActivityIndicator color="black" />
                            ) : (
                                <Text className="text-black font-black uppercase text-[10px] tracking-widest">Guardar</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </BlurView>
        </Modal>
    );
};
