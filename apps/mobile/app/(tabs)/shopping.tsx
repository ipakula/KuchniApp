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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useShoppingList } from '../../src/hooks/useShoppingList';
import { ShoppingItemRow } from '../../src/components/shopping/ShoppingItem';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { Colors, Shadows } from '../../src/constants/colors';
import { getShoppingSuggestions } from '../../src/api/ai.api';

export default function ShoppingScreen() {
  const { items, loading, fetchItems, addItem, removeItem, checkItem, clearChecked } = useShoppingList();
  const [newItem, setNewItem] = useState('');
  const [adding, setAdding] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const unchecked = items.filter((i) => !i.is_checked);
  const checked = items.filter((i) => i.is_checked);

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

  const handleAddSuggestion = async (suggestion: string) => {
    await handleAdd(suggestion);
    setSuggestions((prev) => prev.filter((s) => s !== suggestion));
  };

  const handleLoadSuggestions = async () => {
    setLoadingSuggestions(true);
    setShowSuggestions(true);
    try {
      const result = await getShoppingSuggestions();
      setSuggestions(result);
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

  const ListHeader = () => (
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
            <Text style={styles.aiBtnSub}>Na podstawie stanu spiżarni</Text>
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
              <Text style={styles.suggestionsLoadingText}>Analizuję spiżarnię...</Text>
            </View>
          ) : suggestions.length === 0 ? (
            <Text style={styles.suggestionsEmpty}>Brak propozycji — spiżarnia wygląda kompletnie!</Text>
          ) : (
            <View style={styles.suggestionsList}>
              {suggestions.map((s) => (
                <Pressable key={s} style={styles.suggestionChip} onPress={() => handleAddSuggestion(s)}>
                  <Text style={styles.suggestionChipText}>{s}</Text>
                  <Text style={styles.suggestionChipAdd}>＋</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Sekcja — do kupienia */}
      {unchecked.length > 0 && (
        <Text style={styles.sectionLabel}>Do kupienia ({unchecked.length})</Text>
      )}
    </View>
  );

  const ListFooter = () =>
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
    ) : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Lista zakupów</Text>
        <Text style={styles.subtitle}>{unchecked.length} pozycji</Text>
      </View>

      <FlatList
        data={unchecked}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ShoppingItemRow item={item} onCheck={checkItem} onDelete={removeItem} />
        )}
        contentContainerStyle={styles.list}
        onRefresh={fetchItems}
        refreshing={loading}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={<ListHeader />}
        ListFooterComponent={<ListFooter />}
        ListEmptyComponent={
          unchecked.length === 0 && !loading ? (
            <EmptyState
              icon="🛒"
              title="Lista jest pusta"
              description="Dodaj produkty ręcznie lub skorzystaj z propozycji AI na podstawie spiżarni"
            />
          ) : null
        }
      />
    </SafeAreaView>
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
    ...Shadows.small,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  suggestionsTitle: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  suggestionsClose: { fontSize: 13, color: Colors.textSecondary },
  suggestionsLoading: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  suggestionsLoadingText: { fontSize: 14, color: Colors.textSecondary },
  suggestionsEmpty: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', paddingVertical: 8 },
  suggestionsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
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
    marginBottom: 8,
    marginTop: 4,
  },
  checkedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  clearBtn: { fontSize: 13, color: Colors.error, fontWeight: '600' },
});
