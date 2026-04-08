import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button } from '../src/components/ui/Button';
import { Colors } from '../src/constants/colors';
import { DIET_PREFERENCES, KITCHEN_EQUIPMENT } from '../src/constants/dietPreferences';
import { useAuthStore } from '../src/store/auth.store';
import { updateMe } from '../src/api/auth.api';

const STEPS = 3;

export default function OnboardingScreen() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [step, setStep] = useState(1);
  const [householdSize, setHouseholdSize] = useState(2);
  const [diet, setDiet] = useState('none');
  const [equipment, setEquipment] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleEquipment = (val: string) => {
    setEquipment((prev) =>
      prev.includes(val) ? prev.filter((e) => e !== val) : [...prev, val]
    );
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      const updated = await updateMe({
        household_size: householdSize,
        diet_preference: diet as any,
        kitchen_equipment: equipment,
      });
      setUser(updated);
      router.replace('/(tabs)');
    } catch {
      router.replace('/(tabs)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progress}>
        {Array.from({ length: STEPS }, (_, i) => (
          <View
            key={i}
            style={[styles.progressDot, i < step && styles.progressDotActive]}
          />
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {step === 1 && (
          <View style={styles.step}>
            <Text style={styles.stepEmoji}>🏠</Text>
            <Text style={styles.stepTitle}>Ile osób w Twoim domu?</Text>
            <Text style={styles.stepSubtitle}>
              Pomożemy dopasować porcje w przepisach
            </Text>
            <View style={styles.sizeRow}>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <Pressable
                  key={n}
                  style={[styles.sizeBtn, householdSize === n && styles.sizeBtnActive]}
                  onPress={() => setHouseholdSize(n)}
                >
                  <Text style={[styles.sizeBtnText, householdSize === n && styles.sizeBtnTextActive]}>
                    {n}
                  </Text>
                  <Text style={styles.sizeBtnLabel}>
                    {n === 1 ? 'osoba' : n < 5 ? 'osoby' : 'osób'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.step}>
            <Text style={styles.stepEmoji}>🥗</Text>
            <Text style={styles.stepTitle}>Preferencje żywieniowe</Text>
            <Text style={styles.stepSubtitle}>
              AI dobierze przepisy do Twoich potrzeb
            </Text>
            <View style={styles.optionList}>
              {DIET_PREFERENCES.map((d) => (
                <Pressable
                  key={d.value}
                  style={[styles.optionBtn, diet === d.value && styles.optionBtnActive]}
                  onPress={() => setDiet(d.value)}
                >
                  <Text style={[styles.optionText, diet === d.value && styles.optionTextActive]}>
                    {d.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.step}>
            <Text style={styles.stepEmoji}>👨‍🍳</Text>
            <Text style={styles.stepTitle}>Sprzęt kuchenny</Text>
            <Text style={styles.stepSubtitle}>
              Zaznacz co masz w kuchni (opcjonalnie)
            </Text>
            <View style={styles.equipmentGrid}>
              {KITCHEN_EQUIPMENT.map((eq) => (
                <Pressable
                  key={eq.value}
                  style={[
                    styles.equipBtn,
                    equipment.includes(eq.value) && styles.equipBtnActive,
                  ]}
                  onPress={() => toggleEquipment(eq.value)}
                >
                  <Text style={[styles.equipText, equipment.includes(eq.value) && styles.equipTextActive]}>
                    {eq.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {step < STEPS ? (
          <Button
            title="Dalej →"
            onPress={() => setStep((s) => s + 1)}
            size="lg"
            style={styles.nextBtn}
          />
        ) : (
          <Button
            title="Gotowe! Zacznij 🚀"
            onPress={handleFinish}
            loading={loading}
            size="lg"
            style={styles.nextBtn}
          />
        )}
        {step > 1 && (
          <Button title="Wróć" onPress={() => setStep((s) => s - 1)} variant="ghost" />
        )}
        <Button
          title="Pomiń"
          onPress={() => router.replace('/(tabs)')}
          variant="ghost"
          size="sm"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  progress: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingTop: 16 },
  progressDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.border },
  progressDotActive: { backgroundColor: Colors.primary, width: 24 },
  content: { flex: 1, padding: 24 },
  step: { gap: 16 },
  stepEmoji: { fontSize: 52, textAlign: 'center', marginTop: 16 },
  stepTitle: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
  stepSubtitle: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center' },
  sizeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: 8 },
  sizeBtn: {
    width: 90,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  sizeBtnActive: { borderColor: Colors.primary, backgroundColor: '#E8F5E9' },
  sizeBtnText: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary },
  sizeBtnTextActive: { color: Colors.primary },
  sizeBtnLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  optionList: { gap: 8 },
  optionBtn: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  optionBtnActive: { borderColor: Colors.primary, backgroundColor: '#E8F5E9' },
  optionText: { fontSize: 15, fontWeight: '500', color: Colors.textPrimary },
  optionTextActive: { color: Colors.primary, fontWeight: '700' },
  equipmentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  equipBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  equipBtnActive: { borderColor: Colors.primary, backgroundColor: '#E8F5E9' },
  equipText: { fontSize: 14, color: Colors.textPrimary },
  equipTextActive: { color: Colors.primary, fontWeight: '600' },
  footer: { padding: 24, gap: 8 },
  nextBtn: { width: '100%' },
});
