import '../global.css';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import { useColorScheme, View, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider as AppThemeProvider, useTheme } from '../src/infrastructure/context/ThemeContext';
import { NotificationProvider } from '../src/infrastructure/context/NotificationContext';
import { EasyPayProvider } from '../context/EasyPayContext';
import { DependenciesProvider } from '../src/infrastructure/context/DependenciesContext';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

SplashScreen.preventAutoHideAsync();
const queryClient = new QueryClient();

function ThemeAwareToast() {
  const { theme, fontScale } = useTheme();

  const toastConfig = {
    success: (props: any) => (
      <View style={{ backgroundColor: theme.card, borderColor: '#22c55e', borderWidth: 1, padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', width: '90%', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 }}>
        <Ionicons name="checkmark-circle" size={24} color="#22c55e" style={{ marginRight: 12 }} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.text, fontSize: 16 * fontScale, fontWeight: 'bold' }}>{props.text1}</Text>
          {props.text2 ? <Text style={{ color: theme.textSecondary, fontSize: 14 * fontScale, marginTop: 2 }}>{props.text2}</Text> : null}
        </View>
      </View>
    ),
    error: (props: any) => (
      <View style={{ backgroundColor: theme.card, borderColor: '#ef4444', borderWidth: 1, padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', width: '90%', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 }}>
        <Ionicons name="alert-circle" size={24} color="#ef4444" style={{ marginRight: 12 }} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.text, fontSize: 16 * fontScale, fontWeight: 'bold' }}>{props.text1}</Text>
          {props.text2 ? <Text style={{ color: theme.textSecondary, fontSize: 14 * fontScale, marginTop: 2 }}>{props.text2}</Text> : null}
        </View>
      </View>
    ),
    info: (props: any) => (
      <View style={{ backgroundColor: theme.card, borderColor: theme.primary, borderWidth: 1, padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', width: '90%', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 }}>
        <Ionicons name="information-circle" size={24} color={theme.primary} style={{ marginRight: 12 }} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.text, fontSize: 16 * fontScale, fontWeight: 'bold' }}>{props.text1}</Text>
          {props.text2 ? <Text style={{ color: theme.textSecondary, fontSize: 14 * fontScale, marginTop: 2 }}>{props.text2}</Text> : null}
        </View>
      </View>
    )
  };

  return <Toast config={toastConfig} position="bottom" bottomOffset={60} />;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <NotificationProvider>
          <AppThemeProvider>
            <EasyPayProvider>
              <DependenciesProvider>
                <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                  <Stack screenOptions={{ headerShown: false }} initialRouteName="index">
                    <Stack.Screen name="index" />
                    <Stack.Screen name="login" />
                    <Stack.Screen name="wallet/security" options={{ presentation: 'modal' }} />
                    <Stack.Screen name="wallet/methods/new" options={{ presentation: 'modal' }} />
                    <Stack.Screen name="wallet/methods/[id]" options={{ presentation: 'modal' }} />
                    <Stack.Screen name="wallet/history/[id]" options={{ presentation: 'modal' }} />
                    <Stack.Screen name="(tabs)" />
                  </Stack>
                  <ThemeAwareToast />
                </ThemeProvider>
              </DependenciesProvider>
            </EasyPayProvider>
          </AppThemeProvider>
        </NotificationProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
