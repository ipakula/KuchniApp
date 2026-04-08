import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { usePantry } from '../../../src/hooks/usePantry';
import { Input } from '../../../src/components/ui/Input';
import { Button } from '../../../src/components/ui/Button';
import { Colors } from '../../../src/constants/colors';
import { UNITS } from '../../../src/constants/units';
import { Unit } from '../../../src/types/pantry.types';
import { CATEGORIES } from '../../../src/constants/categories';

export default function AddProductScreen() {
  const router = useRouter();
  const { locations, addItem } = usePantry();
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState<Unit>('szt');
  const [category, setCategory] = useState('');
  const [locationId, setLocationId] = useState(locations[0]?.id || '');
  const [expiryDate, setExpiryDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!name.trim()) {
      Alert.alert('Błąd', 'Podaj nazwę produktu');
      return;
    }
    setLoading(true);
    try {
      await addItem({
        name: name.trim(),
        brand: brand.trim() || undefined,
        quantity: parseFloat(quantity) || 1,
        unit,
        category: category || undefined,
        location_id: locationId || undefined,
        expiration_date: expiryDate || undefined,
        added_from: 'manual',
      });
      router.back();
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Button title="← Wróć" onPress={() => router.back()} variant="ghost" size="sm" />
        <Text style={styles.title}>Dodaj produkt</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content}>
        <Input label="Nazwa produktu *" placeholder="np. Mleko UHT" value={name} onChangeText={setName} />
        <Input label="Marka (opcjonalnie)" placeholder="np. Łaciate" value={brand} onChangeText={setBrand} containerStyle={styles.field} />

        <View style={styles.field}>
          <Text style={styles.label}>Ilość</Text>
          <View style={styles.quantityRow}>
            <Pressable style={styles.qtyBtn} onPress={() => setQuantity(String(Math.max(1, parseFloat(quantity) - 1)))}>
              <Text style={styles.qtyBtnText}>−</Text>
            </Pressable>
            <Input value={quantity} onChangeText={setQuantity} keyboardType="decimal-pad" style={styles.qtyInput} containerStyle={styles.qtyContainer} />
            <Pressable style={styles.qtyBtn} onPress={() => setQuantity(String(parseFloat(quantity) + 1))}>
              <Text style={styles.qtyBtnText}>+</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Jednostka</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {UNITS.slice(0, 6).map((u) => (
              <Pressable key={u.value} style={[styles.chip, unit === u.value && styles.chipActive]} onPress={() => setUnit(u.value as Unit)}>
                <Text style={[styles.chipText, unit === u.value && styles.chipTextActive]}>{u.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Kategoria</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {CATEGORIES.slice(0, 8).map((c) => (
              <Pressable key={c.value} style={[styles.chip, category === c.value && styles.chipActive]} onPress={() => setCategory(c.value)}>
                <Text style={styles.chipText}>{c.icon} {c.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Lokalizacja</Text>
          <View style={styles.locationRow}>
            {locations.map((loc) => (
              <Pressable key={loc.id} style={[styles.locBtn, locationId === loc.id && styles.locBtnActive]} onPress={() => setLocationId(loc.id)}>
                <Text style={styles.locIcon}>{loc.icon}</Text>
                <Text style={[styles.locText, locationId === loc.id && styles.locTextActive]}>{loc.name}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Input
          label="Data ważności (opcjonalnie)"
          placeholder="RRRR-MM-DD"
          value={expiryDate}
          onChangeText={setExpiryDate}
          containerStyle={styles.field}
        />

        <Button title="Dodaj do spiżarni" onPress={handleAdd} loading={loading} size="lg" style={styles.addBtn} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8 },
  title: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  content: { flex: 1, padding: 16 },
  field: { marginTop: 16 },
  label: { fontSize: 14, fontWeight: '500', color: Colors.textPrimary, marginBottom: 8 },
  quantityRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 44, height: 44, borderRadius: 10, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  qtyBtnText: { color: '#fff', fontSize: 22, fontWeight: '700' },
  qtyContainer: { flex: 1 },
  qtyInput: { textAlign: 'center', fontSize: 18, fontWeight: '600' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: Colors.surface, marginRight: 6, borderWidth: 1.5, borderColor: Colors.border },
  chipActive: { borderColor: Colors.primary, backgroundColor: '#E8F5E9' },
  chipText: { fontSize: 13, color: Colors.textSecondary },
  chipTextActive: { color: Colors.primary, fontWeight: '600' },
  locationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  locBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border },
  locBtnActive: { borderColor: Colors.primary, backgroundColor: '#E8F5E9' },
  locIcon: { fontSize: 16 },
  locText: { fontSize: 13, color: Colors.textSecondary },
  locTextActive: { color: Colors.primary, fontWeight: '600' },
  addBtn: { marginTop: 24, marginBottom: 32 },
});
