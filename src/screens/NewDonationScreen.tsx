import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { showToast } from '../components/Toast';

const UNITS = ['kg', 'g', 'litros', 'unidades', 'caixas', 'sacos'];

export default function NewDonationScreen({ navigation }: any) {
  const { user, profile } = useAuth();
  const [foodName, setFoodName] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('kg');
  const [expiryDate, setExpiryDate] = useState('');
  const [pickupAddress, setPickupAddress] = useState(profile?.address ?? '');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Permita acesso à galeria para adicionar fotos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [4, 3], quality: 0.7,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  }

  async function handleSubmit() {
    if (!foodName || !quantity || !expiryDate || !pickupAddress) {
      Alert.alert('Atenção', 'Preencha todos os campos obrigatórios.');
      return;
    }
    if (!user) return;

    setLoading(true);
    try {
      let image_url: string | undefined;

      if (imageUri) {
        const ext = imageUri.split('.').pop() ?? 'jpg';
        const fileName = `${user.id}/${Date.now()}.${ext}`;
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const { error: uploadError } = await supabase.storage
          .from('donation-images')
          .upload(fileName, blob, { contentType: `image/${ext}` });
        if (!uploadError) {
          const { data } = supabase.storage.from('donation-images').getPublicUrl(fileName);
          image_url = data.publicUrl;
        }
      }

      const { error } = await supabase.from('donations').insert({
        donor_id: user.id,
        food_name: foodName.trim(),
        description: description.trim(),
        quantity: parseFloat(quantity),
        unit,
        expiry_date: expiryDate,
        pickup_address: pickupAddress.trim(),
        status: 'available',
        image_url,
      });

      if (error) throw error;
      Alert.alert('Doação criada!', 'Sua doação está disponível para receptores.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Erro', err.message ?? 'Não foi possível criar a doação.');
      showToast.error('Erro ao criar doação', err.message ?? 'Tente novamente mais tarde.', 'bottom');
    } finally {
      setLoading(false);
      showToast.success('Doação publicada com sucesso!', 'Sua doação já está visível para todos', 'bottom');
      navigation.goBack();
    }
  }

  function formatExpiryInput(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  }

  function parseExpiry(formatted: string): string {
    const parts = formatted.split('/');
    if (parts.length !== 3 || parts[2].length !== 4) return '';
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}>
            <Text style={s.backText}>← Voltar</Text>
          </TouchableOpacity>
          <Text style={s.title}>Nova Doação</Text>
          <Text style={s.subtitle}>Compartilhe alimentos com quem precisa</Text>

          <TouchableOpacity style={s.imageBtn} onPress={pickImage}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={s.previewImage} resizeMode="cover" />
            ) : (
              <View style={s.imagePlaceholder}>
                <Text style={s.imagePlaceholderIcon}>📷</Text>
                <Text style={s.imagePlaceholderText}>Adicionar foto</Text>
              </View>
            )}
          </TouchableOpacity>

          <Field label="Nome do alimento *" value={foodName} onChange={setFoodName}
            placeholder="Ex: Arroz integral, Feijão, Frutas..." />

          <Field label="Descrição" value={description} onChange={setDescription}
            placeholder="Estado, quantidade de embalagens, observações..." multiline />

          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Field label="Quantidade *" value={quantity} onChange={setQuantity}
                placeholder="0" keyboard="numeric" />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={s.label}>Unidade</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {UNITS.map((u) => (
                    <TouchableOpacity
                      key={u}
                      style={[s.unitChip, unit === u && s.unitChipActive]}
                      onPress={() => setUnit(u)}
                    >
                      <Text style={[s.unitChipText, unit === u && s.unitChipTextActive]}>{u}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>

          <Text style={s.label}>Validade *</Text>
          <TextInput
            style={s.input}
            placeholder="DD/MM/AAAA"
            placeholderTextColor="#555"
            value={expiryDate ? expiryDate.split('-').reverse().join('/') : ''}
            onChangeText={(t) => {
              const formatted = formatExpiryInput(t);
              const iso = parseExpiry(formatted);
              setExpiryDate(iso || formatted);
            }}
            keyboardType="numeric"
            maxLength={10}
          />

          <Field label="Endereço de retirada *" value={pickupAddress} onChange={setPickupAddress}
            placeholder="Rua, número, bairro, cidade" />

          <TouchableOpacity style={s.submitBtn} onPress={handleSubmit} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#0F0F0F" />
              : <Text style={s.submitBtnText}>Publicar doação</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, value, onChange, placeholder, keyboard, multiline }: any) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        style={[s.input, multiline && { height: 80, textAlignVertical: 'top' }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#555"
        keyboardType={keyboard ?? 'default'}
        multiline={multiline}
      />
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F0F0F' },
  container: { padding: 20, paddingBottom: 48 },
  back: { marginBottom: 16 },
  backText: { color: '#3DDC97', fontSize: 15 },
  title: { fontSize: 26, fontWeight: '700', color: '#FFF', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#888', marginBottom: 20 },
  imageBtn: { marginBottom: 20, borderRadius: 12, overflow: 'hidden' },
  previewImage: { width: '100%', height: 200 },
  imagePlaceholder: {
    height: 140, backgroundColor: '#1E1E1E', borderRadius: 12, borderWidth: 1,
    borderColor: '#2E2E2E', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center',
  },
  imagePlaceholderIcon: { fontSize: 36, marginBottom: 6 },
  imagePlaceholderText: { color: '#555', fontSize: 14 },
  label: { color: '#CCC', fontSize: 13, marginBottom: 6 },
  input: {
    backgroundColor: '#1E1E1E', color: '#FFF', borderRadius: 10, padding: 14,
    fontSize: 15, borderWidth: 1, borderColor: '#2E2E2E', marginBottom: 14,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  unitChip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#1E1E1E', borderWidth: 1, borderColor: '#2E2E2E',
  },
  unitChipActive: { borderColor: '#3DDC97', backgroundColor: '#1a2e25' },
  unitChipText: { color: '#888', fontSize: 13 },
  unitChipTextActive: { color: '#3DDC97', fontWeight: '600' },
  submitBtn: {
    backgroundColor: '#3DDC97', borderRadius: 12, padding: 18, alignItems: 'center', marginTop: 8,
  },
  submitBtnText: { color: '#0F0F0F', fontWeight: '700', fontSize: 16 },
});
