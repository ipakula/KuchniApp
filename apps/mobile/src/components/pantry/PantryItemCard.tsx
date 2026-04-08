import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { PantryItem } from '../../types/pantry.types';
import { ExpirationBadge } from './ExpirationBadge';
import { getCategoryIcon, formatQuantity } from '../../utils/format';
import { Colors, Shadows } from '../../constants/colors';

interface PantryItemCardProps {
  item: PantryItem;
  onPress: (item: PantryItem) => void;
}

export function PantryItemCard({ item, onPress }: PantryItemCardProps) {
  const effectiveDate = item.effective_expiry || item.expiration_date;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={() => onPress(item)}
    >
      <View style={styles.iconWrap}>
        <Text style={styles.icon}>{getCategoryIcon(item.category)}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.meta}>
          {item.location_name || 'Spiżarnia'} • {formatQuantity(item.quantity, item.unit)}
          {item.status === 'opened' ? ' • Otwarte' : ''}
        </Text>
        {effectiveDate && <ExpirationBadge expirationDate={effectiveDate} />}
      </View>

      <Text style={styles.arrow}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 12,
    ...Shadows.small,
  },
  pressed: { opacity: 0.85 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 24 },
  content: { flex: 1, gap: 3 },
  name: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  meta: { fontSize: 12, color: Colors.textSecondary },
  arrow: { fontSize: 20, color: Colors.textMuted },
});
