import { SOFT, RED, GREEN } from '../constants/palette';

// Jogos reais carregados da API (preenchido pela tela de Salas)
let gamesCache = [];

export function setGamesCache(list) {
  gamesCache = Array.isArray(list) ? list : [];
}

export function findGame(title) {
  return gamesCache.find((g) => g.title === title) || null;
}

// Só o status usa cor (aberta, cheia, na sala)
export function getStatus(joined, full) {
  if (joined) return { label: 'NA SALA', color: SOFT, pulse: false };
  if (full) return { label: 'CHEIA', color: RED, pulse: false };
  return { label: 'ABERTA', color: GREEN, pulse: true };
}

export function hostLabel(room) {
  return room.isHost ? 'Sua sala' : 'Sala de ' + room.host;
}

const ACCENTS = ['#8B7BFF', '#F0649A', '#F5A524', '#2FC4DB', '#4ADE80', '#FB7C3C'];
const AVATAR_COLORS = ['#8E7CF0', '#FF6B8A', '#3F8CFF', '#FFB23C', '#7CE06B', '#C77CFF', '#FF4D4D'];

function sumOf(name) {
  let sum = 0;
  const text = String(name || '');
  for (let i = 0; i < text.length; i++) sum += text.charCodeAt(i);
  return sum;
}

// O mesmo nome sempre recebe a mesma cor
export function getAccent(name) {
  return ACCENTS[sumOf(name) % ACCENTS.length];
}

export function avatarColor(name) {
  return AVATAR_COLORS[sumOf(name) % AVATAR_COLORS.length];
}