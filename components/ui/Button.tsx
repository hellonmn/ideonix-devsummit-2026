import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle, Platform } from 'react-native';
import { Colors } from '@/constants/colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  variant?: 'primary' | 'secondary' | 'outline';
}

export const Button: React.FC<ButtonProps> = ({ title, onPress, style, textStyle, variant = 'primary' }) => {
  const isPrimary = variant === 'primary';
  
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        isPrimary ? styles.primary : styles.secondary,
        pressed && styles.pressed,
        style,
      ]}
      onPress={onPress}
    >
      <Text style={[styles.text, isPrimary ? styles.textPrimary : styles.textSecondary, textStyle]}>
        {title}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: {},
    }),
  },
  primary: {
    backgroundColor: '#FFFFFF',
  },
  secondary: {
    backgroundColor: Colors.light.primary,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.85,
  },
  text: {
    fontSize: 18,
    fontWeight: '700',
  },
  textPrimary: {
    color: '#000000',
  },
  textSecondary: {
    color: '#FFFFFF',
  },
});
