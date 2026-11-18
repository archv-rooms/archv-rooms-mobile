import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import {
  FONT_SEMI,
  FONT_BOLD,
  SURFACE,
  WHITE,
  TEXT_MUTED,
  BUTTON_PURPLE,
} from '../constants/palette';

// Cor usada só neste modal (botão de ação destrutiva)
const DANGER = '#E5484D';

let externalShow = null;

// Use no lugar de Alert.alert(titulo, mensagem, botoes)
export function showAlert(title, message, buttons) {
  if (externalShow) externalShow(title, message, buttons);
}

const Ctx = createContext(null);
export const useAlert = () => useContext(Ctx);

export function AlertProvider({ children }) {
  const [state, setState] = useState(null);
  const stateRef = useRef(null);

  const show = useCallback((title, message, buttons) => {
    const list = buttons && buttons.length ? buttons : [{ text: 'OK' }];
    stateRef.current = { title, message, buttons: list };
    setState(stateRef.current);
  }, []);

  externalShow = show;

  const close = (btn) => {
    setState(null);
    if (btn && btn.onPress) btn.onPress();
  };

  return (
    <Ctx.Provider value={show}>
      {children}
      <Modal
        visible={!!state}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => close(null)}
      >
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Text style={styles.title}>{state?.title}</Text>
            {!!state?.message && <Text style={styles.message}>{state.message}</Text>}

            <View style={styles.actions}>
              {state?.buttons.map((btn, i) => {
                const isCancel = btn.style === 'cancel';
                const isDestructive = btn.style === 'destructive';
                return (
                  <Pressable
                    key={i}
                    onPress={() => close(btn)}
                    style={({ pressed }) => [
                      styles.btn,
                      isCancel
                        ? styles.btnGhost
                        : { backgroundColor: isDestructive ? DANGER : BUTTON_PURPLE },
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={isCancel ? styles.btnGhostText : styles.btnText}>
                      {btn.text}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </Ctx.Provider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: SURFACE,
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  title: { fontFamily: FONT_BOLD, color: WHITE, fontSize: 19 },
  message: { fontFamily: FONT_SEMI, color: TEXT_MUTED, fontSize: 14, marginTop: 8, lineHeight: 20 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 10, marginTop: 22 },
  btn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14 },
  btnGhost: { backgroundColor: 'rgba(255,255,255,0.08)' },
  btnText: { fontFamily: FONT_BOLD, color: WHITE, fontSize: 14 },
  btnGhostText: { fontFamily: FONT_BOLD, color: TEXT_MUTED, fontSize: 14 },
  pressed: { opacity: 0.7 },
});