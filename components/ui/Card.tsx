import React from 'react';
import { View, StyleSheet, ViewStyle, Pressable, Platform } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  backgroundColor?: string;
  onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, style, backgroundColor = '#FFFFFF', onPress }) => {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          { backgroundColor },
          pressed && styles.pressed,
          style,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor }, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
      },
      android: {
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
      },
    }),
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
});
