import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { X, Check, DollarSign, Tag } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface EditItemModalProps {
    isVisible: boolean;
    onClose: () => void;
    item: any;
    onSave: (itemId: string, data: any) => Promise<void>;
}

export const EditItemModal: React.FC<EditItemModalProps> = ({ isVisible, onClose, item, onSave }) => {
    const [nombre, setNombre] = useState('');
    const [precio, setPrecio] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (item) {
            setNombre(item.nombre || '');
            setPrecio(String(item.monto || item.precio || ''));
        }
    }, [item]);

    const handleSave = async () => {
        if (!nombre || !precio) return;
        setLoading(true);
        try {
            await onSave(item.id, {
                nombre,
                precio: parseFloat(precio)
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onClose();
        } catch (error) {
            console.error(error);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            visible={isVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.container}
                >
                    <View style={styles.content}>
                        <View style={styles.header}>
                            <Text style={styles.title}>Editar Gasto</Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <X size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.form}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Concepto</Text>
                                <View style={styles.inputWrapper}>
                                    <Tag size={20} color="#94a3b8" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        value={nombre}
                                        onChangeText={setNombre}
                                        placeholder="Ej. Pizza"
                                        placeholderTextColor="#94a3b8"
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Monto</Text>
                                <View style={styles.inputWrapper}>
                                    <DollarSign size={20} color="#10b981" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        value={precio}
                                        onChangeText={setPrecio}
                                        placeholder="0.00"
                                        keyboardType="numeric"
                                        placeholderTextColor="#94a3b8"
                                    />
                                </View>
                            </View>
                        </View>

                        <TouchableOpacity 
                            style={[styles.saveButton, (loading || !nombre || !precio) && styles.disabledButton]}
                            onPress={handleSave}
                            disabled={loading || !nombre || !precio}
                        >
                            <Check size={20} color="white" />
                            <Text style={styles.saveButtonText}>Guardar Cambios</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        width: '100%',
    },
    content: {
        backgroundColor: 'white',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 20,
        fontWeight: '900',
        color: '#1e293b',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    closeButton: {
        padding: 8,
        backgroundColor: '#f1f5f9',
        borderRadius: 12,
    },
    form: {
        gap: 20,
        marginBottom: 32,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 10,
        fontWeight: '900',
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginLeft: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 16,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        paddingVertical: 16,
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
    },
    saveButton: {
        backgroundColor: '#10b981',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        borderRadius: 20,
        gap: 10,
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 5,
    },
    disabledButton: {
        opacity: 0.5,
        backgroundColor: '#94a3b8',
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
    }
});
