import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  Image,
  Modal,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Rajdhani_600SemiBold, Rajdhani_700Bold } from '@expo-google-fonts/rajdhani';
import { useFonts } from 'expo-font';
import api from '../services/api';
import { TEST_GAMES } from '../services/mock';
import { vibrate } from '../services/settings';
import { loadProfile, saveProfile, DEFAULT_PROFILE } from '../services/profile';
import { showAlert } from '../components/AppModal';
import {
  FONT_SEMI,
  FONT_BOLD,
  BG_TOP,
  BG_BOTTOM,
  SURFACE,
  SURFACE_LIGHT,
  ACCENT,
  BUTTON_PURPLE,
  WHITE,
  TEXT_MUTED,
  GREEN,
  RED,
} from '../constants/palette';

const AVATAR_COLORS = ['#8E7CF0', '#FF6B8A', '#3F8CFF', '#FFB23C', '#7CE06B', '#C77CFF', '#2FC4DB', '#FB7C3C'];
const GAMES = TEST_GAMES.map((g) => g.title);

const NAME_MAX = 20;
const BIO_MAX = 80;

// Avatar reutilizável: foto, ou inicial com a cor escolhida
export function Avatar({ profile, size = 40 }) {
  const color = profile.color || ACCENT;
  if (profile.photo) {
    return (
      <Image
        source={{ uri: profile.photo }}
        style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: color }}
      />
    );
  }
  const initial = (profile.name || '?').trim().charAt(0).toUpperCase() || '?';
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 2,
        borderColor: color,
        backgroundColor: color + '30',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontFamily: FONT_BOLD, color, fontSize: size * 0.45 }}>{initial}</Text>
    </View>
  );
}

function Stat({ icon, value, label }) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={20} color={ACCENT} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function ProfileScreen({ navigation }) {
  const [fontsLoaded] = useFonts({ Rajdhani_600SemiBold, Rajdhani_700Bold });
  const [saved, setSaved] = useState(DEFAULT_PROFILE);
  const [draft, setDraft] = useState(DEFAULT_PROFILE);
  const [loaded, setLoaded] = useState(false);
  const [showAvatar, setShowAvatar] = useState(false);
  const [focusField, setFocusField] = useState(null);
  const [notice, setNotice] = useState('');
  const [username, setUsername] = useState('');
  const [stats, setStats] = useState({ matches: '-', rank: '-', friends: '-' });

  const dirty = loaded && JSON.stringify(saved) !== JSON.stringify(draft);
  const dirtyRef = useRef(false);
  dirtyRef.current = dirty;

  useEffect(() => {
    async function start() {
      let p = await loadProfile();

      // Nome e username reais da conta (se tiver login)
      let accountUsername = '';
      try {
        const res = await api.get('/user/profile');
        const user = res.data && res.data.data && res.data.data.user;
        if (user) {
          accountUsername = user.username || '';
          if (user.name) p = { ...p, name: user.name.slice(0, NAME_MAX) };
        }
      } catch (e) {}

      setUsername(accountUsername);
      setSaved(p);
      setDraft(p);
      setLoaded(true);

      // Estatísticas reais
      try {
        const friendsRes = await api.get('/friends');
        const friendsList = (friendsRes.data && friendsRes.data.data) || [];
        setStats((s) => ({ ...s, friends: String(friendsList.length) }));
      } catch (e) {}

      if (accountUsername) {
        try {
          const res = await api.get('/leaderboard/profile/' + accountUsername);
          const d = res.data && res.data.data;
          if (d) {
            setStats((s) => ({
              ...s,
              matches: String(d.totalMatches || 0),
              rank: d.rank ? '#' + d.rank : '-',
            }));
          }
        } catch (e) {}
      }
    }
    start();
  }, []);

  // Voltar com alterações não salvas (seta ou botão voltar do Android)
  useEffect(() => {
    return navigation.addListener('beforeRemove', (e) => {
      if (!dirtyRef.current || Platform.OS === 'web') return;
      e.preventDefault();
      showAlert('Descartar alterações?', 'Você tem alterações que ainda não foram salvas.', [
        { text: 'Continuar editando', style: 'cancel' },
        {
          text: 'Descartar',
          style: 'destructive',
          onPress: () => {
            dirtyRef.current = false;
            navigation.dispatch(e.data.action);
          },
        },
      ]);
    });
  }, []);

  function update(patch) {
    setDraft((d) => ({ ...d, ...patch }));
  }

  async function pickPhoto() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
      });
      if (!result.canceled && result.assets && result.assets[0]) {
        update({ photo: result.assets[0].uri });
      }
    } catch (e) {
      setShowAvatar(false);
      showAlert('Erro', 'Não foi possível abrir a galeria.');
      return;
    }
    setShowAvatar(false);
  }

  function removePhoto() {
    vibrate(15);
    update({ photo: null });
    setShowAvatar(false);
  }

  async function save() {
    const clean = { ...draft, name: draft.name.trim() || DEFAULT_PROFILE.name, bio: draft.bio.trim() };

    // Se o nome mudou e há conta logada, salva o nome no servidor
    if (clean.name !== saved.name && clean.name.length >= 2) {
      try {
        await api.patch('/user/name', { name: clean.name });
      } catch (e) {
        const status = e && e.response && e.response.status;
        if (status !== 401) {
          showAlert('Aviso', 'Não foi possível salvar o nome na conta. Ele foi salvo só neste celular.');
        }
      }
    }

    const ok = await saveProfile(clean);
    if (!ok) {
      showAlert('Erro', 'Não foi possível salvar o perfil.');
      return;
    }
    vibrate(40);
    setSaved(clean);
    setDraft(clean);
    setNotice('Perfil salvo');
    setTimeout(() => setNotice(''), 2500);
  }

  if (!fontsLoaded || !loaded) return <View style={{ flex: 1, backgroundColor: BG_TOP }} />;

  return (
    <LinearGradient colors={[BG_TOP, BG_BOTTOM]} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.back}>
            <Ionicons name="arrow-back" size={22} color={WHITE} />
          </Pressable>
          <Text style={styles.title}>Perfil</Text>
        </View>

        {notice !== '' && (
          <View style={styles.notice}>
            <Ionicons name="checkmark-circle" size={20} color={GREEN} />
            <Text style={styles.noticeText}>{notice}</Text>
          </View>
        )}

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {/* ---------- Avatar ---------- */}
          <View style={styles.avatarBlock}>
            <Pressable onPress={() => setShowAvatar(true)}>
              <Avatar profile={draft} size={120} />
              <View style={styles.cameraBadge}>
                <Ionicons name="camera" size={16} color={WHITE} />
              </View>
            </Pressable>
            <Text style={styles.avatarName} numberOfLines={1}>{draft.name.trim() || DEFAULT_PROFILE.name}</Text>
            {username !== '' && <Text style={styles.username}>@{username}</Text>}
            <Pressable onPress={() => setShowAvatar(true)}>
              <Text style={styles.editLink}>Editar avatar</Text>
            </Pressable>
          </View>

          {/* ---------- Estatísticas reais ---------- */}
          <View style={styles.statsRow}>
            <Stat icon="game-controller" value={stats.matches} label="PARTIDAS" />
            <Stat icon="trophy" value={stats.rank} label="RANKING" />
            <Stat icon="people" value={stats.friends} label="AMIGOS" />
          </View>

          {/* ---------- Nome ---------- */}
          <View style={styles.labelRow}>
            <Text style={styles.label}>NOME</Text>
            <Text style={styles.counter}>{draft.name.length}/{NAME_MAX}</Text>
          </View>
          <TextInput
            style={[styles.input, focusField === 'name' && styles.inputFocused]}
            value={draft.name}
            onChangeText={(t) => update({ name: t.slice(0, NAME_MAX) })}
            onFocus={() => setFocusField('name')}
            onBlur={() => setFocusField(null)}
            placeholder="Seu nome"
            placeholderTextColor={TEXT_MUTED}
          />

          {/* ---------- Bio ---------- */}
          <View style={styles.labelRow}>
            <Text style={styles.label}>BIO</Text>
            <Text style={styles.counter}>{draft.bio.length}/{BIO_MAX}</Text>
          </View>
          <TextInput
            style={[styles.input, styles.inputBio, focusField === 'bio' && styles.inputFocused]}
            value={draft.bio}
            onChangeText={(t) => update({ bio: t.slice(0, BIO_MAX) })}
            onFocus={() => setFocusField('bio')}
            onBlur={() => setFocusField(null)}
            placeholder="Fale um pouco sobre você"
            placeholderTextColor={TEXT_MUTED}
            multiline
          />

          {/* ---------- Jogo favorito ---------- */}
          <Text style={[styles.label, { marginTop: 18, marginBottom: 8 }]}>JOGO FAVORITO</Text>
          <View style={styles.gamesWrap}>
            {GAMES.map((g) => {
              const active = draft.favoriteGame === g;
              return (
                <Pressable
                  key={g}
                  onPress={() => {
                    vibrate(15);
                    update({ favoriteGame: active ? null : g });
                  }}
                  style={[styles.gameChip, active && styles.gameChipActive]}
                >
                  {active && <Ionicons name="star" size={13} color={WHITE} />}
                  <Text style={[styles.gameChipText, active && { color: WHITE }]}>{g}</Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        {/* ---------- Salvar ---------- */}
        <Pressable
          style={[styles.saveButton, !dirty && styles.saveButtonOff]}
          onPress={save}
          disabled={!dirty}
        >
          <Ionicons name="checkmark" size={20} color={dirty ? WHITE : TEXT_MUTED} />
          <Text style={[styles.saveText, !dirty && { color: TEXT_MUTED }]}>Salvar alterações</Text>
        </Pressable>
      </KeyboardAvoidingView>

      {/* ---------- Modal do avatar ---------- */}
      <Modal visible={showAvatar} transparent animationType="slide" onRequestClose={() => setShowAvatar(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowAvatar(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Avatar</Text>

            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <Avatar profile={draft} size={84} />
            </View>

            <Text style={styles.label}>COR</Text>
            <View style={styles.colorRow}>
              {AVATAR_COLORS.map((c) => {
                const active = draft.color === c;
                return (
                  <Pressable
                    key={c}
                    onPress={() => {
                      vibrate(15);
                      update({ color: c });
                    }}
                    style={[styles.colorDot, { backgroundColor: c }, active && styles.colorDotActive]}
                  >
                    {active && <Ionicons name="checkmark" size={16} color={WHITE} />}
                  </Pressable>
                );
              })}
            </View>

            <Pressable style={styles.optionButton} onPress={pickPhoto}>
              <Ionicons name="image-outline" size={20} color={WHITE} />
              <Text style={styles.optionText}>Escolher da galeria</Text>
            </Pressable>

            {draft.photo && (
              <Pressable style={[styles.optionButton, styles.optionDanger]} onPress={removePhoto}>
                <Ionicons name="trash-outline" size={20} color={RED} />
                <Text style={[styles.optionText, { color: RED }]}>Remover foto</Text>
              </Pressable>
            )}

            <Pressable style={styles.doneButton} onPress={() => setShowAvatar(false)}>
              <Text style={styles.optionText}>Pronto</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: Platform.OS === 'ios' ? 28 : 24,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontFamily: FONT_BOLD, color: WHITE, fontSize: 28, letterSpacing: 0.5 },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(74,222,128,0.14)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  noticeText: { fontFamily: FONT_BOLD, color: GREEN, fontSize: 16 },

  avatarBlock: { alignItems: 'center', marginTop: 6, marginBottom: 18 },
  cameraBadge: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: BUTTON_PURPLE,
    borderWidth: 3,
    borderColor: BG_TOP,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarName: { fontFamily: FONT_BOLD, color: WHITE, fontSize: 24, marginTop: 10 },
  username: { fontFamily: FONT_SEMI, color: TEXT_MUTED, fontSize: 15 },
  editLink: { fontFamily: FONT_BOLD, color: ACCENT, fontSize: 15, marginTop: 2 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    backgroundColor: SURFACE,
    borderRadius: 18,
    paddingVertical: 12,
  },
  statValue: { fontFamily: FONT_BOLD, color: WHITE, fontSize: 22 },
  statLabel: { fontFamily: FONT_BOLD, color: TEXT_MUTED, fontSize: 11, letterSpacing: 1 },

  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 8,
  },
  label: { fontFamily: FONT_BOLD, color: TEXT_MUTED, fontSize: 14, letterSpacing: 1.5 },
  counter: { fontFamily: FONT_SEMI, color: TEXT_MUTED, fontSize: 13 },
  input: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'transparent',
    paddingHorizontal: 16,
    height: 48,
    color: WHITE,
    fontFamily: FONT_SEMI,
    fontSize: 17,
  },
  inputBio: { height: 84, paddingTop: 12, textAlignVertical: 'top' },
  inputFocused: { borderColor: ACCENT, backgroundColor: SURFACE_LIGHT },

  gamesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gameChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: SURFACE,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  gameChipActive: { backgroundColor: BUTTON_PURPLE },
  gameChipText: { fontFamily: FONT_BOLD, color: TEXT_MUTED, fontSize: 14 },

  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 26,
    backgroundColor: BUTTON_PURPLE,
    marginTop: 8,
  },
  saveButtonOff: { backgroundColor: 'rgba(255,255,255,0.08)' },
  saveText: { fontFamily: FONT_BOLD, color: WHITE, fontSize: 17 },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: BG_BOTTOM,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 36,
  },
  modalTitle: { fontFamily: FONT_BOLD, color: WHITE, fontSize: 24, marginBottom: 12 },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10, marginBottom: 18 },
  colorDot: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorDotActive: { borderColor: WHITE },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: SURFACE,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 50,
    marginBottom: 10,
  },
  optionDanger: {
    backgroundColor: 'rgba(255,138,155,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,138,155,0.4)',
  },
  optionText: { fontFamily: FONT_BOLD, color: WHITE, fontSize: 16 },
  doneButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BUTTON_PURPLE,
    borderRadius: 16,
    height: 50,
    marginTop: 4,
  },
});