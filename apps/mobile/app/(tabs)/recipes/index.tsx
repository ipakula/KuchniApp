import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { usePlannerStore } from '../../../src/store/planner.store';
import { deleteRecipe, importRecipeFromUrl } from '../../../src/api/recipes.api';
import { Recipe } from '../../../src/types/recipe.types';
import { Colors, Shadows } from '../../../src/constants/colors';

export default function RecipesScreen() {
  const router = useRouter();
  const { recipes, fetchRecipes } = usePlannerStore();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchRecipes().finally(() => setLoading(false));
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRecipes();
    setRefreshing(false);
  };

  const handleDelete = (recipe: Recipe) => {
    Alert.alert(
      'Usuń przepis',
      `Czy na pewno chcesz usunąć "${recipe.title}"?`,
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Usuń',
          style: 'destructive',
          onPress: async () => {
            await deleteRecipe(recipe.id);
            await fetchRecipes();
          },
        },
      ]
    );
  };

  const handleImportUrl = async () => {
    const url = importUrl.trim();
    if (!url) return;
    setImporting(true);
    try {
      const recipe = await importRecipeFromUrl(url);
      await fetchRecipes();
      setShowUrlModal(false);
      setImportUrl('');
      router.push(`/(tabs)/planner/recipe/${recipe.id}`);
    } catch {
      Alert.alert('Błąd importu', 'Nie udało się zaimportować przepisu. Sprawdź URL i spróbuj ponownie.');
    } finally {
      setImporting(false);
    }
  };

  const allTags = useMemo(() => {
    const set = new Set<string>();
    recipes.forEach((r) => r.diet_tags?.forEach((t) => set.add(t)));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pl'));
  }, [recipes]);

  const filtered = recipes.filter((r) => {
    const matchSearch = !search || r.title.toLowerCase().includes(search.toLowerCase());
    const matchTag = !activeTag || r.diet_tags?.includes(activeTag);
    return matchSearch && matchTag;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Przepiśnik</Text>
          <Text style={styles.subtitle}>{recipes.length} przepisów</Text>
        </View>
        <Pressable
          style={styles.addBtn}
          onPress={() => setShowAddMenu(true)}
        >
          <Text style={styles.addBtnText}>＋ Nowy</Text>
        </Pressable>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Szukaj przepisu..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')} style={styles.clearBtn}>
            <Text style={styles.clearText}>✕</Text>
          </Pressable>
        )}
      </View>

      {/* Tag filter chips */}
      {allTags.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tagFilters}
          style={{ flexGrow: 0 }}
        >
          <Pressable
            style={[styles.tagFilterChip, !activeTag && styles.tagFilterChipActive]}
            onPress={() => setActiveTag(null)}
          >
            <Text style={[styles.tagFilterText, !activeTag && styles.tagFilterTextActive]}>Wszystkie</Text>
          </Pressable>
          {allTags.map((tag) => (
            <Pressable
              key={tag}
              style={[styles.tagFilterChip, activeTag === tag && styles.tagFilterChipActive]}
              onPress={() => setActiveTag(activeTag === tag ? null : tag)}
            >
              <Text style={[styles.tagFilterText, activeTag === tag && styles.tagFilterTextActive]}>{tag}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {loading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.list}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📖</Text>
              <Text style={styles.emptyTitle}>
                {search ? 'Brak wyników' : 'Brak przepisów'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {search
                  ? 'Spróbuj innej frazy'
                  : 'Wygeneruj przepis AI — zostanie automatycznie\nzapisany w przepiśniku'}
              </Text>
              {!search && (
                <Pressable
                  style={styles.emptyAction}
                  onPress={() => router.push('/(tabs)/planner/recipe-generator')}
                >
                  <Text style={styles.emptyActionText}>✨ Wygeneruj przepis</Text>
                </Pressable>
              )}
            </View>
          }
          renderItem={({ item: recipe }) => (
            <Pressable
              style={styles.card}
              onPress={() => router.push(`/(tabs)/planner/recipe/${recipe.id}`)}
              onLongPress={() => handleDelete(recipe)}
            >
              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle} numberOfLines={2}>{recipe.title}</Text>
                  {recipe.source === 'ai' && (
                    <View style={styles.aiBadge}>
                      <Text style={styles.aiBadgeText}>AI</Text>
                    </View>
                  )}
                </View>
                {recipe.description ? (
                  <Text style={styles.cardDesc} numberOfLines={2}>{recipe.description}</Text>
                ) : null}
                <View style={styles.cardMeta}>
                  {(recipe.prep_time_min || recipe.cook_time_min) ? (
                    <Text style={styles.cardMetaText}>
                      ⏱ {(recipe.prep_time_min || 0) + (recipe.cook_time_min || 0)} min
                    </Text>
                  ) : null}
                  <Text style={styles.cardMetaText}>🍽 {recipe.servings} porcje</Text>
                  {recipe.diet_tags?.slice(0, 2).map((tag) => (
                    <View key={tag} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View style={styles.cardActions}>
                <Pressable
                  style={styles.planBtn}
                  onPress={(e) => {
                    e.stopPropagation();
                    router.push(`/(tabs)/planner/recipe/${recipe.id}?plan=1`);
                  }}
                >
                  <Text style={styles.planBtnText}>📅 Zaplanuj</Text>
                </Pressable>
                <Text style={styles.cardArrow}>›</Text>
              </View>
            </Pressable>
          )}
        />
      )}

      {/* Add menu */}
      <Modal visible={showAddMenu} transparent animationType="fade" onRequestClose={() => setShowAddMenu(false)}>
        <Pressable style={styles.menuOverlay} onPress={() => setShowAddMenu(false)}>
          <View style={styles.menuBox}>
            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setShowAddMenu(false);
                router.push('/(tabs)/planner/recipe-generator');
              }}
            >
              <Text style={styles.menuItemIcon}>✨</Text>
              <View>
                <Text style={styles.menuItemTitle}>Generuj z AI</Text>
                <Text style={styles.menuItemSub}>Na podstawie produktów ze spiżarni</Text>
              </View>
            </Pressable>
            <View style={styles.menuDivider} />
            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setShowAddMenu(false);
                setShowUrlModal(true);
              }}
            >
              <Text style={styles.menuItemIcon}>🔗</Text>
              <View>
                <Text style={styles.menuItemTitle}>Importuj z linku</Text>
                <Text style={styles.menuItemSub}>AI odczyta przepis ze strony WWW</Text>
              </View>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* URL import modal */}
      <Modal visible={showUrlModal} transparent animationType="slide" onRequestClose={() => setShowUrlModal(false)}>
        <KeyboardAvoidingView
          style={styles.urlModalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Pressable style={{ flex: 1 }} onPress={() => !importing && setShowUrlModal(false)} />
          <View style={styles.urlModalBox}>
            <Text style={styles.urlModalTitle}>Importuj przepis z linku</Text>
            <Text style={styles.urlModalSub}>Wklej adres strony z przepisem. AI wyodrębni składniki i instrukcje.</Text>
            <TextInput
              style={styles.urlInput}
              placeholder="https://..."
              placeholderTextColor={Colors.textMuted}
              value={importUrl}
              onChangeText={setImportUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              editable={!importing}
            />
            <View style={styles.urlModalActions}>
              <Pressable
                style={styles.urlCancelBtn}
                onPress={() => { setShowUrlModal(false); setImportUrl(''); }}
                disabled={importing}
              >
                <Text style={styles.urlCancelBtnText}>Anuluj</Text>
              </Pressable>
              <Pressable
                style={[styles.urlImportBtn, (!importUrl.trim() || importing) && styles.urlImportBtnDisabled]}
                onPress={handleImportUrl}
                disabled={!importUrl.trim() || importing}
              >
                {importing ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.urlImportBtnText}>Importuj</Text>
                )}
              </Pressable>
            </View>
            {importing && (
              <Text style={styles.urlImportingText}>Analizuję przepis... to może chwilę potrwać</Text>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
  },
  title: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: 13, color: Colors.textMuted, marginTop: 1 },
  addBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    ...Shadows.small,
  },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 11, fontSize: 15, color: Colors.textPrimary },
  clearBtn: { padding: 4 },
  clearText: { color: Colors.textMuted, fontSize: 14 },

  tagFilters: { paddingHorizontal: 16, paddingBottom: 10, gap: 6 },
  tagFilterChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, marginRight: 6,
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: 'transparent',
  },
  tagFilterChipActive: { borderColor: Colors.primary, backgroundColor: '#E8F5E9' },
  tagFilterText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  tagFilterTextActive: { color: Colors.primary, fontWeight: '700' },

  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  list: { paddingHorizontal: 16, paddingBottom: 100 },

  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  emptyAction: {
    marginTop: 8,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 13,
  },
  emptyActionText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.small,
  },
  cardBody: { flex: 1, marginRight: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 4 },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: Colors.textPrimary, lineHeight: 22 },
  aiBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.primary + '60',
    marginTop: 2,
  },
  aiBadgeText: { fontSize: 10, fontWeight: '800', color: Colors.primary },
  cardDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18, marginBottom: 8 },
  cardMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  cardMetaText: { fontSize: 12, color: Colors.textMuted },
  tag: {
    backgroundColor: '#E8F5E9',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.primary + '50',
  },
  tagText: { fontSize: 11, color: Colors.primary, fontWeight: '600' },
  cardActions: { alignItems: 'flex-end', gap: 10 },
  planBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  planBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  cardArrow: { fontSize: 22, color: Colors.textMuted },

  // Add menu
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 100,
    paddingRight: 16,
  },
  menuBox: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    width: 260,
    ...Shadows.small,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  menuItemIcon: { fontSize: 24, width: 32, textAlign: 'center' },
  menuItemTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  menuItemSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  menuDivider: { height: 1, backgroundColor: Colors.border, marginHorizontal: 16 },

  // URL import modal
  urlModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  urlModalBox: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 12,
  },
  urlModalTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  urlModalSub: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  urlInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  urlModalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  urlCancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  urlCancelBtnText: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  urlImportBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: Colors.primary,
  },
  urlImportBtnDisabled: { backgroundColor: Colors.textMuted },
  urlImportBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  urlImportingText: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', marginBottom: 8 },
});
