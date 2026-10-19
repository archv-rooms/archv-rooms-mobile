import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function SignInScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  return (
    <LinearGradient colors={['#1E1830', '#3A2F55', '#5B4A7A']} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Voltar */}
        <TouchableOpacity
          style={styles.back}
          onPress={() => navigation.canGoBack() && navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.title}>Log In</Text>

        {/* Email */}
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#B8B0C8"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        {/* Senha */}
        <View style={styles.passwordBox}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            placeholderTextColor="#B8B0C8"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? 'eye-outline' : 'eye-off-outline'}
              size={22}
              color="#E6E0F0"
            />
          </TouchableOpacity>
        </View>

        {/* Botão entrar */}
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.loginText}>Log in</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.forgot}>Forgot Password</Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }} />

        {/* Google */}
        <TouchableOpacity style={styles.googleButton}>
          <Ionicons name="logo-google" size={18} color="#fff" />
          <Text style={styles.googleText}>Continue with Google</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  passwordBox: {
    backgroundColor: '#4B4163',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  passwordInput: {
    flex: 1,
    color: '#fff',
    height: '100%',
  },
  loginButton: {
    backgroundColor: '#5A4E75',
    borderRadius: 26,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginText: {
    color: '#fff',
    fontSize: 15,
  },
  forgot: {
    color: '#9A90B0',
    textAlign: 'center',
    marginTop: 18,
    fontSize: 13,
  },
  googleButton: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#5A4E75',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  googleText: {
    color: '#fff',
    fontSize: 13,
  },
});