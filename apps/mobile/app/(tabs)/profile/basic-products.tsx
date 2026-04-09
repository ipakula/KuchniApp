import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getBasicProducts } from '../../../src/api/auth.api';
import { apiClient } from '../../../src/api/client';
import { Colors, Shadows } from '../../../src/constants/colors';
import { CATEGORIES } from '../../../src/constants/categories';
import { UNITS } from '../../../src/constants/units';

interface BasicProduct {
  id: string;
  name: string;
  category?: string;
  min_quantity: number;
  unit: string;
  is_active: boolean;
}

export default function BasicProductsScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<BasicProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newUnit, setNewUnit] = useState('szt');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const data = await getBasicProducts();
      setProducts(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const { data } = await apiClient.post('/auth/basic-products', {
        name: newName.trim(),
        unit: newUnit,
        min_quantity: 1,
      });
      setProducts((prev) => [...prev, data.data]);
      setNewName('');
    } catch {
      Alert.alert('Błąd', 'Nie udało się dodać produktu');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (product: BasicProduct) => {
    try {
      await apiClient.patch(`/auth/basic-products/${product.id}`, {
        is_active: !product.is_active,
      });
      setProducts((prev) =>
        prev.map((p) => p.id === product.id ? { ...p, is_active: !p.is_active } : p)
      );
    } catch {
      Alert.alert('Błąd', 'Nie udało się zaktualizować');
    }
  };

  const handleDelete = (product: BasicProduct) => {
    Alert.alert('Usuń produkt', `Usunąć "${product.name}" z listy bazowej?`, [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Usuń', style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete(`/auth/basic-products/${product.id}`);
            setProducts((prev) => prev.filter((p) => p.id !== product.id));
          } catch {
            Alert.alert('Błąd', 'Nie udało się usunąć');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>‹</Text>
        </Pressable>
        <Text style={styles.title}>Bazowe produkty</Text>
        <View style={{ width: 40 }} />
      </View>

      <Text style={styles.desc}>
        Produkty, które zawsze chcesz mieć w domu. Aplikacja przypomni o uzupełnieniu listy zakupów.
      </Text>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={Colors.primary} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View style={styles.addBox}>
              <Text style={styles.addTitle}>Dodaj produkt</Text>
              <View style={styles.addRow}>
                <TextInput
                  style={styles.addInput}
                  placeholder="Nazwa produktu (np. Mleko)"
                  placeholderTextColor={Colors.textMuted}
                  value={newName}
                  onChangeText={setNewName}
                  returnKeyType="done"
                  onSubmitEditing={handleAdd}
                />
                <Pressable
                  style={[styles.addBtn, (!newName.trim() || saving) && styles.addBtnDisabled]}
                  onPress={handleAdd}
                  disabled={!newName.trim() || saving}
                >
                  {saving
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.addBtnText}>＋</Text>}
                </Pressable>
              </View>
              {products.length > 0 && <Text style={styles.sectionLabel}>Lista bazowa</Text>}
            </View>
          }
          renderItem={({ item }) => {
            const catIcon = CATEGORIES.find((c) => c.value === item.category)?.icon;
            return (
              <View style={[styles.productCard, !item.is_active && styles.productCardInactive]}>
                <Text style={styles.productIcon}>{catIcon || '🛒'}</Text>
                <View style={styles.productInfo}>
                  <Text style={[styles.productName, !item.is_active && styles.productNameInactive]}>
                    {item.name}
                  </Text>
                  <Text style={styles.productMeta}>
                    min. {item.min_quantity} {item.unit}
                  </Text>
                </View>
                <Pressable
                  style={[styles.toggleBtn, item.is_active && styles.toggleBtnActive]}
                  onPress={() => toggleActive(item)}
                >
                  <Text style={styles.toggleBtnText}>{item.is_active ? 'aktywny' : 'wyłączony'}</Text>
                </Pressable>
                <Pressable onPress={() => handleDelete(item)} style={styles.deleteBtn}>
                  <Text style={styles.deleteBtnText}>🗑</Text>
                </Pressable>
              </View>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.empty}>Brak bazowych produktów. Dodaj pierwszy powyżej.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backBtnText: { fontSize: 30, color: Colors.primary, lineHeight: 34 },
  title: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  desc: {
    fontSize: 13, color: Colors.textSecondary,
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4,
  },
  list: { padding: 16, paddingBottom: 40 },
  addBox: {
    backgroundColor: Colors.surface, borderRadius: 14, padding: 16,
    marginBottom: 16, ...Shadows.small,
  },
  addTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 10 },
  addRow: { flexDirection: 'row', gap: 8 },
  addInput: {
    flex: 1, backgroundColor: Colors.background, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    color: Colors.textPrimary, borderWidth: 1.5, borderColor: Colors.border,
  },
  addBtn: {
    width: 50, height: 50, borderRadius: 10, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  addBtnDisabled: { backgroundColor: Colors.textMuted },
  addBtnText: { color: '#fff', fontSize: 26, fontWeight: '700', lineHeight: 30 },
  sectionLabel: {
    fontSize: 12, fontWeight: '700', color: Colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 16,
  },
  productCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.surface, borderRadius: 12, padding: 14,
    marginBottom: 8, ...Shadows.small,
  },
  productCardInactive: { opacity: 0.55 },
  productIcon: { fontSize: 24 },
  productInfo: { flex: 1 },
  productName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  productNameInactive: { textDecorationLine: 'line-through', color: Colors.textMuted },
  productMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  toggleBtn: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
    backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border,
  },
  toggleBtnActive: { borderColor: Colors.primary, backgroundColor: '#E8F5E9' },
  toggleBtnText: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary },
  deleteBtn: { padding: 6 },
  deleteBtnText: { fontSize: 18 },
  empty: { textAlign: 'center', color: Colors.textMuted, marginTop: 16 },
});
