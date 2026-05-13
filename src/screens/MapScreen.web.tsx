import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MapScreen() {
  return (
    <View style={s.container}>
      <Text style={s.icon}>🗺️</Text>
      <Text style={s.title}>Mapa disponível apenas no app</Text>
      <Text style={s.sub}>Abra o FoodShare pelo celular para ver o mapa de doações.</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#0F0F0F',
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32,
  },
  icon: { fontSize: 48, marginBottom: 16 },
  title: { color: '#FFF', fontSize: 18, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  sub: { color: '#666', fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
