import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type Request = {
  id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  requester_id: string;
  donation_id: string;
  donations: { food_name: string; quantity: number; unit: string };
  profiles: { name: string; phone?: string };
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendente',
  accepted: 'Aceita',
  rejected: 'Recusada',
};

const STATUS_COLOR: Record<string, string> = {
  pending: '#FFA500',
  accepted: '#3DDC97',
  rejected: '#FF4D4D',
};

export default function RequestsScreen({ navigation }: any) {
  const { user } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('requests')
      .select('*, donations(food_name, quantity, unit), profiles:requester_id(name, phone)')
      .eq('donations.donor_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setRequests(data as Request[]);
    setLoading(false);
    setRefreshing(false);
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  async function updateStatus(id: string, status: 'accepted' | 'rejected', request: Request) {
    const actionLabel = status === 'accepted' ? 'Aceitar' : 'Recusar';
    Alert.alert(
      `${actionLabel} solicitação`,
      `${actionLabel} pedido de ${request.profiles?.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: actionLabel,
          style: status === 'rejected' ? 'destructive' : 'default',
          onPress: async () => {
            const { error } = await supabase
              .from('requests')
              .update({ status })
              .eq('id', id);
            if (error) { Alert.alert('Erro', error.message); return; }

            if (status === 'accepted') {
              await supabase
                .from('donations')
                .update({ status: 'reserved' })
                .eq('id', request.donation_id);
            }

            await supabase.from('notifications').insert({
              user_id: request.requester_id,
              title: status === 'accepted' ? 'Solicitação aceita! 🎉' : 'Solicitação recusada',
              body: status === 'accepted'
                ? `Sua solicitação de "${request.donations?.food_name}" foi aceita. Entre em contato com o doador.`
                : `Sua solicitação de "${request.donations?.food_name}" não foi aceita desta vez.`,
              type: status,
              read: false,
            });

            setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
          },
        },
      ]
    );
  }

  function timeAgo(dateStr: string) {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'agora';
    if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
    return `${Math.floor(diff / 86400)}d atrás`;
  }

  const pending = requests.filter((r) => r.status === 'pending');
  const others = requests.filter((r) => r.status !== 'pending');

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.back}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={s.title}>Solicitações</Text>
        <View style={{ width: 60 }} />
      </View>

      {pending.length > 0 && (
        <View style={s.pendingBanner}>
          <Text style={s.pendingBannerText}>
            📬 {pending.length} solicitaç{pending.length > 1 ? 'ões' : 'ão'} aguardando resposta
          </Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator color="#3DDC97" size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={[...pending, ...others]}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetch(); }}
              tintColor="#3DDC97"
            />
          }
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyIcon}>📬</Text>
              <Text style={s.emptyText}>Nenhuma solicitação ainda</Text>
              <Text style={s.emptySub}>Publique doações para receber pedidos</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[s.card, item.status === 'pending' && s.cardPending]}>
              <View style={s.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={s.requesterName}>{item.profiles?.name ?? 'Usuário'}</Text>
                  {item.profiles?.phone && (
                    <Text style={s.phone}>📞 {item.profiles.phone}</Text>
                  )}
                </View>
                <View style={[s.badge, { backgroundColor: STATUS_COLOR[item.status] + '22' }]}>
                  <Text style={[s.badgeText, { color: STATUS_COLOR[item.status] }]}>
                    {STATUS_LABEL[item.status]}
                  </Text>
                </View>
              </View>

              <View style={s.donationInfo}>
                <Text style={s.donationName}>
                  🥦 {item.donations?.food_name ?? 'Doação'}
                </Text>
                <Text style={s.donationQty}>
                  {item.donations?.quantity} {item.donations?.unit}
                </Text>
              </View>

              <Text style={s.time}>{timeAgo(item.created_at)}</Text>

              {item.status === 'pending' && (
                <View style={s.actions}>
                  <TouchableOpacity
                    style={s.acceptBtn}
                    onPress={() => updateStatus(item.id, 'accepted', item)}
                  >
                    <Text style={s.acceptBtnText}>✅ Aceitar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={s.rejectBtn}
                    onPress={() => updateStatus(item.id, 'rejected', item)}
                  >
                    <Text style={s.rejectBtnText}>❌ Recusar</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F0F0F' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12,
  },
  back: { color: '#3DDC97', fontSize: 15 },
  title: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  pendingBanner: {
    backgroundColor: '#FFA50022', marginHorizontal: 16, borderRadius: 10,
    padding: 12, borderWidth: 1, borderColor: '#FFA50044', marginBottom: 4,
  },
  pendingBannerText: { color: '#FFA500', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  card: {
    backgroundColor: '#1E1E1E', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#2E2E2E',
  },
  cardPending: { borderColor: '#FFA50044' },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  requesterName: { fontSize: 16, fontWeight: '700', color: '#FFF', marginBottom: 2 },
  phone: { fontSize: 13, color: '#888' },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  donationInfo: {
    backgroundColor: '#252525', borderRadius: 8, padding: 10, marginBottom: 8,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  donationName: { color: '#CCC', fontSize: 14, fontWeight: '600', flex: 1 },
  donationQty: { color: '#3DDC97', fontSize: 13, fontWeight: '600' },
  time: { color: '#555', fontSize: 12, marginBottom: 10 },
  actions: { flexDirection: 'row', gap: 10 },
  acceptBtn: {
    flex: 1, backgroundColor: '#1a2e25', borderRadius: 8, padding: 12,
    alignItems: 'center', borderWidth: 1, borderColor: '#3DDC97',
  },
  acceptBtnText: { color: '#3DDC97', fontWeight: '700', fontSize: 14 },
  rejectBtn: {
    flex: 1, backgroundColor: '#2e1a1a', borderRadius: 8, padding: 12,
    alignItems: 'center', borderWidth: 1, borderColor: '#FF4D4D',
  },
  rejectBtnText: { color: '#FF4D4D', fontWeight: '700', fontSize: 14 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: '#555', fontSize: 15, marginBottom: 4 },
  emptySub: { color: '#444', fontSize: 13 },
});
