import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getLocations } from '../../../src/api/auth.api';
import { apiClient } from '../../../src/api/client';
import { Colors, Shadows } from '../../../src/constants/colors';

const LOCATION_ICONS = ['🧊', '❄️', '🏠', '🚪', '🗄️', '🍷', '🥫', '🌡️'];

interface Location {
  id: string;
  name: string;
  icon: string;
  is_default: boolean;
}

export default function LocationsScreen() {
  const router = useRouter();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('🏠');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const data = await getLocations();
      setLocations(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const { data } = await apiClient.post('/auth/locations', {
        name: newName.trim(),
        icon: selectedIcon,
      });
      setLocations((prev) => [...prev, data.data]);
      setNewName('');
    } catch {
      Alert.alert('Błąd', 'Nie udało się dodać lokalizacji');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (loc: Location) => {
    if (loc.is_default) {
      Alert.alert('Uwaga', 'Nie można usunąć domyślnej lokalizacji');
      return;
    }
    Alert.alert('Usuń lokalizację', `Usunąć "${loc.name}"?`, [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Usuń', style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete(`/auth/locations/${loc.id}`);
            setLocations((prev) => prev.filter((l) => l.id !== loc.id));
          } catch {
            Alert.alert('Błąd', 'Nie udało się usunąć lokalizacji');
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
        <Text style={styles.title}>Lokalizacje spiżarni</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={Colors.primary} />
      ) : (
        <FlatList
          data={locations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.addBox}>
              <Text style={styles.addTitle}>Dodaj lokalizację</Text>
              {/* Wybór ikony */}
              <View style={styles.iconRow}>
                {LOCATION_ICONS.map((ic) => (
                  <Pressable
                    key={ic}
                    style={[styles.iconBtn, selectedIcon === ic && styles.iconBtnActive]}
                    onPress={() => setSelectedIcon(ic)}
                  >
                    <Text style={styles.iconBtnText}>{ic}</Text>
                  </Pressable>
                ))}
              </View>
              <View style={styles.addRow}>
                <TextInput
                  style={styles.addInput}
                  placeholder="Nazwa (np. Piwnica)"
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
                  {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.addBtnText}>＋</Text>}
                </Pressable>
              </View>
              <Text style={styles.sectionLabel}>Twoje lokalizacje</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.locCard}>
              <Text style={styles.locIcon}>{item.icon}</Text>
              <Text style={styles.locName}>{item.name}</Text>
              {item.is_default && <Text style={styles.defaultBadge}>domyślna</Text>}
              <Pressable onPress={() => handleDelete(item)} style={styles.deleteBtn}>
                <Text style={styles.deleteBtnText}>🗑</Text>
              </Pressable>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>Brak lokalizacji. Dodaj pierwszą powyżej.</Text>
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
  list: { padding: 16, paddingBottom: 40 },
  addBox: {
    backgroundColor: Colors.surface, borderRadius: 14, padding: 16,
    marginBottom: 20, ...Shadows.small,
  },
  addTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
  iconRow: { flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  iconBtn: {
    width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.background, borderWidth: 1.5, borderColor: 'transparent',
  },
  iconBtnActive: { borderColor: Colors.primary, backgroundColor: '#E8F5E9' },
  iconBtnText: { fontSize: 22 },
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
  locCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.surface, borderRadius: 12, padding: 14,
    marginBottom: 8, ...Shadows.small,
  },
  locIcon: { fontSize: 24 },
  locName: { flex: 1, fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  defaultBadge: {
    fontSize: 11, color: Colors.primary, fontWeight: '600',
    backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  deleteBtn: { padding: 6 },
  deleteBtnText: { fontSize: 18 },
  empty: { textAlign: 'center', color: Colors.textMuted, marginTop: 16 },
});
