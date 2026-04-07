import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type Notification = {
  id: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
  type: 'request' | 'accepted' | 'rejected' | 'available' | 'general';
};

const TYPE_ICON: Record<string, string> = {
  request: '📬',
  accepted: '✅',
  rejected: '❌',
  available: '🥦',
  general: '🔔',
};

export default function NotificationsScreen() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setNotifications(data as Notification[]);
    setRefreshing(false);
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  async function markAllRead() {
    if (!user) return;
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  async function markRead(id: string) {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }

  function timeAgo(dateStr: string) {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'agora';
    if (diff < 3600) return `${Math.floor(diff / 60)}min`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  }

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <View>
          <Text style={s.title}>Notificações</Text>
          {unread > 0 && (
            <Text style={s.unreadCount}>{unread} não lidas</Text>
          )}
        </View>
        {unread > 0 && (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={s.markAll}>Marcar todas</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetch(); }}
            tintColor="#3DDC97"
          />
        }
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyIcon}>🔔</Text>
            <Text style={s.emptyText}>Nenhuma notificação ainda</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[s.card, !item.read && s.cardUnread]}
            onPress={() => markRead(item.id)}
            activeOpacity={0.8}
          >
            <View style={s.iconWrapper}>
              <Text style={s.icon}>{TYPE_ICON[item.type] ?? '🔔'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={s.row}>
                <Text style={s.notifTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={s.time}>{timeAgo(item.created_at)}</Text>
              </View>
              <Text style={s.body} numberOfLines={2}>{item.body}</Text>
            </View>
            {!item.read && <View style={s.dot} />}
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F0F0F' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16,
  },
  title: { fontSize: 22, fontWeight: '700', color: '#FFF' },
  unreadCount: { fontSize: 13, color: '#3DDC97', marginTop: 2 },
  markAll: { color: '#3DDC97', fontSize: 14, fontWeight: '600', paddingTop: 4 },
  card: {
    backgroundColor: '#1E1E1E', borderRadius: 12, padding: 14,
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    borderWidth: 1, borderColor: '#2E2E2E',
  },
  cardUnread: { borderColor: '#3DDC9733', backgroundColor: '#1a2e25' },
  iconWrapper: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#252525',
    justifyContent: 'center', alignItems: 'center',
  },
  icon: { fontSize: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  notifTitle: { fontSize: 14, fontWeight: '700', color: '#FFF', flex: 1 },
  time: { fontSize: 12, color: '#555' },
  body: { fontSize: 13, color: '#AAA', lineHeight: 18 },
  dot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#3DDC97',
    marginTop: 4, marginLeft: 4,
  },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: '#555', fontSize: 15 },
});
