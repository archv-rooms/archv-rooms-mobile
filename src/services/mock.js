import { Platform } from 'react-native';

// Switch to false when the Render API is back
export const TEST_MODE = true;

// On web, use the site's own address (works on the PC and on Netlify)
const BASE = Platform.OS === 'web' ? window.location.origin : 'http://localhost:8081';

export const TEST_GAMES = [
  { id: 't0', title: 'From Below', console: 'NES', fileUrl: BASE + '/from-below.nes', image: BASE + '/from.png' },
  { id: 't5', title: 'Böbl', console: 'NES', fileUrl: BASE + '/bobl.nes', image: BASE + '/bolb.png' },
  { id: 't6', title: 'Spacegulls', console: 'NES', fileUrl: BASE + '/spacegulls.nes', image: BASE + '/spacegulls.png' },
  { id: 't7', title: 'Street Fighter II', console: 'NES', fileUrl: BASE + '/streetFighterII.nes', image: BASE + '/street.png' },
  { id: 't8', title: 'Mortal Kombat', console: 'SFC', fileUrl: BASE + '/kombat.sfc', image: BASE + '/mkk.png' },
  { id: 't9', title: 'Metroid II Return of Samus', console: 'SFC', fileUrl: BASE + '/MetroidII-Return-of-Samus.gb', image: BASE + '/metroid.png' },
  { id: 't10', title: 'Super Mario World', console: 'SFC', fileUrl: BASE + '/Super-Mario-World.sfc', image: BASE + '/supermario.png' },
];

export const TEST_FRIENDS = [
  { id: 'u1', name: 'Lucas', username: 'lucas', status: 'playing', game: 'Super Mario World' },
  { id: 'u2', name: 'Ana', username: 'ana', status: 'online', game: null },
  { id: 'u3', name: 'Pedro', username: 'pedro', status: 'offline', game: null },
];

export const TEST_PENDING = [
  { id: 'f10', name: 'Marina', username: 'marina' },
  { id: 'f11', name: 'Caio', username: 'caio' },
];

export const MOCK_ROOMS = [
  { id: 'r1', game: 'Street Fighter II', host: 'lucas', players: 1, maxPlayers: 2 },
  { id: 'r2', game: 'Mortal Kombat', host: 'ana', players: 1, maxPlayers: 2 },
  { id: 'r3', game: 'Super Mario World', host: 'pedro', players: 2, maxPlayers: 2 },
];