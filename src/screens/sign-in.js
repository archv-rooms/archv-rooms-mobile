import React, { useState } from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { TOKEN_KEY } from '../services/api';
import { showAlert } from '../components/AppModal';
import { FadeIn, AuthField, PrimaryButton, authStyles as s } from '../components/auth-kit';
import AuthLayout from '../components/AuthLayout';
import PasswordField from '../components/PasswordField';
import GithubLogin from '../components/GithubLogin';

export default function SignInScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  function goHome() {
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  }

  async function handleLogin() {
    if (busy) return;
    if (!username.trim() || !password) {
      showAlert('Campos vazios', 'Preencha o nick e a senha para entrar.');
      return;
    }
    setBusy(true);
    try {
      const res = await api.post('/auth/login', { username: username.trim(), password });
      await AsyncStorage.setItem(TOKEN_KEY, res.data.data.token);
      goHome();
    } catch (e) {
      showAlert('Erro', 'Nick ou senha incorretos.');
    }
    setBusy(false);
  }

  // Modo convidado: remove qualquer token antigo e entra sem login
  async function handleGuest() {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
    } catch (e) {}
    goHome();
  }

  return (
    <AuthLayout>
      <FadeIn style={s.header}>
        <Image source={require('../../assets/logo.png')} style={s.logo} resizeMode="contain" />
        <Text style={s.title}>Bem-vindo de volta</Text>
        <Text style={s.subtitle}>Entre para continuar jogando</Text>
      </FadeIn>

      <FadeIn delay={100}>
        <AuthField
          icon="at-outline"
          placeholder="Nick"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        <PasswordField value={password} onChangeText={setPassword} onSubmitEditing={handleLogin} />

        <Pressable
          style={{ alignSelf: 'flex-end', paddingVertical: 4, marginBottom: 18 }}
          onPress={() => navigation.navigate('ForgotPassword')}
        >
          <Text style={s.link}>Esqueceu a senha?</Text>
        </Pressable>

        <PrimaryButton label="Entrar" onPress={handleLogin} />
      </FadeIn>

      <FadeIn delay={200}>
        <GithubLogin spacing={24} onSuccess={goHome} />
      </FadeIn>

      <FadeIn delay={240}>
        <Pressable
          style={{ alignSelf: 'center', paddingVertical: 12, marginTop: 8 }}
          onPress={handleGuest}
        >
          <Text style={s.link}>Jogar como convidado</Text>
        </Pressable>
      </FadeIn>

      <View style={{ flex: 1, minHeight: 24 }} />

      <FadeIn delay={280} style={s.footer}>
        <Text style={s.footerText}>Não tem conta?</Text>
        <Pressable onPress={() => navigation.navigate('SignUp')}>
          <Text style={s.footerLink}>Criar conta</Text>
        </Pressable>
      </FadeIn>
    </AuthLayout>
  );
}