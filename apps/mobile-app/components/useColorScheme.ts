import { useColorScheme as useColorSchemeCore } from 'react-native';

export const useColorScheme = () => {
    const coreScheme = useColorSchemeCore();
    // Aseguramos que nunca devuelva null o unspecified para evitar errores en React 19/RN 0.81
    if (coreScheme === 'dark') return 'dark';
    return 'light';
};
