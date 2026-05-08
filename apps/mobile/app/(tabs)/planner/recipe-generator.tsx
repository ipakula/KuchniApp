import React, { useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Pressable,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { usePantry } from '../../../src/hooks/usePantry';
import { usePlannerStore } from '../../../src/store/planner.store';
import { generateRecipe } from '../../../src/api/recipes.api';
import { Button } from '../../../src/components/ui/Button';
import { DatePickerModal } from '../../../src/components/ui/DatePickerModal';
import { Colors } from '../../../src/constants/colors';
import { DIET_PREFERENCES } from '../../../src/constants/dietPreferences';
import { MealType, Recipe } from '../../../src/types/recipe.types';
import { useAuthStore } from '../../../src/store/auth.store';
import { toISODate } from '../../../src/utils/date';

const MEAL_TYPES: { value: MealType; label: string }[] = [
  { value: 'sniadanie', label: '🌅 Śniadanie' },
  { value: 'obiad', label: '☀️ Obiad' },
  { value: 'kolacja', label: '🌙 Kolacja' },
];

export default function RecipeGeneratorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string; mealType?: string }>();
  const { user } = useAuthStore();
  const { items } = usePantry();
  const { addEntry } = usePlannerStore();
  const scrollRef = useRef<ScrollView>(null);

  const [mealType, setMealType] = useState<MealType>((params.mealType as MealType) || 'obiad');
  const [servings, setServings] = useState(user?.household_size || 2);
  const [diet, setDiet] = useState(user?.diet_preference || 'none');
  const [preferences, setPreferences] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedRecipe, setGeneratedRecipe] = useState<Recipe | null>(null);
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Ingredient selector
  const [showIngredientSelector, setShowIngredientSelector] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(items.map((i) => i.id)));
  const [ingredientSearch, setIngredientSearch] = useState('');

  // Plan modal
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planDate, setPlanDate] = useState<Date>(params.date ? new Date(params.date) : new Date());
  const [planMealType, setPlanMealType] = useState<MealType>((params.mealType as MealType) || mealType);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [planning, setPlanning] = useState(false);

  const allItems = items;
  const selectedItems = useMemo(() => allItems.filter((i) => selectedIds.has(i.id)), [allItems, selectedIds]);
  const selectedNames = selectedItems.map((i) => i.name);

  const filteredIngredients = useMemo(() =>
    ingredientSearch
      ? allItems.filter((i) => i.name.toLowerCase().includes(ingredientSearch.toLowerCase()))
      : allItems,
    [allItems, ingredientSearch]
  );

  const toggleItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(allItems.map((i) => i.id)));
  const clearAll = () => setSelectedIds(new Set());

  const handleGenerate = async () => {
    if (selectedNames.length === 0) {
      Alert.alert('Brak składników', 'Wybierz co najmniej jeden składnik ze spiżarni.');
      return;
    }
    setLoading(true);
    setGeneratedRecipe(null);
    try {
      const recipe = await generateRecipe({
        pantry_items: selectedNames,
        meal_type: mealType,
        servings,
        diet: diet !== 'none' ? diet : undefined,
        preferences: preferences || undefined,
        equipment: user?.kitchen_equipment,
        custom_tags: customTags.length > 0 ? customTags : undefined,
      });

      if (params.date) {
        await addEntry(params.date, mealType, recipe.id, servings);
        router.back();
        return;
      }

      setGeneratedRecipe(recipe);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Nieznany błąd';
      Alert.alert('Błąd generowania', msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePlan = async () => {
    if (!generatedRecipe) return;
    setPlanning(true);
    try {
      await addEntry(toISODate(planDate), planMealType, generatedRecipe.id, servings);
      setShowPlanModal(false);
      Alert.alert(
        'Zaplanowano! 📅',
        `${generatedRecipe.title} dodany do planu na ${planDate.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}.`,
        [
          { text: 'Idź do planera', onPress: () => router.replace('/(tabs)/planner') },
          { text: 'Zostań', style: 'cancel' },
        ]
      );
    } catch {
      Alert.alert('Błąd', 'Nie udało się dodać do planera.');
    } finally {
      setPlanning(false);
    }
  };

  const recipeIngredients = Array.isArray(generatedRecipe?.ingredients) ? generatedRecipe!.ingredients : [];
  const recipeInstructions = Array.isArray(generatedRecipe?.instructions) ? generatedRecipe!.instructions : [];

  return (
    <SafeAreaView style={styles.container}>

      {/* ── Ingredient selector modal ── */}
      <Modal visible={showIngredientSelector} animationType="slide" statusBarTranslucent>
        <SafeAreaView style={styles.selectorContainer} edges={['top', 'bottom']}>
          {/* Header */}
          <View style={styles.selectorHeader}>
            <Pressable onPress={() => { setShowIngredientSelector(false); setIngredientSearch(''); }}>
              <Text style={styles.selectorCancel}>Anuluj</Text>
            </Pressable>
            <Text style={styles.selectorTitle}>Wybierz składniki</Text>
            <Pressable onPress={() => { setShowIngredientSelector(false); setIngredientSearch(''); }}>
              <Text style={styles.selectorDone}>Gotowe ({selectedIds.size})</Text>
            </Pressable>
          </View>

          {/* Search */}
          <View style={styles.selectorSearch}>
            <Text style={styles.selectorSearchIcon}>🔍</Text>
            <TextInput
              style={styles.selectorSearchInput}
              placeholder="Szukaj składnika..."
              placeholderTextColor={Colors.textMuted}
              value={ingredientSearch}
              onChangeText={setIngredientSearch}
              autoFocus={false}
            />
            {ingredientSearch.length > 0 && (
              <Pressable onPress={() => setIngredientSearch('')}>
                <Text style={styles.selectorClear}>✕</Text>
              </Pressable>
            )}
          </View>

          {/* Select all / clear */}
          <View style={styles.selectorBulkRow}>
            <Pressable style={styles.bulkBtn} onPress={selectAll}>
              <Text style={styles.bulkBtnText}>Zaznacz wszystkie</Text>
            </Pressable>
            <View style={styles.bulkDivider} />
            <Pressable style={styles.bulkBtn} onPress={clearAll}>
              <Text style={[styles.bulkBtnText, { color: Colors.error ?? '#E53935' }]}>Odznacz wszystkie</Text>
            </Pressable>
          </View>

          {/* Count summary */}
          <Text style={styles.selectorCount}>
            {selectedIds.size} z {allItems.length} produktów wybranych
          </Text>

          {/* List */}
          <FlatList
            data={filteredIngredients}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.selectorList}
            renderItem={({ item }) => {
              const checked = selectedIds.has(item.id);
              return (
                <Pressable
                  style={[styles.selectorItem, checked && styles.selectorItemActive]}
                  onPress={() => toggleItem(item.id)}
                >
                  <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                    {checked && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <View style={styles.selectorItemInfo}>
                    <Text style={[styles.selectorItemName, checked && styles.selectorItemNameActive]}>
                      {item.name}
                    </Text>
                    {item.category ? (
                      <Text style={styles.selectorItemCategory}>{item.category}</Text>
                    ) : null}
                  </View>
                  <Text style={styles.selectorItemQty}>
                    {item.quantity} {item.unit}
                  </Text>
                </Pressable>
              );
            }}
            ItemSeparatorComponent={() => <View style={styles.selectorSep} />}
            ListEmptyComponent={
              <View style={styles.selectorEmpty}>
                <Text style={styles.selectorEmptyText}>Brak produktów pasujących do wyszukiwania</Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>

      {/* ── Loading overlay ── */}
      <Modal visible={loading} transparent animationType="fade">
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingTitle}>Generuję przepis AI...</Text>
            <Text style={styles.loadingSubtitle}>To może potrwać kilka sekund</Text>
          </View>
        </View>
      </Modal>

      {/* ── Plan modal ── */}
      <Modal visible={showPlanModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowPlanModal(false)} />
          <View style={styles.planSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.planSheetTitle}>Zaplanuj posiłek</Text>
            {generatedRecipe && <Text style={styles.planSheetRecipe}>{generatedRecipe.title}</Text>}

            <Text style={styles.planLabel}>Rodzaj posiłku</Text>
            <View style={styles.planMealRow}>
              {MEAL_TYPES.map((mt) => (
                <Pressable
                  key={mt.value}
                  style={[styles.planMealBtn, planMealType === mt.value && styles.planMealBtnActive]}
                  onPress={() => setPlanMealType(mt.value)}
                >
                  <Text style={[styles.planMealText, planMealType === mt.value && styles.planMealTextActive]}>
                    {mt.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.planLabel}>Data</Text>
            <Pressable style={styles.dateTrigger} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.dateIcon}>📅</Text>
              <Text style={styles.dateValue}>
                {planDate.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}
              </Text>
            </Pressable>

            <Button
              title={planning ? 'Dodaję...' : '📅 Dodaj do planu'}
              onPress={handlePlan}
              loading={planning}
              size="lg"
              style={styles.confirmBtn}
            />
          </View>
        </View>
      </Modal>

      <DatePickerModal
        visible={showDatePicker}
        value={planDate}
        minimumDate={new Date()}
        onConfirm={(date) => { setPlanDate(date); setShowDatePicker(false); }}
        onCancel={() => setShowDatePicker(false)}
      />

      {/* ── Screen header ── */}
      <View style={styles.header}>
        <Button title="← Wróć" onPress={() => router.back()} variant="ghost" size="sm" />
        <Text style={styles.title}>Generator Przepisów AI</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView ref={scrollRef} style={styles.content} keyboardShouldPersistTaps="handled">

        {/* Rodzaj posiłku */}
        <Text style={styles.sectionLabel}>Rodzaj posiłku</Text>
        <View style={styles.mealTypeRow}>
          {MEAL_TYPES.map((mt) => (
            <Pressable
              key={mt.value}
              style={[styles.mealTypeBtn, mealType === mt.value && styles.mealTypeBtnActive]}
              onPress={() => setMealType(mt.value)}
            >
              <Text style={[styles.mealTypeText, mealType === mt.value && styles.mealTypeTextActive]}>
                {mt.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Liczba porcji */}
        <Text style={styles.sectionLabel}>Liczba porcji</Text>
        <View style={styles.servingsRow}>
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <Pressable
              key={n}
              style={[styles.servingBtn, servings === n && styles.servingBtnActive]}
              onPress={() => setServings(n)}
            >
              <Text style={[styles.servingText, servings === n && styles.servingTextActive]}>{n}</Text>
            </Pressable>
          ))}
        </View>

        {/* Dieta */}
        <Text style={styles.sectionLabel}>Dieta</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {DIET_PREFERENCES.map((d) => (
            <Pressable
              key={d.value}
              style={[styles.dietBtn, diet === d.value && styles.dietBtnActive]}
              onPress={() => setDiet(d.value)}
            >
              <Text style={[styles.dietText, diet === d.value && styles.dietTextActive]}>{d.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Preferencje dodatkowe */}
        <Text style={styles.sectionLabel}>Dodatkowe preferencje (opcjonalnie)</Text>
        <TextInput
          style={styles.preferencesInput}
          placeholder="np. szybkie, włoskie, bez cebuli..."
          placeholderTextColor={Colors.textMuted}
          value={preferences}
          onChangeText={setPreferences}
          multiline
        />

        {/* ── Składniki ze spiżarni ── */}
        <View style={styles.ingredientsHeader}>
          <Text style={styles.sectionLabel}>Składniki ze spiżarni</Text>
          <Pressable
            style={styles.editIngredientsBtn}
            onPress={() => setShowIngredientSelector(true)}
          >
            <Text style={styles.editIngredientsBtnText}>Wybierz ({selectedIds.size})</Text>
          </Pressable>
        </View>

        {selectedItems.length === 0 ? (
          <Pressable
            style={styles.noIngredientsBox}
            onPress={() => setShowIngredientSelector(true)}
          >
            <Text style={styles.noIngredientsText}>
              Żaden składnik nie jest wybrany. Dotknij żeby wybrać.
            </Text>
          </Pressable>
        ) : (
          <Pressable
            style={styles.ingredientsSummary}
            onPress={() => setShowIngredientSelector(true)}
          >
            <Text style={styles.ingredientsSummaryText} numberOfLines={3}>
              {selectedItems.slice(0, 12).map((i) => i.name).join(' · ')}
              {selectedItems.length > 12 ? ` · +${selectedItems.length - 12} więcej` : ''}
            </Text>
            <Text style={styles.ingredientsSummaryEdit}>Edytuj ›</Text>
          </Pressable>
        )}

        {/* Tagi własne */}
        <Text style={styles.sectionLabel}>Tagi / kategoria (opcjonalnie)</Text>
        <View style={styles.tagInputRow}>
          <TextInput
            style={styles.tagInput}
            placeholder="np. szybkie, fit, tani..."
            placeholderTextColor={Colors.textMuted}
            value={tagInput}
            onChangeText={setTagInput}
            returnKeyType="done"
            onSubmitEditing={() => {
              const t = tagInput.trim();
              if (t && !customTags.includes(t)) setCustomTags((prev) => [...prev, t]);
              setTagInput('');
            }}
          />
          <Pressable
            style={[styles.tagAddBtn, !tagInput.trim() && styles.tagAddBtnDisabled]}
            disabled={!tagInput.trim()}
            onPress={() => {
              const t = tagInput.trim();
              if (t && !customTags.includes(t)) setCustomTags((prev) => [...prev, t]);
              setTagInput('');
            }}
          >
            <Text style={styles.tagAddBtnText}>＋</Text>
          </Pressable>
        </View>
        {customTags.length > 0 && (
          <View style={styles.tagChips}>
            {customTags.map((tag) => (
              <Pressable
                key={tag}
                style={styles.tagChip}
                onPress={() => setCustomTags((prev) => prev.filter((t) => t !== tag))}
              >
                <Text style={styles.tagChipText}>{tag}</Text>
                <Text style={styles.tagChipRemove}>✕</Text>
              </Pressable>
            ))}
          </View>
        )}

        <Button
          title={generatedRecipe ? '🔄 Generuj ponownie' : '✨ Wygeneruj przepis AI'}
          onPress={handleGenerate}
          loading={loading}
          size="lg"
          style={styles.generateBtn}
          variant={generatedRecipe ? 'outline' : 'primary'}
        />

        {/* ── Generated recipe result ── */}
        {generatedRecipe && (
          <View style={styles.resultCard}>
            <View style={styles.resultActions}>
              <Pressable
                style={styles.actionBtnSave}
                onPress={() => Alert.alert('Zapisano! 📚', `"${generatedRecipe.title}" jest już w Twoim przepiśniku.`)}
              >
                <Text style={styles.actionBtnSaveText}>📚 Zapisano w przepiśniku</Text>
              </Pressable>
              <Pressable
                style={styles.actionBtnPlan}
                onPress={() => { setPlanMealType(mealType); setShowPlanModal(true); }}
              >
                <Text style={styles.actionBtnPlanText}>📅 Zaplanuj</Text>
              </Pressable>
            </View>

            <Text style={styles.resultTitle}>{generatedRecipe.title}</Text>
            {generatedRecipe.description && (
              <Text style={styles.resultDescription}>{generatedRecipe.description}</Text>
            )}

            <View style={styles.metaRow}>
              {(generatedRecipe.prep_time_min || generatedRecipe.cook_time_min) ? (
                <View style={styles.metaBadge}>
                  <Text style={styles.metaText}>
                    ⏱ {(generatedRecipe.prep_time_min || 0) + (generatedRecipe.cook_time_min || 0)} min
                  </Text>
                </View>
              ) : null}
              <View style={styles.metaBadge}>
                <Text style={styles.metaText}>🍽 {generatedRecipe.servings} porcje</Text>
              </View>
              {generatedRecipe.diet_tags?.map((tag) => (
                <View key={tag} style={[styles.metaBadge, styles.tagBadge]}>
                  <Text style={[styles.metaText, styles.tagText]}>{tag}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.resultSectionTitle}>📝 Składniki</Text>
            {recipeIngredients.map((ing, i) => (
              <View key={i} style={styles.ingredientRow}>
                <Text style={styles.ingredientBullet}>•</Text>
                <Text style={styles.ingredientText}>
                  {ing.quantity ? `${ing.quantity} ${ing.unit || ''} ` : ''}
                  <Text style={styles.ingredientName}>{ing.name}</Text>
                </Text>
              </View>
            ))}

            <Text style={[styles.resultSectionTitle, { marginTop: 16 }]}>👨‍🍳 Przygotowanie</Text>
            {recipeInstructions.map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{step.step}</Text>
                </View>
                <Text style={styles.stepDescription}>{step.description}</Text>
              </View>
            ))}

            <View style={{ height: 32 }} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  title: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  content: { flex: 1, padding: 16 },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 8,
    marginTop: 16,
  },

  // Meal type
  mealTypeRow: { gap: 8 },
  mealTypeBtn: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  mealTypeBtnActive: { borderColor: Colors.primary, backgroundColor: '#E8F5E9' },
  mealTypeText: { fontSize: 15, fontWeight: '500', color: Colors.textPrimary },
  mealTypeTextActive: { color: Colors.primary, fontWeight: '700' },

  // Servings
  servingsRow: { flexDirection: 'row', gap: 8 },
  servingBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  servingBtnActive: { borderColor: Colors.primary, backgroundColor: '#E8F5E9' },
  servingText: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  servingTextActive: { color: Colors.primary },

  // Diet
  dietBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginRight: 6,
    backgroundColor: Colors.surface,
  },
  dietBtnActive: { borderColor: Colors.primary, backgroundColor: '#E8F5E9' },
  dietText: { fontSize: 13, color: Colors.textSecondary },
  dietTextActive: { color: Colors.primary, fontWeight: '600' },

  // Preferences
  preferencesInput: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
    minHeight: 60,
  },

  // Ingredients section
  ingredientsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 8,
  },
  editIngredientsBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  editIngredientsBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  noIngredientsBox: {
    padding: 16,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  noIngredientsText: { fontSize: 14, color: Colors.textMuted, textAlign: 'center' },
  ingredientsSummary: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ingredientsSummaryText: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  ingredientsSummaryEdit: { fontSize: 14, color: Colors.primary, fontWeight: '700' },

  generateBtn: { marginTop: 20 },

  // Loading
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    gap: 12,
    width: 260,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  loadingTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  loadingSubtitle: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },

  // Plan modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  planSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  planSheetTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
  planSheetRecipe: { fontSize: 14, color: Colors.textSecondary, marginBottom: 20 },
  planLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 12,
  },
  planMealRow: { flexDirection: 'row', gap: 8 },
  planMealBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    alignItems: 'center',
  },
  planMealBtnActive: { borderColor: Colors.primary, backgroundColor: '#E8F5E9' },
  planMealText: { fontSize: 13, fontWeight: '500', color: Colors.textPrimary },
  planMealTextActive: { color: Colors.primary, fontWeight: '700' },
  dateTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.background,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  dateIcon: { fontSize: 18 },
  dateValue: { fontSize: 15, color: Colors.textPrimary, fontWeight: '500', flex: 1 },
  confirmBtn: { marginTop: 20, marginBottom: 8 },

  // Result card
  resultCard: {
    marginTop: 24,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.primary + '40',
  },
  resultActions: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  actionBtnSave: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  actionBtnSaveText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  actionBtnPlan: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  actionBtnPlanText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  resultTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, lineHeight: 28, marginBottom: 6 },
  resultDescription: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20, marginBottom: 10 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  metaBadge: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagBadge: { backgroundColor: '#E8F5E9', borderColor: Colors.primary },
  metaText: { fontSize: 12, color: Colors.textSecondary },
  tagText: { color: Colors.primary, fontWeight: '600' },
  resultSectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 10 },
  ingredientRow: { flexDirection: 'row', gap: 8, marginBottom: 6, alignItems: 'flex-start' },
  ingredientBullet: { fontSize: 14, color: Colors.primary, marginTop: 2 },
  ingredientText: { flex: 1, fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  ingredientName: { color: Colors.textPrimary, fontWeight: '500' },
  stepRow: { flexDirection: 'row', gap: 12, marginBottom: 14, alignItems: 'flex-start' },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepNumberText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  stepDescription: { flex: 1, fontSize: 14, color: Colors.textPrimary, lineHeight: 22 },

  // ── Ingredient Selector Modal ──
  selectorContainer: { flex: 1, backgroundColor: Colors.background },
  selectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  selectorCancel: { fontSize: 16, color: Colors.textSecondary },
  selectorTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  selectorDone: { fontSize: 16, fontWeight: '700', color: Colors.primary },

  selectorSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 12,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
  },
  selectorSearchIcon: { fontSize: 16, marginRight: 8 },
  selectorSearchInput: { flex: 1, paddingVertical: 11, fontSize: 15, color: Colors.textPrimary },
  selectorClear: { color: Colors.textMuted, fontSize: 14, paddingLeft: 8 },

  selectorBulkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginBottom: 4,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  bulkBtn: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  bulkBtnText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  bulkDivider: { width: 1, height: 32, backgroundColor: Colors.border },

  selectorCount: {
    fontSize: 12,
    color: Colors.textMuted,
    marginHorizontal: 16,
    marginBottom: 6,
    marginTop: 4,
  },

  selectorList: { paddingHorizontal: 12, paddingBottom: 32 },
  selectorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 12,
  },
  selectorItemActive: { backgroundColor: '#E8F5E9' },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: '700' },
  selectorItemInfo: { flex: 1 },
  selectorItemName: { fontSize: 15, fontWeight: '500', color: Colors.textPrimary },
  selectorItemNameActive: { color: Colors.primary, fontWeight: '700' },
  selectorItemCategory: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  selectorItemQty: { fontSize: 13, color: Colors.textSecondary },
  selectorSep: { height: 1, backgroundColor: Colors.border, marginHorizontal: 0 },
  selectorEmpty: { padding: 32, alignItems: 'center' },
  selectorEmptyText: { color: Colors.textMuted, fontSize: 14, textAlign: 'center' },

  // Tags
  tagInputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  tagInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
  },
  tagAddBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagAddBtnDisabled: { backgroundColor: Colors.border },
  tagAddBtnText: { color: '#fff', fontSize: 22, fontWeight: '700', lineHeight: 26 },
  tagChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.primary + '60',
  },
  tagChipText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  tagChipRemove: { fontSize: 11, color: Colors.primary, fontWeight: '700' },
});
