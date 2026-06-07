import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { PantryItem } from '../../types/pantry.types';
import { ExpirationBadge } from './ExpirationBadge';
import { getCategoryIcon, formatQuantity, formatDate } from '../../utils/format';
import { getDaysUntilExpiry } from '../../utils/date';
import { Colors, Shadows } from '../../constants/colors';

interface PantryItemCardProps {
  item: PantryItem;
  onPress: (item: PantryItem) => void;
}

export function PantryItemCard({ item, onPress }: PantryItemCardProps) {
  const effectiveDate = item.effective_expiry || item.expiration_date;
  const isOpened = item.status === 'opened';

  // Only show badge if expiring within 7 days (or already expired)
  const daysLeft = getDaysUntilExpiry(effectiveDate);
  const showBadge = effectiveDate && daysLeft !== null && daysLeft <= 7;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={() => onPress(item)}
    >
      <View style={[styles.iconWrap, isOpened && styles.iconWrapOpened]}>
        <Text style={styles.icon}>{getCategoryIcon(item.category)}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          {isOpened && (
            <View style={styles.openedPill}>
              <Text style={styles.openedPillText}>otwarte</Text>
            </View>
          )}
        </View>
        <Text style={styles.meta}>
          {item.location_name || 'Spiżarnia'} · {formatQuantity(item.quantity, item.unit)}
        </Text>
        {isOpened && item.opened_date && (
          <Text style={styles.openedDate}>otwarto {formatDate(item.opened_date)}</Text>
        )}
        {showBadge && <ExpirationBadge expirationDate={effectiveDate!} />}
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
  iconWrapOpened: {
    backgroundColor: '#FFF8E1',
  },
  icon: { fontSize: 24 },
  content: { flex: 1, gap: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, flex: 1 },
  openedPill: {
    backgroundColor: '#FFF8E1',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  openedPillText: { fontSize: 10, fontWeight: '700', color: Colors.accent },
  meta: { fontSize: 12, color: Colors.textSecondary },
  openedDate: { fontSize: 11, color: Colors.accent },
  arrow: { fontSize: 20, color: Colors.textMuted },
});
