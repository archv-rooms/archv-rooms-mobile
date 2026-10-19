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
import api from '../services/api';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSend() {
    if (loading) return;

    if (!email.trim()) {
      setSent(false);
      setError('Preencha o e-mail.');
      return;
    }

    setError('');
    setSent(false);
    setLoading(true);

    try {
      // timeout maior porque a API pode demorar para "acordar"
      await api.post(
        '/auth/forgot-password',
        { email: email.trim() },
        { timeout: 90000 }
      );
      setSent(true);
    } catch (err) {
      const apiMessage = err?.response?.data?.message;

      if (apiMessage) {
        setError(apiMessage);
      } else if (err?.code === 'ECONNABORTED') {
        setError('O servidor demorou para responder. Tente novamente.');
      } else {
        setError('Não foi possível conectar ao servidor. Tente novamente.');
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

        <Text style={styles.title}>Reset Password</Text>

        <Text style={styles.description}>
          To recover your account, please enter the email address linked to your
          account. We'll send you instructions to reset your password.
        </Text>

        {/* Email */}
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#B8B0C8"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setSent(false);
            setError('');
          }}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!loading}
          onSubmitEditing={handleSend}
        />

        {/* Botão enviar */}
        <TouchableOpacity
          style={[styles.sendButton, loading && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.sendText}>Send link</Text>
          )}
        </TouchableOpacity>

        {sent && (
          <Text style={styles.sentMessage}>
            If this email is registered, you will receive a link shortly.
          </Text>
        )}

        {error !== '' && <Text style={styles.error}>{error}</Text>}
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
    marginBottom: 8,
  },
  description: {
    color: '#D8D0E8',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 20,
  },
  input: {
    backgroundColor: 'rgba(75, 65, 99, 0.35)',
    borderWidth: 1,
    borderColor: '#5A4E75',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    color: '#fff',
    marginBottom: 14,
  },
  sendButton: {
    backgroundColor: '#5A4E75',
    borderRadius: 26,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.7,
  },
  sendText: {
    color: '#fff',
    fontSize: 15,
  },
  sentMessage: {
    color: '#B8B0C8',
    textAlign: 'center',
    fontSize: 12,
    marginTop: 16,
  },
  error: {
    color: '#FF9AA8',
    textAlign: 'center',
    fontSize: 13,
    marginTop: 16,
  },
});