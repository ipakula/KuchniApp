import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Recipe, MealType } from '../../../../src/types/recipe.types';
import { getRecipe, updateRecipeTags } from '../../../../src/api/recipes.api';
import { usePlannerStore } from '../../../../src/store/planner.store';
import { Button } from '../../../../src/components/ui/Button';
import { DatePickerModal } from '../../../../src/components/ui/DatePickerModal';
import { Colors } from '../../../../src/constants/colors';
import { toISODate } from '../../../../src/utils/date';

const MEAL_TYPES: { value: MealType; label: string }[] = [
  { value: 'sniadanie', label: '🌅 Śniadanie' },
  { value: 'obiad', label: '☀️ Obiad' },
  { value: 'kolacja', label: '🌙 Kolacja' },
];

export default function RecipeViewScreen() {
  const { id, entryId, plan } = useLocalSearchParams<{ id: string; entryId?: string; plan?: string }>();
  const router = useRouter();
  const { markCooked, addEntry } = usePlannerStore();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [cooking, setCooking] = useState(false);

  // Tags editing
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [savingTags, setSavingTags] = useState(false);

  // Plan modal
  const [showPlanModal, setShowPlanModal] = useState(!!plan);
  const [planDate, setPlanDate] = useState<Date>(new Date());
  const [planMealType, setPlanMealType] = useState<MealType>('obiad');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [planning, setPlanning] = useState(false);

  useEffect(() => {
    if (id) {
      getRecipe(id).then((r) => {
        setRecipe(r);
        setTags(Array.isArray(r?.diet_tags) ? r.diet_tags : []);
      }).finally(() => setLoading(false));
    }
  }, [id]);

  const addTag = () => {
    const t = tagInput.trim();
    if (!t || tags.includes(t)) { setTagInput(''); return; }
    setTags((prev) => [...prev, t]);
    setTagInput('');
  };

  const removeTag = (tag: string) => setTags((prev) => prev.filter((t) => t !== tag));

  const handleSaveTags = async () => {
    if (!recipe) return;
    setSavingTags(true);
    try {
      const updated = await updateRecipeTags(recipe.id, tags);
      setRecipe(updated);
    } catch {
      Alert.alert('Błąd', 'Nie udało się zapisać tagów.');
    } finally {
      setSavingTags(false);
    }
  };

  const handleCooked = async () => {
    if (!entryId) return;
    setCooking(true);
    try {
      await markCooked(entryId);
      Alert.alert('🎉 Smacznego!', 'Przepis oznaczony jako ugotowany. Składniki odjęte ze spiżarni.');
      router.back();
    } finally {
      setCooking(false);
    }
  };

  const handlePlan = async () => {
    if (!recipe) return;
    setPlanning(true);
    try {
      await addEntry(toISODate(planDate), planMealType, recipe.id, recipe.servings);
      setShowPlanModal(false);
      Alert.alert(
        'Zaplanowano! 📅',
        `${recipe.title} dodany do planu na ${planDate.toLocaleDateString('pl-PL', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })}.`,
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

  if (loading) return <View style={styles.loading}><Text>Ładowanie...</Text></View>;
  if (!recipe) return <View style={styles.loading}><Text>Przepis nie znaleziony</Text></View>;

  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  const instructions = Array.isArray(recipe.instructions) ? recipe.instructions : [];

  return (
    <SafeAreaView style={styles.container}>
      {/* Plan modal */}
      <Modal visible={showPlanModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowPlanModal(false)} />
          <View style={styles.planSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.planSheetTitle}>Zaplanuj posiłek</Text>
            <Text style={styles.planSheetRecipe}>{recipe.title}</Text>

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

      <ScrollView>
        <View style={styles.header}>
          <Button title="← Wróć" onPress={() => router.back()} variant="ghost" size="sm" />
          {!entryId && (
            <Button
              title="📅 Zaplanuj"
              onPress={() => setShowPlanModal(true)}
              size="sm"
            />
          )}
        </View>

        <View style={styles.heroSection}>
          <Text style={styles.title}>{recipe.title}</Text>
          {recipe.description && <Text style={styles.description}>{recipe.description}</Text>}

          <View style={styles.metaRow}>
            {recipe.prep_time_min && (
              <View style={styles.metaBadge}>
                <Text style={styles.metaText}>⏱ {recipe.prep_time_min + (recipe.cook_time_min || 0)} min</Text>
              </View>
            )}
            <View style={styles.metaBadge}>
              <Text style={styles.metaText}>🍽 {recipe.servings} porcje</Text>
            </View>
            {recipe.diet_tags?.map((tag) => (
              <View key={tag} style={[styles.metaBadge, styles.tagBadge]}>
                <Text style={[styles.metaText, styles.tagText]}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Tagi */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏷️ Tagi</Text>
          <View style={styles.tagChips}>
            {tags.map((tag) => (
              <Pressable key={tag} style={styles.tagChip} onPress={() => removeTag(tag)}>
                <Text style={styles.tagChipText}>{tag}</Text>
                <Text style={styles.tagChipRemove}>✕</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.tagInputRow}>
            <TextInput
              style={styles.tagInput}
              placeholder="Dodaj tag..."
              placeholderTextColor={Colors.textMuted}
              value={tagInput}
              onChangeText={setTagInput}
              returnKeyType="done"
              onSubmitEditing={addTag}
            />
            <Pressable
              style={[styles.tagAddBtn, !tagInput.trim() && styles.tagAddBtnDisabled]}
              onPress={addTag}
              disabled={!tagInput.trim()}
            >
              <Text style={styles.tagAddBtnText}>＋</Text>
            </Pressable>
            <Pressable
              style={[styles.tagSaveBtn, savingTags && styles.tagAddBtnDisabled]}
              onPress={handleSaveTags}
              disabled={savingTags}
            >
              <Text style={styles.tagSaveBtnText}>{savingTags ? '...' : 'Zapisz'}</Text>
            </Pressable>
          </View>
        </View>

        {/* Składniki */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Składniki</Text>
          {ingredients.map((ing, i) => (
            <View key={i} style={styles.ingredientRow}>
              <Text style={styles.ingredientBullet}>•</Text>
              <Text style={styles.ingredientText}>
                {ing.quantity ? `${ing.quantity} ${ing.unit || ''} ` : ''}
                <Text style={styles.ingredientName}>{ing.name}</Text>
              </Text>
            </View>
          ))}
        </View>

        {/* Instrukcje */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👨‍🍳 Przygotowanie</Text>
          {instructions.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{step.step}</Text>
              </View>
              <Text style={styles.stepDescription}>{step.description}</Text>
            </View>
          ))}
        </View>

        {/* CTA bottom */}
        <View style={styles.ctaSection}>
          {entryId ? (
            <Button
              title="✅ Ugotowane! Aktualizuj spiżarnię"
              onPress={handleCooked}
              loading={cooking}
              size="lg"
              style={styles.fullBtn}
            />
          ) : (
            <Button
              title="📅 Zaplanuj ten przepis"
              onPress={() => setShowPlanModal(true)}
              size="lg"
              style={styles.fullBtn}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroSection: { padding: 16, gap: 12 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary, lineHeight: 32 },
  description: { fontSize: 15, color: Colors.textSecondary, lineHeight: 22 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  metaBadge: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagBadge: { backgroundColor: '#E8F5E9', borderColor: Colors.primary },
  metaText: { fontSize: 12, color: Colors.textSecondary },
  tagText: { color: Colors.primary, fontWeight: '600' },
  section: { paddingHorizontal: 16, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 14 },
  ingredientRow: { flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'flex-start' },
  ingredientBullet: { fontSize: 16, color: Colors.primary, marginTop: 1 },
  ingredientText: { flex: 1, fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  ingredientName: { color: Colors.textPrimary, fontWeight: '500' },
  stepRow: { flexDirection: 'row', gap: 14, marginBottom: 16, alignItems: 'flex-start' },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepNumberText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  stepDescription: { flex: 1, fontSize: 14, color: Colors.textPrimary, lineHeight: 22 },
  ctaSection: { padding: 16, paddingBottom: 32 },
  fullBtn: { width: '100%' },

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
  planMealText: { fontSize: 12, fontWeight: '500', color: Colors.textPrimary },
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

  // Tags
  tagChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  tagChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#E8F5E9', borderRadius: 16,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: Colors.primary + '60',
  },
  tagChipText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  tagChipRemove: { fontSize: 11, color: Colors.primary, fontWeight: '700' },
  tagInputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  tagInput: {
    flex: 1, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 9, fontSize: 14,
    color: Colors.textPrimary, backgroundColor: Colors.background,
  },
  tagAddBtn: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  tagAddBtnDisabled: { backgroundColor: Colors.border },
  tagAddBtnText: { color: '#fff', fontSize: 20, fontWeight: '700', lineHeight: 24 },
  tagSaveBtn: {
    paddingHorizontal: 14, height: 40, borderRadius: 10,
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  tagSaveBtnText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
});
