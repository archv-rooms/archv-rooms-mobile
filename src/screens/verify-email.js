import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import api from '../services/api';

export default function VerifyEmailScreen({ route, navigation }) {
  const token = route.params && route.params.token;
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setMessage('Token inválido ou expirado.');
      setStatus('error');
      return;
    }
    api
      .get('/auth/verify-email', { params: { token } })
      .then(() => setStatus('ok'))
      .catch((err) => {
        const msg = err && err.response && err.response.data && err.response.data.message;
        setMessage(msg || 'Token inválido ou expirado.');
        setStatus('error');
      });
  }, [token]);

  const goToLogin = () =>
    navigation.reset({ index: 0, routes: [{ name: 'SignIn' }] });

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#14111F',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      {status === 'loading' && <ActivityIndicator size="large" color="#fff" />}

      {status === 'ok' && (
        <>
          <Text style={{ color: '#fff', fontSize: 20, marginBottom: 16 }}>
            E-mail verificado com sucesso!
          </Text>
          <TouchableOpacity onPress={goToLogin}>
            <Text style={{ color: '#fff', fontSize: 16 }}>Ir para o login</Text>
          </TouchableOpacity>
        </>
      )}

      {status === 'error' && (
        <>
          <Text style={{ color: '#fff', fontSize: 20, marginBottom: 16, textAlign: 'center' }}>
            {message}
          </Text>
          <TouchableOpacity onPress={goToLogin}>
            <Text style={{ color: '#fff', fontSize: 16 }}>Voltar ao login</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}