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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function goHome() {
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  }

  async function handleLogin() {
    // Empty fields skip the login and enter without an account (test access)
    if (!email.trim() || !password) {
      await AsyncStorage.removeItem(TOKEN_KEY);
      goHome();
      return;
    }
    try {
      const res = await api.post('/auth/login', { email: email.trim(), password });
      await AsyncStorage.setItem(TOKEN_KEY, res.data.data.token);
      goHome();
    } catch (e) {
      showAlert('Erro', 'E-mail ou senha incorretos.');
    }
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
          icon="mail-outline"
          placeholder="E-mail"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
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
        <GithubLogin spacing={24} />
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