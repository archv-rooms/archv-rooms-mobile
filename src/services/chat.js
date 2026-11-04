import { io } from 'socket.io-client';
import api from './api';

let socket = null;

export function conectar(aoReceber) {
  if (!socket) {
    const url = api.defaults.baseURL.replace('/api', '');
    socket = io(url, { transports: ['websocket'] });
  }
  socket.off('new_message');
  socket.on('new_message', aoReceber);
}

export function desconectar() {
  socket?.disconnect();
  socket = null;
}

export function entrarNaConversa(id) {
  socket?.emit('join_conversation', id);
}

export function sairDaConversa(id) {
  socket?.emit('leave_conversation', id);
}

export async function abrirConversa(friendId) {
  const res = await api.post('/chat/conversations/direct', { friendId });
  return res.data.data.conversation;
}

export async function buscarMensagens(conversaId) {
  const res = await api.get(`/chat/conversations/${conversaId}/messages`);
  return res.data.data.messages;
}

export async function enviarMensagem(conversaId, content) {
  await api.post(`/chat/conversations/${conversaId}/messages`, { content });
}