import React, { useState } from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import SignInScreen from './src/screens/sign-in';
import SignUpScreen from './src/screens/sign-up';
import ForgotPasswordScreen from './src/screens/forgot-password';
import HomeScreen from './src/screens/home';
import GameScreen from './src/screens/game';
import FriendsScreen from './src/screens/friends';
import ChatScreen from './src/screens/chat';
import RoomsScreen from './src/screens/rooms';
import LobbyScreen from './src/screens/room';
import ProfileScreen from './src/screens/profile';
import SettingsScreen from './src/screens/settings';
import AboutScreen from './src/screens/about';
import OnboardingScreen, { ONBOARDING_KEY } from './src/screens/onboarding';
import BottomTabBar from './src/components/BottomTabBar';
import { TOKEN_KEY } from './src/services/api';

const Stack = createNativeStackNavigator();
const navigationRef = createNavigationContainerRef();

export default function App() {
  const [currentRoute, setCurrentRoute] = useState('SignIn');

  async function updateCurrentRoute() {
    const route = navigationRef.getCurrentRoute();
    if (!route) return;
    setCurrentRoute(route.name);

    // First time reaching Home after login: show the onboarding once
    if (route.name === 'Home') {
      let seen = null;
      try {
        seen = await AsyncStorage.getItem(ONBOARDING_KEY);
      } catch (e) {}
      if (!seen) {
        navigationRef.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
      }
    }
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
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Game" component={GameScreen} />
        <Stack.Screen name="Friends" component={FriendsScreen} />
        <Stack.Screen name="Rooms" component={RoomsScreen} />
        <Stack.Screen name="Lobby" component={LobbyScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="About" component={AboutScreen} />
      </Stack.Navigator>

      <BottomTabBar
        currentRoute={currentRoute}
        onNavigate={(name) => navigationRef.navigate(name)}
        onSignOut={signOut}
      />
    </NavigationContainer>
  );
}