import React, { useEffect, useState } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { showToast } from "../components/Toast";

const ROLES = [
  { value: "receiver", label: "Receptor", icon: "🫂" },
  { value: "donor", label: "Doador", icon: "🤝" },
] as const;

type Role = "donor" | "receiver";

export default function EditProfileScreen({ navigation }: any) {
  const { user, refreshProfile } = useAuth(); // ✅ ADICIONADO

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [role, setRole] = useState<Role>("receiver");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setInitialLoading(false);
      return;
    }

    async function loadProfile() {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("name, phone, address, role, avatar_url")
          .eq("id", user!.id)
          .single();

        if (data) {
          setName(data.name ?? "");
          setPhone(data.phone ?? "");
          setAddress(data.address ?? "");
          setRole(data.role ?? "receiver");
          setAvatarUrl(data.avatar_url ?? null);
        }
      } catch (_) {
      } finally {
        setInitialLoading(false);
      }
    }

    loadProfile();
  }, [user]);

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permissão necessária",
        "Permita acesso à galeria para alterar sua foto.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
  }

  async function uploadAvatar(): Promise<string | null> {
    if (!avatarUri || !user) return avatarUrl;

    const uriParts = avatarUri.split(".");
    const lastPart = uriParts[uriParts.length - 1];
    const ext =
      lastPart && !lastPart.includes("/") ? lastPart.split("?")[0] : "jpg";

    const fileName = `${user.id}/avatar.${ext}`;

    const response = await fetch(avatarUri);
    const blob = await response.blob();

    const contentType =
      blob.type && blob.type !== "application/octet-stream"
        ? blob.type
        : `image/${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, blob, { contentType, upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
    return data.publicUrl;
  }

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert("Atenção", "O nome não pode estar vazio.");
      return;
    }

    if (!phone.trim()) {
      Alert.alert("Atenção", "O telefone não pode estar vazio.");
      return;
    }

    if (!user) return;

    setLoading(true);
    try {
      const newAvatarUrl = await uploadAvatar();

      const { error } = await supabase
        .from("profiles")
        .update({
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
          role,
          avatar_url: newAvatarUrl,
        })
        .eq("id", user.id);

      if (error) throw error;

      // ✅ ATUALIZA CONTEXTO
      await refreshProfile();

      showToast.success(
        "Perfil atualizado!",
        "Suas informações foram salvas com sucesso.",
        "bottom"
      );

      navigation.goBack();

    } catch (err: any) {
      showToast.error(
        "Erro",
        err.message ?? "Não foi possível salvar as alterações.",
        "bottom"
      );
    } finally {
      setLoading(false);
    }
  }

  const displayAvatar = avatarUri ?? avatarUrl;
  const initials = name
    ? name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  if (initialLoading) {
    return (
      <SafeAreaView style={s.safe}>
        <ActivityIndicator
          style={{ marginTop: 40 }}
          color="#3DDC97"
          size="large"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={s.container}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}>
            <Text style={s.backText}>← Voltar</Text>
          </TouchableOpacity>

          <Text style={s.title}>Editar Perfil</Text>
          <Text style={s.subtitle}>Atualize suas informações pessoais</Text>

          <TouchableOpacity style={s.avatarWrapper} onPress={pickImage}>
            {displayAvatar ? (
              <Image source={{ uri: displayAvatar }} style={s.avatarImage} />
            ) : (
              <View style={s.avatarFallback}>
                <Text style={s.avatarInitials}>{initials}</Text>
              </View>
            )}
            <View style={s.avatarBadge}>
              <Text style={s.avatarBadgeText}>📷</Text>
            </View>
          </TouchableOpacity>

          <Text style={s.avatarHint}>Toque para alterar a foto</Text>

          <Text style={s.label}>Nome completo *</Text>
          <TextInput
            style={s.input}
            value={name}
            onChangeText={setName}
            placeholder="Seu nome"
            placeholderTextColor="#555"
            autoCapitalize="words"
          />

          <Text style={s.label}>Telefone *</Text>
          <TextInput
            style={s.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="(85) 99999-9999"
            placeholderTextColor="#555"
            keyboardType="phone-pad"
          />

          <Text style={s.label}>Endereço (opcional)</Text>
          <TextInput
            style={s.input}
            value={address}
            onChangeText={setAddress}
            placeholder="Rua, número, bairro"
            placeholderTextColor="#555"
            autoCapitalize="words"
          />

          <TouchableOpacity
            style={[s.saveBtn, loading && s.saveBtnDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#0F0F0F" />
            ) : (
              <Text style={s.saveBtnText}>Salvar alterações</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0F0F0F" },
  container: { padding: 20, paddingBottom: 48 },
  back: { marginBottom: 16 },
  backText: { color: "#3DDC97", fontSize: 15 },
  title: { fontSize: 26, fontWeight: "700", color: "#FFF", marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#888", marginBottom: 28 },

  avatarWrapper: { alignSelf: "center", marginBottom: 8, position: "relative" },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#3DDC97",
  },
  avatarFallback: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#1a2e25",
    borderWidth: 2,
    borderColor: "#3DDC97",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitials: { fontSize: 34, fontWeight: "700", color: "#3DDC97" },
  avatarBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#3DDC97",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#0F0F0F",
  },
  avatarBadgeText: { fontSize: 14 },
  avatarHint: {
    color: "#555",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 28,
  },

  label: { color: "#CCC", fontSize: 13, marginBottom: 6 },
  roleRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  roleBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#1E1E1E",
    borderWidth: 1,
    borderColor: "#2E2E2E",
  },
  roleBtnActive: { borderColor: "#3DDC97", backgroundColor: "#1a2e25" },
  roleBtnText: { color: "#FFF", fontWeight: "600", fontSize: 14 },

  input: {
    backgroundColor: "#1E1E1E",
    color: "#FFF",
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#2E2E2E",
    marginBottom: 16,
  },

  saveBtn: {
    backgroundColor: "#3DDC97",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: "#0F0F0F", fontWeight: "700", fontSize: 16 },
});