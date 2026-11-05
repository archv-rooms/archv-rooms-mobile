import { Vibration } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAudioPlayer } from 'expo-audio';

export const SETTINGS_KEY = 'app_settings';
export const DEFAULTS = { sound: true, vibration: true, notifications: true };

// Guarda os ajustes na memória para qualquer tela consultar na hora
let current = { ...DEFAULTS };
let clickPlayer = null;

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

// Toca o clique só se o ajuste de sons estiver ligado
export function playClick() {
  if (!current.sound) return;
  try {
    if (!clickPlayer) {
      clickPlayer = createAudioPlayer(require('../../assets/click.wav'));
    }
    clickPlayer.seekTo(0);
    clickPlayer.play();
  } catch (e) {}
}

// Feedback de toque: vibra (se ligado) e toca o clique (se ligado).
// Todas as telas já chamam vibrate(), então o som vale no app todo.
export function vibrate(ms = 20) {
  if (current.vibration) Vibration.vibrate(ms);
  playClick();
}

// Carrega os ajustes salvos assim que o app abre
loadSettings();