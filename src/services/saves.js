import AsyncStorage from '@react-native-async-storage/async-storage';

const INDEX_KEY = 'saves:index';
const STATE_PREFIX = 'saves:state:';

export async function listSaves() {
  try {
    const raw = await AsyncStorage.getItem(INDEX_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export async function addSave(game, stateBase64) {
  const id = String(Date.now());
  const meta = {
    id,
    gameId: game.id,
    title: game.title,
    console: game.console,
    image: game.image,
    fileUrl: game.fileUrl,
    createdAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(STATE_PREFIX + id, stateBase64);
  const saves = await listSaves();
  await AsyncStorage.setItem(INDEX_KEY, JSON.stringify([meta, ...saves]));
  return meta;
}

export async function getSaveState(id) {
  return AsyncStorage.getItem(STATE_PREFIX + id);
}

export async function removeSave(id) {
  const saves = await listSaves();
  await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(saves.filter((s) => s.id !== id)));
  await AsyncStorage.removeItem(STATE_PREFIX + id);
}