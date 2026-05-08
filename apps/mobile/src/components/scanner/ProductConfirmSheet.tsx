import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import { Button } from '../ui/Button';
import { DatePickerModal } from '../ui/DatePickerModal';
import { ExpiryScannerButton } from '../ui/ExpiryScanner';
import { Colors } from '../../constants/colors';
import { AddPantryItemDTO, Unit } from '../../types/pantry.types';
import { UNITS } from '../../constants/units';
import { CATEGORIES } from '../../constants/categories';

interface ScannedProduct {
  barcode?: string;
  name?: string;
  brand?: string;
  category?: string;
  image_url?: string;
  id?: string;
}

interface ProductConfirmSheetProps {
  product: ScannedProduct | null;
  onClose: () => void;
  onAdd: (item: AddPantryItemDTO) => Promise<void>;
  locations: Array<{ id: string; name: string; icon: string }>;
}

export function ProductConfirmSheet({
  product,
  onClose,
  onAdd,
  locations,
}: ProductConfirmSheetProps) {
  const isUnknown = !product?.name;

  const [name, setName] = useState(product?.name || '');
  const [category, setCategory] = useState(product?.category || '');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState<Unit>('szt');
  const [selectedLocation, setSelectedLocation] = useState(locations[0]?.id || '');
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const formatDate = (d: Date) =>
    d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });

  if (!product) return null;

  const adjustQty = (delta: number) => {
    setQuantity((prev) => String(Math.max(0.5, parseFloat(prev) + delta)));
  };

  const handleAdd = async () => {
    if (!name.trim()) {
      Alert.alert('Wymagane', 'Podaj nazwę produktu');
      return;
    }
    setLoading(true);
    try {
      await onAdd({
        product_id: product.id,
        name: name.trim(),
        barcode: product.barcode,
        category: category || undefined,
        quantity: parseFloat(quantity) || 1,
        unit,
        location_id: selectedLocation || undefined,
        expiration_date: expiryDate ? expiryDate.toISOString().split('T')[0] : undefined,
        added_from: 'scan',
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Nagłówek produktu */}
          <View style={styles.productHeader}>
            {isUnknown ? (
              <View style={styles.unknownBanner}>
                <Text style={styles.unknownIcon}>🔍</Text>
                <View>
                  <Text style={styles.unknownTitle}>Nieznany produkt</Text>
                  <Text style={styles.unknownSub}>Uzupełnij dane poniżej</Text>
                </View>
              </View>
            ) : (
              <>
                <Text style={styles.productName}>{name}</Text>
                {category ? (
                  <Text style={styles.productCategory}>
                    {CATEGORIES.find((c) => c.value === category)?.icon} {category}
                  </Text>
                ) : null}
              </>
            )}
          </View>

          {/* Nazwa (edytowalna zawsze gdy nieznany, opcjonalnie dla znanych) */}
          {isUnknown && (
            <>
              <Text style={styles.sectionLabel}>Nazwa produktu *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="np. Mleko UHT 3,2%"
                placeholderTextColor={Colors.textMuted}
                value={name}
                onChangeText={setName}
                returnKeyType="done"
              />
            </>
          )}

          {/* Kategoria */}
          <Text style={[styles.sectionLabel, { marginTop: 16 }]}>
            Kategoria{!isUnknown && category ? ` · ${CATEGORIES.find(c => c.value === category)?.icon}` : ''}
          </Text>
          <View style={styles.categoryWrap}>
            {CATEGORIES.map((c) => (
              <Pressable
                key={c.value}
                style={[styles.chip, category === c.value && styles.chipActive]}
                onPress={() => setCategory(category === c.value ? '' : c.value)}
              >
                <Text style={styles.chipIcon}>{c.icon}</Text>
                <Text style={[styles.chipText, category === c.value && styles.chipTextActive]}>
                  {c.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Ilość */}
          <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Ilość</Text>
          <View style={styles.quantityRow}>
            <Pressable style={styles.qtyBtn} onPress={() => adjustQty(-1)}>
              <Text style={styles.qtyBtnText}>−</Text>
            </Pressable>
            <TextInput
              style={styles.qtyInput}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="decimal-pad"
            />
            <Pressable style={styles.qtyBtn} onPress={() => adjustQty(1)}>
              <Text style={styles.qtyBtnText}>+</Text>
            </Pressable>
          </View>

          {/* Jednostka */}
          <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Jednostka</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {UNITS.map((u) => (
              <Pressable
                key={u.value}
                style={[styles.chip, unit === u.value && styles.chipActive]}
                onPress={() => setUnit(u.value as Unit)}
              >
                <Text style={[styles.chipText, unit === u.value && styles.chipTextActive]}>
                  {u.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Lokalizacja */}
          {locations.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Lokalizacja</Text>
              <View style={styles.locationRow}>
                {locations.map((loc) => (
                  <Pressable
                    key={loc.id}
                    style={[styles.locBtn, selectedLocation === loc.id && styles.locBtnActive]}
                    onPress={() => setSelectedLocation(loc.id)}
                  >
                    <Text style={styles.locIcon}>{loc.icon}</Text>
                    <Text style={[styles.locText, selectedLocation === loc.id && styles.locTextActive]}>
                      {loc.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          {/* Data ważności */}
          <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Data ważności (opcjonalnie)</Text>
          <View style={styles.dateRow}>
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
            <ExpiryScannerButton onDateFound={(date) => setExpiryDate(date)} />
          </View>

          <Button
            title="Dodaj do spiżarni"
            onPress={handleAdd}
            loading={loading}
            size="lg"
            style={styles.addBtn}
          />
        </ScrollView>

      </View>

      <DatePickerModal
        visible={showDatePicker}
        value={expiryDate}
        minimumDate={new Date()}
        onConfirm={(date) => { setExpiryDate(date); setShowDatePicker(false); }}
        onCancel={() => setShowDatePicker(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '88%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },

  // Nagłówek
  productHeader: { marginBottom: 4 },
  productName: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  productCategory: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },

  unknownBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  unknownIcon: { fontSize: 28 },
  unknownTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  unknownSub: { fontSize: 13, color: Colors.textSecondary },

  // Inputs
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: Colors.background,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textPrimary,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginBottom: 4,
  },

  chipRow: { marginBottom: 4 },

  // Chips
  categoryWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.background,
    marginRight: 6,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  chipActive: { borderColor: Colors.primary, backgroundColor: '#E8F5E9' },
  chipIcon: { fontSize: 14 },
  chipText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  chipTextActive: { color: Colors.primary, fontWeight: '700' },

  // Ilość
  quantityRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: { color: '#fff', fontSize: 24, fontWeight: '700' },
  qtyInput: {
    flex: 1,
    height: 48,
    backgroundColor: Colors.background,
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },

  // Lokalizacja
  locationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  locBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  locBtnActive: { borderColor: Colors.primary, backgroundColor: '#E8F5E9' },
  locIcon: { fontSize: 18 },
  locText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  locTextActive: { color: Colors.primary, fontWeight: '700' },

  addBtn: { marginTop: 24, marginBottom: 8 },

  // Data
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateTrigger: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.background,
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

});
