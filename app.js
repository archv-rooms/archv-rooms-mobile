import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet } from 'react-native';

import SignInScreen from './src/screens/sign-in';

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
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="SignIn"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="SignIn" component={SignInScreen} />
        <Stack.Screen name="SignUp" component={PlaceholderScreen} />
        <Stack.Screen name="ForgotPassword" component={PlaceholderScreen} />
        <Stack.Screen name="Home" component={PlaceholderScreen} />
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