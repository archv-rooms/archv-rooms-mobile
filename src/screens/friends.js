import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TOKEN_KEY } from '../services/api';
import {
  listarAmigos,
  listarPendentes,
  buscarUsuarios,
  convidar,
  responder,
} from '../services/friends';

const ROXO = '#6A5BD6';
const SUPERFICIE = '#4B4163';
const SUAVE = '#B8B0C8';

export default function FriendsScreen({ navigation }) {
  const [logado, setLogado] = useState(true);
  const [amigos, setAmigos] = useState([]);
  const [pendentes, setPendentes] = useState([]);
  const [busca, setBusca] = useState('');
  const [resultados, setResultados] = useState([]);

  async function carregar() {
    try {
      setAmigos(await listarAmigos());
      setPendentes(await listarPendentes());
    } catch (e) {}
  }

  useEffect(() => {
    async function iniciar() {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (!token) {
        setLogado(false);
        return;
      }
      carregar();
    }
    iniciar();
  }, []);

  async function pesquisar(texto) {
    setBusca(texto);
    if (!texto.trim()) {
      setResultados([]);
      return;
    }
    try {
      setResultados(await buscarUsuarios(texto));
    } catch (e) {}
  }

  async function enviarConvite(id) {
    try {
      await convidar(id);
      setResultados(resultados.map((u) => (u.id === id ? { ...u, requestSent: true } : u)));
    } catch (e) {}
  }

  async function responderConvite(id, status) {
    try {
      await responder(id, status);
      carregar();
    } catch (e) {}
  }

  function nomeDe(u) {
    return u.username || u.name || 'User';
  }

  return (
    <LinearGradient colors={['#1E1830', '#3A2F55', '#5B4A7A']} style={{ flex: 1 }}>
      <View style={styles.container}>
        <View style={styles.topo}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.voltar}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.titulo}>Friends</Text>
        </View>

        {!logado ? (
          <View style={styles.vazio}>
            <Ionicons name="lock-closed-outline" size={36} color={SUAVE} />
            <Text style={styles.vazioTexto}>Log in with your account to see your friends</Text>
          </View>
        ) : (
          <>
            <View style={styles.busca}>
              <Ionicons name="search-outline" size={20} color={SUAVE} />
              <TextInput
                style={styles.buscaInput}
                placeholder="Search users"
                placeholderTextColor={SUAVE}
                value={busca}
                onChangeText={pesquisar}
                autoCapitalize="none"
              />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {busca.trim() !== '' &&
                resultados.map((u) => (
                  <View key={u.id} style={styles.linha}>
                    <Text style={styles.nome}>{nomeDe(u)}</Text>
                    <TouchableOpacity
                      style={[styles.botao, u.requestSent && { opacity: 0.5 }]}
                      disabled={u.requestSent}
                      onPress={() => enviarConvite(u.id)}
                    >
                      <Text style={styles.botaoTexto}>{u.requestSent ? 'Sent' : 'Add'}</Text>
                    </TouchableOpacity>
                  </View>
                ))}

              {busca.trim() === '' && pendentes.length > 0 && (
                <>
                  <Text style={styles.secao}>Requests</Text>
                  {pendentes.map((p) => (
                    <View key={p.id} style={styles.linha}>
                      <Text style={styles.nome}>{nomeDe(p.sender || p.user || p)}</Text>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity
                          style={styles.botao}
                          onPress={() => responderConvite(p.id, 'accepted')}
                        >
                          <Text style={styles.botaoTexto}>Accept</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.botao, { backgroundColor: SUPERFICIE }]}
                          onPress={() => responderConvite(p.id, 'rejected')}
                        >
                          <Text style={styles.botaoTexto}>Decline</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </>
              )}

              {busca.trim() === '' && (
                <>
                  <Text style={styles.secao}>Friends</Text>
                  {amigos.length === 0 && <Text style={styles.vazioTexto}>No friends yet</Text>}
                  {amigos.map((a) => (
                    <TouchableOpacity
                      key={a.id}
                      style={styles.linha}
                      onPress={() => navigation.navigate('Chat', { friend: a })}
                    >
                      <Text style={styles.nome}>{nomeDe(a)}</Text>
                      <Ionicons name="chatbubble-outline" size={20} color={SUAVE} />
                    </TouchableOpacity>
                  ))}
                </>
              )}
            </ScrollView>
          </>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 60 },
  topo: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  voltar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  busca: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: SUPERFICIE,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    marginBottom: 8,
  },
  buscaInput: { flex: 1, color: '#fff', fontSize: 17 },
  secao: { color: SUAVE, fontSize: 15, marginTop: 18, marginBottom: 8 },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: SUPERFICIE,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 10,
  },
  nome: { color: '#fff', fontSize: 17, fontWeight: '600' },
  botao: {
    backgroundColor: ROXO,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  botaoTexto: { color: '#fff', fontWeight: '600' },
  vazio: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  vazioTexto: { color: SUAVE, fontSize: 16, textAlign: 'center' },
});