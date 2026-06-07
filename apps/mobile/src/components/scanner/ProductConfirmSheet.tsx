import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
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

  if (!product) return null;

  const formatDate = (d: Date) =>
    d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });

  const adjustQty = (delta: number) => {
    setQuantity((prev) => {
      const next = Math.max(0.5, parseFloat(prev) + delta);
      return Number.isInteger(next) ? String(next) : next.toFixed(1);
    });
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

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.sheetWrap}
      >
        <View style={styles.sheet}>
          <View style={styles.handle} />

          {/* Nazwa — zawsze edytowalna, stała na górze */}
          <View style={styles.nameSection}>
            {isUnknown ? (
              <View style={styles.unknownBadge}>
                <Text style={styles.unknownBadgeText}>🔍 Nieznany produkt</Text>
              </View>
            ) : product.brand ? (
              <Text style={styles.brandLabel}>{product.brand}</Text>
            ) : null}
            <TextInput
              style={styles.nameInput}
              placeholder="Nazwa produktu *"
              placeholderTextColor={Colors.textMuted}
              value={name}
              onChangeText={setName}
              returnKeyType="done"
              autoCorrect={false}
            />
          </View>

          {/* Scrollowalny środek */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            style={styles.scroll}
          >
            <Text style={styles.sectionLabel}>Kategoria</Text>
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

            <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Ilość i jednostka</Text>
            <View style={styles.qtyUnitRow}>
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
              <View style={styles.separator} />
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

            <View style={{ height: 8 }} />
          </ScrollView>

          {/* Stały footer — data ważności + przycisk */}
          <View style={styles.footer}>
            <View style={styles.dateRow}>
              <Pressable style={styles.dateTrigger} onPress={() => setShowDatePicker(true)}>
                <Text style={styles.dateIcon}>📅</Text>
                <Text style={[styles.dateValue, !expiryDate && styles.datePlaceholder]}>
                  {expiryDate ? formatDate(expiryDate) : 'Data ważności (opcjonalnie)'}
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
            />
          </View>
        </View>
      </KeyboardAvoidingView>

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

  sheetWrap: {
    width: '100%',
    maxHeight: '88%',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '100%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },

  // Sekcja nazwy — stała na górze
  nameSection: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 8,
  },
  unknownBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF8E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  unknownBadgeText: { fontSize: 13, fontWeight: '600', color: '#F59E0B' },
  brandLabel: { fontSize: 13, color: Colors.textMuted, fontWeight: '500' },
  nameInput: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },

  // Scrollowalny środek
  scroll: { paddingHorizontal: 20, paddingTop: 16 },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },

  // Kategoria
  categoryWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  chipActive: { borderColor: Colors.primary, backgroundColor: '#E8F5E9' },
  chipIcon: { fontSize: 14 },
  chipText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  chipTextActive: { color: Colors.primary, fontWeight: '700' },

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
  qtyInput: {
    width: 64,
    height: 44,
    backgroundColor: Colors.background,
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  separator: { width: 1, height: 32, backgroundColor: Colors.border, marginHorizontal: 2 },
  unitScroll: { flex: 1 },
  unitChip: {
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.background,
    marginRight: 6,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  unitChipActive: { borderColor: Colors.primary, backgroundColor: '#E8F5E9' },
  unitChipText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  unitChipTextActive: { color: Colors.primary, fontWeight: '700' },

  // Lokalizacja
  locationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  locBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  locBtnActive: { borderColor: Colors.primary, backgroundColor: '#E8F5E9' },
  locIcon: { fontSize: 16 },
  locText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  locTextActive: { color: Colors.primary, fontWeight: '700' },

  // Stały footer
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 10,
    backgroundColor: Colors.surface,
  },
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
    paddingVertical: 11,
  },
  dateIcon: { fontSize: 16 },
  dateValue: { flex: 1, fontSize: 14, color: Colors.textPrimary, fontWeight: '500' },
  datePlaceholder: { color: Colors.textMuted, fontWeight: '400' },
  dateClear: { padding: 4 },
  dateClearText: { fontSize: 13, color: Colors.textMuted },
});
