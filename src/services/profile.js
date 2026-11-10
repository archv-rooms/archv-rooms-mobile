import AsyncStorage from '@react-native-async-storage/async-storage';

export const PROFILE_KEY = 'profile';

export const DEFAULT_PROFILE = {
  name: 'Jogador',
  bio: '',
  color: '#8E7CF0',
  photo: null,
  favoriteGame: null,
};

export async function loadProfile() {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_KEY);
    if (raw) return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch (e) {}
  return { ...DEFAULT_PROFILE };
}

export async function saveProfile(profile) {
  try {
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    return true;
  } catch (e) {
    return false;
  }
}