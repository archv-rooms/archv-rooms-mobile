import React, { useState } from 'react';
import { View, Text, Image, Animated, Pressable } from 'react-native';
import api from '../services/api';
import { getApiErrorMessage } from '../services/apiError';
import { FadeIn, PrimaryButton, authStyles as s } from '../components/auth-kit';
import AuthLayout from '../components/AuthLayout';
import PasswordField from '../components/PasswordField';
import StatusMessage from '../components/StatusMessage';
import useShake from '../hooks/useShake';

export default function ResetPasswordScreen({ route, navigation }) {
  const token = route.params && route.params.token;

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const { shakeStyle, shake } = useShake();

  function showError(message) {
    setError(message);
    shake();
  }

  async function handleReset() {
    if (loading) return;

    if (!token) {
      showError('Link inválido ou expirado.');
      return;
    }
    if (!password || !confirm) {
      showError('Preencha os dois campos.');
      return;
    }
    if (password.length < 6) {
      showError('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      showError('As senhas não são iguais.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await api.post('/auth/reset-password', { token, password }, { timeout: 90000 });
      setDone(true);
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
        <Text style={s.title}>Nova senha</Text>
        <Text style={[s.subtitle, { paddingHorizontal: 8 }]}>
          Escolha uma nova senha para a sua conta.
        </Text>
      </FadeIn>

      <FadeIn delay={100}>
        {done ? (
          <>
            <StatusMessage
              icon="checkmark-circle-outline"
              iconSize={20}
              message="Senha redefinida com sucesso!"
              style={{ marginBottom: 16 }}
            />
            <PrimaryButton label="Ir para o login" onPress={goToLogin} />
          </>
        ) : (
          <>
            <Animated.View style={shakeStyle}>
              <PasswordField
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  setError('');
                }}
                placeholder="Nova senha"
              />
              <PasswordField
                value={confirm}
                onChangeText={(t) => {
                  setConfirm(t);
                  setError('');
                }}
                placeholder="Confirmar nova senha"
                onSubmitEditing={handleReset}
              />
              <PrimaryButton label="Salvar senha" onPress={handleReset} loading={loading} />
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