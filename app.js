import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import SignInScreen from './src/screens/sign-in';
import SignUpScreen from './src/screens/sign-up';
import ForgotPasswordScreen from './src/screens/forgot-password';
import HomeScreen from './src/screens/home';
import GameScreen from './src/screens/game';
import { TOKEN_KEY } from './src/services/api';
import { MODO_TESTE } from './src/services/mock';

const Stack = createNativeStackNavigator();

// Telas provisórias — troquem pelo conteúdo real quando estiverem prontas
function PlaceholderScreen({ route }) {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderText}>{route.name}</Text>
      <Text style={styles.placeholderSubtext}>Tela ainda não implementada</Text>
    </View>
  );
}

export default function App() {
  const [checking, setChecking] = useState(true);
  const [initialRoute, setInitialRoute] = useState('SignIn');

  useEffect(() => {
    async function checkToken() {
      try {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        setInitialRoute(token || MODO_TESTE ? 'Home' : 'SignIn');
      } catch (e) {
        setInitialRoute(MODO_TESTE ? 'Home' : 'SignIn');
      } finally {
        setChecking(false);
      }
    }
    checkToken();
  }, []);

  if (checking) {
    return (
      <View style={styles.placeholder}>
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="SignIn" component={SignInScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Game" component={GameScreen} />
        <Stack.Screen name="Onboarding" component={PlaceholderScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111018',
  },
  placeholderText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  placeholderSubtext: {
    color: '#7070a0',
    marginTop: 8,
  },
});