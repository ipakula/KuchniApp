import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeOut, LinearTransition } from 'react-native-reanimated';
import { ShoppingItem as TShoppingItem } from '../../types/shopping.types';
import { Colors } from '../../constants/colors';
import { formatQuantity } from '../../utils/format';

interface ShoppingItemProps {
  item: TShoppingItem;
  onCheck: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ShoppingItemRow({ item, onCheck, onDelete }: ShoppingItemProps) {
  return (
    <Animated.View
      layout={LinearTransition}
      exiting={FadeOut.duration(200)}
      style={[styles.container, item.is_checked && styles.checkedContainer]}
    >
      <Pressable
        onPress={() => onCheck(item.id)}
        style={[styles.checkbox, item.is_checked && styles.checkboxChecked]}
      >
        {item.is_checked && <Text style={styles.checkmark}>✓</Text>}
      </Pressable>

      <View style={styles.info}>
        <Text style={[styles.name, item.is_checked && styles.strikethrough]}>
          {item.name}
        </Text>
        <Text style={styles.qty}>{formatQuantity(item.quantity, item.unit)}</Text>
      </View>

      <Pressable onPress={() => onDelete(item.id)} style={styles.deleteBtn}>
        <Text style={styles.deleteIcon}>✕</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    marginBottom: 6,
    gap: 12,
  },
  checkedContainer: { opacity: 0.6 },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: Colors.primary },
  checkmark: { color: '#fff', fontSize: 13, fontWeight: '700' },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '500', color: Colors.textPrimary },
  strikethrough: { textDecorationLine: 'line-through', color: Colors.textMuted },
  qty: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  deleteBtn: { padding: 4 },
  deleteIcon: { fontSize: 14, color: Colors.textMuted },
});
