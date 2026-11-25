import React, { useState, useRef, useEffect } from 'react';
import { View, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as NavigationBar from 'expo-navigation-bar';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import SignInScreen from './src/screens/sign-in';
import SignUpScreen from './src/screens/sign-up';
import ForgotPasswordScreen from './src/screens/forgot-password';
import ChooseUsernameScreen from './src/screens/choose-username';
import VerifyEmailScreen from './src/screens/verify-email';
import ResetPasswordScreen from './src/screens/reset-password';
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
import { registerForPush } from './src/services/push';

const Stack = createNativeStackNavigator();
const navigationRef = createNavigationContainerRef();

const linking = {
  prefixes: ['https://archv-rooms-web.vercel.app', 'archvroomsmobile://'],
  config: {
    screens: {
      VerifyEmail: 'verify-email',
      ResetPassword: 'reset-password',
    },
  },
};

// Espaço reservado embaixo em todas as telas
const TAB_BAR_SPACE = 96;

// Telas que ocupam a tela inteira, sem espaço reservado embaixo
const FULLSCREEN_ROUTES = ['Game'];

// Tela que abre ao tocar na notificação, conforme o tipo
const PUSH_SCREEN = {
  message: 'Friends',
  friend_request: 'Friends',
  friend_accepted: 'Friends',
  room_full: 'Rooms',
};

// Esconde a barra de navegação do Android (voltar, início, recentes)
async function hideAndroidBar() {
  if (Platform.OS !== 'android') return;
  try {
    await NavigationBar.setVisibilityAsync('hidden');
  } catch (e) {}
}

export default function App() {
  const [currentRoute, setCurrentRoute] = useState('SignIn');
  const usernameChecked = useRef(false);
  const pushRegistered = useRef(false);

  // Esconde a barra do Android ao abrir o app
  useEffect(() => {
    hideAndroidBar();
  }, []);

  // Ao tocar numa notificação, abre a tela correspondente
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data || {};
      const screen = PUSH_SCREEN[data.type];
      if (screen && navigationRef.isReady()) {
        navigationRef.navigate(screen);
      }
    });
    return () => sub.remove();
  }, []);

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

  // Registra o aparelho para receber notificações (uma vez por sessão, só com login)
  async function setupPush() {
    if (pushRegistered.current) return;
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (!token) return;
      pushRegistered.current = true;
      await registerForPush();
    } catch (e) {}
  }

  async function updateCurrentRoute() {
    const route = navigationRef.getCurrentRoute();
    if (!route) return;
    setCurrentRoute(route.name);

    // Garante que a barra do Android continue escondida a cada tela
    hideAndroidBar();

    if (route.name === 'Home') {
      if (await needsUsername()) {
        navigationRef.reset({ index: 0, routes: [{ name: 'ChooseUsername' }] });
        return;
      }

      setupPush();

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
    pushRegistered.current = false;
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
    } catch (e) {}
    navigationRef.reset({ index: 0, routes: [{ name: 'SignIn' }] });
  }

  const fullscreen = FULLSCREEN_ROUTES.includes(currentRoute);

  return (
    <AlertProvider>
      <NavigationContainer
        ref={navigationRef}
        linking={linking}
        onReady={updateCurrentRoute}
        onStateChange={updateCurrentRoute}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: fullscreen ? '#000' : '#14111F',
            paddingBottom: fullscreen ? 0 : TAB_BAR_SPACE,
          }}
        >
          <Stack.Navigator
            initialRouteName="SignIn"
            screenOptions={{ headerShown: false, animation: 'fade' }}
          >
            <Stack.Screen name="SignIn" component={SignInScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
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
        </View>

        <BottomTabBar
          currentRoute={currentRoute}
          onNavigate={(name) => navigationRef.navigate(name)}
          onSignOut={signOut}
        />
      </NavigationContainer>
    </AlertProvider>
  );
}