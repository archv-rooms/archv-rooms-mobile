import api from './api';
import { TEST_MODE, TEST_FRIENDS, TEST_PENDING } from './mock';

export async function listFriends() {
  if (TEST_MODE) return TEST_FRIENDS;
  const res = await api.get('/friends');
  return res.data.data;
}

export async function listPending() {
  if (TEST_MODE) return TEST_PENDING;
  const res = await api.get('/friends/pending');
  return res.data.data;
}

export async function searchUsers(text) {
  if (TEST_MODE) {
    const query = text.toLowerCase();
    return [...TEST_FRIENDS, ...TEST_PENDING].filter(
      (user) => user.name.toLowerCase().includes(query) || user.username.includes(query)
    );
  }
  const res = await api.get('/friends/search', { params: { q: text } });
  return res.data.data;
}

export async function sendFriendRequest(receiverId) {
  if (TEST_MODE) return { ok: true };
  return api.post('/friends/request', { receiverId });
}

export async function respondToRequest(friendshipId, status) {
  if (TEST_MODE) return { ok: true };
  return api.patch(`/friends/${friendshipId}/respond`, { status });
}