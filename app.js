import React, { useState, useRef } from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import SignInScreen from './src/screens/sign-in';
import SignUpScreen from './src/screens/sign-up';
import ForgotPasswordScreen from './src/screens/forgot-password';
import ChooseUsernameScreen from './src/screens/choose-username';
import HomeScreen from './src/screens/home';
import GameScreen from './src/screens/game';
import FriendsScreen from './src/screens/friends';
import ChatScreen from './src/screens/chat';
import RoomsScreen from './src/screens/rooms';
import LobbyScreen from './src/screens/room';
import ProfileScreen from './src/screens/profile';
import RankingScreen from './src/screens/ranking';
import SettingsScreen from './src/screens/settings';
import AboutScreen from './src/screens/about';
import OnboardingScreen, { ONBOARDING_KEY } from './src/screens/onboarding';
import BottomTabBar from './src/components/BottomTabBar';
import { AlertProvider } from './src/components/AppModal';
import api, { TOKEN_KEY } from './src/services/api';

const Stack = createNativeStackNavigator();
const navigationRef = createNavigationContainerRef();

export default function App() {
  const [currentRoute, setCurrentRoute] = useState('SignIn');
  const usernameChecked = useRef(false);

  // Se a conta não tem username (login Google/GitHub), abre a tela para escolher
  async function needsUsername() {
    if (usernameChecked.current) return false;
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (!token) return false;
      const res = await api.get('/user/profile');
      const user = res.data && res.data.data && res.data.data.user;
      if (!user) return false;
      usernameChecked.current = true;
      return !user.username;
    } catch (e) {
      return false;
    }
  }

  async function updateCurrentRoute() {
    const route = navigationRef.getCurrentRoute();
    if (!route) return;
    setCurrentRoute(route.name);

    if (route.name === 'Home') {
      if (await needsUsername()) {
        navigationRef.reset({ index: 0, routes: [{ name: 'ChooseUsername' }] });
        return;
      }

      // First time reaching Home after login: show the onboarding once
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
    usernameChecked.current = false;
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
    } catch (e) {}
    navigationRef.reset({ index: 0, routes: [{ name: 'SignIn' }] });
  }

  return (
    <AlertProvider>
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
          <Stack.Screen name="ChooseUsername" component={ChooseUsernameScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Game" component={GameScreen} />
          <Stack.Screen name="Friends" component={FriendsScreen} />
          <Stack.Screen name="Rooms" component={RoomsScreen} />
          <Stack.Screen name="Lobby" component={LobbyScreen} />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Ranking" component={RankingScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="About" component={AboutScreen} />
        </Stack.Navigator>

        <BottomTabBar
          currentRoute={currentRoute}
          onNavigate={(name) => navigationRef.navigate(name)}
          onSignOut={signOut}
        />
      </NavigationContainer>
    </AlertProvider>
  );
}