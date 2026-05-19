import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { supabase } from "../lib/supabase";
import { showToast } from "../components/Toast";

export default function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    if (!email.trim()) {
      showToast.error("Atenção", "Informe seu e-mail.", "bottom");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: "foodshare://reset-password",
        },
      );

      if (error) throw error;

      showToast.success(
        "E-mail enviado",
        "Confira sua caixa de entrada para redefinir a senha.",
        "bottom",
      );

      navigation.goBack();
    } catch (err: any) {
      showToast.error(
        "Erro",
        err.message ?? "Não foi possível enviar o e-mail.",
        "bottom",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={s.title}>Recuperar senha</Text>
      <Text style={s.subtitle}>
        Digite seu e-mail para receber o link de redefinição.
      </Text>

      <TextInput
        style={s.input}
        placeholder="seu@email.com"
        placeholderTextColor="#555"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <TouchableOpacity style={s.btn} onPress={handleSend} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#0F0F0F" />
        ) : (
          <Text style={s.btnText}>Enviar link</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={s.back}>Voltar</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F0F",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    color: "#FFF",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    color: "#888",
    fontSize: 14,
    marginBottom: 24,
  },
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
  btn: {
    backgroundColor: "#3DDC97",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
  },
  btnText: {
    color: "#0F0F0F",
    fontWeight: "700",
    fontSize: 16,
  },
  back: {
    color: "#888",
    textAlign: "center",
    marginTop: 16,
    fontSize: 14,
  },
});
