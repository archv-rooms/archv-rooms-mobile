import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONT, PressableScale, authStyles as s } from './auth-kit';
import { showAlert } from './AppModal';
import { TOKEN_KEY } from '../services/api';

const BACKEND_URL = 'https://archv-rooms-service.onrender.com';

// Link que o backend usa para voltar ao app
function getReturnUrl() {
  const host = Constants.expoConfig?.hostUri;
  // Rodando pelo Metro/túnel (Expo Go): usa o link exp://
  if (host) {
    return `exp://${host}/--/auth`;
  }
  // App instalado: usa o esquema do app
  return Linking.createURL('auth');
}

async function loginWithProvider(provider, label, onSuccess) {
  try {
    const returnUrl = getReturnUrl();
    const authUrl = `${BACKEND_URL}/auth/${provider}?app=${encodeURIComponent(returnUrl)}`;

    const result = await WebBrowser.openAuthSessionAsync(authUrl, returnUrl);
    if (result.type !== 'success') return; // usuário fechou o navegador

    const { queryParams } = Linking.parse(result.url);
    if (queryParams?.error || !queryParams?.token) {
      showAlert(label, `Não foi possível entrar com o ${label}.`);
      return;
    }

    await AsyncStorage.setItem(TOKEN_KEY, String(queryParams.token));
    if (onSuccess) onSuccess();
  } catch (e) {
    showAlert(label, `Não foi possível entrar com o ${label}.`);
  }
}

const buttonStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  height: 54,
  borderRadius: 27,
  backgroundColor: COLORS.surface,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.08)',
};

const labelStyle = { fontFamily: FONT.semi, color: '#fff', fontSize: 18 };

// "ou" divider + Continue with Google and GitHub buttons
export default function GithubLogin({ onSuccess, spacing = 24 }) {
  return (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: spacing }}>
        <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.12)' }} />
        <Text style={s.link}>ou</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.12)' }} />
      </View>

      <PressableScale
        onPress={() => loginWithProvider('google', 'Google', onSuccess)}
        style={buttonStyle}
        scale={0.96}
      >
        <Ionicons name="logo-google" size={20} color="#fff" />
        <Text style={labelStyle}>Continuar com Google</Text>
      </PressableScale>

      <View style={{ height: 12 }} />

      <PressableScale
        onPress={() => loginWithProvider('github', 'GitHub', onSuccess)}
        style={buttonStyle}
        scale={0.96}
      >
        <Ionicons name="logo-github" size={20} color="#fff" />
        <Text style={labelStyle}>Continuar com GitHub</Text>
      </PressableScale>
    </>
  );
}