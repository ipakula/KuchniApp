import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../constants/colors';

interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  style?: ViewStyle;
}

const variantColors = {
  success: { bg: '#E8F5E9', text: '#2D6A4F' },
  warning: { bg: '#FFF8E1', text: '#F57F17' },
  danger: { bg: '#FFEBEE', text: '#C62828' },
  info: { bg: '#E3F2FD', text: '#1565C0' },
  neutral: { bg: '#F5F5F5', text: '#616161' },
};

export function Badge({ label, variant = 'neutral', style }: BadgeProps) {
  const colors = variantColors[variant];
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }, style]}>
      <Text style={[styles.text, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  text: { fontSize: 11, fontWeight: '600' },
});
