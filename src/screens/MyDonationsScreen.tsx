import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type Donation = {
  id: string;
  food_name: string;
  quantity: number;
  unit: string;
  expiry_date: string;
  pickup_address: string;
  status: 'available' | 'reserved' | 'completed';
  created_at: string;
  request_count?: number;
};

const STATUS_LABEL: Record<string, string> = {
  available: 'Disponível',
  reserved: 'Reservado',
  completed: 'Concluído',
};

const STATUS_COLOR: Record<string, string> = {
  available: '#3DDC97',
  reserved: '#FFA500',
  completed: '#888',
};

const FILTERS = ['Todas', 'available', 'reserved', 'completed'] as const;
const FILTER_LABEL: Record<string, string> = {
  Todas: 'Todas', available: 'Disponíveis', reserved: 'Reservadas', completed: 'Concluídas',
};

export default function MyDonationsScreen({ navigation }: any) {
  const { user } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [filter, setFilter] = useState<typeof FILTERS[number]>('Todas');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('donations')
      .select('*')
      .eq('donor_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setDonations(data as Donation[]);
    setLoading(false);
    setRefreshing(false);
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  async function handleDelete(id: string) {
    Alert.alert('Excluir doação', 'Tem certeza? Esta ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive', onPress: async () => {
          await supabase.from('donations').delete().eq('id', id);
          setDonations((prev) => prev.filter((d) => d.id !== id));
        },
      },
    ]);
  }

  async function handleComplete(id: string) {
    const { error } = await supabase
      .from('donations')
      .update({ status: 'completed' })
      .eq('id', id);
    if (!error) setDonations((prev) => prev.map((d) => d.id === id ? { ...d, status: 'completed' } : d));
  }

  const filtered = filter === 'Todas' ? donations : donations.filter((d) => d.status === filter);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.back}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={s.title}>Minhas Doações</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => navigation.navigate('NewDonation')}>
          <Text style={s.addBtnText}>+ Nova</Text>
        </TouchableOpacity>
      </View>

      <View style={s.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[s.filterChip, filter === f && s.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[s.filterChipText, filter === f && s.filterChipTextActive]}>
              {FILTER_LABEL[f]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color="#3DDC97" size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
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
              <Text style={s.emptyIcon}>📦</Text>
              <Text style={s.emptyText}>Nenhuma doação nesta categoria</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={s.card}
              onPress={() => navigation.navigate('DonationDetail', { donation: item })}
              activeOpacity={0.8}
            >
              <View style={s.cardTop}>
                <Text style={s.foodName} numberOfLines={1}>{item.food_name}</Text>
                <View style={[s.badge, { backgroundColor: STATUS_COLOR[item.status] + '22' }]}>
                  <Text style={[s.badgeText, { color: STATUS_COLOR[item.status] }]}>
                    {STATUS_LABEL[item.status]}
                  </Text>
                </View>
              </View>
              <Text style={s.qty}>{item.quantity} {item.unit}</Text>
              <Text style={s.addr} numberOfLines={1}>📍 {item.pickup_address}</Text>
              <Text style={s.expiry}>
                Validade: {new Date(item.expiry_date).toLocaleDateString('pt-BR')}
              </Text>

              {item.status !== 'completed' && (
                <View style={s.actions}>
                  {item.status === 'available' && (
                    <TouchableOpacity
                      style={s.actionBtn}
                      onPress={() => handleComplete(item.id)}
                    >
                      <Text style={s.actionBtnText}>✅ Concluir</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[s.actionBtn, s.actionBtnDanger]}
                    onPress={() => handleDelete(item.id)}
                  >
                    <Text style={[s.actionBtnText, { color: '#FF4D4D' }]}>🗑 Excluir</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
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
  addBtn: { backgroundColor: '#3DDC97', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  addBtnText: { color: '#0F0F0F', fontWeight: '700', fontSize: 13 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 4 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: '#1E1E1E', borderWidth: 1, borderColor: '#2E2E2E',
  },
  filterChipActive: { borderColor: '#3DDC97', backgroundColor: '#1a2e25' },
  filterChipText: { color: '#888', fontSize: 13 },
  filterChipTextActive: { color: '#3DDC97', fontWeight: '600' },
  card: {
    backgroundColor: '#1E1E1E', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#2E2E2E',
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  foodName: { fontSize: 17, fontWeight: '700', color: '#FFF', flex: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  qty: { color: '#3DDC97', fontSize: 14, fontWeight: '600', marginBottom: 4 },
  addr: { color: '#777', fontSize: 12, marginBottom: 2 },
  expiry: { color: '#555', fontSize: 12, marginBottom: 10 },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1, backgroundColor: '#252525', borderRadius: 8, padding: 10, alignItems: 'center',
    borderWidth: 1, borderColor: '#3DDC9744',
  },
  actionBtnDanger: { borderColor: '#FF4D4D44' },
  actionBtnText: { color: '#3DDC97', fontSize: 13, fontWeight: '600' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: '#555', fontSize: 15 },
});