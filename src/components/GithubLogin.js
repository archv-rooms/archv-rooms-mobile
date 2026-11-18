import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, PressableScale, authStyles as s } from './auth-kit';
import { showAlert } from './AppModal';

function googleSoon() {
  // TODO: ligar ao login do Google
  showAlert('Google', 'Login com Google em breve.');
}

function githubSoon() {
  // TODO: ligar ao OAuth do GitHub
  showAlert('GitHub', 'Login com GitHub em breve.');
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
export default function GithubLogin({
  onGooglePress = googleSoon,
  onPress = githubSoon,
  spacing = 24,
}) {
  return (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: spacing }}>
        <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.12)' }} />
        <Text style={s.link}>ou</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.12)' }} />
      </View>

      <PressableScale onPress={onGooglePress} style={buttonStyle} scale={0.96}>
        <Ionicons name="logo-google" size={20} color="#fff" />
        <Text style={labelStyle}>Continuar com Google</Text>
      </PressableScale>

      <View style={{ height: 12 }} />

      <PressableScale onPress={onPress} style={buttonStyle} scale={0.96}>
        <Ionicons name="logo-github" size={20} color="#fff" />
        <Text style={labelStyle}>Continuar com GitHub</Text>
      </PressableScale>
    </>
  );
}