import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function LoginScreen({ navigation }: any) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Atenção', 'Preencha e-mail e senha.');
      return;
    }
    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (err: any) {
      Alert.alert('Erro ao entrar', err.message ?? 'Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={s.header}>
        <Text style={s.logo}>🥦</Text>
        <Text style={s.brand}>FoodShare</Text>
        <Text style={s.subtitle}>Conectando quem tem com quem precisa</Text>
      </View>

      <View style={s.form}>
        <Text style={s.label}>E-mail</Text>
        <TextInput
          style={s.input}
          placeholder="seu@email.com"
          placeholderTextColor="#555"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={s.label}>Senha</Text>
        <TextInput
          style={s.input}
          placeholder="••••••••"
          placeholderTextColor="#555"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={s.btn} onPress={handleLogin} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#0F0F0F" />
            : <Text style={s.btnText}>Entrar</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={s.link}>
            Não tem conta?{' '}
            <Text style={s.linkAccent}>Cadastre-se</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F0F', justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 48 },
  logo: { fontSize: 56 },
  brand: { fontSize: 32, fontWeight: '700', color: '#3DDC97', marginTop: 8 },
  subtitle: { fontSize: 14, color: '#888', marginTop: 4, textAlign: 'center' },
  form: { gap: 12 },
  label: { color: '#CCC', fontSize: 13, marginBottom: -6 },
  input: {
    backgroundColor: '#1E1E1E', color: '#FFF', borderRadius: 10, padding: 14,
    fontSize: 15, borderWidth: 1, borderColor: '#2E2E2E',
  },
  btn: {
    backgroundColor: '#3DDC97', borderRadius: 10, padding: 16,
    alignItems: 'center', marginTop: 8,
  },
  btnText: { color: '#0F0F0F', fontWeight: '700', fontSize: 16 },
  link: { color: '#888', textAlign: 'center', marginTop: 16, fontSize: 14 },
  linkAccent: { color: '#3DDC97', fontWeight: '600' },
});
