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
};

const FILTERS = ['Todas', 'available', 'reserved', 'completed'] as const;

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
    Alert.alert('Excluir doação', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('donations').delete().eq('id', id);
          setDonations((prev) => prev.filter((d) => d.id !== id));
        },
      },
    ]);
  }

  const filtered = filter === 'Todas'
    ? donations
    : donations.filter((d) => d.status === filter);

  return (
    <SafeAreaView style={s.safe}>

      
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.back}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={s.title}>Minhas Doações</Text>
        <View style={{ width: 60 }} />
      </View>

      
      <View style={s.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[s.filterChip, filter === f && s.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={s.filterChipText}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

     
      {loading ? (
        <ActivityIndicator size="large" color="#3DDC97" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}
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
              <Text style={s.emptyText}>Nenhuma doação encontrada</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={s.card}>
              <Text style={s.food}>{item.food_name}</Text>
              <Text style={s.info}>{item.quantity} {item.unit}</Text>
              <Text style={s.info}>📍 {item.pickup_address}</Text>
              <Text style={s.info}>
                {new Date(item.expiry_date).toLocaleDateString('pt-BR')}
              </Text>

              <View style={s.actions}>
                <TouchableOpacity onPress={() => handleDelete(item.id)}>
                  <Text style={s.delete}>🗑 Excluir</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      
      <TouchableOpacity
        style={s.fab}
        onPress={() => navigation.navigate('NewDonation')}
        activeOpacity={0.8}
      >
        <View style={s.fabContent}>
          <Text style={s.fabLabel}>Criar Doação</Text>
          <Text style={s.fabPlus}>＋</Text>
        </View>
      </TouchableOpacity>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F0F0F' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },

  back: { color: '#3DDC97', fontSize: 15 },

  title: { fontSize: 18, fontWeight: '700', color: '#FFF' },

  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 4,
  },

  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#2E2E2E',
  },

  filterChipActive: {
    borderColor: '#3DDC97',
    backgroundColor: '#1a2e25',
  },

  filterChipText: {
    color: '#888',
    fontSize: 13,
  },

  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2E2E2E',
  },

  food: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },

  info: {
    color: '#AAA',
    marginTop: 4,
    fontSize: 13,
  },

  actions: {
    marginTop: 10,
  },

  delete: {
    color: '#FF4D4D',
    fontSize: 13,
    fontWeight: '600',
  },

  empty: {
    alignItems: 'center',
    marginTop: 60,
  },

  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },

  emptyText: {
    color: '#555',
    fontSize: 15,
  },

  fab: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: '#3DDC97',
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 14,

    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },

  fabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  fabLabel: {
    color: '#0F0F0F',
    fontSize: 15,
    fontWeight: '700',
  },

  fabPlus: {
    color: '#0F0F0F',
    fontSize: 20,
    fontWeight: '700',
  },
});