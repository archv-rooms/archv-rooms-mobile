import React, { useState } from 'react';
import { View, Text, Image, Animated, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { getApiErrorMessage } from '../services/apiError';
import { showAlert } from '../components/AppModal';
import { COLORS, FONT, FadeIn, AuthField, PrimaryButton, authStyles as s } from '../components/auth-kit';
import AuthLayout from '../components/AuthLayout';
import PasswordField from '../components/PasswordField';
import GithubLogin from '../components/GithubLogin';
import StatusMessage from '../components/StatusMessage';
import useShake from '../hooks/useShake';

// Keeps only digits and formats them as DD/MM/YYYY while typing
function formatBirthDate(text) {
  const digits = text.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

// Returns true only for a real calendar date that is not in the future
function isValidBirthDate(value) {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return false;

  const day = Number(value.slice(0, 2));
  const month = Number(value.slice(3, 5));
  const year = Number(value.slice(6, 10));

  if (year < 1900) return false;

  const date = new Date(year, month - 1, day);
  const isRealDate =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day;

  return isRealDate && date <= new Date();
}

export default function SignUpScreen({ navigation }) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { shakeStyle, shake } = useShake();

  function showError(message) {
    setError(message);
    shake();
  }

  function showBirthInfo() {
    showAlert(
      'Data de nascimento',
      'Usamos sua data de nascimento para confirmar que você tem idade para usar o archv-rooms.'
    );
  }

  // After sign up, show the onboarding; it ends at the login screen
  function goToOnboarding() {
    navigation.navigate('Onboarding', { fromSignUp: true });
  }

  async function handleSignUp() {
    if (loading) return;

    if (!name.trim() || !username.trim() || !email.trim() || !password) {
      showError('Preencha nome, nick, e-mail e senha.');
      return;
    }

    if (birthDate !== '' && !isValidBirthDate(birthDate)) {
      showError('Data de nascimento inválida. Use o formato DD/MM/AAAA.');
      return;
    }

    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      await api.post(
        '/auth/register',
        { name: name.trim(), username: username.trim(), email: email.trim(), password },
        { timeout: 90000 }
      );
      setSuccess(true);
    } catch (err) {
      showError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <FadeIn style={[s.header, { marginBottom: 24 }]}>
        <Image source={require('../../assets/logo.png')} style={[s.logo, { width: 72, height: 72 }]} resizeMode="contain" />
        <Text style={s.title}>Criar conta</Text>
        <Text style={s.subtitle}>Entre no Archv Rooms e comece a jogar</Text>
      </FadeIn>

      <FadeIn delay={100}>
        <Animated.View style={shakeStyle}>
          <AuthField icon="person-outline" placeholder="Nome" value={name} onChangeText={setName} autoCapitalize="words" editable={!loading} />
          <AuthField icon="at-outline" placeholder="Nick" value={username} onChangeText={setUsername} autoCapitalize="none" editable={!loading} />

          {/* Date of birth is not sent to the API */}
          <AuthField
            icon="calendar-outline"
            placeholder="Data de nascimento (DD/MM/AAAA)"
            value={birthDate}
            onChangeText={(text) => setBirthDate(formatBirthDate(text))}
            keyboardType="number-pad"
            editable={!loading}
            right={
              <Pressable onPress={showBirthInfo} hitSlop={10}>
                <Ionicons name="information-circle-outline" size={22} color={COLORS.muted} />
              </Pressable>
            }
          />

          <AuthField
            icon="mail-outline"
            placeholder="E-mail"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />
          <PasswordField
            value={password}
            onChangeText={setPassword}
            editable={!loading}
            onSubmitEditing={handleSignUp}
          />

          {error !== '' && <Text style={[s.error, { textAlign: 'center' }]}>{error}</Text>}
          {success && (
            <StatusMessage
              icon="checkmark-circle"
              message="Conta criada! Já pode entrar com seu nick."
              actionLabel="Continuar"
              onAction={goToOnboarding}
              style={{ marginBottom: 12 }}
            />
          )}

          <PrimaryButton label="Criar conta" onPress={handleSignUp} loading={loading} />
        </Animated.View>
      </FadeIn>

      <Text style={{ fontFamily: FONT.normal, color: COLORS.muted, textAlign: 'center', fontSize: 14, marginTop: 14 }}>
        Ao continuar, você concorda com os Termos e a Política de Privacidade.
      </Text>

      <FadeIn delay={200}>
        <GithubLogin spacing={20} />
      </FadeIn>

      <FadeIn delay={280} style={[s.footer, { marginTop: 24 }]}>
        <Text style={s.footerText}>Já tem conta?</Text>
        <Pressable onPress={() => navigation.navigate('SignIn')}>
          <Text style={s.footerLink}>Entrar</Text>
        </Pressable>
      </FadeIn>
    </AuthLayout>
  );
}