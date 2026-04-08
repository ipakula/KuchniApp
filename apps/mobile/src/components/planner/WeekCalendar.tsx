import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { format, isToday } from 'date-fns';
import { pl } from 'date-fns/locale';
import { MealPlanEntry, MealType } from '../../types/recipe.types';
import { Colors } from '../../constants/colors';
import { toISODate, getWeekDates } from '../../utils/date';
import { MEAL_TYPE_ICONS, MEAL_TYPE_LABELS } from '../../constants/dietPreferences';

const MEAL_TYPES: MealType[] = ['sniadanie', 'obiad', 'kolacja'];

interface WeekCalendarProps {
  weekStart: Date;
  entries: MealPlanEntry[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onAddMeal: (date: string, mealType: MealType) => void;
  onMealPress: (entry: MealPlanEntry) => void;
}

export function WeekCalendar({
  weekStart,
  entries,
  selectedDate,
  onSelectDate,
  onAddMeal,
  onMealPress,
}: WeekCalendarProps) {
  const weekDates = getWeekDates(weekStart);
  const selectedDateStr = toISODate(selectedDate);

  const getEntry = (date: Date, mealType: MealType) =>
    entries.find(
      (e) => e.meal_date === toISODate(date) && e.meal_type === mealType
    );

  return (
    <View>
      {/* Nagłówek — dni tygodnia */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayNav}>
        {weekDates.map((day) => {
          const isSelected = toISODate(day) === selectedDateStr;
          return (
            <Pressable
              key={day.toISOString()}
              onPress={() => onSelectDate(day)}
              style={[styles.dayBtn, isSelected && styles.dayBtnSelected, isToday(day) && styles.dayBtnToday]}
            >
              <Text style={[styles.dayName, isSelected && styles.dayTextSelected]}>
                {format(day, 'EEE', { locale: pl })}
              </Text>
              <Text style={[styles.dayNum, isSelected && styles.dayTextSelected]}>
                {format(day, 'd')}
              </Text>
              {isToday(day) && <View style={styles.todayDot} />}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Posiłki dla wybranego dnia */}
      <Text style={styles.dateHeader}>
        {format(selectedDate, 'EEEE, d MMMM', { locale: pl })}
      </Text>

      <View style={styles.mealList}>
        {MEAL_TYPES.map((mealType) => {
          const entry = getEntry(selectedDate, mealType);
          return (
            <View key={mealType} style={styles.mealRow}>
              <Text style={styles.mealIcon}>{MEAL_TYPE_ICONS[mealType]}</Text>
              <View style={styles.mealContent}>
                <Text style={styles.mealLabel}>{MEAL_TYPE_LABELS[mealType]}</Text>
                {entry ? (
                  <Pressable onPress={() => onMealPress(entry)}>
                    <Text style={styles.recipeName}>{entry.recipe_title}</Text>
                    {entry.status === 'cooked' && (
                      <Text style={styles.cookedBadge}>✓ Ugotowane</Text>
                    )}
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={() => onAddMeal(selectedDateStr, mealType)}
                    style={styles.addMealBtn}
                  >
                    <Text style={styles.addMealText}>+ Dodaj przepis</Text>
                  </Pressable>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dayNav: { paddingHorizontal: 16, marginBottom: 16 },
  dayBtn: {
    width: 48,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 6,
  },
  dayBtnSelected: { backgroundColor: Colors.primary },
  dayBtnToday: { borderWidth: 1.5, borderColor: Colors.primary },
  dayName: { fontSize: 11, color: Colors.textSecondary, textTransform: 'capitalize' },
  dayNum: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  dayTextSelected: { color: Colors.textInverse },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
    marginTop: 3,
  },
  dateHeader: {
    fontSize: 17,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginBottom: 12,
    textTransform: 'capitalize',
    color: Colors.textPrimary,
  },
  mealList: { paddingHorizontal: 16 },
  mealRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
    alignItems: 'flex-start',
  },
  mealIcon: { fontSize: 24, marginTop: 2 },
  mealContent: { flex: 1 },
  mealLabel: { fontSize: 12, color: Colors.textMuted, fontWeight: '500', marginBottom: 4 },
  recipeName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  cookedBadge: { fontSize: 12, color: Colors.primary, fontWeight: '500', marginTop: 2 },
  addMealBtn: {},
  addMealText: { fontSize: 14, color: Colors.primary, fontWeight: '500' },
});
