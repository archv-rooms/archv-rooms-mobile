import { Platform } from 'react-native';

// Troque para false quando a API do Render voltar
export const MODO_TESTE = true;

// Na web usa o endereço do próprio site (funciona no PC e no Netlify)
const BASE = Platform.OS === 'web' ? window.location.origin : 'http://localhost:8081';

export const JOGOS_TESTE = [
  {
    id: 't0',
    title: 'From Below',
    console: 'NES',
    fileUrl: BASE + '/from-below.nes',
  },
  {
    id: 't5',
    title: 'Böbl',
    console: 'NES',
    fileUrl: BASE + '/bobl.nes',
  },
  {
    id: 't6',
    title: 'Spacegulls',
    console: 'NES',
    fileUrl: BASE + '/spacegulls.nes',
  },
  {
    id: 't7',
    title: 'Street Fighter II',
    console: 'NES',
    fileUrl: BASE + '/streetFighterII.nes',
  },
  { id: 't1', title: 'Super Mario World', console: 'SNES', exemplo: true },
  { id: 't2', title: 'Contra', console: 'NES', exemplo: true },
  { id: 't3', title: 'Sonic The Hedgehog', console: 'MD', exemplo: true },
  { id: 't4', title: 'Pokémon Red', console: 'GB', exemplo: true },
];