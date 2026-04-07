import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type Donation = {
  id: string;
  food_name: string;
  description: string;
  quantity: number;
  unit: string;
  expiry_date: string;
  pickup_address: string;
  status: 'available' | 'reserved' | 'completed';
  image_url?: string;
  donor_id: string;
  created_at: string;
  profiles: { name: string; phone?: string };
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

export default function DonationDetailScreen({ route, navigation }: any) {
  const { donation: routeDonation, donationId } = route.params ?? {};
  const { user, profile } = useAuth();
  const [donation, setDonation] = useState<Donation | null>(routeDonation ?? null);
  const [loading, setLoading] = useState(!routeDonation);
  const [requesting, setRequesting] = useState(false);
  const [alreadyRequested, setAlreadyRequested] = useState(false);

  useEffect(() => {
    if (!routeDonation && donationId) {
      supabase
        .from('donations')
        .select('*, profiles(name, phone)')
        .eq('id', donationId)
        .single()
        .then(({ data }) => {
          if (data) setDonation(data as Donation);
          setLoading(false);
        });
    }
  }, [donationId, routeDonation]);

  useEffect(() => {
    if (!user || !donation) return;
    supabase
      .from('requests')
      .select('id')
      .eq('donation_id', donation.id)
      .eq('requester_id', user.id)
      .maybeSingle()
      .then(({ data }) => { if (data) setAlreadyRequested(true); });
  }, [user, donation]);

  async function handleRequest() {
    if (!user || !donation) return;
    setRequesting(true);
    try {
      const { error } = await supabase.from('requests').insert({
        donation_id: donation.id,
        requester_id: user.id,
        status: 'pending',
      });
      if (error) throw error;

      await supabase.from('notifications').insert({
        user_id: donation.donor_id,
        title: 'Nova solicitação recebida',
        body: `${profile?.name ?? 'Alguém'} solicitou "${donation.food_name}"`,
        type: 'request',
        read: false,
      });

      setAlreadyRequested(true);
      Alert.alert('Solicitação enviada!', 'O doador receberá uma notificação.');
    } catch (err: any) {
      Alert.alert('Erro', err.message ?? 'Não foi possível enviar a solicitação.');
    } finally {
      setRequesting(false);
    }
  }

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator color="#3DDC97" size="large" />
      </View>
    );
  }

  if (!donation) {
    return (
      <View style={s.center}>
        <Text style={{ color: '#888' }}>Doação não encontrada.</Text>
      </View>
    );
  }

  const isOwner = user?.id === donation.donor_id;
  const isReceiver = profile?.role === 'receiver';
  const expiryDate = new Date(donation.expiry_date).toLocaleDateString('pt-BR');
  const status = donation.status;

  return (
    <SafeAreaView style={s.safe}>
      <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
        <Text style={s.backText}>← Voltar</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={s.content}>
        {donation.image_url ? (
          <Image source={{ uri: donation.image_url }} style={s.image} resizeMode="cover" />
        ) : (
          <View style={s.imagePlaceholder}>
            <Text style={{ fontSize: 64 }}>🥦</Text>
          </View>
        )}

        <View style={s.statusRow}>
          <View style={[s.statusBadge, { backgroundColor: STATUS_COLOR[status] + '22' }]}>
            <Text style={[s.statusText, { color: STATUS_COLOR[status] }]}>
              {STATUS_LABEL[status]}
            </Text>
          </View>
          <Text style={s.date}>
            Publicado em {new Date(donation.created_at).toLocaleDateString('pt-BR')}
          </Text>
        </View>

        <Text style={s.foodName}>{donation.food_name}</Text>
        <Text style={s.quantity}>{donation.quantity} {donation.unit}</Text>
        <Text style={s.description}>{donation.description}</Text>

        <View style={s.infoSection}>
          <InfoRow icon="📅" label="Validade" value={expiryDate} />
          <InfoRow icon="📍" label="Retirada" value={donation.pickup_address} />
          <InfoRow icon="👤" label="Doador" value={donation.profiles?.name ?? '—'} />
          {isOwner && donation.profiles?.phone && (
            <InfoRow icon="📞" label="Telefone" value={donation.profiles.phone} />
          )}
        </View>

        {isReceiver && status === 'available' && !isOwner && (
          <TouchableOpacity
            style={[s.requestBtn, alreadyRequested && s.requestBtnDisabled]}
            onPress={alreadyRequested ? undefined : handleRequest}
            disabled={requesting || alreadyRequested}
          >
            {requesting
              ? <ActivityIndicator color="#0F0F0F" />
              : <Text style={s.requestBtnText}>
                  {alreadyRequested ? '✅ Solicitação enviada' : 'Solicitar esta doação'}
                </Text>}
          </TouchableOpacity>
        )}

        {isOwner && (
          <View style={s.ownerNote}>
            <Text style={s.ownerNoteText}>
              Esta é sua doação. Gerencie as solicitações em "Solicitações".
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={s.infoRow}>
      <Text style={s.infoIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={s.infoLabel}>{label}</Text>
        <Text style={s.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F0F0F' },
  center: { flex: 1, backgroundColor: '#0F0F0F', justifyContent: 'center', alignItems: 'center' },
  backBtn: { paddingHorizontal: 20, paddingVertical: 12 },
  backText: { color: '#3DDC97', fontSize: 15 },
  content: { paddingBottom: 48 },
  image: { width: '100%', height: 240 },
  imagePlaceholder: {
    width: '100%', height: 200, backgroundColor: '#1E1E1E',
    justifyContent: 'center', alignItems: 'center',
  },
  statusRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 16, marginBottom: 8,
  },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 13, fontWeight: '600' },
  date: { fontSize: 12, color: '#555' },
  foodName: { fontSize: 26, fontWeight: '800', color: '#FFF', paddingHorizontal: 20, marginBottom: 4 },
  quantity: { fontSize: 16, color: '#3DDC97', fontWeight: '600', paddingHorizontal: 20, marginBottom: 12 },
  description: { fontSize: 14, color: '#AAA', paddingHorizontal: 20, lineHeight: 22, marginBottom: 20 },
  infoSection: {
    backgroundColor: '#1E1E1E', marginHorizontal: 20, borderRadius: 14,
    padding: 16, gap: 14, borderWidth: 1, borderColor: '#2E2E2E', marginBottom: 24,
  },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  infoIcon: { fontSize: 20, marginTop: 1 },
  infoLabel: { fontSize: 12, color: '#888' },
  infoValue: { fontSize: 14, color: '#FFF', fontWeight: '500', marginTop: 2 },
  requestBtn: {
    backgroundColor: '#3DDC97', marginHorizontal: 20, borderRadius: 12,
    padding: 18, alignItems: 'center',
  },
  requestBtnDisabled: { backgroundColor: '#1a2e25' },
  requestBtnText: { color: '#0F0F0F', fontWeight: '700', fontSize: 16 },
  ownerNote: {
    marginHorizontal: 20, backgroundColor: '#1a2e25', borderRadius: 10,
    padding: 14, borderWidth: 1, borderColor: '#3DDC9733',
  },
  ownerNoteText: { color: '#3DDC97', fontSize: 13, textAlign: 'center' },
});
