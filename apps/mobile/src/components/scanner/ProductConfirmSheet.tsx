import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Colors } from '../../constants/colors';
import { AddPantryItemDTO, Unit } from '../../types/pantry.types';
import { UNITS } from '../../constants/units';

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
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState<Unit>('szt');
  const [selectedLocation, setSelectedLocation] = useState(locations[0]?.id || '');
  const [expiryDate, setExpiryDate] = useState('');
  const [loading, setLoading] = useState(false);

  if (!product) return null;

  const handleAdd = async () => {
    setLoading(true);
    try {
      await onAdd({
        product_id: product.id,
        name: product.name || 'Produkt',
        brand: product.brand,
        barcode: product.barcode,
        category: product.category,
        quantity: parseFloat(quantity) || 1,
        unit,
        location_id: selectedLocation || undefined,
        expiration_date: expiryDate || undefined,
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

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Produkt */}
          <View style={styles.productHeader}>
            <Text style={styles.productName}>{product.name || 'Nieznany produkt'}</Text>
            {product.brand && <Text style={styles.productBrand}>{product.brand}</Text>}
            {product.category && <Text style={styles.productCategory}>{product.category}</Text>}
          </View>

          {/* Ilość */}
          <View style={styles.quantityRow}>
            <Pressable
              style={styles.qtyBtn}
              onPress={() => setQuantity(String(Math.max(1, parseFloat(quantity) - 1)))}
            >
              <Text style={styles.qtyBtnText}>−</Text>
            </Pressable>
            <Input
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="decimal-pad"
              style={styles.qtyInput}
              containerStyle={styles.qtyContainer}
            />
            <Pressable
              style={styles.qtyBtn}
              onPress={() => setQuantity(String(parseFloat(quantity) + 1))}
            >
              <Text style={styles.qtyBtnText}>+</Text>
            </Pressable>
          </View>

          {/* Jednostka */}
          <Text style={styles.sectionLabel}>Jednostka</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.unitRow}>
            {UNITS.slice(0, 6).map((u) => (
              <Pressable
                key={u.value}
                style={[styles.unitBtn, unit === u.value && styles.unitBtnActive]}
                onPress={() => setUnit(u.value as Unit)}
              >
                <Text style={[styles.unitText, unit === u.value && styles.unitTextActive]}>
                  {u.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Lokalizacja */}
          <Text style={styles.sectionLabel}>Lokalizacja</Text>
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

          {/* Data ważności */}
          <Input
            label="Data ważności (opcjonalnie)"
            placeholder="RRRR-MM-DD"
            value={expiryDate}
            onChangeText={setExpiryDate}
            containerStyle={styles.dateInput}
          />

          <Button
            title="Dodaj do spiżarni"
            onPress={handleAdd}
            loading={loading}
            size="lg"
            style={styles.addBtn}
          />
        </ScrollView>
      </View>
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
    maxHeight: '80%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  productHeader: { marginBottom: 20, gap: 4 },
  productName: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  productBrand: { fontSize: 14, color: Colors.textSecondary },
  productCategory: { fontSize: 12, color: Colors.textMuted },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  qtyBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: { color: '#fff', fontSize: 22, fontWeight: '700' },
  qtyContainer: { flex: 1 },
  qtyInput: { textAlign: 'center', fontSize: 18, fontWeight: '600' },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8 },
  unitRow: { marginBottom: 16 },
  unitBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.background,
    marginRight: 6,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  unitBtnActive: { borderColor: Colors.primary, backgroundColor: '#E8F5E9' },
  unitText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  unitTextActive: { color: Colors.primary },
  locationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  locBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  locBtnActive: { borderColor: Colors.primary, backgroundColor: '#E8F5E9' },
  locIcon: { fontSize: 16 },
  locText: { fontSize: 13, color: Colors.textSecondary },
  locTextActive: { color: Colors.primary, fontWeight: '600' },
  dateInput: { marginBottom: 20 },
  addBtn: { marginBottom: 16 },
});
