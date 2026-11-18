import { GREEN, SOFT, TEXT_MUTED } from '../constants/palette';
import { avatarColor } from './roomHelpers';

// Cor da bolinha de quem está offline (só usada nas telas de amigos e chat)
export const OFFLINE_DOT = '#6E6586';

// O mesmo nome sempre recebe a mesma cor
export function colorFor(name) {
  return avatarColor(name);
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