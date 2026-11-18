import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Endereço da API do archv-rooms (o mesmo que o site usa)
export const API_URL = 'https://archv-rooms-service.onrender.com/api';

export const TOKEN_KEY = 'archv_token';

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

// Envia o token salvo em todas as chamadas, quando existir
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;