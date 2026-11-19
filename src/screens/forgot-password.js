import React, { useState } from 'react';
import { View, Text, Image, Animated, Pressable } from 'react-native';
import api from '../services/api';
import { getApiErrorMessage } from '../services/apiError';
import { FadeIn, AuthField, PrimaryButton, authStyles as s } from '../components/auth-kit';
import AuthLayout from '../components/AuthLayout';
import StatusMessage from '../components/StatusMessage';
import useShake from '../hooks/useShake';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const { shakeStyle, shake } = useShake();

  function showError(message) {
    setSent(false);
    setError(message);
    shake();
  }

  async function handleSend() {
    if (loading) return;

    if (!email.trim()) {
      showError('Preencha o e-mail.');
      return;
    }

    setError('');
    setSent(false);
    setLoading(true);

    try {
      await api.post('/auth/forgot-password', { email: email.trim() }, { timeout: 90000 });
      setSent(true);
    } catch (err) {
      showError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <FadeIn style={s.header}>
        <Image source={require('../../assets/logo.png')} style={s.logo} resizeMode="contain" />
        <Text style={s.title}>Redefinir senha</Text>
        <Text style={[s.subtitle, { paddingHorizontal: 8 }]}>
          Digite o e-mail da sua conta e enviaremos um link para criar uma nova senha.
        </Text>
      </FadeIn>

      <FadeIn delay={100}>
        <Animated.View style={shakeStyle}>
          <AuthField
            icon="mail-outline"
            placeholder="E-mail"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setSent(false);
              setError('');
            }}
            keyboardType="email-address"
            editable={!loading}
            onSubmitEditing={handleSend}
          />

          <PrimaryButton label="Enviar link" onPress={handleSend} loading={loading} />
        </Animated.View>

        {sent && (
          <StatusMessage
            icon="mail-outline"
            iconSize={20}
            message="Se este e-mail estiver cadastrado, você receberá um link em instantes."
            style={{ marginTop: 16 }}
          />
        )}
        {error !== '' && <Text style={[s.error, { textAlign: 'center', marginTop: 16 }]}>{error}</Text>}
      </FadeIn>

      <View style={{ flex: 1, minHeight: 24 }} />

      <FadeIn delay={200} style={s.footer}>
        <Text style={s.footerText}>Lembrou a senha?</Text>
        <Pressable onPress={() => navigation.navigate('SignIn')}>
          <Text style={s.footerLink}>Entrar</Text>
        </Pressable>
      </FadeIn>
    </AuthLayout>
  );
}