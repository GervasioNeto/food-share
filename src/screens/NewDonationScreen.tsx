import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardTypeOptions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { showToast } from '../components/Toast';
import { BackButton } from '../components/BackButton';

const UNITS = ['kg', 'g', 'litros', 'unidades', 'caixas', 'sacos'];

export default function NewDonationScreen({ navigation }: any) {
  const { user, profile } = useAuth();

  const [foodName, setFoodName] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('kg');


  const [expiryDate, setExpiryDate] = useState('');
  const [expiryDisplay, setExpiryDisplay] = useState('');
  const [expiryError, setExpiryError] = useState('');

  const [pickupAddress, setPickupAddress] = useState(profile?.address ?? '');
  const [imageUri, setImageUri] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  async function pickImage() {
    const { status } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Permissão necessária',
        'Permita acesso à galeria para adicionar fotos.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  }

  async function geocodeAddress(
    address: string
  ): Promise<{ lat: number; lng: number } | null> {
    try {
      const results = await Location.geocodeAsync(address);

      if (results.length === 0) return null;

      return {
        lat: results[0].latitude,
        lng: results[0].longitude,
      };
    } catch {
      return null;
    }
  }

  function formatExpiryInput(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, 8);

    if (digits.length <= 2) return digits;

    if (digits.length <= 4) {
      return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }

    return `${digits.slice(0, 2)}/${digits.slice(
      2,
      4
    )}/${digits.slice(4)}`;
  }

  function validateExpiryDate(formatted: string): {
    valid: boolean;
    iso?: string;
    error?: string;
  } {
    const parts = formatted.split('/');

    if (parts.length !== 3) {
      return {
        valid: false,
        error: 'Data incompleta',
      };
    }

    const [day, month, year] = parts.map(Number);

    if (!day || !month || !year) {
      return {
        valid: false,
        error: 'Data inválida',
      };
    }

    if (year < 2024 || year > 2100) {
      return {
        valid: false,
        error: 'Ano inválido',
      };
    }

    const date = new Date(year, month - 1, day);

    const isValid =
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day;

    if (!isValid) {
      return {
        valid: false,
        error: 'Data inexistente',
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date < today) {
      return {
        valid: false,
        error: 'Data já expirou',
      };
    }

    return {
      valid: true,
      iso: `${year}-${String(month).padStart(2, '0')}-${String(
        day
      ).padStart(2, '0')}`,
    };
  }

async function handleSubmit() {
  if (
    !foodName.trim() ||
    !quantity.trim() ||
    !expiryDate ||
    !pickupAddress.trim()
  ) {
    showToast.error(
      'Campos obrigatórios faltando',
      'Preencha todos os campos obrigatórios.',
      'bottom'
    );

    return;
  }

  if (!user) {
    showToast.error(
      'Usuário não autenticado',
      'Faça login novamente.',
      'bottom'
    );

    return;
  }

  const parsedQuantity = parseFloat(quantity);

  if (
    isNaN(parsedQuantity) ||
    parsedQuantity <= 0
  ) {
    showToast.error(
      'Quantidade inválida',
      'Digite uma quantidade válida.',
      'bottom'
    );

    return;
  }

  setLoading(true);

  try {
    let image_url: string | undefined;

    if (imageUri) {
      const ext =
        imageUri
          .split('.')
          .pop()
          ?.toLowerCase() || 'jpg';

      const fileName = `${user.id}/${Date.now()}.${ext}`;

      const response = await fetch(imageUri);

      if (!response.ok) {
        throw new Error(
          'Erro ao processar imagem.'
        );
      }

      const blob = await response.blob();

      const {
        error: uploadError,
      } = await supabase.storage
        .from('donation-images')
        .upload(fileName, blob, {
          contentType: `image/${ext}`,
        });

      if (uploadError) {
        throw new Error(
          uploadError.message
        );
      }

      const { data } = supabase.storage
        .from('donation-images')
        .getPublicUrl(fileName);

      image_url = data.publicUrl;
    }


    const coords =
      await geocodeAddress(
        pickupAddress.trim()
      );


    const {
      error: insertError,
    } = await supabase
      .from('donations')
      .insert({
        donor_id: user.id,
        food_name: foodName.trim(),
        description:
          description.trim(),
        quantity: parsedQuantity,
        unit,
        expiry_date: expiryDate,
        pickup_address:
          pickupAddress.trim(),
        status: 'available',
        image_url,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
      });


    if (insertError) {
      throw new Error(
        insertError.message
      );
    }

    showToast.success(
      'Doação publicada com sucesso! 🎉',
      'Sua doação já está visível.',
      'bottom'
    );

    navigation.goBack();
  } catch (err: any) {
    console.error(
      'handleSubmit error:',
      err
    );

    showToast.error(
      'Erro ao criar doação',
      err?.message ||
        'Tente novamente.',
      'bottom'
    );
  } finally {
    setLoading(false);
  }
}

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : 'height'
        }
      >
        <ScrollView
          contentContainerStyle={s.container}
          keyboardShouldPersistTaps="handled"
        >
    <BackButton onPress={() => navigation.goBack()} />

          <Text style={s.title}>Nova Doação</Text>

          <Text style={s.subtitle}>
            Compartilhe alimentos com quem precisa
          </Text>

          <TouchableOpacity
            style={s.imageBtn}
            onPress={pickImage}
          >
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                style={s.previewImage}
                resizeMode="cover"
              />
            ) : (
              <View style={s.imagePlaceholder}>
                <Text style={s.imagePlaceholderIcon}>
                  📷
                </Text>

                <Text style={s.imagePlaceholderText}>
                  Adicionar foto
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <Field
            label="Nome do alimento *"
            value={foodName}
            onChange={setFoodName}
            placeholder="Ex: Arroz integral, Feijão, Frutas..."
          />

          <Field
            label="Descrição"
            value={description}
            onChange={setDescription}
            placeholder="Estado, quantidade de embalagens, observações..."
            multiline
          />

          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Field
                label="Quantidade *"
                value={quantity}
                onChange={setQuantity}
                placeholder="0"
                keyboard="numeric"
              />
            </View>

            <View style={{ width: 12 }} />

            <View style={{ flex: 1 }}>
              <Text style={s.label}>Unidade</Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 12 }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    gap: 6,
                  }}
                >
                  {UNITS.map((u) => (
                    <TouchableOpacity
                      key={u}
                      style={[
                        s.unitChip,
                        unit === u &&
                          s.unitChipActive,
                      ]}
                      onPress={() => setUnit(u)}
                    >
                      <Text
                        style={[
                          s.unitChipText,
                          unit === u &&
                            s.unitChipTextActive,
                        ]}
                      >
                        {u}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>

          <Text style={s.label}>Validade *</Text>

          <TextInput
            style={[
              s.input,
              expiryError && s.inputError,
            ]}
            placeholder="DD/MM/AAAA"
            placeholderTextColor="#555"
            value={expiryDisplay}
            onChangeText={(t) => {
              const formatted =
                formatExpiryInput(t);

              setExpiryDisplay(formatted);

              if (formatted.length === 10) {
                const validation =
                  validateExpiryDate(
                    formatted
                  );

                if (validation.valid) {
                  setExpiryDate(
                    validation.iso!
                  );

                  setExpiryError('');
                } else {
                  setExpiryDate('');

                  setExpiryError(
                    validation.error ||
                      'Data inválida'
                  );
                }
              } else {
                setExpiryDate('');
                setExpiryError('');
              }
            }}
            keyboardType="numeric"
            maxLength={10}
          />

          {expiryError ? (
            <Text style={s.errorText}>
              {expiryError}
            </Text>
          ) : null}

          <Field
            label="Endereço de retirada *"
            value={pickupAddress}
            onChange={setPickupAddress}
            placeholder="Rua, número, bairro, cidade"
          />

          <TouchableOpacity
            style={[
              s.submitBtn,
              loading && { opacity: 0.7 },
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#0F0F0F" />
            ) : (
              <Text style={s.submitBtnText}>
                Publicar doação
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
  keyboard?: KeyboardTypeOptions;
  multiline?: boolean;
};

function Field({
  label,
  value,
  onChange,
  placeholder,
  keyboard,
  multiline,
}: FieldProps) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={s.label}>{label}</Text>

      <TextInput
        style={[
          s.input,
          multiline && {
            height: 80,
            textAlignVertical: 'top',
          },
        ]}
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
  safe: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },

  container: {
    padding: 20,
    paddingBottom: 48,
  },

  back: {
    marginBottom: 16,
  },

  backText: {
    color: '#3DDC97',
    fontSize: 15,
  },

  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },

  subtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 20,
  },

  imageBtn: {
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },

  previewImage: {
    width: '100%',
    height: 200,
  },

  imagePlaceholder: {
    height: 140,
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2E2E2E',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },

  imagePlaceholderIcon: {
    fontSize: 36,
    marginBottom: 6,
  },

  imagePlaceholderText: {
    color: '#555',
    fontSize: 14,
  },

  label: {
    color: '#CCC',
    fontSize: 13,
    marginBottom: 6,
  },

  input: {
    backgroundColor: '#1E1E1E',
    color: '#FFF',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#2E2E2E',
    marginBottom: 14,
  },

  inputError: {
    borderColor: '#FF4D4D',
  },

  errorText: {
    color: '#FF4D4D',
    fontSize: 12,
    marginTop: -8,
    marginBottom: 12,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  unitChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#2E2E2E',
  },

  unitChipActive: {
    borderColor: '#3DDC97',
    backgroundColor: '#1a2e25',
  },

  unitChipText: {
    color: '#888',
    fontSize: 13,
  },

  unitChipTextActive: {
    color: '#3DDC97',
    fontWeight: '600',
  },

  submitBtn: {
    backgroundColor: '#3DDC97',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
  },

  submitBtnText: {
    color: '#0F0F0F',
    fontWeight: '700',
    fontSize: 16,
  },
});