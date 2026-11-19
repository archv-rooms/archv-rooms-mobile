import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

const TOKEN_KEY = 'archv_token';

async function hasToken() {
  try {
    return !!(await AsyncStorage.getItem(TOKEN_KEY));
  } catch (e) {
    return false;
  }
}

function extractList(res) {
  const body = res && res.data;
  if (Array.isArray(body)) return body;
  if (body && Array.isArray(body.data)) return body.data;
  if (body && body.data && Array.isArray(body.data.games)) return body.data.games;
  return [];
}

function parseSaveData(data) {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch (e) {
      return null;
    }
  }
  return data || null;
}

// Lista os saves da nuvem (slots) de todos os jogos.
// O id de cada item é "gameId:slot".
export async function listSaves() {
  if (!(await hasToken())) return [];
  try {
    const games = extractList(await api.get('/games')).filter((g) => g && g.fileUrl);

    const perGame = await Promise.all(
      games.map(async (game) => {
        try {
          const slots = extractList(await api.get('/saves/' + game.id));
          return slots
            .filter((s) => {
              const data = parseSaveData(s.saveData);
              return data && typeof data.state === 'string';
            })
            .map((s) => ({
              id: game.id + ':' + s.slot,
              gameId: game.id,
              slot: s.slot,
              title: game.title + ' (Slot ' + s.slot + ')',
              console: game.console,
              image: game.image,
              fileUrl: game.fileUrl,
              createdAt: s.updatedAt,
            }));
        } catch (e) {
          return [];
        }
      })
    );

    return perGame
      .flat()
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  } catch (e) {
    return [];
  }
}

// Salva o estado (base64) no slot, na nuvem
export async function addSave(game, stateBase64, slot) {
  if (!(await hasToken())) throw new Error('NO_LOGIN');
  await api.post('/saves/' + game.id, { slot, saveData: { state: stateBase64 } });
  return { gameId: game.id, slot };
}

// Busca o estado (base64) de um save pelo id "gameId:slot"
export async function getSaveState(id) {
  const parts = String(id).split(':');
  const gameId = parts[0];
  const slot = Number(parts[1]);
  const slots = extractList(await api.get('/saves/' + gameId));
  const found = slots.find((s) => Number(s.slot) === slot);
  const data = found ? parseSaveData(found.saveData) : null;
  return data && typeof data.state === 'string' ? data.state : null;
}
// Apaga o save pelo id "gameId:slot"
export async function removeSave(id) {
  const parts = String(id).split(':');
  const gameId = parts[0];
  const slot = Number(parts[1]);
  await api.delete('/saves/' + gameId + '/' + slot);
}