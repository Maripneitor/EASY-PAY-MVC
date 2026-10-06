import React from 'react';
import { View, Text } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../infrastructure/context/ThemeContext';
import { useEasyPay } from '../../context/EasyPayContext';

export const SyncStatus = () => {
    const { theme, fontScale } = useTheme();
    const { isOnline, activeGrupo } = useEasyPay();

    return (
        <>
            {!isOnline && (
                <View 
                    style={{ 
                        backgroundColor: '#f43f5e',
                        zIndex: 100,
                        position: 'absolute',
                        top: 48,
                        left: 24,
                        right: 24,
                    }}
                    className="px-4 py-2 rounded-full flex-row items-center justify-center shadow-lg"
                >
                    <View className="flex-row items-center gap-2">
                        <MaterialIcons 
                            name="cloud-off" 
                            size={16} 
                            color="white" 
                        />
                        <Text 
                            style={{ 
                                color: "white",
                                fontSize: 11 * fontScale 
                            }} 
                            className="font-bold text-center"
                        >
                            🔴 Offline. Los cambios se guardarán localmente.
                        </Text>
                    </View>
                </View>
            )}
            {isOnline && (
                <View 
                    style={{ zIndex: 100, position: 'absolute', top: 56, right: 24 }}
                >
                    <View 
                        style={{ 
                            backgroundColor: theme.bg + 'CC',
                            borderColor: '#10b98140'
                        }}
                        className="px-3 py-1.5 rounded-full flex-row items-center gap-2 border shadow-sm"
                    >
                        <View
                            className="w-2 h-2 rounded-full bg-emerald-500"
                        />
                        <Text 
                            style={{ color: '#10b981', fontSize: 9 * fontScale }} 
                            className="font-black uppercase tracking-[0.1em]"
                        >
                            {activeGrupo ? 'Sincronizado' : 'Online'}
                        </Text>
                        <Ionicons name="flash" size={10} color="#10b981" />
                    </View>
                </View>
            )}
        </>
    );
};
