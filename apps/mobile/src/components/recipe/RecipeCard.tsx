import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Recipe } from '../../types/recipe.types';
import { Colors, Shadows } from '../../constants/colors';

interface RecipeCardProps {
  recipe: Recipe;
  onPress: (recipe: Recipe) => void;
}

export function RecipeCard({ recipe, onPress }: RecipeCardProps) {
  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]} onPress={() => onPress(recipe)}>
      <Text style={styles.title} numberOfLines={2}>{recipe.title}</Text>
      {recipe.description && (
        <Text style={styles.description} numberOfLines={2}>{recipe.description}</Text>
      )}
      <View style={styles.meta}>
        {recipe.prep_time_min && (
          <Text style={styles.metaText}>⏱ {recipe.prep_time_min + (recipe.cook_time_min || 0)} min</Text>
        )}
        <Text style={styles.metaText}>🍽 {recipe.servings} porcje</Text>
        {recipe.diet_tags?.slice(0, 2).map((tag) => (
          <Text key={tag} style={styles.tag}>{tag}</Text>
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    gap: 6,
    ...Shadows.small,
  },
  title: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  description: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  metaText: { fontSize: 12, color: Colors.textSecondary },
  tag: {
    fontSize: 11,
    color: Colors.primary,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    fontWeight: '600',
  },
});
