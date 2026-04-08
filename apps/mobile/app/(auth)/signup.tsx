import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../../src/lib/firebase';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { Colors } from '../../src/constants/colors';

export default function SignupScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!email || !password || !name) {
      Alert.alert('Błąd', 'Wypełnij wszystkie pola');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Błąd', 'Hasło musi mieć co najmniej 6 znaków');
      return;
    }

    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(user, { displayName: name.trim() });
      // Konto w DB zostanie utworzone przez onAuthStateChanged w _layout.tsx
      router.replace('/onboarding');
    } catch (err: any) {
      Alert.alert(
        'Błąd rejestracji',
        err.code === 'auth/email-already-in-use'
          ? 'Ten email jest już zajęty'
          : 'Wystąpił błąd. Spróbuj ponownie.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
        <Text style={styles.title}>Utwórz konto</Text>
        <Text style={styles.subtitle}>Zacznij oszczędzać żywność 🥦</Text>

        <View style={styles.form}>
          <Input label="Imię" placeholder="Jak masz na imię?" value={name} onChangeText={setName} />
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
            placeholder="Min. 6 znaków"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <Button title="Utwórz konto" onPress={handleSignup} loading={loading} size="lg" />

        <Button
          title="Mam już konto — zaloguj się"
          onPress={() => router.replace('/(auth)/login')}
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
