import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { apiClient } from '../src/api/client';
import { Notification } from '../src/types/user.types';
import { Colors } from '../src/constants/colors';
import { Button } from '../src/components/ui/Button';
import { EmptyState } from '../src/components/ui/EmptyState';

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const { data } = await apiClient.get('/notifications');
      setNotifications(data.data);
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    await apiClient.post('/notifications/read-all');
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const getIcon = (type: string) => {
    const icons: Record<string, string> = {
      expiring_soon: '⚠️',
      expired: '🗑️',
      weekly_check: '📋',
      missing_basic: '🛒',
    };
    return icons[type] || '🔔';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Wróć</Text>
        </Pressable>
        <Text style={styles.title}>Powiadomienia</Text>
        <Pressable onPress={markAllRead}>
          <Text style={styles.markAllText}>Przeczytaj</Text>
        </Pressable>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.notifCard, !item.is_read && styles.notifCardUnread]}>
            <Text style={styles.notifIcon}>{getIcon(item.type)}</Text>
            <View style={styles.notifContent}>
              <Text style={styles.notifTitle}>{item.title}</Text>
              {item.body && <Text style={styles.notifBody}>{item.body}</Text>}
              <Text style={styles.notifTime}>
                {new Date(item.sent_at).toLocaleDateString('pl-PL')}
              </Text>
            </View>
            {!item.is_read && <View style={styles.unreadDot} />}
          </View>
        )}
        contentContainerStyle={styles.list}
        onRefresh={loadNotifications}
        refreshing={loading}
        ListEmptyComponent={
          <EmptyState icon="🔔" title="Brak powiadomień" description="Tutaj pojawią się alerty o produktach" />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {},
  backText: { fontSize: 15, color: Colors.primary, fontWeight: '500' },
  title: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  markAllText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  notifCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    gap: 12,
    alignItems: 'flex-start',
  },
  notifCardUnread: { backgroundColor: '#F0F7FF', borderLeftWidth: 3, borderLeftColor: Colors.primary },
  notifIcon: { fontSize: 24 },
  notifContent: { flex: 1, gap: 4 },
  notifTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  notifBody: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  notifTime: { fontSize: 11, color: Colors.textMuted },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, marginTop: 4 },
});
