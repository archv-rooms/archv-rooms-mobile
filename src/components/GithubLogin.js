import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, PressableScale, authStyles as s } from './auth-kit';
import { showAlert } from './AppModal';
import { TOKEN_KEY } from '../services/api';

const BACKEND_URL = 'https://archv-rooms-service.onrender.com';

// Link que o backend usa para voltar ao app
function getReturnUrl() {
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
  alignItems: 'center',
  justifyContent: 'center',
  width: 52,
  height: 52,
  borderRadius: 26,
  backgroundColor: COLORS.surface,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.08)',
};

// Divisor "ou" + botões redondos do Google e do GitHub
export default function GithubLogin({ onSuccess, spacing = 16 }) {
  return (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: spacing }}>
        <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.12)' }} />
        <Text style={s.link}>ou</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.12)' }} />
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16 }}>
        <PressableScale
          onPress={() => loginWithProvider('google', 'Google', onSuccess)}
          style={buttonStyle}
          scale={0.92}
        >
          <Ionicons name="logo-google" size={22} color="#fff" />
        </PressableScale>

        <PressableScale
          onPress={() => loginWithProvider('github', 'GitHub', onSuccess)}
          style={buttonStyle}
          scale={0.92}
        >
          <Ionicons name="logo-github" size={22} color="#fff" />
        </PressableScale>
      </View>
    </>
  );
}