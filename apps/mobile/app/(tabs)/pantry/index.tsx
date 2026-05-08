import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SectionList,
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

type ViewMode = 'list' | 'location' | 'category';

export default function PantryScreen() {
  const router = useRouter();
  const { items, loading, fetchItems, locations } = usePantry();
  const [search, setSearch] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const filtered = items.filter((item) => {
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase());
    const matchLocation = viewMode !== 'list' || !selectedLocation || item.location_name === selectedLocation;
    return matchSearch && matchLocation;
  });

  // Group by location
  const locationSections = useMemo(() => {
    const grouped: Record<string, PantryItem[]> = {};
    for (const item of filtered) {
      const key = item.location_name || 'Bez lokalizacji';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    }
    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b, 'pl'))
      .map(([title, data]) => ({ title, data }));
  }, [filtered]);

  // Group by category
  const categorySections = useMemo(() => {
    const grouped: Record<string, PantryItem[]> = {};
    for (const item of filtered) {
      const key = item.category || 'Inne';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    }
    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b, 'pl'))
      .map(([title, data]) => ({ title, data }));
  }, [filtered]);

  const handleItemPress = (item: PantryItem) => {
    router.push(`/(tabs)/pantry/${item.id}`);
  };

  const renderSectionHeader = ({ section }: { section: { title: string; data: PantryItem[] } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{section.title}</Text>
      <Text style={styles.sectionHeaderCount}>{section.data.length}</Text>
    </View>
  );

  const renderItem = ({ item }: { item: PantryItem }) => (
    <PantryItemCard item={item} onPress={handleItemPress} />
  );

  const emptyComponent = (
    <EmptyState
      icon="🥫"
      title="Brak produktów"
      description={search ? 'Brak wyników dla podanej frazy' : 'Dodaj produkty skanując kod kreskowy lub ręcznie'}
      actionLabel={search ? undefined : 'Skanuj produkt'}
      onAction={search ? undefined : () => router.push('/(tabs)/pantry/scan')}
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Spiżarnia</Text>
          <Text style={styles.subtitle}>{items.length} produktów</Text>
        </View>
        {/* View mode toggle */}
        <View style={styles.viewToggle}>
          <Pressable
            style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
            onPress={() => setViewMode('list')}
          >
            <Text style={[styles.toggleIcon, viewMode === 'list' && styles.toggleIconActive]}>≡</Text>
          </Pressable>
          <Pressable
            style={[styles.toggleBtn, viewMode === 'location' && styles.toggleBtnActive]}
            onPress={() => setViewMode('location')}
          >
            <Text style={[styles.toggleIcon, viewMode === 'location' && styles.toggleIconActive]}>📍</Text>
          </Pressable>
          <Pressable
            style={[styles.toggleBtn, viewMode === 'category' && styles.toggleBtnActive]}
            onPress={() => setViewMode('category')}
          >
            <Text style={[styles.toggleIcon, viewMode === 'category' && styles.toggleIconActive]}>🏷️</Text>
          </Pressable>
        </View>
      </View>

      {/* Search */}
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

      {/* Location filter chips — only in list mode */}
      {viewMode === 'list' && locations.length > 0 && (
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
      )}

      {/* Flat list view */}
      {viewMode === 'list' && (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          onRefresh={fetchItems}
          refreshing={loading}
          ListEmptyComponent={emptyComponent}
        />
      )}

      {/* Location grouped view */}
      {viewMode === 'location' && (
        <SectionList
          sections={locationSections}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={styles.list}
          onRefresh={fetchItems}
          refreshing={loading}
          ListEmptyComponent={emptyComponent}
          stickySectionHeadersEnabled={false}
        />
      )}

      {/* Category grouped view */}
      {viewMode === 'category' && (
        <SectionList
          sections={categorySections}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={styles.list}
          onRefresh={fetchItems}
          refreshing={loading}
          ListEmptyComponent={emptyComponent}
          stickySectionHeadersEnabled={false}
        />
      )}

      {/* FAB */}
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
  },
  title: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: 13, color: Colors.textMuted, marginTop: 1 },

  viewToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBtnActive: { backgroundColor: Colors.primary },
  toggleIcon: { fontSize: 16, color: Colors.textSecondary },
  toggleIconActive: { color: '#fff' },

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
  search: { flex: 1, paddingVertical: 11, fontSize: 15, color: Colors.textPrimary },
  clearBtn: { padding: 4 },
  clearBtnText: { color: Colors.textMuted, fontSize: 14 },

  locationFilters: { paddingHorizontal: 16, paddingBottom: 10, gap: 6 },
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

  list: { paddingHorizontal: 16, paddingBottom: 100 },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    paddingTop: 18,
    paddingBottom: 6,
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionHeaderCount: { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },

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
