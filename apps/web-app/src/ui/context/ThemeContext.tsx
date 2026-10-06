import React, { createContext, useContext, useEffect, useState } from 'react';

// 1. Añadimos 'pink' a los tipos permitidos
type ColorTheme = 'vibrant' | 'serene' | 'earth' | 'pink' | 'default';
type FontSize = 'small' | 'medium' | 'large';

interface ThemeContextType {
    colorTheme: ColorTheme;
    isDark: boolean;
    fontSize: FontSize;
    setTheme: (theme: ColorTheme) => void;
    toggleTheme: () => void;
    setFontSize: (size: FontSize) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [colorTheme, setColorTheme] = useState<ColorTheme>(() => 
        (localStorage.getItem('color-theme') as ColorTheme) || 'default'
    );

    const [isDark, setIsDark] = useState<boolean>(() => {
        const saved = localStorage.getItem('is-dark');
        return saved ? saved === 'true' : true;
    });

    const [fontSize, setFontSizeState] = useState<FontSize>(() => 
        (localStorage.getItem('font-size') as FontSize) || 'medium'
    );

    useEffect(() => {
        const rootBody = window.document.body;
        const rootHtml = window.document.documentElement;
        
        // 1. Limpiamos clases de color (añadimos pink aquí) y tamaño
        const themes = ['vibrant', 'serene', 'earth', 'pink', 'dark'];
        const sizes = ['font-small', 'font-medium', 'font-large'];
        
        rootBody.classList.remove(...themes, ...sizes);
        rootHtml.classList.remove(...sizes);

        // 2. Aplicamos Modo Oscuro
        if (isDark) {
            rootBody.classList.add('dark');
        }

        // 3. Aplicamos Tema de Color
        if (colorTheme !== 'default') {
            rootBody.classList.add(colorTheme);
        }

        // 4. ESCALADO GLOBAL: Aplicamos al HTML y al BODY
        rootHtml.classList.add(`font-${fontSize}`);
        rootBody.classList.add(`font-${fontSize}`);

        // 5. Persistencia
        localStorage.setItem('color-theme', colorTheme);
        localStorage.setItem('is-dark', isDark.toString());
        localStorage.setItem('font-size', fontSize);
        
    }, [colorTheme, isDark, fontSize]);

    const setTheme = (newColor: ColorTheme) => setColorTheme(newColor);
    const toggleTheme = () => setIsDark(prev => !prev);
    const setFontSize = (size: FontSize) => setFontSizeState(size);

    return (
        <ThemeContext.Provider value={{ colorTheme, isDark, fontSize, setTheme, toggleTheme, setFontSize }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) throw new Error('useTheme debe usarse dentro de ThemeProvider');
    return context;
};