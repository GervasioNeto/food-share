import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { supabase } from "../lib/supabase";
import { showToast } from "../components/Toast";

export default function ResetPasswordScreen({ navigation }: any) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    checkRecoverySession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setSessionReady(true);
        return;
      }

      if (session) {
        setSessionReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function checkRecoverySession() {
    const { data, error } = await supabase.auth.getSession();

    if (!error && data.session) {
      setSessionReady(true);
    }
  }

  async function handleResetPassword() {
    if (!password || !confirmPassword) {
      showToast.error("Atenção", "Preencha todos os campos.", "bottom");
      Alert.alert("Atenção", "Preencha todos os campos.");
      return;
    }

    if (password.length < 6) {
      showToast.error(
        "Atenção",
        "A senha deve ter pelo menos 6 caracteres.",
        "bottom",
      );
      Alert.alert("Atenção", "A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      showToast.error("Atenção", "As senhas não coincidem.", "bottom");
      Alert.alert("Atenção", "As senhas não coincidem.");
      return;
    }

    if (!sessionReady) {
      showToast.error(
        "Erro",
        "Sessão de recuperação não encontrada.",
        "bottom",
      );
      Alert.alert("Erro", "Sessão de recuperação não encontrada.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        const message =
          error.message ===
          "New password should be different from the old password."
            ? "A nova senha deve ser diferente da senha antiga."
            : (error.message ?? "Não foi possível redefinir a senha.");

        throw new Error(message);
      }

      showToast.success(
        "Senha redefinida",
        "Agora você pode entrar com sua nova senha.",
        "bottom",
      );

      Alert.alert("Sucesso", "Senha redefinida com sucesso.", [
        {
          text: "OK",
          onPress: async () => {
            await supabase.auth.signOut();
            navigation.getParent()?.reset({
              index: 0,
              routes: [{ name: "Auth" }],
            });
          },
        },
      ]);
    } catch (err: any) {
      showToast.error(
        "Erro",
        err.message ?? "Não foi possível redefinir a senha.",
        "bottom",
      );
      Alert.alert("Erro", err.message ?? "Não foi possível redefinir a senha.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={s.container}>
      <Text style={s.title}>Redefinir senha</Text>
      <Text style={s.subtitle}>
        {sessionReady
          ? "Digite sua nova senha."
          : "Validando link de recuperação..."}
      </Text>

      {!sessionReady ? (
        <ActivityIndicator color="#3DDC97" style={{ marginTop: 24 }} />
      ) : (
        <>
          <TextInput
            style={s.input}
            placeholder="Nova senha"
            placeholderTextColor="#555"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TextInput
            style={s.input}
            placeholder="Confirmar nova senha"
            placeholderTextColor="#555"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <TouchableOpacity
            style={s.button}
            onPress={handleResetPassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#0F0F0F" />
            ) : (
              <Text style={s.buttonText}>Salvar nova senha</Text>
            )}
          </TouchableOpacity>
        </>
      )}
    </View>
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
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#3DDC97",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#0F0F0F",
    fontWeight: "700",
    fontSize: 16,
  },
});
