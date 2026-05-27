import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { ArrowRight, Locate, Map, Pin } from 'lucide-react-native';

type DonationMarker = {
  id: string;
  food_name: string;
  quantity: number;
  unit: string;
  pickup_address: string;
  lat: number;
  lng: number;
};

const FORTALEZA: Region = {
  latitude: -3.7172,
  longitude: -38.5433,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

export default function MapScreen({ navigation }: any) {
  const mapRef = useRef<MapView>(null);
  const [markers, setMarkers] = useState<DonationMarker[]>([]);
  const [region, setRegion] = useState<Region>(FORTALEZA);
  const [loadingMap, setLoadingMap] = useState(true);
  const [loadingDonations, setLoadingDonations] = useState(true);
  const [selected, setSelected] = useState<DonationMarker | null>(null);

  useEffect(() => {
    requestLocationAndCenter();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchDonations();
    }, [])
  );

  async function requestLocationAndCenter() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLoadingMap(false);
        return;
      }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    } catch {
    } finally {
      setLoadingMap(false);
    }
  }

  async function fetchDonations() {
    const { data } = await supabase
      .from('donations')
      .select('id, food_name, quantity, unit, pickup_address, lat, lng')
      .eq('status', 'available')
      .not('lat', 'is', null);
    if (data) setMarkers(data as DonationMarker[]);
    setLoadingDonations(false);
  }

  function centerOnUser() {
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      .then((loc) => {
        mapRef.current?.animateToRegion({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }, 800);
      })
      .catch(() => Alert.alert('Localização', 'Não foi possível obter sua localização.'));
  }

  function openDirections(marker: DonationMarker) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${marker.lat},${marker.lng}`;
    Linking.openURL(url);
  }

  const loading = loadingMap || loadingDonations;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.title}>Mapa de Doações</Text>
        <Text style={s.sub}>
          {loadingDonations ? 'Carregando...' : `${markers.length} disponíve${markers.length === 1 ? 'l' : 'is'}`}
        </Text>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color="#3DDC97" size="large" />
          <Text style={s.loadingText}>Obtendo sua localização...</Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <MapView
            ref={mapRef}
            style={s.map}
            provider={PROVIDER_DEFAULT}
            initialRegion={region}
            showsUserLocation
            showsMyLocationButton={false}
            onPress={() => setSelected(null)}
          >
            {markers.map((m) => (
              <Marker
                key={m.id}
                coordinate={{ latitude: m.lat, longitude: m.lng }}
                onPress={() => setSelected(m)}
              >
                <View style={[s.pin, selected?.id === m.id && s.pinSelected]}>
                  <Text style={s.pinIcon}>🥦</Text>
                </View>
              </Marker>
            ))}
          </MapView>

          <TouchableOpacity style={s.myLocationBtn} onPress={centerOnUser}>
            <Locate size={20} color="#3DDC97" />
          </TouchableOpacity>

          {selected && (
            <View style={s.card}>
              <View style={s.cardHandle} />
              <Text style={s.cardName}>{selected.food_name}</Text>
              <Text style={s.cardQty}>{selected.quantity} {selected.unit}</Text>
              <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 4, marginBottom: 16 }}>
                <Pin size={13} color="#888" style={{ marginTop: 2 }} />
                <Text style={[s.cardAddr, { marginBottom: 0 }]} numberOfLines={2}>{selected.pickup_address}</Text>
              </View>
              <View style={s.cardButtons}>
                <TouchableOpacity
                  style={s.cardBtnDir}
                  onPress={() => openDirections(selected)}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Map size={16} color="#FFF" />
                    <Text style={s.cardBtnDirText}>Como chegar</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.cardBtnDetail}
                  onPress={() => navigation.navigate('DonationDetail', { donationId: selected.id })}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={s.cardBtnDetailText}>Ver detalhes</Text>
                    <ArrowRight size={16} color="#0F0F0F" />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F0F0F' },
  header: { paddingHorizontal: 20, paddingVertical: 12 },
  title: { fontSize: 22, fontWeight: '700', color: '#FFF' },
  sub: { fontSize: 13, color: '#888', marginTop: 2 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: '#888', fontSize: 14 },
  map: { flex: 1 },
  pin: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: '#1a2e25',
    borderWidth: 2, borderColor: '#3DDC97', justifyContent: 'center', alignItems: 'center',
  },
  pinSelected: {
    width: 46, height: 46, borderRadius: 23, borderWidth: 3, backgroundColor: '#1a3d2b',
  },
  pinIcon: { fontSize: 18 },
  myLocationBtn: {
    position: 'absolute', bottom: 24, right: 16,
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#1a2e25', borderWidth: 2, borderColor: '#3DDC97',
    justifyContent: 'center', alignItems: 'center',
    elevation: 4,
  },
  myLocationIcon: { fontSize: 22 },
  card: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#1a1a1a', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingBottom: 32, borderTopWidth: 1, borderTopColor: '#2a2a2a',
    elevation: 8,
  },
  cardHandle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: '#333',
    alignSelf: 'center', marginBottom: 16,
  },
  cardName: { color: '#FFF', fontSize: 18, fontWeight: '700', marginBottom: 4 },
  cardQty: { color: '#3DDC97', fontSize: 14, fontWeight: '600', marginBottom: 6 },
  cardAddr: { color: '#888', fontSize: 13, marginBottom: 16, lineHeight: 18 },
  cardButtons: { flexDirection: 'row', gap: 10 },
  cardBtnDir: {
    flex: 1, backgroundColor: '#1E1E1E', borderRadius: 10, padding: 14,
    alignItems: 'center', borderWidth: 1, borderColor: '#2a2a2a',
  },
  cardBtnDirText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
  cardBtnDetail: {
    flex: 1, backgroundColor: '#3DDC97', borderRadius: 10,
    padding: 14, alignItems: 'center',
  },
  cardBtnDetailText: { color: '#0F0F0F', fontWeight: '700', fontSize: 14 },
});
