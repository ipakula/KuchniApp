import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MealPlanEntry } from '../../types/recipe.types';
import { Colors, Shadows } from '../../constants/colors';
import { MEAL_TYPE_ICONS, MEAL_TYPE_LABELS } from '../../constants/dietPreferences';

interface TodayMealsWidgetProps {
  entries: MealPlanEntry[];
  onPress: () => void;
}

export function TodayMealsWidget({ entries, onPress }: TodayMealsWidgetProps) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Text style={styles.title}>Dziś na talerzu</Text>
      {entries.length === 0 ? (
        <Text style={styles.empty}>Brak zaplanowanych posiłków — dodaj przepisy</Text>
      ) : (
        <View style={styles.mealList}>
          {entries.map((entry) => (
            <View key={entry.id} style={styles.mealRow}>
              <Text style={styles.mealIcon}>{MEAL_TYPE_ICONS[entry.meal_type]}</Text>
              <View style={styles.mealInfo}>
                <Text style={styles.mealType}>{MEAL_TYPE_LABELS[entry.meal_type]}</Text>
                <Text style={styles.mealName} numberOfLines={1}>{entry.recipe_title}</Text>
              </View>
              {entry.status === 'cooked' && <Text style={styles.cooked}>✓</Text>}
            </View>
          ))}
        </View>
      )}
    </Pressable>
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
  title: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  empty: { fontSize: 13, color: Colors.textMuted, fontStyle: 'italic' },
  mealList: { gap: 8 },
  mealRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mealIcon: { fontSize: 18 },
  mealInfo: { flex: 1 },
  mealType: { fontSize: 11, color: Colors.textMuted, fontWeight: '500' },
  mealName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  cooked: { fontSize: 16, color: Colors.primary, fontWeight: '700' },
});
