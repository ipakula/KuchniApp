import React from 'react';
import { View, Text, StyleSheet, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button } from '../../src/components/ui/Button';
import { Colors } from '../../src/constants/colors';

export default function LandingScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.emoji}>🍽️</Text>
        <Text style={styles.title}>KuchniApp</Text>
        <Text style={styles.subtitle}>
          Twoja inteligentna spiżarnia.{'\n'}Mniej marnowania, więcej gotowania.
        </Text>
      </View>

      <View style={styles.features}>
        {[
          { icon: '📷', text: 'Skanuj produkty w sekundę' },
          { icon: '✨', text: 'Przepisy AI z tego co masz' },
          { icon: '🛒', text: 'Lista zakupów automatycznie' },
          { icon: '🔔', text: 'Alerty o terminach ważności' },
        ].map((f, i) => (
          <View key={i} style={styles.feature}>
            <Text style={styles.featureIcon}>{f.icon}</Text>
            <Text style={styles.featureText}>{f.text}</Text>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <Button
          title="Zacznij za darmo"
          onPress={() => router.push('/(auth)/signup')}
          size="lg"
          style={styles.primaryBtn}
        />
        <Button
          title="Mam już konto — zaloguj"
          onPress={() => router.push('/(auth)/login')}
          variant="ghost"
          size="lg"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: 32,
  },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emoji: { fontSize: 72 },
  title: { fontSize: 36, fontWeight: '900', color: Colors.primary, letterSpacing: -1 },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  features: { gap: 14, marginBottom: 32 },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureIcon: { fontSize: 24, width: 36, textAlign: 'center' },
  featureText: { fontSize: 15, color: Colors.textPrimary, fontWeight: '500' },
  actions: { gap: 12 },
  primaryBtn: { width: '100%' },
});
