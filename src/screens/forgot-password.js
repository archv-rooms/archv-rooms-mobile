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
    setError(message);
    shake();
  }

  async function handleSend() {
    if (loading) return;

    if (!email.trim()) {
      showError('Digite o seu e-mail.');
      return;
    }

    setError('');
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

  function goToLogin() {
    navigation.reset({ index: 0, routes: [{ name: 'SignIn' }] });
  }

  return (
    <AuthLayout>
      <FadeIn style={s.header}>
        <Image source={require('../../assets/logo.png')} style={s.logo} resizeMode="contain" />
        <Text style={s.title}>Esqueceu a senha?</Text>
        <Text style={[s.subtitle, { paddingHorizontal: 8 }]}>
          Digite o seu e-mail e enviaremos um link para criar uma nova senha.
        </Text>
      </FadeIn>

      <FadeIn delay={100}>
        {sent ? (
          <>
            <StatusMessage
              icon="checkmark-circle-outline"
              iconSize={20}
              message="Se o e-mail existir, enviamos um link para redefinir a senha."
              style={{ marginBottom: 16 }}
            />
            <PrimaryButton label="Voltar ao login" onPress={goToLogin} />
          </>
        ) : (
          <>
            <Animated.View style={shakeStyle}>
              <AuthField
                icon="mail-outline"
                placeholder="E-mail"
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  setError('');
                }}
                keyboardType="email-address"
              />
              <PrimaryButton label="Enviar link" onPress={handleSend} loading={loading} />
            </Animated.View>

            {error !== '' && (
              <Text style={[s.error, { textAlign: 'center', marginTop: 16 }]}>{error}</Text>
            )}
          </>
        )}
      </FadeIn>

      <View style={{ flex: 1, minHeight: 24 }} />

      <FadeIn delay={200} style={s.footer}>
        <Pressable onPress={goToLogin}>
          <Text style={s.footerLink}>Voltar ao login</Text>
        </Pressable>
      </FadeIn>
    </AuthLayout>
  );
}