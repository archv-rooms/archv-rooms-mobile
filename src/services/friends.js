import api from './api';
import { MODO_TESTE, AMIGOS_TESTE, PENDENTES_TESTE } from './mock';

export async function listarAmigos() {
  if (MODO_TESTE) return AMIGOS_TESTE;
  const res = await api.get('/friends');
  return res.data.data;
}

export async function listarPendentes() {
  if (MODO_TESTE) return PENDENTES_TESTE;
  const res = await api.get('/friends/pending');
  return res.data.data;
}

export async function buscarUsuarios(texto) {
  if (MODO_TESTE) {
    const t = texto.toLowerCase();
    return [...AMIGOS_TESTE, ...PENDENTES_TESTE].filter(
      (u) => u.name.toLowerCase().includes(t) || u.username.includes(t)
    );
  }
  const res = await api.get('/friends/search', { params: { q: texto } });
  return res.data.data;
}

export async function convidar(receiverId) {
  if (MODO_TESTE) return { ok: true };
  return api.post('/friends/request', { receiverId });
}

export async function responder(friendshipId, status) {
  if (MODO_TESTE) return { ok: true };
  return api.patch(`/friends/${friendshipId}/respond`, { status });
}