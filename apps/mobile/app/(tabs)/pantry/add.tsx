import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { DatePickerModal } from '../../../src/components/ui/DatePickerModal';
import { usePantry } from '../../../src/hooks/usePantry';
import { Input } from '../../../src/components/ui/Input';
import { Button } from '../../../src/components/ui/Button';
import { Colors } from '../../../src/constants/colors';
import { UNITS } from '../../../src/constants/units';
import { CATEGORIES } from '../../../src/constants/categories';
import { Unit } from '../../../src/types/pantry.types';
import { searchProducts, ProductSuggestion } from '../../../src/api/products.api';

export default function AddProductScreen() {
  const router = useRouter();
  const { locations, addItem } = usePantry();

  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState<Unit>('szt');
  const [category, setCategory] = useState('');
  const [locationId, setLocationId] = useState(locations[0]?.id || '');
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ustaw domyślną lokalizację gdy załaduje się lista
  const effectiveLocationId = locationId || locations[0]?.id || '';

  const handleNameChange = (text: string) => {
    setName(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (text.length >= 2) {
      searchTimeout.current = setTimeout(async () => {
        try {
          const results = await searchProducts(text);
          setSuggestions(results);
          setShowSuggestions(results.length > 0);
        } catch {
          // ignore search errors silently
        }
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (s: ProductSuggestion) => {
    setName(s.name);
    if (s.category) setCategory(s.category);
    if (s.default_unit) setUnit(s.default_unit as Unit);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const formatDate = (d: Date) =>
    d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });

  const handleAdd = async () => {
    if (!name.trim()) {
      Alert.alert('Wymagane', 'Podaj nazwę produktu');
      return;
    }
    setLoading(true);
    try {
      await addItem({
        name: name.trim(),
        quantity: parseFloat(quantity) || 1,
        unit,
        category: category || undefined,
        location_id: effectiveLocationId || undefined,
        expiration_date: expiryDate
          ? expiryDate.toISOString().split('T')[0]
          : undefined,
        added_from: 'manual',
      });
      router.back();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Spróbuj ponownie';
      Alert.alert('Nie udało się dodać produktu', msg);
    } finally {
      setLoading(false);
    }
  };

  const adjustQty = (delta: number) => {
    const current = parseFloat(quantity) || 1;
    const next = Math.max(0.5, current + delta);
    setQuantity(Number.isInteger(next) ? String(next) : next.toFixed(1));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>‹</Text>
        </Pressable>
        <Text style={styles.title}>Dodaj produkt</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Nazwa z autocomplete */}
        <View style={styles.nameWrapper}>
          <Input
            label="Nazwa produktu *"
            placeholder="np. Mleko UHT 3,2%"
            value={name}
            onChangeText={handleNameChange}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            returnKeyType="done"
          />
          {showSuggestions && (
            <View style={styles.suggestionDropdown}>
              <FlatList
                data={suggestions}
                keyExtractor={(s) => s.id}
                keyboardShouldPersistTaps="handled"
                scrollEnabled={suggestions.length > 4}
                style={{ maxHeight: 200 }}
                renderItem={({ item: s }) => (
                  <Pressable style={styles.suggestionItem} onPress={() => handleSelectSuggestion(s)}>
                    <Text style={styles.suggestionName}>{s.name}</Text>
                    {s.brand ? <Text style={styles.suggestionBrand}>{s.brand}</Text> : null}
                  </Pressable>
                )}
                ItemSeparatorComponent={() => <View style={styles.suggestionSep} />}
              />
            </View>
          )}
        </View>

        {/* Ilość + Jednostka w jednym wierszu */}
        <View style={styles.field}>
          <Text style={styles.label}>Ilość i jednostka</Text>
          <View style={styles.qtyUnitRow}>
            {/* Stepper */}
            <Pressable style={styles.qtyBtn} onPress={() => adjustQty(-1)}>
              <Text style={styles.qtyBtnText}>−</Text>
            </Pressable>
            <Input
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="decimal-pad"
              style={styles.qtyInput}
              containerStyle={styles.qtyContainer}
            />
            <Pressable style={styles.qtyBtn} onPress={() => adjustQty(1)}>
              <Text style={styles.qtyBtnText}>+</Text>
            </Pressable>

            {/* Separator */}
            <View style={styles.separator} />

            {/* Jednostka — poziomo */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.unitScroll}>
              {UNITS.map((u) => (
                <Pressable
                  key={u.value}
                  style={[styles.unitChip, unit === u.value && styles.unitChipActive]}
                  onPress={() => setUnit(u.value as Unit)}
                >
                  <Text style={[styles.unitChipText, unit === u.value && styles.unitChipTextActive]}>
                    {u.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Kategoria — siatka 2 kolumny */}
        <View style={styles.field}>
          <Text style={styles.label}>Kategoria</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((c) => (
              <Pressable
                key={c.value}
                style={[styles.categoryBtn, category === c.value && styles.categoryBtnActive]}
                onPress={() => setCategory(category === c.value ? '' : c.value)}
              >
                <Text style={styles.categoryIcon}>{c.icon}</Text>
                <Text style={[styles.categoryText, category === c.value && styles.categoryTextActive]}>
                  {c.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Lokalizacja */}
        {locations.length > 0 && (
          <View style={styles.field}>
            <Text style={styles.label}>Lokalizacja</Text>
            <View style={styles.locationRow}>
              {locations.map((loc) => (
                <Pressable
                  key={loc.id}
                  style={[styles.locBtn, effectiveLocationId === loc.id && styles.locBtnActive]}
                  onPress={() => setLocationId(loc.id)}
                >
                  <Text style={styles.locIcon}>{loc.icon}</Text>
                  <Text style={[styles.locText, effectiveLocationId === loc.id && styles.locTextActive]}>
                    {loc.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Data ważności — tap otwiera picker */}
        <View style={styles.field}>
          <Text style={styles.label}>Data ważności (opcjonalnie)</Text>
          <Pressable style={styles.dateTrigger} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.dateIcon}>📅</Text>
            <Text style={[styles.dateValue, !expiryDate && styles.datePlaceholder]}>
              {expiryDate ? formatDate(expiryDate) : 'Wybierz datę...'}
            </Text>
            {expiryDate && (
              <Pressable
                style={styles.dateClear}
                onPress={(e) => { e.stopPropagation(); setExpiryDate(null); }}
              >
                <Text style={styles.dateClearText}>✕</Text>
              </Pressable>
            )}
          </Pressable>
        </View>

        <Button
          title="Dodaj do spiżarni"
          onPress={handleAdd}
          loading={loading}
          size="lg"
          style={styles.submitBtn}
        />
      </ScrollView>

      <DatePickerModal
        visible={showDatePicker}
        value={expiryDate}
        minimumDate={new Date()}
        onConfirm={(date) => { setExpiryDate(date); setShowDatePicker(false); }}
        onCancel={() => setShowDatePicker(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: { fontSize: 30, color: Colors.primary, lineHeight: 34 },
  title: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },

  scroll: { flex: 1, padding: 16 },
  field: { marginTop: 20 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },

  // Ilość + jednostka
  qtyUnitRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qtyBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: { color: '#fff', fontSize: 22, fontWeight: '700' },
  qtyContainer: { width: 64 },
  qtyInput: { textAlign: 'center', fontSize: 17, fontWeight: '700' },
  separator: { width: 1, height: 32, backgroundColor: Colors.border, marginHorizontal: 4 },
  unitScroll: { flex: 1 },
  unitChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    marginRight: 6,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitChipActive: { borderColor: Colors.primary, backgroundColor: '#E8F5E9' },
  unitChipText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  unitChipTextActive: { color: Colors.primary, fontWeight: '700' },

  // Kategoria grid
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '47%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  categoryBtnActive: { borderColor: Colors.primary, backgroundColor: '#E8F5E9' },
  categoryIcon: { fontSize: 18 },
  categoryText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500', flex: 1 },
  categoryTextActive: { color: Colors.primary, fontWeight: '700' },

  // Lokalizacja
  locationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  locBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  locBtnActive: { borderColor: Colors.primary, backgroundColor: '#E8F5E9' },
  locIcon: { fontSize: 18 },
  locText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  locTextActive: { color: Colors.primary, fontWeight: '700' },

  // Data
  dateTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  dateIcon: { fontSize: 18 },
  dateValue: { flex: 1, fontSize: 15, color: Colors.textPrimary, fontWeight: '500' },
  datePlaceholder: { color: Colors.textMuted, fontWeight: '400' },
  dateClear: { padding: 4 },
  dateClearText: { fontSize: 13, color: Colors.textMuted },

  submitBtn: { marginTop: 32, marginBottom: 40 },

  // Autocomplete
  nameWrapper: { zIndex: 10 },
  suggestionDropdown: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginTop: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  suggestionItem: {
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  suggestionName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  suggestionBrand: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  suggestionSep: { height: 1, backgroundColor: Colors.border },
});
