import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { usePantry } from '../../../src/hooks/usePantry';
import { PantryItemCard } from '../../../src/components/pantry/PantryItemCard';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { PantryItem } from '../../../src/types/pantry.types';
import { Colors, Shadows } from '../../../src/constants/colors';

export default function PantryScreen() {
  const router = useRouter();
  const { items, loading, fetchItems, locations } = usePantry();
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
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Spiżarnia</Text>
          <Text style={styles.subtitle}>{items.length} produktów</Text>
        </View>
      </View>

      {/* Wyszukiwarka */}
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.search}
          placeholder="Szukaj produktu..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>✕</Text>
          </Pressable>
        )}
      </View>

      {/* Filtry lokalizacji */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={[{ id: null as null, name: 'Wszystkie', icon: '🏠' }, ...locations]}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.locationFilters}
        style={{ flexGrow: 0 }}
        renderItem={({ item: loc }) => {
          const isActive = loc.id === null ? selectedLocation === null : selectedLocation === loc.name;
          return (
            <Pressable
              style={[styles.locationBtn, isActive && styles.locationBtnActive]}
              onPress={() => setSelectedLocation(loc.id === null ? null : loc.name)}
            >
              <Text style={styles.locationIcon}>{loc.icon}</Text>
              <Text style={[styles.locationText, isActive && styles.locationTextActive]}>
                {loc.name}
              </Text>
            </Pressable>
          );
        }}
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
            title="Brak produktów"
            description={search ? 'Brak wyników dla podanej frazy' : 'Dodaj produkty skanując kod kreskowy lub ręcznie'}
            actionLabel={search ? undefined : 'Skanuj produkt'}
            onAction={search ? undefined : () => router.push('/(tabs)/pantry/scan')}
          />
        }
      />

      {/* FAB — dwa przyciski */}
      <View style={styles.fabContainer}>
        <Pressable
          style={[styles.fab, styles.fabSecondary]}
          onPress={() => router.push('/(tabs)/pantry/scan')}
        >
          <Text style={styles.fabIconSecondary}>📷</Text>
          <Text style={styles.fabLabelSecondary}>Skanuj</Text>
        </Pressable>
        <Pressable
          style={[styles.fab, styles.fabPrimary]}
          onPress={() => router.push('/(tabs)/pantry/add')}
        >
          <Text style={styles.fabIconPrimary}>＋</Text>
          <Text style={styles.fabLabelPrimary}>Dodaj</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 14,
  },
  title: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: 13, color: Colors.textMuted, marginTop: 1 },

  // Wyszukiwarka
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  search: {
    flex: 1,
    paddingVertical: 11,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  clearBtn: { padding: 4 },
  clearBtnText: { color: Colors.textMuted, fontSize: 14 },

  // Filtry
  locationFilters: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 6,
  },
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

  // Lista
  list: { paddingHorizontal: 16, paddingBottom: 100 },

  // FAB
  fabContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 28,
    ...Shadows.medium,
  },
  fabPrimary: { backgroundColor: Colors.primary },
  fabSecondary: { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.primary },
  fabIconPrimary: { fontSize: 20, color: '#fff' },
  fabLabelPrimary: { fontSize: 15, fontWeight: '700', color: '#fff' },
  fabIconSecondary: { fontSize: 18 },
  fabLabelSecondary: { fontSize: 15, fontWeight: '700', color: Colors.primary },
});
