import { io } from 'socket.io-client';
import api from './api';
import { TEST_MODE } from './mock';

let socket = null;

// ---------- Modo de teste: conversas em memória, sem API ----------
const testConversations = {}; // id da conversa -> lista de mensagens
let testListener = null;
let testCounter = 1;

const TEST_REPLIES = [
  'Bora! Cria uma sala aí 🎮',
  'Hahaha boa',
  'Já tô pronto, me chama',
  'Show! Qual jogo vai ser?',
  'Beleza, te espero na sala',
];

function newId() {
  return 'm' + Date.now() + '-' + testCounter++;
}

function friendIdFrom(conversationId) {
  return String(conversationId).replace('test-', '');
}

export function conectar(aoReceber) {
  if (TEST_MODE) {
    testListener = aoReceber;
    return;
  }
  if (!socket) {
    const url = api.defaults.baseURL.replace('/api', '');
    socket = io(url, { transports: ['websocket'] });
  }
  socket.off('new_message');
  socket.on('new_message', aoReceber);
}

export function desconectar() {
  if (TEST_MODE) {
    testListener = null;
    return;
  }
  socket?.disconnect();
  socket = null;
}

export function entrarNaConversa(id) {
  if (TEST_MODE) return;
  socket?.emit('join_conversation', id);
}

export function sairDaConversa(id) {
  if (TEST_MODE) return;
  socket?.emit('leave_conversation', id);
}

export async function abrirConversa(friendId) {
  if (TEST_MODE) {
    const id = 'test-' + friendId;
    if (!testConversations[id]) {
      testConversations[id] = [
        {
          id: newId(),
          conversationId: id,
          senderId: friendId,
          content: 'E aí! Bora jogar?',
          createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
        },
      ];
    }
    return { id };
  }
  const res = await api.post('/chat/conversations/direct', { friendId });
  return res.data.data.conversation;
}

export async function buscarMensagens(conversaId) {
  if (TEST_MODE) return [...(testConversations[conversaId] || [])];
  const res = await api.get(`/chat/conversations/${conversaId}/messages`);
  return res.data.data.messages;
}

export async function enviarMensagem(conversaId, content) {
  if (TEST_MODE) {
    const list = testConversations[conversaId] || (testConversations[conversaId] = []);

    const mine = {
      id: newId(),
      conversationId: conversaId,
      senderId: 'me',
      content,
      createdAt: new Date().toISOString(),
    };
    list.push(mine);
    testListener?.(mine);

    // Resposta simulada do amigo
    setTimeout(() => {
      const reply = {
        id: newId(),
        conversationId: conversaId,
        senderId: friendIdFrom(conversaId),
        content: TEST_REPLIES[list.length % TEST_REPLIES.length],
        createdAt: new Date().toISOString(),
      };
      list.push(reply);
      testListener?.(reply);
    }, 1200);
    return;
  }
  await api.post(`/chat/conversations/${conversaId}/messages`, { content });
}