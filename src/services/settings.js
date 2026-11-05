import { Vibration } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SETTINGS_KEY = 'app_settings';
export const DEFAULTS = { sound: true, vibration: true, notifications: true };

// Guarda os ajustes na memória para qualquer tela consultar na hora
let current = { ...DEFAULTS };

export async function loadSettings() {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (raw) current = { ...DEFAULTS, ...JSON.parse(raw) };
  } catch (e) {}
  return current;
}

export function getSettings() {
  return current;
}

export async function saveSettings(next) {
  current = next;
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  } catch (e) {}
}

// Vibra só se o ajuste estiver ligado
export function vibrate(ms = 20) {
  if (current.vibration) Vibration.vibrate(ms);
}

// Carrega os ajustes salvos assim que o app abre
loadSettings();