import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { PantryItem } from '../../types/pantry.types';
import { Colors, Shadows } from '../../constants/colors';
import { getDaysUntilExpiry } from '../../utils/date';

interface ExpiringWidgetProps {
  items: PantryItem[];
  onViewAll: () => void;
  onGenerateRecipe: () => void;
}

function expiryLabel(item: PantryItem): string {
  const date = item.effective_expiry || item.expiration_date;
  const days = getDaysUntilExpiry(date);
  if (days === null) return '';
  if (days < 0) return 'przeterminowane';
  if (days === 0) return 'dziś!';
  if (days === 1) return 'jutro';
  return `za ${days} dni`;
}

function urgencyColor(item: PantryItem): string {
  const date = item.effective_expiry || item.expiration_date;
  const days = getDaysUntilExpiry(date);
  if (days === null) return Colors.textMuted;
  if (days <= 0) return Colors.error;
  if (days <= 1) return Colors.error;
  if (days <= 3) return Colors.accent;
  return Colors.textSecondary;
}

export function ExpiringWidget({ items, onViewAll, onGenerateRecipe }: ExpiringWidgetProps) {
  if (items.length === 0) return null;

  // Show at most 3 items in the widget
  const preview = items.slice(0, 3);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.icon}>⚠️</Text>
          <Text style={styles.title}>
            {items.length === 1 ? '1 produkt kończy się' : `${items.length} produktów kończy się`}
          </Text>
        </View>
        <Pressable onPress={onViewAll}>
          <Text style={styles.viewAll}>Wszystkie ›</Text>
        </Pressable>
      </View>

      {/* Per-item rows */}
      <View style={styles.itemList}>
        {preview.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
            <Text style={[styles.itemExpiry, { color: urgencyColor(item) }]}>
              {expiryLabel(item)}
            </Text>
          </View>
        ))}
        {items.length > 3 && (
          <Text style={styles.moreText}>i {items.length - 3} więcej...</Text>
        )}
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.actionBtn} onPress={onViewAll}>
          <Text style={styles.actionText}>Sprawdź</Text>
        </Pressable>
        <Pressable style={[styles.actionBtn, styles.actionBtnPrimary]} onPress={onGenerateRecipe}>
          <Text style={[styles.actionText, styles.actionTextPrimary]}>✨ Wygeneruj przepis</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF8E1',
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: Colors.accent,
    gap: 10,
    marginBottom: 16,
    ...Shadows.small,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  icon: { fontSize: 20 },
  title: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  viewAll: { fontSize: 13, color: Colors.primary, fontWeight: '600' },

  itemList: { gap: 6 },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  itemName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginRight: 8,
  },
  itemExpiry: { fontSize: 12, fontWeight: '700' },
  moreText: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', marginTop: 2 },

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
  actionTextPrimary: { color: '#fff' },
});
