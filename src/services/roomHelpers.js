import { TEST_GAMES, TEST_FRIENDS } from './mock';
import { SOFT, RED, GREEN } from '../constants/palette';

export const GAMES = TEST_GAMES.map((g) => g.title);
export const FRIEND_USERNAMES = TEST_FRIENDS.map((f) => f.username);

export function findGame(title) {
  return TEST_GAMES.find((g) => g.title === title) || null;
}

export function getCover(name) {
  const found = findGame(name);
  return found ? found.image : null;
}

// Only the status uses color (open, full, joined)
export function getStatus(joined, full) {
  if (joined) return { label: 'NA SALA', color: SOFT, pulse: false };
  if (full) return { label: 'CHEIA', color: RED, pulse: false };
  return { label: 'ABERTA', color: GREEN, pulse: true };
}

export function hostLabel(room) {
  return room.host === 'você' ? 'Sua sala' : 'Sala de ' + room.host;
}

const ACCENTS = ['#8B7BFF', '#F0649A', '#F5A524', '#2FC4DB', '#4ADE80', '#FB7C3C'];
const AVATAR_COLORS = ['#8E7CF0', '#FF6B8A', '#3F8CFF', '#FFB23C', '#7CE06B', '#C77CFF', '#FF4D4D'];

function sumOf(name) {
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return sum;
}

// Same name always gets the same color
export function getAccent(name) {
  return ACCENTS[sumOf(name) % ACCENTS.length];
}

export function avatarColor(name) {
  return AVATAR_COLORS[sumOf(name) % AVATAR_COLORS.length];
}