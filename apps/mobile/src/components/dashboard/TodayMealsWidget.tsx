import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MealPlanEntry } from '../../types/recipe.types';
import { Colors, Shadows } from '../../constants/colors';
import { MEAL_TYPE_ICONS, MEAL_TYPE_LABELS } from '../../constants/dietPreferences';

interface TodayMealsWidgetProps {
  entries: MealPlanEntry[];
  onPress: () => void;
  onAddMeal?: () => void;
}

export function TodayMealsWidget({ entries, onPress, onAddMeal }: TodayMealsWidgetProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Dziś na talerzu</Text>
        {entries.length > 0 && (
          <Pressable onPress={onPress}>
            <Text style={styles.viewAll}>Zobacz plan ›</Text>
          </Pressable>
        )}
      </View>

      {entries.length === 0 ? (
        <Pressable style={styles.emptyState} onPress={onAddMeal || onPress}>
          <Text style={styles.emptyIcon}>🍽️</Text>
          <View style={styles.emptyText}>
            <Text style={styles.emptyTitle}>Brak posiłków na dziś</Text>
            <Text style={styles.emptyAction}>Zaplanuj posiłki →</Text>
          </View>
        </Pressable>
      ) : (
        <View style={styles.mealList}>
          {entries.map((entry) => (
            <Pressable
              key={entry.id}
              style={styles.mealRow}
              onPress={onPress}
            >
              <View style={styles.mealIconWrap}>
                <Text style={styles.mealIcon}>{MEAL_TYPE_ICONS[entry.meal_type]}</Text>
              </View>
              <View style={styles.mealInfo}>
                <Text style={styles.mealType}>{MEAL_TYPE_LABELS[entry.meal_type]}</Text>
                <Text style={styles.mealName} numberOfLines={1}>{entry.recipe_title}</Text>
              </View>
              {entry.status === 'cooked' ? (
                <View style={styles.cookedBadge}>
                  <Text style={styles.cookedText}>✓</Text>
                </View>
              ) : (
                <Text style={styles.arrow}>›</Text>
              )}
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    ...Shadows.small,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  viewAll: { fontSize: 13, color: Colors.primary, fontWeight: '600' },

  emptyState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.background,
    borderRadius: 10,
    padding: 12,
  },
  emptyIcon: { fontSize: 28 },
  emptyText: { flex: 1, gap: 2 },
  emptyTitle: { fontSize: 14, color: Colors.textSecondary },
  emptyAction: { fontSize: 13, color: Colors.primary, fontWeight: '600' },

  mealList: { gap: 8 },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.background,
    borderRadius: 10,
    padding: 10,
  },
  mealIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealIcon: { fontSize: 18 },
  mealInfo: { flex: 1 },
  mealType: { fontSize: 11, color: Colors.textMuted, fontWeight: '500' },
  mealName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  cookedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cookedText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  arrow: { fontSize: 18, color: Colors.textMuted },
});
