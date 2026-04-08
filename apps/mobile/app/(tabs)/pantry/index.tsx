import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { usePantry } from '../../../src/hooks/usePantry';
import { PantryItemCard } from '../../../src/components/pantry/PantryItemCard';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { PantryItem } from '../../../src/types/pantry.types';
import { Colors } from '../../../src/constants/colors';

export default function PantryScreen() {
  const router = useRouter();
  const { items, loading, fetchItems, locations, expiringItems } = usePantry();
  const [search, setSearch] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  const filtered = items.filter((item) => {
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase());
    const matchLocation = !selectedLocation || item.location_name === selectedLocation;
    return matchSearch && matchLocation;
  });

  const handleItemPress = (item: PantryItem) => {
    router.push(`/(tabs)/pantry/${item.id}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Spiżarnia</Text>
        <View style={styles.headerActions}>
          <Pressable style={styles.addBtn} onPress={() => router.push('/(tabs)/pantry/scan')}>
            <Text style={styles.addBtnText}>📷</Text>
          </Pressable>
          <Pressable style={styles.addBtn} onPress={() => router.push('/(tabs)/pantry/add')}>
            <Text style={styles.addBtnText}>＋</Text>
          </Pressable>
        </View>
      </View>

      {/* Szukaj */}
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          placeholder="🔍 Szukaj produktu..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filtry lokalizacji */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={[{ id: null, name: 'Wszystkie', icon: '🏠' }, ...locations]}
        keyExtractor={(_, i) => String(i)}
        style={styles.locationFilters}
        renderItem={({ item: loc }) => (
          <Pressable
            style={[
              styles.locationBtn,
              selectedLocation === loc.name && styles.locationBtnActive,
              loc.id === null && selectedLocation === null && styles.locationBtnActive,
            ]}
            onPress={() => setSelectedLocation(loc.id === null ? null : loc.name)}
          >
            <Text style={styles.locationIcon}>{loc.icon}</Text>
            <Text style={[
              styles.locationText,
              (selectedLocation === loc.name || (loc.id === null && !selectedLocation)) && styles.locationTextActive,
            ]}>
              {loc.name}
            </Text>
          </Pressable>
        )}
      />

      {/* Lista produktów */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PantryItemCard item={item} onPress={handleItemPress} />
        )}
        contentContainerStyle={styles.list}
        onRefresh={fetchItems}
        refreshing={loading}
        ListEmptyComponent={
          <EmptyState
            icon="🥫"
            title="Pusta spiżarnia"
            description="Dodaj produkty skanując kod kreskowy lub ręcznie"
            actionLabel="Skanuj produkt"
            onAction={() => router.push('/(tabs)/pantry/scan')}
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
  headerActions: { flexDirection: 'row', gap: 8 },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  searchWrap: { paddingHorizontal: 16, marginBottom: 8 },
  search: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  locationFilters: { paddingLeft: 16, marginBottom: 8, flexGrow: 0 },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    marginRight: 6,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  locationBtnActive: { borderColor: Colors.primary, backgroundColor: '#E8F5E9' },
  locationIcon: { fontSize: 14 },
  locationText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  locationTextActive: { color: Colors.primary, fontWeight: '700' },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
});
