import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { auth } from '../../../src/lib/firebase';
import { useAuthStore } from '../../../src/store/auth.store';
import { Colors } from '../../../src/constants/colors';
import { DIET_PREFERENCES } from '../../../src/constants/dietPreferences';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const dietLabel = DIET_PREFERENCES.find((d) => d.value === user?.diet_preference)?.label || 'Bez ograniczeń';

  const handleLogout = () => {
    Alert.alert('Wyloguj się', 'Czy na pewno chcesz się wylogować?', [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Wyloguj',
        style: 'destructive',
        onPress: async () => {
          await signOut(auth);
          logout();
          router.replace('/(auth)/landing');
        },
      },
    ]);
  };

  const MenuItem = ({ icon, label, onPress, danger }: { icon: string; label: string; onPress: () => void; danger?: boolean }) => (
    <Pressable style={styles.menuItem} onPress={onPress}>
      <Text style={styles.menuIcon}>{icon}</Text>
      <Text style={[styles.menuLabel, danger && { color: Colors.error }]}>{label}</Text>
      <Text style={styles.menuArrow}>›</Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* User info */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.display_name?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.display_name || 'Użytkownik'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user?.household_size || 2}</Text>
            <Text style={styles.statLabel}>Osoby w domu</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{dietLabel}</Text>
            <Text style={styles.statLabel}>Dieta</Text>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionLabel}>Ustawienia</Text>
          <MenuItem icon="📍" label="Lokalizacje spiżarni" onPress={() => {}} />
          <MenuItem icon="🛒" label="Bazowe produkty" onPress={() => {}} />
          <MenuItem icon="🔔" label="Powiadomienia" onPress={() => {}} />
          <MenuItem icon="👨‍👩‍👧‍👦" label="Profil domowników" onPress={() => {}} />
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.menuSectionLabel}>Konto</Text>
          <MenuItem icon="🚪" label="Wyloguj się" onPress={handleLogout} danger />
        </View>

        <Text style={styles.version}>KuchniApp v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  userCard: { alignItems: 'center', padding: 24, gap: 8, backgroundColor: Colors.surface },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 28, fontWeight: '700', color: '#fff' },
  userName: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  userEmail: { fontSize: 14, color: Colors.textSecondary },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingVertical: 16,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  statLabel: { fontSize: 12, color: Colors.textSecondary },
  divider: { width: 1, backgroundColor: Colors.border },
  menuSection: { marginTop: 24, paddingHorizontal: 16 },
  menuSectionLabel: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 6,
    gap: 12,
  },
  menuIcon: { fontSize: 20, width: 28 },
  menuLabel: { flex: 1, fontSize: 15, color: Colors.textPrimary, fontWeight: '500' },
  menuArrow: { fontSize: 20, color: Colors.textMuted },
  version: { textAlign: 'center', color: Colors.textMuted, fontSize: 12, marginTop: 24, marginBottom: 32 },
});
