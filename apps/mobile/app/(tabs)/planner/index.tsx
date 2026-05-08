import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Modal,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { useMealPlan } from '../../../src/hooks/useMealPlan';
import { WeekCalendar } from '../../../src/components/planner/WeekCalendar';
import { MealPlanEntry, MealType, Recipe } from '../../../src/types/recipe.types';
import { Colors, Shadows } from '../../../src/constants/colors';

export default function PlannerScreen() {
  const router = useRouter();
  const { entries, recipes, currentWeek, loading, fetchWeekPlan, navigateWeek, addEntry } = useMealPlan();
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Add-meal flow state
  const [pendingDate, setPendingDate] = useState('');
  const [pendingMealType, setPendingMealType] = useState<MealType>('obiad');
  const [showChoiceModal, setShowChoiceModal] = useState(false);
  const [showRecipePicker, setShowRecipePicker] = useState(false);
  const [recipeSearch, setRecipeSearch] = useState('');
  const [addingRecipe, setAddingRecipe] = useState(false);

  const handleAddMeal = (date: string, mealType: MealType) => {
    setPendingDate(date);
    setPendingMealType(mealType);
    setShowChoiceModal(true);
  };

  const handleMealPress = (entry: MealPlanEntry) => {
    router.push(`/(tabs)/planner/recipe/${entry.recipe_id}?entryId=${entry.id}`);
  };

  const handlePickFromCookbook = () => {
    setShowChoiceModal(false);
    setRecipeSearch('');
    setShowRecipePicker(true);
  };

  const handleGenerateWithAI = () => {
    setShowChoiceModal(false);
    router.push(`/(tabs)/planner/recipe-generator?date=${pendingDate}&mealType=${pendingMealType}`);
  };

  const handleSelectRecipe = async (recipe: Recipe) => {
    setAddingRecipe(true);
    try {
      await addEntry(pendingDate, pendingMealType, recipe.id, 2);
      setShowRecipePicker(false);
    } catch {
      Alert.alert('Błąd', 'Nie udało się dodać przepisu do planu.');
    } finally {
      setAddingRecipe(false);
    }
  };

  const filteredRecipes = useMemo(() => {
    if (!recipeSearch.trim()) return recipes;
    const q = recipeSearch.toLowerCase();
    return recipes.filter((r) => r.title.toLowerCase().includes(q));
  }, [recipes, recipeSearch]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchWeekPlan} />}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Posiłki</Text>
          <View style={styles.weekNav}>
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
        </View>

        <WeekCalendar
          weekStart={currentWeek}
          entries={entries}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onAddMeal={handleAddMeal}
          onMealPress={handleMealPress}
        />

        <Pressable
          style={styles.generateBtn}
          onPress={() => router.push('/(tabs)/planner/recipe-generator')}
        >
          <Text style={styles.generateBtnText}>✨ Wygeneruj przepis AI</Text>
        </Pressable>
      </ScrollView>

      {/* Choice modal: cookbook vs AI */}
      <Modal visible={showChoiceModal} transparent animationType="slide" onRequestClose={() => setShowChoiceModal(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowChoiceModal(false)}>
          <View style={styles.choiceSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Dodaj przepis</Text>
            <Text style={styles.sheetSub}>
              {pendingDate ? `${pendingDate} · ` : ''}{pendingMealType}
            </Text>

            <Pressable style={styles.choiceItem} onPress={handlePickFromCookbook}>
              <View style={styles.choiceIcon}>
                <Text style={styles.choiceIconText}>📚</Text>
              </View>
              <View style={styles.choiceText}>
                <Text style={styles.choiceTitle}>Z Przepiśnika</Text>
                <Text style={styles.choiceSub}>
                  {recipes.length > 0 ? `${recipes.length} przepisów do wyboru` : 'Wybierz z zapisanych przepisów'}
                </Text>
              </View>
              <Text style={styles.choiceArrow}>›</Text>
            </Pressable>

            <Pressable style={styles.choiceItem} onPress={handleGenerateWithAI}>
              <View style={[styles.choiceIcon, styles.choiceIconAI]}>
                <Text style={styles.choiceIconText}>✨</Text>
              </View>
              <View style={styles.choiceText}>
                <Text style={styles.choiceTitle}>Wygeneruj z AI</Text>
                <Text style={styles.choiceSub}>Na podstawie produktów ze spiżarni</Text>
              </View>
              <Text style={styles.choiceArrow}>›</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Recipe picker modal */}
      <Modal visible={showRecipePicker} animationType="slide" onRequestClose={() => setShowRecipePicker(false)}>
        <SafeAreaView style={styles.pickerContainer} edges={['top']}>
          {/* Header */}
          <View style={styles.pickerHeader}>
            <Pressable onPress={() => setShowRecipePicker(false)} style={styles.pickerClose}>
              <Text style={styles.pickerCloseText}>Anuluj</Text>
            </Pressable>
            <Text style={styles.pickerTitle}>Wybierz przepis</Text>
            <View style={{ width: 60 }} />
          </View>

          {/* Search */}
          <View style={styles.pickerSearch}>
            <Text style={styles.pickerSearchIcon}>🔍</Text>
            <TextInput
              style={styles.pickerSearchInput}
              placeholder="Szukaj przepisu..."
              placeholderTextColor={Colors.textMuted}
              value={recipeSearch}
              onChangeText={setRecipeSearch}
            />
          </View>

          {recipes.length === 0 ? (
            <View style={styles.pickerEmpty}>
              <Text style={styles.pickerEmptyIcon}>📖</Text>
              <Text style={styles.pickerEmptyTitle}>Brak przepisów</Text>
              <Text style={styles.pickerEmptySub}>Wygeneruj przepis z AI lub zaimportuj z linku w zakładce Przepisy</Text>
            </View>
          ) : (
            <FlatList
              data={filteredRecipes}
              keyExtractor={(r) => r.id}
              contentContainerStyle={styles.pickerList}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <View style={styles.pickerEmpty}>
                  <Text style={styles.pickerEmptyTitle}>Brak wyników</Text>
                  <Text style={styles.pickerEmptySub}>Spróbuj innej frazy</Text>
                </View>
              }
              renderItem={({ item: recipe }) => (
                <Pressable
                  style={styles.pickerItem}
                  onPress={() => handleSelectRecipe(recipe)}
                  disabled={addingRecipe}
                >
                  <View style={styles.pickerItemBody}>
                    <View style={styles.pickerItemTop}>
                      <Text style={styles.pickerItemTitle} numberOfLines={1}>{recipe.title}</Text>
                      {recipe.source === 'ai' && (
                        <View style={styles.aiBadge}>
                          <Text style={styles.aiBadgeText}>AI</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.pickerItemMeta}>
                      {[(recipe.prep_time_min || 0) + (recipe.cook_time_min || 0) > 0 && `⏱ ${(recipe.prep_time_min || 0) + (recipe.cook_time_min || 0)} min`, `🍽 ${recipe.servings} porcje`].filter(Boolean).join('  ·  ')}
                    </Text>
                    {recipe.diet_tags?.length > 0 && (
                      <Text style={styles.pickerItemTags} numberOfLines={1}>
                        {recipe.diet_tags.slice(0, 3).join(' · ')}
                      </Text>
                    )}
                  </View>
                  {addingRecipe ? (
                    <ActivityIndicator color={Colors.primary} size="small" />
                  ) : (
                    <Text style={styles.pickerItemAdd}>＋</Text>
                  )}
                </Pressable>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
  },
  title: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary },
  weekNav: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  weekLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },
  navBtn: { fontSize: 26, color: Colors.primary, paddingHorizontal: 6 },
  generateBtn: {
    margin: 16,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  generateBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Choice modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  choiceSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    gap: 12,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 8,
  },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  sheetSub: { fontSize: 13, color: Colors.textMuted, marginTop: -4, marginBottom: 8, textTransform: 'capitalize' },

  choiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    backgroundColor: Colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  choiceIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceIconAI: { backgroundColor: '#FFF8E1' },
  choiceIconText: { fontSize: 22 },
  choiceText: { flex: 1 },
  choiceTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  choiceSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  choiceArrow: { fontSize: 22, color: Colors.textMuted },

  // Recipe picker
  pickerContainer: { flex: 1, backgroundColor: Colors.background },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  pickerClose: { width: 60 },
  pickerCloseText: { fontSize: 16, color: Colors.primary, fontWeight: '600' },
  pickerTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },

  pickerSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 12,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
  },
  pickerSearchIcon: { fontSize: 16, marginRight: 8 },
  pickerSearchInput: {
    flex: 1,
    paddingVertical: 11,
    fontSize: 15,
    color: Colors.textPrimary,
  },

  pickerList: { paddingHorizontal: 12, paddingBottom: 40 },

  pickerEmpty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  pickerEmptyIcon: { fontSize: 48 },
  pickerEmptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  pickerEmptySub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: 32 },

  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.small,
  },
  pickerItemBody: { flex: 1, marginRight: 10 },
  pickerItemTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  pickerItemTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  aiBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.primary + '60',
  },
  aiBadgeText: { fontSize: 10, fontWeight: '800', color: Colors.primary },
  pickerItemMeta: { fontSize: 12, color: Colors.textMuted, marginBottom: 2 },
  pickerItemTags: { fontSize: 11, color: Colors.textSecondary },
  pickerItemAdd: { fontSize: 28, color: Colors.primary, fontWeight: '300' },
});
