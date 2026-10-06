import React from 'react';
import { View, Platform, StyleSheet } from 'react-native';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  maxWidth?: number;
  backgroundColor?: string;
  className?: string;
}

/**
 * A container that limits the width of its content on web/desktop
 * to provide a professional look while staying responsive on mobile.
 */
export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({ 
  children, 
  maxWidth = 1200, 
  backgroundColor = 'transparent',
  className = ""
}) => {
  if (Platform.OS !== 'web') {
    return <View className={`flex-1 ${className}`} style={{ backgroundColor }}>{children}</View>;
  }

  return (
    <View style={[styles.outerContainer, { backgroundColor }]}>
      <View 
        className={className}
        style={[
          styles.innerContainer, 
          { maxWidth: maxWidth }
        ]}
      >
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    alignItems: 'center',
    width: '100%',
  },
  innerContainer: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
  },
});
