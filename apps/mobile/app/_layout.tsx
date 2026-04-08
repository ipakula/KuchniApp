import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { auth } from '../src/lib/firebase';
import { useAuthStore } from '../src/store/auth.store';
import { getMe, registerUser } from '../src/api/auth.api';
import { useNotifications } from '../src/hooks/useNotifications';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { setUser, setLoading } = useAuthStore();
  useNotifications();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const user = await getMe();
          setUser(user);
        } catch {
          // Użytkownik zalogowany przez Firebase ale bez konta w DB — zarejestruj
          try {
            const user = await registerUser(
              firebaseUser.email!,
              firebaseUser.displayName || undefined
            );
            setUser(user);
          } catch {
            setUser(null);
          }
        }
      } else {
        setUser(null);
      }
      SplashScreen.hideAsync();
    });

    return unsubscribe;
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppContent />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
