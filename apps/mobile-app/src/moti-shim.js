import { View, Text } from 'react-native';
import React from 'react';

export const MotiView = View;
export const MotiText = Text;
export const AnimatePresence = ({ children }) => children;
export const useDynamicAnimation = () => ({});
export const useAnimationState = () => ({});

export default {
  MotiView,
  MotiText,
  AnimatePresence,
  useDynamicAnimation,
  useAnimationState,
};
