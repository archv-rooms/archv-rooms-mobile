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
  conectar as connect,
  desconectar as disconnect,
  entrarNaConversa as joinConversation,
  sairDaConversa as leaveConversation,
  abrirConversa as openConversation,
  buscarMensagens as fetchMessages,
  enviarMensagem as sendMessage,
} from '../services/chat';

const PURPLE = '#6A5BD6';
const SURFACE = '#4B4163';
const MUTED = '#B8B0C8';

export default function ChatScreen({ navigation, route }) {
  const { friend } = route.params;
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const conversationId = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    async function start() {
      try {
        const conversation = await openConversation(friend.id);
        conversationId.current = conversation.id;

        // New messages arrive here; ignore duplicates and other conversations
        connect((message) => {
          if (message.conversationId !== conversationId.current) return;
          setMessages((current) =>
            current.some((m) => m.id === message.id) ? current : [...current, message]
          );
        });
        joinConversation(conversation.id);

        setMessages(await fetchMessages(conversation.id));
      } catch (e) {}
    }
    start();

    return () => {
      if (conversationId.current) leaveConversation(conversationId.current);
      disconnect();
    };
  }, []);

  async function send() {
    const content = text.trim();
    if (!content || !conversationId.current) return;
    setText('');
    try {
      await sendMessage(conversationId.current, content);
    } catch (e) {}
  }

  function renderMessage({ item }) {
    const isMine = item.senderId !== friend.id;
    return (
      <View style={[styles.bubble, isMine ? styles.mine : styles.theirs]}>
        <Text style={styles.bubbleText}>{item.content}</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={['#1E1830', '#3A2F55', '#5B4A7A']} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.top}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>{friend.username || friend.name}</Text>
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => String(m.id)}
          renderItem={renderMessage}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        />

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Message"
            placeholderTextColor={MUTED}
            value={text}
            onChangeText={setText}
            onSubmitEditing={send}
          />
          <TouchableOpacity style={styles.sendButton} onPress={send}>
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  bubble: {
    maxWidth: '78%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginBottom: 8,
  },
  mine: { alignSelf: 'flex-end', backgroundColor: PURPLE },
  theirs: { alignSelf: 'flex-start', backgroundColor: SURFACE },
  bubbleText: { color: '#fff', fontSize: 16 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  input: {
    flex: 1,
    height: 48,
    backgroundColor: SURFACE,
    borderRadius: 24,
    paddingHorizontal: 18,
    color: '#fff',
    fontSize: 16,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
});