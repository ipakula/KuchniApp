import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { usePantry } from '../../src/hooks/usePantry';
import { useMealPlan } from '../../src/hooks/useMealPlan';
import { useAuthStore } from '../../src/store/auth.store';
import { ExpiringWidget } from '../../src/components/dashboard/ExpiringWidget';
import { TodayMealsWidget } from '../../src/components/dashboard/TodayMealsWidget';
import { Colors } from '../../src/constants/colors';

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { items, stats, expiringItems, loading, fetchItems, fetchStats } = usePantry();
  const { todayEntries, fetchWeekPlan } = useMealPlan();

  const onRefresh = useCallback(async () => {
    await Promise.all([fetchItems(), fetchStats(), fetchWeekPlan()]);
  }, []);

  const firstName = user?.display_name?.split(' ')[0] || 'tam';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Dzień dobry, {firstName}! 👋</Text>
            <Text style={styles.date}>
              {new Date().toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
          </View>
          <Pressable onPress={() => router.push('/notifications')} style={styles.notifBtn}>
            <Text style={styles.notifIcon}>🔔</Text>
          </Pressable>
        </View>

        {/* Alerty wygasania */}
        {expiringItems.length > 0 && (
          <ExpiringWidget
            items={expiringItems}
            onViewAll={() => router.push('/(tabs)/pantry')}
            onGenerateRecipe={() => router.push('/(tabs)/planner')}
          />
        )}

        {/* Statystyki */}
        {stats && (
          <View style={styles.statsRow}>
            <Pressable style={styles.statCard} onPress={() => router.push('/(tabs)/pantry')}>
              <Text style={styles.statNumber}>{stats.total}</Text>
              <Text style={styles.statLabel}>Produktów</Text>
            </Pressable>
            <Pressable style={[styles.statCard, stats.expiring_soon > 0 && styles.statCardWarning]}>
              <Text style={styles.statNumber}>{stats.expiring_soon}</Text>
              <Text style={styles.statLabel}>Kończą się</Text>
            </Pressable>
            <Pressable style={[styles.statCard, stats.expired > 0 && styles.statCardDanger]}>
              <Text style={styles.statNumber}>{stats.expired}</Text>
              <Text style={styles.statLabel}>Przeterminowane</Text>
            </Pressable>
          </View>
        )}

        {/* Dziś na talerzu */}
        <TodayMealsWidget
          entries={todayEntries}
          onPress={() => router.push('/(tabs)/planner')}
        />

        {/* Szybki skan FAB */}
        <View style={styles.spacer} />
      </ScrollView>

      {/* FAB — skanuj */}
      <Pressable
        style={({ pressed }) => [styles.fab, pressed && { transform: [{ scale: 0.95 }] }]}
        onPress={() => router.push('/(tabs)/pantry/scan')}
      >
        <Text style={styles.fabIcon}>📷</Text>
        <Text style={styles.fabText}>Skanuj produkt</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1, padding: 16, gap: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  greeting: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  date: { fontSize: 13, color: Colors.textSecondary, marginTop: 2, textTransform: 'capitalize' },
  notifBtn: { padding: 8 },
  notifIcon: { fontSize: 22 },
  statsRow: { flexDirection: 'row', gap: 8, marginVertical: 16 },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  statCardWarning: { backgroundColor: '#FFF8E1' },
  statCardDanger: { backgroundColor: '#FFEBEE' },
  statNumber: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  statLabel: { fontSize: 11, color: Colors.textSecondary, textAlign: 'center' },
  spacer: { height: 80 },
  fab: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 50,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabIcon: { fontSize: 20 },
  fabText: { color: Colors.textInverse, fontSize: 15, fontWeight: '700' },
});
