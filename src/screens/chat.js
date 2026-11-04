import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  conectar,
  desconectar,
  entrarNaConversa,
  sairDaConversa,
  abrirConversa,
  buscarMensagens,
  enviarMensagem,
} from '../services/chat';

const ROXO = '#6A5BD6';
const SUPERFICIE = '#4B4163';
const SUAVE = '#B8B0C8';

export default function ChatScreen({ navigation, route }) {
  const { friend } = route.params;
  const [mensagens, setMensagens] = useState([]);
  const [texto, setTexto] = useState('');
  const conversaId = useRef(null);
  const lista = useRef(null);

  useEffect(() => {
    async function iniciar() {
      try {
        const conversa = await abrirConversa(friend.id);
        conversaId.current = conversa.id;

        conectar((msg) => {
          if (msg.conversationId !== conversaId.current) return;
          setMensagens((atuais) =>
            atuais.some((m) => m.id === msg.id) ? atuais : [...atuais, msg]
          );
        });
        entrarNaConversa(conversa.id);

        setMensagens(await buscarMensagens(conversa.id));
      } catch (e) {}
    }
    iniciar();

    return () => {
      if (conversaId.current) sairDaConversa(conversaId.current);
      desconectar();
    };
  }, []);

  async function enviar() {
    const conteudo = texto.trim();
    if (!conteudo || !conversaId.current) return;
    setTexto('');
    try {
      await enviarMensagem(conversaId.current, conteudo);
    } catch (e) {}
  }

  function renderMensagem({ item }) {
    const minha = item.senderId !== friend.id;
    return (
      <View style={[styles.balao, minha ? styles.minha : styles.deles]}>
        <Text style={styles.balaoTexto}>{item.content}</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={['#1E1830', '#3A2F55', '#5B4A7A']} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.topo}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.voltar}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.titulo}>{friend.username || friend.name}</Text>
        </View>

        <FlatList
          ref={lista}
          data={mensagens}
          keyExtractor={(m) => String(m.id)}
          renderItem={renderMensagem}
          onContentSizeChange={() => lista.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        />

        <View style={styles.entrada}>
          <TextInput
            style={styles.input}
            placeholder="Message"
            placeholderTextColor={SUAVE}
            value={texto}
            onChangeText={setTexto}
            onSubmitEditing={enviar}
          />
          <TouchableOpacity style={styles.enviar} onPress={enviar}>
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  topo: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  voltar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  balao: {
    maxWidth: '78%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginBottom: 8,
  },
  minha: { alignSelf: 'flex-end', backgroundColor: ROXO },
  deles: { alignSelf: 'flex-start', backgroundColor: SUPERFICIE },
  balaoTexto: { color: '#fff', fontSize: 16 },
  entrada: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  input: {
    flex: 1,
    height: 48,
    backgroundColor: SUPERFICIE,
    borderRadius: 24,
    paddingHorizontal: 18,
    color: '#fff',
    fontSize: 16,
  },
  enviar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: ROXO,
    alignItems: 'center',
    justifyContent: 'center',
  },
});