import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { TOKEN_KEY } from '../services/api';
import { MODO_TESTE } from '../services/mock';

export default function SignInScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin() {
    if (loading) return;

    if (!email.trim() || !password) {
      setError('Preencha o e-mail e a senha.');
      return;
    }

    setError('');
    setLoading(true);

    // Modo teste: aceita qualquer login, sem chamar a API
    if (MODO_TESTE) {
      await AsyncStorage.setItem(TOKEN_KEY, 'token-de-teste');
      setLoading(false);
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
      return;
    }

    try {
      // timeout maior porque a API pode demorar ~1 minuto para "acordar"
      const response = await api.post(
        '/auth/login',
        { email: email.trim(), password },
        { timeout: 90000 }
      );

      const token = response?.data?.data?.token;

      if (!token) {
        setError('Resposta inesperada do servidor. Tente novamente.');
        return;
      }

      await AsyncStorage.setItem(TOKEN_KEY, token);

      // reset para o usuário não voltar ao login ao apertar "voltar"
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } catch (err) {
      const apiMessage = err?.response?.data?.message;

      if (apiMessage) {
        // mensagens da API (usuário não encontrado, senha inválida, etc.)
        setError(apiMessage);
      } else if (err?.code === 'ECONNABORTED') {
        setError('O servidor demorou para responder. Tente novamente.');
      } else {
        setError(
          'Não foi possível conectar ao servidor. Se for a primeira vez, aguarde um minuto e tente de novo.'
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient colors={['#1E1830', '#3A2F55', '#5B4A7A']} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Voltar */}
        <TouchableOpacity
          style={styles.back}
          onPress={() => navigation.canGoBack() && navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.title}>Log In</Text>

        {/* Email */}
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#B8B0C8"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!loading}
        />

        {/* Senha */}
        <View style={styles.passwordBox}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            placeholderTextColor="#B8B0C8"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            editable={!loading}
            onSubmitEditing={handleLogin}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? 'eye-outline' : 'eye-off-outline'}
              size={22}
              color="#E6E0F0"
            />
          </TouchableOpacity>
        </View>

        {/* Mensagem de erro */}
        {error !== '' && <Text style={styles.error}>{error}</Text>}

        {/* Botão entrar */}
        <TouchableOpacity
          style={[styles.loginButton, loading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginText}>Log in</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.forgot}>Forgot Password</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
          <Text style={styles.createAccount}>Create account</Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }} />

        {/* Google */}
        <TouchableOpacity style={styles.googleButton}>
          <Ionicons name="logo-google" size={18} color="#fff" />
          <Text style={styles.googleText}>Continue with Google</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 40,
  },
  back: {
    marginBottom: 20,
    width: 40,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#4B4163',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    color: '#fff',
    marginBottom: 14,
  },
  passwordBox: {
    backgroundColor: '#4B4163',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  passwordInput: {
    flex: 1,
    color: '#fff',
    height: '100%',
  },
  error: {
    color: '#FF9AA8',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 14,
  },
  loginButton: {
    backgroundColor: '#5A4E75',
    borderRadius: 26,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginText: {
    color: '#fff',
    fontSize: 15,
  },
  forgot: {
    color: '#9A90B0',
    textAlign: 'center',
    marginTop: 18,
    fontSize: 13,
  },
  createAccount: {
    color: '#9A90B0',
    textAlign: 'center',
    marginTop: 14,
    fontSize: 13,
  },
  googleButton: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#5A4E75',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  googleText: {
    color: '#fff',
    fontSize: 13,
  },
});