import React from 'react';
import { View, Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../constants/colors';

interface QuickActionsProps {
  onConsume: () => void;
  onOpen: () => Promise<void>;
  onDiscard: () => void;
  isOpened?: boolean;
}

interface ActionButtonProps {
  emoji: string;
  label: string;
  color: string;
  onPress: () => void | Promise<void>;
  disabled?: boolean;
  dimmed?: boolean;
}

function ActionButton({ emoji, label, color, onPress, disabled, dimmed }: ActionButtonProps) {
  const [loading, setLoading] = React.useState(false);

  const handlePress = async () => {
    if (loading || disabled) return;
    setLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await onPress();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: color },
        (dimmed || disabled) && styles.btnDimmed,
        pressed && !disabled && styles.pressed,
      ]}
      onPress={handlePress}
      disabled={loading || disabled}
    >
      {loading ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <>
          <Text style={styles.emoji}>{emoji}</Text>
          <Text style={styles.label}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

export function QuickActions({ onConsume, onOpen, onDiscard, isOpened }: QuickActionsProps) {
  return (
    <View style={styles.row}>
      <ActionButton
        emoji="✅"
        label="Skonsumuj"
        color={Colors.primary}
        onPress={onConsume}
      />
      <ActionButton
        emoji={isOpened ? '📦' : '📦'}
        label={isOpened ? 'Otwarte ✓' : 'Otwarto'}
        color={Colors.accent}
        onPress={onOpen}
        disabled={isOpened}
        dimmed={isOpened}
      />
      <ActionButton
        emoji="🗑️"
        label="Wyrzuć"
        color={Colors.warning}
        onPress={onDiscard}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 60,
  },
  btnDimmed: { opacity: 0.5 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  emoji: { fontSize: 22 },
  label: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
