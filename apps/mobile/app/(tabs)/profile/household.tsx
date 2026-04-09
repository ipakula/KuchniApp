import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { updateMe } from '../../../src/api/auth.api';
import { useAuthStore } from '../../../src/store/auth.store';
import { Colors, Shadows } from '../../../src/constants/colors';
import { DIET_PREFERENCES } from '../../../src/constants/dietPreferences';

const HOUSEHOLD_SIZES = [1, 2, 3, 4, 5, 6, 7, 8];

export default function HouseholdScreen() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [size, setSize] = useState(user?.household_size ?? 2);
  const [diet, setDiet] = useState(user?.diet_preference ?? 'none');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateMe({ household_size: size, diet_preference: diet as any });
      setUser({ ...user!, ...updated });
      Alert.alert('Zapisano', 'Profil domowników zaktualizowany');
      router.back();
    } catch {
      Alert.alert('Błąd', 'Nie udało się zapisać zmian');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>‹</Text>
        </Pressable>
        <Text style={styles.title}>Profil domowników</Text>
        <Pressable onPress={handleSave} disabled={saving}>
          {saving
            ? <ActivityIndicator color={Colors.primary} />
            : <Text style={styles.saveBtn}>Zapisz</Text>}
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* Liczba osób */}
        <Text style={styles.sectionTitle}>Liczba osób w domu</Text>
        <Text style={styles.sectionDesc}>Używamy tej informacji do dopasowania porcji w przepisach</Text>
        <View style={styles.sizeGrid}>
          {HOUSEHOLD_SIZES.map((n) => (
            <Pressable
              key={n}
              style={[styles.sizeBtn, size === n && styles.sizeBtnActive]}
              onPress={() => setSize(n)}
            >
              <Text style={[styles.sizeBtnNumber, size === n && styles.sizeBtnNumberActive]}>
                {n}
              </Text>
              <Text style={[styles.sizeBtnLabel, size === n && styles.sizeBtnLabelActive]}>
                {n === 1 ? 'osoba' : n < 5 ? 'osoby' : 'osób'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Preferencje dietetyczne */}
        <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Preferencje dietetyczne</Text>
        <Text style={styles.sectionDesc}>Wpływa na generowanie przepisów AI</Text>
        <View style={styles.dietList}>
          {DIET_PREFERENCES.map((d) => (
            <Pressable
              key={d.value}
              style={[styles.dietBtn, diet === d.value && styles.dietBtnActive]}
              onPress={() => setDiet(d.value)}
            >
              <Text style={styles.dietIcon}>{d.icon}</Text>
              <View style={styles.dietText}>
                <Text style={[styles.dietLabel, diet === d.value && styles.dietLabelActive]}>
                  {d.label}
                </Text>
                {d.description && (
                  <Text style={styles.dietDesc}>{d.description}</Text>
                )}
              </View>
              {diet === d.value && <Text style={styles.dietCheck}>✓</Text>}
            </Pressable>
          ))}
        </View>
      </ScrollView>
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
  saveBtn: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  content: { padding: 16, paddingBottom: 40 },

  sectionTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  sectionDesc: { fontSize: 13, color: Colors.textSecondary, marginBottom: 14 },

  sizeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  sizeBtn: {
    width: '22%', aspectRatio: 1, borderRadius: 14,
    backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Colors.border, ...Shadows.small,
  },
  sizeBtnActive: { borderColor: Colors.primary, backgroundColor: '#E8F5E9' },
  sizeBtnNumber: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  sizeBtnNumberActive: { color: Colors.primary },
  sizeBtnLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  sizeBtnLabelActive: { color: Colors.primary },

  dietList: { gap: 8 },
  dietBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.surface, borderRadius: 12, padding: 14,
    borderWidth: 1.5, borderColor: 'transparent', ...Shadows.small,
  },
  dietBtnActive: { borderColor: Colors.primary, backgroundColor: '#E8F5E9' },
  dietIcon: { fontSize: 24, width: 32, textAlign: 'center' },
  dietText: { flex: 1 },
  dietLabel: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  dietLabelActive: { color: Colors.primary },
  dietDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  dietCheck: { fontSize: 18, color: Colors.primary, fontWeight: '700' },
});
