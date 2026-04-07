import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Callout, PROVIDER_DEFAULT } from 'react-native-maps';
import { supabase } from '../lib/supabase';

type DonationMarker = {
  id: string;
  food_name: string;
  quantity: number;
  unit: string;
  pickup_address: string;
  lat: number;
  lng: number;
};

const FORTALEZA = { latitude: -3.7172, longitude: -38.5433, latitudeDelta: 0.08, longitudeDelta: 0.08 };

export default function MapScreen({ navigation }: any) {
  const [markers, setMarkers] = useState<DonationMarker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('donations')
        .select('id, food_name, quantity, unit, pickup_address, lat, lng')
        .eq('status', 'available')
        .not('lat', 'is', null);
      if (data) setMarkers(data as DonationMarker[]);
      setLoading(false);
    }
    fetch();
  }, []);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.title}>Mapa de Doações</Text>
        <Text style={s.sub}>{markers.length} disponíveis</Text>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color="#3DDC97" size="large" />
        </View>
      ) : (
        <MapView
          style={s.map}
          provider={PROVIDER_DEFAULT}
          initialRegion={FORTALEZA}
          customMapStyle={darkMapStyle}
        >
          {markers.map((m) => (
            <Marker
              key={m.id}
              coordinate={{ latitude: m.lat, longitude: m.lng }}
              pinColor="#3DDC97"
            >
              <View style={s.pin}>
                <Text style={s.pinIcon}>🥦</Text>
              </View>
              <Callout onPress={() => navigation.navigate('DonationDetail', { donationId: m.id })}>
                <View style={s.callout}>
                  <Text style={s.calloutName}>{m.food_name}</Text>
                  <Text style={s.calloutQty}>{m.quantity} {m.unit}</Text>
                  <Text style={s.calloutAddr}>{m.pickup_address}</Text>
                  <TouchableOpacity style={s.calloutBtn}>
                    <Text style={s.calloutBtnText}>Ver detalhes →</Text>
                  </TouchableOpacity>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F0F0F' },
  header: { paddingHorizontal: 20, paddingVertical: 12 },
  title: { fontSize: 22, fontWeight: '700', color: '#FFF' },
  sub: { fontSize: 13, color: '#888', marginTop: 2 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  map: { flex: 1 },
  pin: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: '#1a2e25',
    borderWidth: 2, borderColor: '#3DDC97', justifyContent: 'center', alignItems: 'center',
  },
  pinIcon: { fontSize: 18 },
  callout: { width: 200, padding: 8 },
  calloutName: { fontWeight: '700', fontSize: 14, color: '#000', marginBottom: 2 },
  calloutQty: { fontSize: 12, color: '#3DDC97', marginBottom: 2 },
  calloutAddr: { fontSize: 11, color: '#555', marginBottom: 6 },
  calloutBtn: { backgroundColor: '#3DDC97', borderRadius: 6, padding: 6, alignItems: 'center' },
  calloutBtnText: { color: '#0F0F0F', fontWeight: '700', fontSize: 12 },
});

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2c2c2c' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212121' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
];
