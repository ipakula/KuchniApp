import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { usePantry } from '../../../src/hooks/usePantry';
import { usePlannerStore } from '../../../src/store/planner.store';
import { generateRecipe } from '../../../src/api/recipes.api';
import { Button } from '../../../src/components/ui/Button';
import { Colors } from '../../../src/constants/colors';
import { DIET_PREFERENCES } from '../../../src/constants/dietPreferences';
import { MealType } from '../../../src/types/recipe.types';
import { useAuthStore } from '../../../src/store/auth.store';

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

  const [mealType, setMealType] = useState<MealType>((params.mealType as MealType) || 'obiad');
  const [servings, setServings] = useState(user?.household_size || 2);
  const [diet, setDiet] = useState(user?.diet_preference || 'none');
  const [preferences, setPreferences] = useState('');
  const [loading, setLoading] = useState(false);

  const pantryItemNames = items.slice(0, 20).map((i) => i.name);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const recipe = await generateRecipe({
        pantry_items: pantryItemNames,
        meal_type: mealType,
        servings,
        diet: diet !== 'none' ? diet : undefined,
        preferences: preferences || undefined,
        equipment: user?.kitchen_equipment,
      });

      // Jeśli mamy datę — od razu dodaj do planera
      if (params.date) {
        await addEntry(params.date, mealType, recipe.id, servings);
        router.back();
      } else {
        // Pokaż przepis
        router.push(`/(tabs)/planner/recipe/${recipe.id}`);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Nieznany błąd';
      console.error('[RecipeGenerator] Błąd:', JSON.stringify(err?.response?.data), err?.message);
      Alert.alert('Błąd generowania', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Loading overlay */}
      <Modal visible={loading} transparent animationType="fade">
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingTitle}>Generuję przepis AI...</Text>
            <Text style={styles.loadingSubtitle}>To może potrwać kilka sekund</Text>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <Button title="← Wróć" onPress={() => router.back()} variant="ghost" size="sm" />
        <Text style={styles.title}>Generator Przepisów AI</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content}>
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dietRow}>
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

        {/* Składniki ze spiżarni */}
        <Text style={styles.sectionLabel}>
          Dostępne składniki ({Math.min(pantryItemNames.length, 20)})
        </Text>
        <Text style={styles.pantryItems}>
          {pantryItemNames.slice(0, 10).join(', ')}
          {pantryItemNames.length > 10 ? ` i ${pantryItemNames.length - 10} więcej...` : ''}
        </Text>

        <Button
          title={loading ? 'Generuję przepis...' : '✨ Wygeneruj przepis AI'}
          onPress={handleGenerate}
          loading={loading}
          size="lg"
          style={styles.generateBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8 },
  title: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  content: { flex: 1, padding: 16 },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary, marginBottom: 8, marginTop: 16 },
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
  dietRow: {},
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
  pantryItems: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  generateBtn: { marginTop: 24, marginBottom: 32 },
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
    ...{
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 8,
    },
  },
  loadingTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  loadingSubtitle: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
});
