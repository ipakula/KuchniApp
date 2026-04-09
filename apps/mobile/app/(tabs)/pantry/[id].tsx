import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Pressable,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { PantryItem } from '../../../src/types/pantry.types';
import { usePantry } from '../../../src/hooks/usePantry';
import { QuickActions } from '../../../src/components/pantry/QuickActions';
import { ExpirationBadge } from '../../../src/components/pantry/ExpirationBadge';
import { Button } from '../../../src/components/ui/Button';
import { Colors } from '../../../src/constants/colors';
import { formatDate, formatQuantity, getCategoryIcon } from '../../../src/utils/format';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { items, consumeItem, openItem, discardItem, removeItem, updateItem } = usePantry();
  const [item, setItem] = useState<PantryItem | null>(null);
  const [editingQty, setEditingQty] = useState(false);
  const [qtyInput, setQtyInput] = useState('');

  useEffect(() => {
    const found = items.find((i) => i.id === id);
    setItem(found || null);
    if (found) setQtyInput(String(found.quantity));
  }, [id, items]);

  if (!item) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notFoundWrap}>
          <Text style={styles.notFoundIcon}>🔍</Text>
          <Text style={styles.notFoundTitle}>Produkt nie znaleziony</Text>
          <Button title="← Wróć" onPress={() => router.back()} variant="ghost" size="sm" />
        </View>
      </SafeAreaView>
    );
  }

  const effectiveDate = item.effective_expiry || item.expiration_date;

  const handleConsume = () => {
    Alert.alert(
      'Skonsumuj produkt',
      `Oznaczyć "${item.name}" jako skonsumowany?\nZostanie usunięty ze spiżarni.`,
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Skonsumuj',
          onPress: async () => {
            try {
              await consumeItem(item.id);
              router.back();
            } catch {
              Alert.alert('Błąd', 'Nie udało się zaktualizować produktu.');
            }
          },
        },
      ]
    );
  };

  const handleDiscard = () => {
    Alert.alert(
      'Wyrzuć produkt',
      `Wyrzucić "${item.name}"?\nZostanie oznaczony jako odpad i usunięty ze spiżarni.`,
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Wyrzuć',
          style: 'destructive',
          onPress: async () => {
            try {
              await discardItem(item.id);
              router.back();
            } catch {
              Alert.alert('Błąd', 'Nie udało się zaktualizować produktu.');
            }
          },
        },
      ]
    );
  };

  const handleOpen = async () => {
    if (item.status === 'opened') return;
    try {
      await openItem(item.id);
    } catch {
      Alert.alert('Błąd', 'Nie udało się zaktualizować statusu.');
    }
  };

  const handleDelete = () => {
    Alert.alert('Usuń produkt', `Czy na pewno chcesz usunąć "${item.name}"?`, [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Usuń',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeItem(item.id);
            router.back();
          } catch {
            Alert.alert('Błąd', 'Nie udało się usunąć produktu.');
          }
        },
      },
    ]);
  };

  const handleSaveQty = async () => {
    const qty = parseFloat(qtyInput);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Błąd', 'Podaj prawidłową ilość.');
      setQtyInput(String(item.quantity));
      setEditingQty(false);
      return;
    }
    try {
      await updateItem(item.id, { quantity: qty });
      setEditingQty(false);
    } catch {
      Alert.alert('Błąd', 'Nie udało się zaktualizować ilości.');
      setQtyInput(String(item.quantity));
      setEditingQty(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <Button title="← Wróć" onPress={() => router.back()} variant="ghost" size="sm" />
        </View>

        {/* Produkt info */}
        <View style={styles.productHeader}>
          <Text style={styles.productIcon}>{getCategoryIcon(item.category)}</Text>
          <Text style={styles.productName}>{item.name}</Text>
          {item.brand && <Text style={styles.productBrand}>{item.brand}</Text>}
          {item.category && (
            <View style={styles.categoryPill}>
              <Text style={styles.categoryPillText}>{item.category}</Text>
            </View>
          )}
        </View>

        {/* Szybkie akcje */}
        <View style={styles.section}>
          <QuickActions
            onConsume={handleConsume as any}
            onOpen={handleOpen}
            onDiscard={handleDiscard as any}
            isOpened={item.status === 'opened'}
          />
        </View>

        {/* Szczegóły */}
        <View style={styles.card}>
          {/* Ilość — edytowalna */}
          <View style={styles.detail}>
            <Text style={styles.detailLabel}>Ilość</Text>
            {editingQty ? (
              <View style={styles.qtyEditRow}>
                <TextInput
                  style={styles.qtyInput}
                  value={qtyInput}
                  onChangeText={setQtyInput}
                  keyboardType="decimal-pad"
                  autoFocus
                  selectTextOnFocus
                />
                <Text style={styles.qtyUnit}>{item.unit}</Text>
                <Pressable style={styles.saveQtyBtn} onPress={handleSaveQty}>
                  <Text style={styles.saveQtyText}>Zapisz</Text>
                </Pressable>
                <Pressable
                  onPress={() => { setQtyInput(String(item.quantity)); setEditingQty(false); }}
                >
                  <Text style={styles.cancelQtyText}>Anuluj</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable onPress={() => setEditingQty(true)} style={styles.qtyValueRow}>
                <Text style={styles.detailValue}>{formatQuantity(item.quantity, item.unit)}</Text>
                <Text style={styles.editHint}>✏️</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.detail}>
            <Text style={styles.detailLabel}>Lokalizacja</Text>
            <Text style={styles.detailValue}>{item.location_name || 'Spiżarnia'}</Text>
          </View>

          <View style={styles.detail}>
            <Text style={styles.detailLabel}>Status</Text>
            <Text style={styles.detailValue}>
              {item.status === 'opened' ? '📦 Otwarte' : '🔒 Nieotwarte'}
            </Text>
          </View>

          {effectiveDate && (
            <View style={styles.detail}>
              <Text style={styles.detailLabel}>Data ważności</Text>
              <View style={styles.expiryCol}>
                <Text style={styles.detailValue}>{formatDate(effectiveDate)}</Text>
                <ExpirationBadge expirationDate={effectiveDate} />
              </View>
            </View>
          )}

          {item.opened_date && (
            <View style={styles.detail}>
              <Text style={styles.detailLabel}>Data otwarcia</Text>
              <Text style={styles.detailValue}>{formatDate(item.opened_date)}</Text>
            </View>
          )}

          <View style={[styles.detail, styles.detailLast]}>
            <Text style={styles.detailLabel}>Dodano</Text>
            <Text style={styles.detailValue}>{formatDate(item.created_at)}</Text>
          </View>
        </View>

        {/* Akcje */}
        <View style={styles.bottomActions}>
          <Button
            title="🗑️ Usuń produkt"
            onPress={handleDelete}
            variant="danger"
            size="sm"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  notFoundWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 32,
  },
  notFoundIcon: { fontSize: 48 },
  notFoundTitle: { fontSize: 18, fontWeight: '700', color: Colors.textSecondary },

  header: { paddingHorizontal: 16, paddingTop: 8 },

  productHeader: { alignItems: 'center', padding: 24, gap: 8 },
  productIcon: { fontSize: 64 },
  productName: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  productBrand: { fontSize: 15, color: Colors.textSecondary },
  categoryPill: {
    backgroundColor: Colors.background,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryPillText: { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },

  section: { marginHorizontal: 16, marginBottom: 16 },

  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
  },

  detail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  detailLast: { borderBottomWidth: 0 },
  detailLabel: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
  detailValue: { fontSize: 14, color: Colors.textPrimary, fontWeight: '600' },
  expiryCol: { alignItems: 'flex-end', gap: 4 },

  // Edycja ilości
  qtyValueRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  editHint: { fontSize: 13 },
  qtyEditRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyInput: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    width: 70,
    textAlign: 'center',
  },
  qtyUnit: { fontSize: 13, color: Colors.textSecondary },
  saveQtyBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  saveQtyText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  cancelQtyText: { fontSize: 13, color: Colors.textMuted },

  bottomActions: { padding: 16, gap: 8 },
});
