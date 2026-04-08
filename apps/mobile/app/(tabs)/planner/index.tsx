import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { useMealPlan } from '../../../src/hooks/useMealPlan';
import { WeekCalendar } from '../../../src/components/planner/WeekCalendar';
import { MealPlanEntry, MealType } from '../../../src/types/recipe.types';
import { Colors } from '../../../src/constants/colors';
import { toISODate } from '../../../src/utils/date';

export default function PlannerScreen() {
  const router = useRouter();
  const { entries, currentWeek, loading, fetchWeekPlan, navigateWeek, markCooked } = useMealPlan();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const handleAddMeal = (date: string, mealType: MealType) => {
    router.push(`/(tabs)/planner/recipe-generator?date=${date}&mealType=${mealType}`);
  };

  const handleMealPress = (entry: MealPlanEntry) => {
    router.push(`/(tabs)/planner/recipe/${entry.recipe_id}?entryId=${entry.id}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView refreshing={loading} onRefresh={fetchWeekPlan}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => navigateWeek(-1)}>
            <Text style={styles.navBtn}>‹</Text>
          </Pressable>
          <Text style={styles.weekLabel}>
            {format(currentWeek, 'LLLL yyyy', { locale: pl })}
          </Text>
          <Pressable onPress={() => navigateWeek(1)}>
            <Text style={styles.navBtn}>›</Text>
          </Pressable>
        </View>

        <WeekCalendar
          weekStart={currentWeek}
          entries={entries}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onAddMeal={handleAddMeal}
          onMealPress={handleMealPress}
        />

        {/* FAB — Generuj plan AI */}
        <Pressable
          style={styles.generateBtn}
          onPress={() => router.push('/(tabs)/planner/recipe-generator')}
        >
          <Text style={styles.generateBtnText}>✨ Wygeneruj przepis AI</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  weekLabel: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, textTransform: 'capitalize' },
  navBtn: { fontSize: 28, color: Colors.primary, paddingHorizontal: 8 },
  generateBtn: {
    margin: 16,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  generateBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
