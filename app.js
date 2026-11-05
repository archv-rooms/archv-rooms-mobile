import React, { useState } from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import SignInScreen from './src/screens/sign-in';
import SignUpScreen from './src/screens/sign-up';
import ForgotPasswordScreen from './src/screens/forgot-password';
import HomeScreen from './src/screens/home';
import GameScreen from './src/screens/game';
import FriendsScreen from './src/screens/friends';
import ChatScreen from './src/screens/chat';
import RoomsScreen from './src/screens/rooms';
import BottomTabBar from './src/components/BottomTabBar';
import { TOKEN_KEY } from './src/services/api';

const Stack = createNativeStackNavigator();
const navigationRef = createNavigationContainerRef();

function PlaceholderScreen({ route }) {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderText}>{route.name}</Text>
      <Text style={styles.placeholderSubtext}>Tela ainda não implementada</Text>
    </View>
  );
}

export default function App() {
  const [currentRoute, setCurrentRoute] = useState('SignIn');

  function updateCurrentRoute() {
    const route = navigationRef.getCurrentRoute();
    if (route) setCurrentRoute(route.name);
  }

  async function signOut() {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
    } catch (e) {}
    navigationRef.reset({ index: 0, routes: [{ name: 'SignIn' }] });
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={updateCurrentRoute}
      onStateChange={updateCurrentRoute}
    >
      <Stack.Navigator
        initialRouteName="SignIn"
        screenOptions={{ headerShown: false, animation: 'fade' }}
      >
        <Stack.Screen name="SignIn" component={SignInScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Game" component={GameScreen} />
        <Stack.Screen name="Friends" component={FriendsScreen} />
        <Stack.Screen name="Rooms" component={RoomsScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="Onboarding" component={PlaceholderScreen} />
      </Stack.Navigator>

      <BottomTabBar
        currentRoute={currentRoute}
        onNavigate={(name) => navigationRef.navigate(name)}
        onSignOut={signOut}
      />
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