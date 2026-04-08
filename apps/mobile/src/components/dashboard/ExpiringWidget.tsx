import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { PantryItem } from '../../types/pantry.types';
import { Colors, Shadows } from '../../constants/colors';
import { getExpiryLabel } from '../../utils/date';

interface ExpiringWidgetProps {
  items: PantryItem[];
  onViewAll: () => void;
  onGenerateRecipe: () => void;
}

export function ExpiringWidget({ items, onViewAll, onGenerateRecipe }: ExpiringWidgetProps) {
  if (items.length === 0) return null;

  return (
    <Pressable style={styles.card} onPress={onViewAll}>
      <View style={styles.header}>
        <Text style={styles.icon}>⚠️</Text>
        <View style={styles.headerText}>
          <Text style={styles.title}>
            {items.length} {items.length === 1 ? 'produkt kończy się' : 'produkty kończą się'}
          </Text>
          <Text style={styles.subtitle}>
            {items
              .slice(0, 2)
              .map((i) => i.name)
              .join(', ')}
            {items.length > 2 ? ` i ${items.length - 2} więcej` : ''}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.actionBtn} onPress={onViewAll}>
          <Text style={styles.actionText}>Sprawdź</Text>
        </Pressable>
        <Pressable style={[styles.actionBtn, styles.actionBtnPrimary]} onPress={onGenerateRecipe}>
          <Text style={[styles.actionText, styles.actionTextPrimary]}>✨ Wygeneruj przepis</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF8E1',
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: Colors.accent,
    gap: 12,
    ...Shadows.small,
  },
  header: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  icon: { fontSize: 24 },
  headerText: { flex: 1, gap: 3 },
  title: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  subtitle: { fontSize: 13, color: Colors.textSecondary },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionBtnPrimary: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  actionText: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  actionTextPrimary: { color: Colors.textInverse },
});
