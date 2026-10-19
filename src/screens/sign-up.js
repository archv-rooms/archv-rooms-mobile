import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../services/api';

export default function SignUpScreen({ navigation }) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const showBirthInfo = () => {
    Alert.alert(
      'Date of Birth',
      'We use your date of birth to confirm you are old enough to use archv-rooms.'
    );
  };

  async function handleSignUp() {
    if (loading) return;

    if (!name.trim() || !username.trim() || !email.trim() || !password) {
      setError('Preencha nome, username, e-mail e senha.');
      return;
    }

    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      // timeout maior porque a API pode demorar para "acordar"
      await api.post(
        '/auth/register',
        {
          name: name.trim(),
          username: username.trim(),
          email: email.trim(),
          password,
        },
        { timeout: 90000 }
      );
      setSuccess(true);
    } catch (err) {
      const apiMessage = err?.response?.data?.message;

      if (apiMessage) {
        setError(apiMessage);
      } else if (err?.code === 'ECONNABORTED') {
        setError('O servidor demorou para responder. Tente novamente.');
      } else {
        setError('Não foi possível conectar ao servidor. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient colors={['#1E1830', '#3A2F55', '#5B4A7A']} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Voltar */}
          <TouchableOpacity
            style={styles.back}
            onPress={() => navigation.canGoBack() && navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={26} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.title}>Create Account</Text>

          {/* Nome */}
          <TextInput
            style={styles.input}
            placeholder="Name"
            placeholderTextColor="#B8B0C8"
            value={name}
            onChangeText={setName}
            editable={!loading}
          />

          {/* Username */}
          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor="#B8B0C8"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            editable={!loading}
          />

          {/* Data de nascimento (não é enviada para a API) */}
          <View style={styles.fieldBox}>
            <TextInput
              style={styles.fieldInput}
              placeholder="Date of Birth"
              placeholderTextColor="#B8B0C8"
              value={birthDate}
              onChangeText={setBirthDate}
              keyboardType="numbers-and-punctuation"
              editable={!loading}
            />
            <TouchableOpacity onPress={showBirthInfo}>
              <Ionicons name="information-circle-outline" size={22} color="#E6E0F0" />
            </TouchableOpacity>
          </View>

          {/* Email */}
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#B8B0C8"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
          />

          {/* Senha */}
          <View style={styles.fieldBox}>
            <TextInput
              style={styles.fieldInput}
              placeholder="Password"
              placeholderTextColor="#B8B0C8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              editable={!loading}
              onSubmitEditing={handleSignUp}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                size={22}
                color="#E6E0F0"
              />
            </TouchableOpacity>
          </View>

          {/* Mensagens */}
          {error !== '' && <Text style={styles.error}>{error}</Text>}

          {success && (
            <View>
              <Text style={styles.success}>
                Conta criada! Verifique seu e-mail para ativar a conta antes de entrar.
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
                <Text style={styles.goLogin}>Go to Log In</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Botão cadastrar */}
          <TouchableOpacity
            style={[styles.signUpButton, loading && styles.buttonDisabled]}
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.signUpText}>Sign up</Text>
            )}
          </TouchableOpacity>

          {/* Termos */}
          <Text style={styles.terms}>
            By continuing, you agree to our Terms and Privacy Policy.
          </Text>

          {/* Google */}
          <TouchableOpacity style={styles.googleButton}>
            <Text style={styles.googleText}>Continue with Google</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 40,
  },
  back: {
    marginBottom: 20,
    width: 40,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#4B4163',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    color: '#fff',
    marginBottom: 14,
  },
  fieldBox: {
    backgroundColor: '#4B4163',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  fieldInput: {
    flex: 1,
    color: '#fff',
    height: '100%',
  },
  error: {
    color: '#FF9AA8',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 14,
  },
  success: {
    color: '#9BE7B0',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 8,
  },
  goLogin: {
    color: '#fff',
    fontSize: 13,
    textAlign: 'center',
    textDecorationLine: 'underline',
    marginBottom: 14,
  },
  signUpButton: {
    backgroundColor: '#5A4E75',
    borderRadius: 26,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  signUpText: {
    color: '#fff',
    fontSize: 15,
  },
  terms: {
    color: '#9A90B0',
    textAlign: 'center',
    fontSize: 11,
    marginTop: 14,
    marginBottom: 16,
  },
  googleButton: {
    backgroundColor: '#5A4E75',
    borderRadius: 26,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleText: {
    color: '#fff',
    fontSize: 14,
  },
});