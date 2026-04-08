import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../src/lib/firebase';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { Colors } from '../../src/constants/colors';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Błąd', 'Wypełnij wszystkie pola');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert(
        'Błąd logowania',
        err.code === 'auth/invalid-credential'
          ? 'Nieprawidłowy email lub hasło'
          : 'Wystąpił błąd. Spróbuj ponownie.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
        <Text style={styles.title}>Zaloguj się</Text>
        <Text style={styles.subtitle}>Witaj z powrotem 👋</Text>

        <View style={styles.form}>
          <Input
            label="Email"
            placeholder="twoj@email.pl"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Input
            label="Hasło"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <Button title="Zaloguj się" onPress={handleLogin} loading={loading} size="lg" />

        <Button
          title="Nie masz konta? Zarejestruj się"
          onPress={() => router.replace('/(auth)/signup')}
          variant="ghost"
          style={styles.switchBtn}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, padding: 24, justifyContent: 'center', gap: 16 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: 16, color: Colors.textSecondary },
  form: { gap: 12, marginVertical: 16 },
  switchBtn: { marginTop: 8 },
});
