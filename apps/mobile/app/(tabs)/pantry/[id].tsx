import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { PantryItem } from '../../../src/types/pantry.types';
import { usePantry } from '../../../src/hooks/usePantry';
import { QuickActions } from '../../../src/components/pantry/QuickActions';
import { ExpirationBadge } from '../../../src/components/pantry/ExpirationBadge';
import { Button } from '../../../src/components/ui/Button';
import { Colors } from '../../../src/constants/colors';
import { formatDate, formatQuantity } from '../../../src/utils/format';
import { getCategoryIcon } from '../../../src/utils/format';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { items, consumeItem, openItem, discardItem, removeItem } = usePantry();
  const [item, setItem] = useState<PantryItem | null>(null);

  useEffect(() => {
    const found = items.find((i) => i.id === id);
    setItem(found || null);
  }, [id, items]);

  if (!item) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFound}>Produkt nie znaleziony</Text>
      </SafeAreaView>
    );
  }

  const effectiveDate = item.effective_expiry || item.expiration_date;

  const handleDelete = () => {
    Alert.alert('Usuń produkt', `Czy na pewno chcesz usunąć "${item.name}"?`, [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Usuń',
        style: 'destructive',
        onPress: async () => {
          await removeItem(item.id);
          router.back();
        },
      },
    ]);
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
          {item.category && <Text style={styles.productCategory}>{item.category}</Text>}
        </View>

        {/* Szybkie akcje */}
        <View style={styles.section}>
          <QuickActions
            onConsume={async () => { await consumeItem(item.id); router.back(); }}
            onOpen={async () => { await openItem(item.id); }}
            onDiscard={async () => { await discardItem(item.id); router.back(); }}
          />
        </View>

        {/* Szczegóły */}
        <View style={styles.section}>
          <View style={styles.detail}>
            <Text style={styles.detailLabel}>Ilość</Text>
            <Text style={styles.detailValue}>{formatQuantity(item.quantity, item.unit)}</Text>
          </View>
          <View style={styles.detail}>
            <Text style={styles.detailLabel}>Lokalizacja</Text>
            <Text style={styles.detailValue}>{item.location_name || 'Spiżarnia'}</Text>
          </View>
          <View style={styles.detail}>
            <Text style={styles.detailLabel}>Status</Text>
            <Text style={styles.detailValue}>{item.status === 'opened' ? '📦 Otwarte' : '🔒 Nieotwarte'}</Text>
          </View>
          {effectiveDate && (
            <View style={styles.detail}>
              <Text style={styles.detailLabel}>Data ważności</Text>
              <View>
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
          <View style={styles.detail}>
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
  notFound: { padding: 24, color: Colors.textSecondary },
  header: { paddingHorizontal: 16, paddingTop: 8 },
  productHeader: { alignItems: 'center', padding: 24, gap: 8 },
  productIcon: { fontSize: 64 },
  productName: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
  productBrand: { fontSize: 15, color: Colors.textSecondary },
  productCategory: { fontSize: 13, color: Colors.textMuted },
  section: { marginHorizontal: 16, marginBottom: 16, gap: 8 },
  detail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  detailLabel: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
  detailValue: { fontSize: 14, color: Colors.textPrimary, fontWeight: '600' },
  bottomActions: { padding: 16, gap: 8 },
});
