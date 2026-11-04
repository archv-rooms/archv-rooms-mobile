import api from './api';

export async function listarAmigos() {
  const res = await api.get('/friends');
  return res.data.data;
}

export async function listarPendentes() {
  const res = await api.get('/friends/pending');
  return res.data.data;
}

export async function buscarUsuarios(texto) {
  const res = await api.get('/friends/search', { params: { q: texto } });
  return res.data.data;
}

export function convidar(receiverId) {
  return api.post('/friends/request', { receiverId });
}

export function responder(friendshipId, status) {
  return api.patch(`/friends/${friendshipId}/respond`, { status });
}