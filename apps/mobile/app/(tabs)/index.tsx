import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { usePantry } from '../../src/hooks/usePantry';
import { useMealPlan } from '../../src/hooks/useMealPlan';
import { useAuthStore } from '../../src/store/auth.store';
import { ExpiringWidget } from '../../src/components/dashboard/ExpiringWidget';
import { TodayMealsWidget } from '../../src/components/dashboard/TodayMealsWidget';
import { Colors, Shadows } from '../../src/constants/colors';

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { stats, expiringItems, loading, fetchItems, fetchStats } = usePantry();
  const { todayEntries, fetchWeekPlan } = useMealPlan();

  const onRefresh = useCallback(async () => {
    await Promise.all([fetchItems(), fetchStats(), fetchWeekPlan()]);
  }, []);

  const firstName = user?.display_name?.split(' ')[0] || 'tam';
  const initials = user?.display_name
    ? user.display_name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
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
          <View style={styles.headerRight}>
            <Pressable onPress={() => router.push('/notifications')} style={styles.notifBtn}>
              <Text style={styles.notifIcon}>🔔</Text>
            </Pressable>
            <Pressable
              style={styles.avatar}
              onPress={() => router.push('/(tabs)/profile')}
            >
              <Text style={styles.avatarText}>{initials}</Text>
            </Pressable>
          </View>
        </View>

        {/* Statystyki */}
        {stats && (
          <View style={styles.statsRow}>
            <Pressable style={styles.statCard} onPress={() => router.push('/(tabs)/pantry')}>
              <Text style={styles.statNumber}>{stats.total}</Text>
              <Text style={styles.statLabel}>Produktów</Text>
            </Pressable>
            <Pressable style={[styles.statCard, stats.expiring_soon > 0 && styles.statCardWarning]}
              onPress={() => router.push('/(tabs)/pantry')}>
              <Text style={styles.statNumber}>{stats.expiring_soon}</Text>
              <Text style={styles.statLabel}>Kończą się</Text>
            </Pressable>
            <Pressable style={[styles.statCard, stats.expired > 0 && styles.statCardDanger]}
              onPress={() => router.push('/(tabs)/pantry')}>
              <Text style={styles.statNumber}>{stats.expired}</Text>
              <Text style={styles.statLabel}>Przeterminowane</Text>
            </Pressable>
          </View>
        )}

        {/* Alerty wygasania */}
        {expiringItems.length > 0 && (
          <ExpiringWidget
            items={expiringItems}
            onViewAll={() => router.push('/(tabs)/pantry')}
            onGenerateRecipe={() => router.push('/(tabs)/planner')}
          />
        )}

        {/* Dziś na talerzu */}
        <TodayMealsWidget
          entries={todayEntries}
          onPress={() => router.push('/(tabs)/planner')}
          onAddMeal={() => router.push('/(tabs)/planner/recipe-generator')}
        />

        {/* Szybkie akcje */}
        <Text style={styles.sectionTitle}>Szybkie akcje</Text>
        <View style={styles.actionsGrid}>
          <Pressable style={styles.actionCard} onPress={() => router.push('/(tabs)/pantry/scan')}>
            <Text style={styles.actionIcon}>📷</Text>
            <Text style={styles.actionLabel}>Skanuj produkt</Text>
          </Pressable>
          <Pressable style={styles.actionCard} onPress={() => router.push('/(tabs)/pantry/add')}>
            <Text style={styles.actionIcon}>➕</Text>
            <Text style={styles.actionLabel}>Dodaj ręcznie</Text>
          </Pressable>
          <Pressable style={styles.actionCard} onPress={() => router.push('/(tabs)/shopping')}>
            <Text style={styles.actionIcon}>🛒</Text>
            <Text style={styles.actionLabel}>Lista zakupów</Text>
          </Pressable>
          <Pressable style={styles.actionCard} onPress={() => router.push('/(tabs)/planner')}>
            <Text style={styles.actionIcon}>✨</Text>
            <Text style={styles.actionLabel}>Generuj przepis</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 16, paddingBottom: 32 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  greeting: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  date: { fontSize: 13, color: Colors.textSecondary, marginTop: 2, textTransform: 'capitalize' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  notifBtn: { padding: 4 },
  notifIcon: { fontSize: 22 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  // Stats
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 4,
    ...Shadows.small,
  },
  statCardWarning: { backgroundColor: '#FFF8E1' },
  statCardDanger: { backgroundColor: '#FFEBEE' },
  statNumber: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  statLabel: { fontSize: 11, color: Colors.textSecondary, textAlign: 'center' },

  // Quick actions
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 20,
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionCard: {
    width: '47.5%',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    ...Shadows.small,
  },
  actionIcon: { fontSize: 28 },
  actionLabel: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, textAlign: 'center' },
});
