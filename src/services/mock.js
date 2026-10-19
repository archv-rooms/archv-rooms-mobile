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
    image: BASE + '/from.png',
  },
  {
    id: 't5',
    title: 'Böbl',
    console: 'NES',
    fileUrl: BASE + '/bobl.nes',
    image: BASE + '/bolb.png',
  },
  {
    id: 't6',
    title: 'Spacegulls',
    console: 'NES',
    fileUrl: BASE + '/spacegulls.nes',
    image: BASE + '/spacegulls.png',
  },
  {
    id: 't7',
    title: 'Street Fighter II',
    console: 'NES',
    fileUrl: BASE + '/streetFighterII.nes',
    image: BASE + '/street.png',
  },
  {
    id: 't8',
    title: 'Mortal Kombat',
    console: 'SFC',
    fileUrl: BASE + '/kombat.sfc',
    image: BASE + '/mkk.png',
  },
  {
    id: 't9',
    title: 'Metroid II Return of Samus',
    console: 'SFC',
    fileUrl: BASE + '/MetroidII-Return-of-Samus.gb',
    image: BASE + '/metroid.png',
  },
  {
    id: 't10',
    title: 'Super Mario World',
    console: 'SFC',
    fileUrl: BASE + '/Super-Mario-World.sfc',
    image: BASE + '/supermario.png',
  },

];