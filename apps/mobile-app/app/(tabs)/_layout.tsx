import { useEasyPay } from '../../context/EasyPayContext';
import React from 'react';
import { Tabs, useRouter, Redirect } from 'expo-router';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, TouchableOpacity, Platform, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/infrastructure/context/ThemeContext';
import { useNotifications } from '../../src/infrastructure/context/NotificationContext';

const CustomTabBarButton = ({ children, onPress, theme, isOnline }: any) => {
  return (
    <View style={{ alignItems: 'center' }}>
      <TouchableOpacity
        style={{
          top: -20,
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1001,
          ...styles.tabButtonShadow
        }}
        onPress={onPress}
        activeOpacity={0.9}
      >
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: theme.primary,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 4,
            borderColor: theme.bg,
          }}
        >
          {children}
          {isOnline === false && (
            <View style={{ position: 'absolute', top: -4, right: -4, backgroundColor: '#f43f5e', borderRadius: 12, padding: 3, borderWidth: 2, borderColor: theme.bg }}>
              <MaterialIcons name="cloud-off" size={14} color="white" />
            </View>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
};

import { usePathname } from 'expo-router';
import { useEffect } from 'react';

export default function TabLayout() {
  const { theme } = useTheme();
  const { hasAlerts } = useNotifications();
  const { user, isLoading, isOnline, saveLastRoute, pendingSettlementsCount } = useEasyPay();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname && pathname !== '/') {
      saveLastRoute(pathname);
    }
  }, [pathname]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/');
    }
  }, [user, isLoading]);

  if (isLoading || !user) return null;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      {!isOnline && (
        <View style={{
          paddingTop: insets.top,
          backgroundColor: '#f59e0b',
          zIndex: 50
        }}>
          <View style={{
            paddingVertical: 6,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}>
            <MaterialIcons name="cloud-off" size={16} color="white" />
            <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
              📡 Sin conexión. Los cambios se guardarán localmente.
            </Text>
          </View>
        </View>
      )}
      <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: '#475569',
        tabBarStyle: {
          backgroundColor: theme.bg,
          borderTopWidth: 0,
          height: 60 + (insets.bottom > 0 ? insets.bottom + 5 : 15),
          paddingBottom: insets.bottom > 0 ? insets.bottom + 5 : 15,
          paddingTop: 12,
          position: 'absolute',
          elevation: 0,
          borderTopColor: 'transparent',
          borderBottomWidth: 0,
        },
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: '900',
          textTransform: 'uppercase',
          letterSpacing: 1.2,
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, focused }) => (
            <View>
              <MaterialIcons name="grid-view" size={26} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Alertas',
          tabBarIcon: ({ color, focused }) => (
            <View>
              <View>
                <MaterialIcons name="notifications-none" size={26} color={color} />
                {hasAlerts && (
                  <View className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#050a15]" />
                )}
              </View>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="qr"
        options={{
          tabBarLabel: '',
          tabBarButton: (props) => (
            <CustomTabBarButton theme={theme} isOnline={isOnline} {...props}>
              <MaterialIcons name="qr-code-scanner" size={32} color="white" />
            </CustomTabBarButton>
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Estadísticas',
          tabBarIcon: ({ color, focused }) => (
            <View>
              <MaterialIcons name="bar-chart" size={26} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen name="groups" options={{ href: null }} />
      <Tabs.Screen name="payments" options={{ href: null }} />
    </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  tabButtonShadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
    }),
  },
});
