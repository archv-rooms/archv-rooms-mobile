import api from './api';

export async function listFriends() {
  const res = await api.get('/friends');
  return res.data.data;
}

export async function listPending() {
  const res = await api.get('/friends/pending');
  return res.data.data;
}

export async function searchUsers(text) {
  const res = await api.get('/friends/search', { params: { q: text } });
  return res.data.data;
}

export async function sendFriendRequest(receiverId) {
  return api.post('/friends/request', { receiverId });
}

export async function respondToRequest(friendshipId, status) {
  return api.patch(`/friends/${friendshipId}/respond`, { status });
}