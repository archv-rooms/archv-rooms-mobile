import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, PressableScale, authStyles as s } from './auth-kit';
import { showAlert } from './AppModal';

function comingSoon() {
  // TODO: ligar ao OAuth do GitHub
  showAlert('GitHub', 'Login com GitHub em breve.');
}

// "ou" divider + Continue with GitHub button
export default function GithubLogin({ onPress = comingSoon, spacing = 24 }) {
  return (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: spacing }}>
        <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.12)' }} />
        <Text style={s.link}>ou</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.12)' }} />
      </View>

      <PressableScale
        onPress={onPress}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          height: 54,
          borderRadius: 27,
          backgroundColor: COLORS.surface,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.08)',
        }}
        scale={0.96}
      >
        <Ionicons name="logo-github" size={20} color="#fff" />
        <Text style={{ fontFamily: FONT.semi, color: '#fff', fontSize: 18 }}>Continuar com GitHub</Text>
      </PressableScale>
    </>
  );
}