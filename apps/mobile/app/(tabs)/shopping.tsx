import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  SectionList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useShoppingList } from '../../src/hooks/useShoppingList';
import { ShoppingItemRow } from '../../src/components/shopping/ShoppingItem';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { Colors, Shadows } from '../../src/constants/colors';
import { getShoppingSuggestions, ShoppingSuggestion, SuggestionReason } from '../../src/api/ai.api';
import { ShoppingItem } from '../../src/types/shopping.types';

const REASON_LABELS: Record<SuggestionReason, { label: string; color: string }> = {
  meal_plan: { label: '🍽️ przepis', color: '#E3F2FD' },
  low_stock: { label: '📉 kończy się', color: '#FFF8E1' },
  missing_basic: { label: '🧺 brakujący', color: '#F3E5F5' },
  ai:          { label: '✨ AI', color: '#E8F5E9' },
};

const SOURCE_ICONS: Record<string, string> = {
  manual: '',
  basic_products: '🧺',
  meal_plan: '🍽️',
  low_stock: '📉',
  ai_suggestion: '✨',
};

interface ListHeaderProps {
  newItem: string;
  setNewItem: (v: string) => void;
  handleAdd: (name?: string) => void;
  adding: boolean;
  showSuggestions: boolean;
  suggestions: ShoppingSuggestion[];
  loadingSuggestions: boolean;
  addingAll: boolean;
  handleLoadSuggestions: () => void;
  handleAddSuggestion: (s: ShoppingSuggestion) => void;
  handleAddAll: () => void;
  setShowSuggestions: (v: boolean) => void;
  setSuggestions: (v: ShoppingSuggestion[]) => void;
}

function ListHeader({
  newItem, setNewItem, handleAdd, adding,
  showSuggestions, suggestions, loadingSuggestions, addingAll,
  handleLoadSuggestions, handleAddSuggestion, handleAddAll,
  setShowSuggestions, setSuggestions,
}: ListHeaderProps) {
  return (
    <View>
      {/* Pole dodawania */}
      <View style={styles.addRow}>
        <TextInput
          style={styles.addInput}
          placeholder="Wpisz produkt i naciśnij +"
          placeholderTextColor={Colors.textMuted}
          value={newItem}
          onChangeText={setNewItem}
          onSubmitEditing={() => handleAdd()}
          returnKeyType="done"
          editable={!adding}
        />
        <Pressable
          style={[styles.addBtn, (!newItem.trim() || adding) && styles.addBtnDisabled]}
          onPress={() => handleAdd()}
          disabled={!newItem.trim() || adding}
        >
          {adding ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.addBtnText}>＋</Text>
          )}
        </Pressable>
      </View>

      {/* AI propozycje */}
      {!showSuggestions ? (
        <Pressable style={styles.aiBtn} onPress={handleLoadSuggestions}>
          <Text style={styles.aiBtnIcon}>✨</Text>
          <View style={styles.aiBtnTextWrap}>
            <Text style={styles.aiBtnTitle}>Propozycje AI</Text>
            <Text style={styles.aiBtnSub}>Na podstawie spiżarni, przepisów i braków</Text>
          </View>
          <Text style={styles.aiBtnArrow}>›</Text>
        </Pressable>
      ) : (
        <View style={styles.suggestionsBox}>
          <View style={styles.suggestionsHeader}>
            <Text style={styles.suggestionsTitle}>✨ Propozycje AI</Text>
            <Pressable onPress={() => { setShowSuggestions(false); setSuggestions([]); }}>
              <Text style={styles.suggestionsClose}>Ukryj</Text>
            </Pressable>
          </View>

          {loadingSuggestions ? (
            <View style={styles.suggestionsLoading}>
              <ActivityIndicator color={Colors.primary} />
              <Text style={styles.suggestionsLoadingText}>Analizuję spiżarnię i przepisy...</Text>
            </View>
          ) : suggestions.length === 0 ? (
            <Text style={styles.suggestionsEmpty}>
              Spiżarnia wygląda kompletnie! Wszystkie propozycje są już na liście.
            </Text>
          ) : (
            <>
              <Pressable
                style={[styles.addAllBtn, addingAll && styles.addAllBtnDisabled]}
                onPress={handleAddAll}
                disabled={addingAll}
              >
                {addingAll ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.addAllBtnText}>＋ Dodaj wszystkie ({suggestions.length})</Text>
                )}
              </Pressable>

              {(['meal_plan', 'low_stock', 'missing_basic', 'ai'] as SuggestionReason[])
                .map((reason) => {
                  const group = suggestions.filter((s) => s.reason === reason);
                  if (group.length === 0) return null;
                  const meta = REASON_LABELS[reason];
                  return (
                    <View key={reason} style={styles.suggestionGroup}>
                      <View style={[styles.reasonPill, { backgroundColor: meta.color }]}>
                        <Text style={styles.reasonPillText}>{meta.label}</Text>
                      </View>
                      <View style={styles.suggestionChips}>
                        {group.map((s) => (
                          <Pressable
                            key={s.name}
                            style={styles.suggestionChip}
                            onPress={() => handleAddSuggestion(s)}
                          >
                            <Text style={styles.suggestionChipText}>{s.name}</Text>
                            <Text style={styles.suggestionChipAdd}>＋</Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  );
                })}
            </>
          )}
        </View>
      )}
    </View>
  );
}

export default function ShoppingScreen() {
  const { items, loading, fetchItems, addItem, removeItem, checkItem, clearChecked } = useShoppingList();
  const [newItem, setNewItem] = useState('');
  const [adding, setAdding] = useState(false);
  const [suggestions, setSuggestions] = useState<ShoppingSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [addingAll, setAddingAll] = useState(false);

  const unchecked = items.filter((i) => !i.is_checked);
  const checked = items.filter((i) => i.is_checked);

  // Group unchecked items by category for sectioned display
  const grouped = React.useMemo(() => {
    const map: Record<string, ShoppingItem[]> = {};
    for (const item of unchecked) {
      const cat = item.category || 'Inne';
      if (!map[cat]) map[cat] = [];
      map[cat].push(item);
    }
    // Sort: categories with items first, alphabetically
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b, 'pl'))
      .map(([title, data]) => ({ title, data }));
  }, [unchecked]);

  const handleAdd = async (name = newItem) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setAdding(true);
    try {
      await addItem({ name: trimmed, quantity: 1, unit: 'szt' });
      if (name === newItem) setNewItem('');
    } catch {
      Alert.alert('Błąd', 'Nie udało się dodać pozycji. Sprawdź połączenie z serwerem.');
    } finally {
      setAdding(false);
    }
  };

  const handleAddSuggestion = async (suggestion: ShoppingSuggestion) => {
    try {
      await addItem({
        name: suggestion.name,
        quantity: 1,
        unit: 'szt',
        category: suggestion.category,
      });
      setSuggestions((prev) => prev.filter((s) => s.name !== suggestion.name));
    } catch {
      Alert.alert('Błąd', 'Nie udało się dodać pozycji.');
    }
  };

  const handleAddAll = async () => {
    if (suggestions.length === 0) return;
    setAddingAll(true);
    try {
      await Promise.all(
        suggestions.map((s) =>
          addItem({ name: s.name, quantity: 1, unit: 'szt', category: s.category })
        )
      );
      setSuggestions([]);
      setShowSuggestions(false);
    } catch {
      Alert.alert('Błąd', 'Nie udało się dodać wszystkich pozycji.');
    } finally {
      setAddingAll(false);
    }
  };

  const handleLoadSuggestions = async () => {
    setLoadingSuggestions(true);
    setShowSuggestions(true);
    try {
      const result = await getShoppingSuggestions();
      // Filter out items already on the list
      const listNames = items.map((i) => i.name.toLowerCase());
      setSuggestions(result.filter((s) => !listNames.includes(s.name.toLowerCase())));
    } catch {
      Alert.alert('Błąd', 'Nie udało się pobrać propozycji AI. Sprawdź połączenie z serwerem.');
      setShowSuggestions(false);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleClearChecked = () => {
    if (checked.length === 0) return;
    Alert.alert('Wyczyść kupione', `Usunąć ${checked.length} zaznaczonych pozycji?`, [
      { text: 'Anuluj', style: 'cancel' },
      { text: 'Wyczyść', style: 'destructive', onPress: clearChecked },
    ]);
  };

  const listHeaderProps: ListHeaderProps = {
    newItem, setNewItem, handleAdd, adding,
    showSuggestions, suggestions, loadingSuggestions, addingAll,
    handleLoadSuggestions, handleAddSuggestion, handleAddAll,
    setShowSuggestions, setSuggestions,
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Lista zakupów</Text>
        <Text style={styles.subtitle}>{unchecked.length} do kupienia</Text>
      </View>

      {unchecked.length === 0 ? (
        // No unchecked items — flat list with header + empty state + checked section
        <FlatList
          data={checked}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          onRefresh={fetchItems}
          refreshing={loading}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View>
              <ListHeader {...listHeaderProps} />
              <EmptyState
                icon="🛒"
                title="Lista jest pusta"
                description="Dodaj produkty ręcznie lub skorzystaj z propozycji AI"
              />
              {checked.length > 0 && (
                <View style={styles.checkedHeader}>
                  <Text style={styles.sectionLabel}>Kupione ({checked.length})</Text>
                  <Pressable onPress={handleClearChecked}>
                    <Text style={styles.clearBtn}>Wyczyść</Text>
                  </Pressable>
                </View>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <ShoppingItemRow item={item} onCheck={checkItem} onDelete={removeItem} />
          )}
        />
      ) : (
        <SectionList
          sections={grouped}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          onRefresh={fetchItems}
          refreshing={loading}
          keyboardShouldPersistTaps="handled"
          stickySectionHeadersEnabled={false}
          ListHeaderComponent={<ListHeader {...listHeaderProps} />}
          renderSectionHeader={({ section }) => (
            grouped.length > 1 ? (
              <Text style={styles.sectionLabel}>{section.title}</Text>
            ) : null
          )}
          renderItem={({ item }) => (
            <ShoppingItemRowWithSource item={item} onCheck={checkItem} onDelete={removeItem} />
          )}
          ListFooterComponent={
            checked.length > 0 ? (
              <View>
                <View style={styles.checkedHeader}>
                  <Text style={styles.sectionLabel}>Kupione ({checked.length})</Text>
                  <Pressable onPress={handleClearChecked}>
                    <Text style={styles.clearBtn}>Wyczyść</Text>
                  </Pressable>
                </View>
                {checked.map((item) => (
                  <ShoppingItemRow key={item.id} item={item} onCheck={checkItem} onDelete={removeItem} />
                ))}
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

// Wrapper that adds source icon to item row
function ShoppingItemRowWithSource({
  item,
  onCheck,
  onDelete,
}: {
  item: ShoppingItem;
  onCheck: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const icon = SOURCE_ICONS[item.source] || '';
  return (
    <View>
      {icon ? (
        <View style={styles.sourceIconWrap}>
          <Text style={styles.sourceIcon}>{icon}</Text>
        </View>
      ) : null}
      <ShoppingItemRow item={item} onCheck={onCheck} onDelete={onDelete} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 14,
  },
  title: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: 13, color: Colors.textMuted, marginTop: 1 },

  list: { paddingHorizontal: 16, paddingBottom: 40 },

  // Dodawanie
  addRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  addInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: Colors.textPrimary,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  addBtn: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.small,
  },
  addBtnDisabled: { backgroundColor: Colors.textMuted },
  addBtnText: { color: '#fff', fontSize: 26, fontWeight: '700', lineHeight: 30 },

  // AI
  aiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: Colors.primary + '40',
    gap: 12,
    ...Shadows.small,
  },
  aiBtnIcon: { fontSize: 24 },
  aiBtnTextWrap: { flex: 1 },
  aiBtnTitle: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  aiBtnSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  aiBtnArrow: { fontSize: 22, color: Colors.textMuted },

  suggestionsBox: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: Colors.primary + '40',
    gap: 12,
    ...Shadows.small,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  suggestionsTitle: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  suggestionsClose: { fontSize: 13, color: Colors.textSecondary },
  suggestionsLoading: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  suggestionsLoadingText: { fontSize: 14, color: Colors.textSecondary },
  suggestionsEmpty: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', paddingVertical: 8 },

  // Add all
  addAllBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  addAllBtnDisabled: { backgroundColor: Colors.textMuted },
  addAllBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // Suggestion groups
  suggestionGroup: { gap: 6 },
  reasonPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  reasonPillText: { fontSize: 11, fontWeight: '600', color: Colors.textPrimary },
  suggestionChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#E8F5E9',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary + '60',
  },
  suggestionChipText: { fontSize: 14, color: Colors.primary, fontWeight: '500' },
  suggestionChipAdd: { fontSize: 16, color: Colors.primary, fontWeight: '700' },

  // Sekcje
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 12,
  },
  checkedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  clearBtn: { fontSize: 13, color: Colors.error, fontWeight: '600' },

  // Source icon overlay
  sourceIconWrap: {
    position: 'absolute',
    top: 6,
    right: 32,
    zIndex: 1,
  },
  sourceIcon: { fontSize: 12 },
});
