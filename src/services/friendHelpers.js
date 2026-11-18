import { GREEN, SOFT, TEXT_MUTED } from '../constants/palette';

// Cor da bolinha de quem está offline (só usada nas telas de amigos e chat)
export const OFFLINE_DOT = '#6E6586';

const AVATAR_COLORS = ['#8E7CF0', '#FF6B8A', '#3F8CFF', '#FFB23C', '#7CE06B', '#C77CFF', '#FF4D4D'];

// O mesmo nome sempre recebe a mesma cor
export function colorFor(name) {
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

// Texto e cor de cada status de amigo
export function statusInfo(friend) {
  if (friend.status === 'playing') {
    return { label: friend.game ? 'Jogando ' + friend.game : 'Jogando', color: SOFT, dot: SOFT };
  }
  if (friend.status === 'online') return { label: 'Online', color: GREEN, dot: GREEN };
  if (friend.status === 'offline') return { label: 'Offline', color: TEXT_MUTED, dot: OFFLINE_DOT };
  return null;
}