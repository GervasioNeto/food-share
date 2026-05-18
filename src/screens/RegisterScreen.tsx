import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../contexts/AuthContext';
import { showToast } from '../components/Toast';

type Role = 'donor' | 'receiver';

export default function RegisterScreen({ navigation }: any) {
  const { signUp } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [role, setRole] = useState<Role>('receiver');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!name || !email || !password) {
      Alert.alert(
        'Atenção',
        'Nome, e-mail e senha são obrigatórios.'
      );

      showToast.error(
        'Preencha os campos obrigatórios.',
        'Email, senha e nome são necessários.',
        'bottom'
      );

      return;
    }

    setLoading(true);

    try {
      await signUp({
        email: email.trim(),
        password,
        name,
        phone,
        role,
        ...(role === 'receiver' && { address }),
      });

      showToast.success(
        'Conta criada!',
        'Bem-vindo à rede FoodShare!',
        'bottom'
      );
    } catch (err: any) {
      Alert.alert(
        'Erro ao cadastrar',
        err.message ?? 'Tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#0F0F0F' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={s.container}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          style={s.back}
          onPress={() => navigation.goBack()}
        >
          <Text style={s.backText}>← Voltar</Text>
        </TouchableOpacity>

        <Text style={s.title}>Criar conta</Text>

        <Text style={s.subtitle}>
          Junte-se à rede FoodShare
        </Text>

        <Text style={s.sectionLabel}>Você é:</Text>

        <View style={s.roleRow}>
          {(['receiver', 'donor'] as Role[]).map((r) => (
            <TouchableOpacity
              key={r}
              style={[
                s.roleBtn,
                role === r && s.roleBtnActive,
              ]}
              onPress={() => setRole(r)}
            >
              <Text
                style={[
                  s.roleBtnText,
                  role === r && s.roleBtnTextActive,
                ]}
              >
                {r === 'receiver'
                  ? '🙋 Receptor'
                  : '🤝 Doador'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Field
          label="Nome completo"
          value={name}
          onChange={setName}
          placeholder="Seu nome"
        />

        <Field
          label="E-mail"
          value={email}
          onChange={setEmail}
          placeholder="seu@email.com"
          keyboard="email-address"
          autoCapitalize="none"
        />

        <Field
          label="Telefone"
          value={phone}
          onChange={setPhone}
          placeholder="(85) 99999-9999"
          keyboard="phone-pad"
        />

        {/* Campo senha com ícone */}
        <View style={{ marginBottom: 12 }}>
          <Text style={s.label}>Senha</Text>

          <View style={s.passwordContainer}>
            <TextInput
              style={s.passwordInput}
              value={password}
              onChangeText={setPassword}
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor="#555"
              secureTextEntry={!showPassword}
            />

            <TouchableOpacity
              onPress={() =>
                setShowPassword(!showPassword)
              }
            >
              <Ionicons
                name={showPassword ? 'eye-off' : 'eye'}
                size={22}
                color="#888"
              />
            </TouchableOpacity>
          </View>
        </View>

        {role === 'receiver' && (
          <Field
            label="Endereço"
            value={address}
            onChange={setAddress}
            placeholder="Rua, número, bairro"
          />
        )}

        <TouchableOpacity
          style={s.btn}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#0F0F0F" />
          ) : (
            <Text style={s.btnText}>
              Criar conta
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.goBack()}
        >
          <Text style={s.link}>
            Já tem conta?{' '}
            <Text style={s.linkAccent}>
              Entrar
            </Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  keyboard,
  autoCapitalize,
}: any) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={s.label}>{label}</Text>

      <TextInput
        style={s.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#555"
        keyboardType={keyboard ?? 'default'}
        autoCapitalize={
          autoCapitalize ?? 'sentences'
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 48,
  },

  back: {
    marginBottom: 24,
  },

  backText: {
    color: '#3DDC97',
    fontSize: 15,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },

  subtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 24,
  },

  sectionLabel: {
    color: '#CCC',
    fontSize: 13,
    marginBottom: 8,
  },

  roleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },

  roleBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2E2E2E',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
  },

  roleBtnActive: {
    borderColor: '#3DDC97',
    backgroundColor: '#1a2e25',
  },

  roleBtnText: {
    color: '#888',
    fontWeight: '600',
  },

  roleBtnTextActive: {
    color: '#3DDC97',
  },

  label: {
    color: '#CCC',
    fontSize: 13,
    marginBottom: 4,
  },

  input: {
    backgroundColor: '#1E1E1E',
    color: '#FFF',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#2E2E2E',
  },

  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2E2E2E',
    paddingHorizontal: 14,
  },

  passwordInput: {
    flex: 1,
    color: '#FFF',
    paddingVertical: 14,
    fontSize: 15,
  },

  btn: {
    backgroundColor: '#3DDC97',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },

  btnText: {
    color: '#0F0F0F',
    fontWeight: '700',
    fontSize: 16,
  },

  link: {
    color: '#888',
    textAlign: 'center',
    fontSize: 14,
  },

  linkAccent: {
    color: '#3DDC97',
    fontWeight: '600',
  },
});