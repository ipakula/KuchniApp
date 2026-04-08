import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Recipe } from '../../../../src/types/recipe.types';
import { getRecipe } from '../../../../src/api/recipes.api';
import { usePlannerStore } from '../../../../src/store/planner.store';
import { Button } from '../../../../src/components/ui/Button';
import { Colors } from '../../../../src/constants/colors';

export default function RecipeViewScreen() {
  const { id, entryId } = useLocalSearchParams<{ id: string; entryId?: string }>();
  const router = useRouter();
  const { markCooked } = usePlannerStore();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [cooking, setCooking] = useState(false);

  useEffect(() => {
    if (id) {
      getRecipe(id).then(setRecipe).finally(() => setLoading(false));
    }
  }, [id]);

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

  if (loading) return <View style={styles.loading}><Text>Ładowanie...</Text></View>;
  if (!recipe) return <View style={styles.loading}><Text>Przepis nie znaleziony</Text></View>;

  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  const instructions = Array.isArray(recipe.instructions) ? recipe.instructions : [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Button title="← Wróć" onPress={() => router.back()} variant="ghost" size="sm" />
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

        {/* CTA — Ugotowano */}
        {entryId && (
          <View style={styles.ctaSection}>
            <Button
              title="✅ Ugotowane! Aktualizuj spiżarnię"
              onPress={handleCooked}
              loading={cooking}
              size="lg"
              style={styles.cookedBtn}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: 16, paddingTop: 8 },
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
  cookedBtn: { width: '100%' },
});
