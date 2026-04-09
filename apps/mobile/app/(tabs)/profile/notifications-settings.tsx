import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Shadows } from '../../../src/constants/colors';

interface Setting {
  key: string;
  label: string;
  description: string;
  icon: string;
}

const SETTINGS: Setting[] = [
  { key: 'expiring', label: 'Kończące się produkty', description: 'Przypomnienie 3 dni przed datą ważności', icon: '⏰' },
  { key: 'expired', label: 'Przeterminowane produkty', description: 'Alert gdy produkt straci ważność', icon: '⚠️' },
  { key: 'shopping', label: 'Lista zakupów', description: 'Propozycje uzupełnienia spiżarni', icon: '🛒' },
  { key: 'meal_plan', label: 'Plan posiłków', description: 'Przypomnienie o zaplanowanych posiłkach', icon: '🍽️' },
  { key: 'ai_tips', label: 'Porady AI', description: 'Tygodniowe wskazówki dotyczące spiżarni', icon: '✨' },
];

export default function NotificationsSettingsScreen() {
  const router = useRouter();
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    expiring: true,
    expired: true,
    shopping: false,
    meal_plan: true,
    ai_tips: false,
  });

  const toggle = (key: string) => {
    setEnabled((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    // TODO: zapisz ustawienia na backendzie
    Alert.alert('Zapisano', 'Ustawienia powiadomień zostały zaktualizowane');
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>‹</Text>
        </Pressable>
        <Text style={styles.title}>Powiadomienia</Text>
        <Pressable onPress={handleSave}>
          <Text style={styles.saveBtn}>Zapisz</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionDesc}>
          Wybierz, o czym chcesz być powiadamiany
        </Text>

        <View style={styles.card}>
          {SETTINGS.map((setting, i) => (
            <View key={setting.key}>
              {i > 0 && <View style={styles.divider} />}
              <View style={styles.row}>
                <Text style={styles.rowIcon}>{setting.icon}</Text>
                <View style={styles.rowText}>
                  <Text style={styles.rowLabel}>{setting.label}</Text>
                  <Text style={styles.rowDesc}>{setting.description}</Text>
                </View>
                <Switch
                  value={enabled[setting.key]}
                  onValueChange={() => toggle(setting.key)}
                  trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                  thumbColor={enabled[setting.key] ? Colors.primary : '#fff'}
                />
              </View>
            </View>
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
  sectionDesc: { fontSize: 14, color: Colors.textSecondary, marginBottom: 16 },
  card: { backgroundColor: Colors.surface, borderRadius: 14, ...Shadows.small },
  divider: { height: 1, backgroundColor: Colors.border, marginLeft: 56 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  rowIcon: { fontSize: 24, width: 32, textAlign: 'center' },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  rowDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
});
