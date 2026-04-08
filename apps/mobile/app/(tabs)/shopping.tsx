import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useShoppingList } from '../../src/hooks/useShoppingList';
import { ShoppingItemRow } from '../../src/components/shopping/ShoppingItem';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { Button } from '../../src/components/ui/Button';
import { Colors } from '../../src/constants/colors';

export default function ShoppingScreen() {
  const { items, loading, fetchItems, addItem, removeItem, checkItem, clearChecked } = useShoppingList();
  const [newItem, setNewItem] = useState('');
  const [adding, setAdding] = useState(false);

  const unchecked = items.filter((i) => !i.is_checked);
  const checked = items.filter((i) => i.is_checked);

  const handleAdd = async () => {
    if (!newItem.trim()) return;
    setAdding(true);
    try {
      await addItem({ name: newItem.trim(), quantity: 1, unit: 'szt' });
      setNewItem('');
    } finally {
      setAdding(false);
    }
  };

  const handleClearChecked = () => {
    if (checked.length === 0) return;
    Alert.alert('Wyczyść kupione', `Usunąć ${checked.length} zaznaczonych pozycji?`, [
      { text: 'Anuluj', style: 'cancel' },
      { text: 'Wyczyść', style: 'destructive', onPress: clearChecked },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Lista zakupów</Text>
        {checked.length > 0 && (
          <Pressable onPress={handleClearChecked}>
            <Text style={styles.clearBtn}>Wyczyść kupione</Text>
          </Pressable>
        )}
      </View>

      {/* Pole dodawania */}
      <View style={styles.addRow}>
        <TextInput
          style={styles.addInput}
          placeholder="Dodaj produkt..."
          placeholderTextColor={Colors.textMuted}
          value={newItem}
          onChangeText={setNewItem}
          onSubmitEditing={handleAdd}
          returnKeyType="done"
        />
        <Pressable
          style={[styles.addBtn, adding && { opacity: 0.6 }]}
          onPress={handleAdd}
          disabled={adding}
        >
          <Text style={styles.addBtnText}>＋</Text>
        </Pressable>
      </View>

      <FlatList
        data={[...unchecked, ...checked]}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ShoppingItemRow
            item={item}
            onCheck={checkItem}
            onDelete={removeItem}
          />
        )}
        contentContainerStyle={styles.list}
        onRefresh={fetchItems}
        refreshing={loading}
        ListEmptyComponent={
          <EmptyState
            icon="🛒"
            title="Lista jest pusta"
            description="Dodaj produkty ręcznie lub wygeneruj sugestie AI"
          />
        }
      />
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
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary },
  clearBtn: { fontSize: 13, color: Colors.error, fontWeight: '600' },
  addRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 12 },
  addInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: { color: '#fff', fontSize: 24, fontWeight: '700' },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
});
