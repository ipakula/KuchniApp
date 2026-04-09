import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../src/lib/firebase';
import { useAuthStore } from '../src/store/auth.store';
import { useNotifications } from '../src/hooks/useNotifications';
import { registerUser, getMe } from '../src/api/auth.api';

SplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
  const { setUser, setLoading } = useAuthStore();
  useNotifications();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Rejestracja jest idempotentna (ON CONFLICT DO UPDATE) —
          // wywołujemy zawsze żeby mieć pewność że rekord istnieje w DB
          await registerUser(firebaseUser.email ?? '', firebaseUser.displayName ?? undefined);
          // Pobierz pełny profil z backendu
          const user = await getMe();
          setUser(user);
        } catch (err) {
          // Fallback — przynajmniej ustaw dane z Firebase żeby UI działało
          console.warn('[Auth] Błąd synchronizacji z backendem:', err);
          setUser({
            id: firebaseUser.uid,
            firebase_uid: firebaseUser.uid,
            email: firebaseUser.email ?? '',
            display_name: firebaseUser.displayName ?? undefined,
            household_size: 1,
            diet_preference: 'none',
            kitchen_equipment: [],
            created_at: '',
            updated_at: '',
          });
        }
      } else {
        setUser(null);
      }
      SplashScreen.hideAsync();
    });

    return unsubscribe;
  }, []);

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <RootLayoutContent />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
