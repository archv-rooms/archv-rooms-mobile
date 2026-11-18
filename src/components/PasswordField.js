import React, { useState } from 'react';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, AuthField } from './auth-kit';

// Password input with the show/hide eye button
export default function PasswordField(props) {
  const [visible, setVisible] = useState(false);

  return (
    <AuthField
      icon="lock-closed-outline"
      placeholder="Senha"
      {...props}
      secureTextEntry={!visible}
      right={
        <Pressable onPress={() => setVisible(!visible)} hitSlop={10}>
          <Ionicons name={visible ? 'eye-outline' : 'eye-off-outline'} size={22} color={COLORS.muted} />
        </Pressable>
      }
    />
  );
}