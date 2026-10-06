import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ColorTheme = 'vibrant' | 'serene' | 'earth' | 'pink' | 'default' | 'light';
export type FontSize = 'small' | 'medium' | 'large';

interface Theme {
    bg: string;
    card: string;
    cardSecondary: string;
    primary: string;
    text: string;
    textSecondary: string;
    border: string;
    isDark: boolean;
    glassBg: string;
}

const THEMES: Record<ColorTheme, Theme> = {
    default: {
        bg: '#050a15',
        card: '#0c1425',
        cardSecondary: 'rgba(30, 41, 59, 0.4)',
        primary: '#38bdf8', // Original Blue
        text: '#ffffff',
        textSecondary: '#94a3b8',
        border: 'rgba(56, 189, 248, 0.2)',
        isDark: true,
        glassBg: 'rgba(255, 255, 255, 0.05)'
    },
    light: {
        bg: '#F7F9FB',
        card: '#FFFFFF',
        cardSecondary: '#F2F4F6',
        primary: '#0061A4',
        text: '#191C1E',
        textSecondary: '#404752',
        border: '#BFC7D4',
        isDark: false,
        glassBg: 'rgba(247, 249, 251, 0.8)'
    },
    vibrant: {
        bg: '#1a0a0a',
        card: '#2d1212',
        cardSecondary: 'rgba(45, 18, 18, 0.6)',
        primary: '#f87171', // Rojo Mate
        text: '#ffffff',
        textSecondary: '#fca5a5',
        border: 'rgba(248, 113, 113, 0.2)',
        isDark: true,
        glassBg: 'rgba(255, 255, 255, 0.05)'
    },
    serene: {
        bg: '#051a14',
        card: '#0a2e24',
        cardSecondary: 'rgba(10, 46, 36, 0.6)',
        primary: '#34d399', // Verde Bosque Tint
        text: '#f8fafc',
        textSecondary: '#6ee7b7',
        border: 'rgba(52, 211, 153, 0.2)',
        isDark: true,
        glassBg: 'rgba(255, 255, 255, 0.05)'
    },
    earth: {
        bg: '#17120a',
        card: '#261e12',
        cardSecondary: 'rgba(38, 30, 18, 0.6)',
        primary: '#fbbf24', // Ámbar
        text: '#f8fafc',
        textSecondary: '#fcd34d',
        border: 'rgba(251, 191, 36, 0.2)',
        isDark: true,
        glassBg: 'rgba(255, 255, 255, 0.05)'
    },
    pink: {
        bg: '#1a0a14',
        card: '#2d1222',
        cardSecondary: 'rgba(45, 18, 34, 0.6)',
        primary: '#ff4081', // Rosa Lomecan
        text: '#f8fafc',
        textSecondary: '#f472b6',
        border: 'rgba(255, 64, 129, 0.2)',
        isDark: true,
        glassBg: 'rgba(255, 255, 255, 0.05)'
    }
};

const FONT_SCALES: Record<FontSize, number> = {
    small: 0.85,
    medium: 1,
    large: 1.2
};

interface ThemeContextType {
    colorTheme: ColorTheme;
    fontSize: FontSize;
    theme: Theme;
    fontScale: number;
    setColorTheme: (theme: ColorTheme) => void;
    setFontSize: (size: FontSize) => void;
    cycleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [colorTheme, setColorThemeState] = useState<ColorTheme>('default');
    const [fontSize, setFontSizeState] = useState<FontSize>('medium');

    useEffect(() => {
        // Load settings
        const loadSettings = async () => {
            try {
                const savedTheme = await AsyncStorage.getItem('@easy_pay_theme');
                const savedSize = await AsyncStorage.getItem('@easy_pay_font_size');
                if (savedTheme) setColorThemeState(savedTheme as ColorTheme);
                if (savedSize) setFontSizeState(savedSize as FontSize);
            } catch (e) {
                console.error('Failed to load theme settings');
            }
        };
        loadSettings();
    }, []);

    const setColorTheme = async (theme: ColorTheme) => {
        setColorThemeState(theme);
        await AsyncStorage.setItem('@easy_pay_theme', theme);
    };

    const setFontSize = async (size: FontSize) => {
        setFontSizeState(size);
        await AsyncStorage.setItem('@easy_pay_font_size', size);
    };

    const cycleTheme = () => {
        const themeList: ColorTheme[] = ['light', 'default', 'vibrant', 'serene', 'earth', 'pink'];
        const currentIndex = themeList.indexOf(colorTheme);
        const nextIndex = (currentIndex + 1) % themeList.length;
        setColorTheme(themeList[nextIndex]);
    };

    const value = {
        colorTheme,
        fontSize,
        theme: THEMES[colorTheme],
        fontScale: FONT_SCALES[fontSize],
        setColorTheme,
        setFontSize,
        cycleTheme
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within ThemeProvider');
    return context;
};
