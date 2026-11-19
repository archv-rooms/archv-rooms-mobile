import React, { useState } from 'react';
import { Text } from 'react-native';
import api from '../services/api';
import { showAlert } from '../components/AppModal';
import { FadeIn, AuthField, PrimaryButton, authStyles as s } from '../components/auth-kit';
import AuthLayout from '../components/AuthLayout';

export default function ChooseUsernameScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSave() {
    if (busy) return;
    const value = username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(value)) {
      showAlert('Username inválido', 'Use de 3 a 20 letras, números ou _ (sem espaços).');
      return;
    }
    setBusy(true);
    try {
      await api.patch('/user/username', { username: value });
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } catch (e) {
      const msg =
        (e && e.response && e.response.data && e.response.data.message) ||
        'Não foi possível salvar o username.';
      showAlert('Erro', msg);
    }
    setBusy(false);
  }

  return (
    <AuthLayout>
      <FadeIn style={s.header}>
        <Text style={s.title}>Escolha seu nick</Text>
        <Text style={s.subtitle}>É assim que seus amigos vão te encontrar</Text>
      </FadeIn>

      <FadeIn delay={100}>
        <AuthField
          icon="at-outline"
          placeholder="username"
          value={username}
          onChangeText={setUsername}
        />
        <PrimaryButton label="Salvar" onPress={handleSave} />
      </FadeIn>
    </AuthLayout>
  );
}