import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';

const CORES = {
  NES: 'nes',
  SNES: 'snes9x',
  SFC: 'snes9x',
  GBA: 'gba',
  GB: 'gambatte',
  GBC: 'gambatte',
  'GAME BOY': 'gambatte',
  N64: 'n64',
  PS1: 'pcsx_rearmed',
  PSX: 'pcsx_rearmed',
  MD: 'genesis_plus_gx',
  'MEGA DRIVE': 'genesis_plus_gx',
};

function getCore(consoleName) {
  return CORES[(consoleName || '').toUpperCase()] || 'nes';
}

function montarHtml(game) {
  const core = JSON.stringify(getCore(game.console));
  const url = JSON.stringify(game.fileUrl || '').replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<style>
  html, body { margin: 0; padding: 0; width: 100%; height: 100%; background: #000; overflow: hidden; }
  #game-container { width: 100%; height: 100%; }
</style>
</head>
<body>
<div id="game-container"></div>
<script>
  window.EJS_player = '#game-container';
  window.EJS_core = ${core};
  window.EJS_gameUrl = ${url};
  window.EJS_pathtodata = 'https://cdn.emulatorjs.org/stable/data/';
  window.EJS_startOnLoaded = true;
  // Avisa o app quando o jogo realmente começou
  window.EJS_onGameStart = function () {
    var msg = 'ejs-game-started';
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(msg);
    } else {
      window.parent.postMessage(msg, '*');
    }
  };
</script>
<script src="https://cdn.emulatorjs.org/stable/data/loader.js"></script>
</body>
</html>`;
}

export default function GameScreen({ navigation, route }) {
  const game = (route && route.params && route.params.game) || null;
  const { width, height } = useWindowDimensions();
  const deitado = width > height;
  const [carregando, setCarregando] = useState(true);

  // Na web: escuta o aviso que vem de dentro do iframe
  useEffect(() => {
    if (Platform.OS !== 'web') return undefined;
    function aoReceber(evento) {
      if (evento.data === 'ejs-game-started') {
        setCarregando(false);
      }
    }
    window.addEventListener('message', aoReceber);
    return () => window.removeEventListener('message', aoReceber);
  }, []);

  // Segurança: se o aviso nunca chegar, tira a tela de carregando depois de 25s
  useEffect(() => {
    const timer = setTimeout(() => setCarregando(false), 25000);
    return () => clearTimeout(timer);
  }, []);

  function voltar() {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Home');
    }
  }

  let conteudo;

  if (!game || !game.fileUrl) {
    conteudo = (
      <View style={styles.centro}>
        <Text style={styles.mensagem}>Arquivo do jogo não disponível.</Text>
      </View>
    );
  } else if (Platform.OS === 'web') {
    conteudo = React.createElement('iframe', {
      srcDoc: montarHtml(game),
      title: game.title || 'Jogo',
      allow: 'autoplay; fullscreen; gamepad',
      allowFullScreen: true,
      style: { flex: 1, width: '100%', height: '100%', border: 'none', backgroundColor: '#000' },
    });
  } else {
    conteudo = (
      <WebView
        style={styles.webview}
        originWhitelist={['*']}
        source={{ html: montarHtml(game), baseUrl: 'https://archv-rooms.onrender.com' }}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        allowsFullscreenVideo
        onMessage={(e) => {
          if (e.nativeEvent.data === 'ejs-game-started') {
            setCarregando(false);
          }
        }}
      />
    );
  }

  const mostrarCarregando = carregando && game && game.fileUrl;

  return (
    <View style={styles.container}>
      <StatusBar hidden={deitado} />

      {/* Em pé: barra de título normal */}
      {!deitado && (
        <View style={styles.header}>
          <TouchableOpacity onPress={voltar} style={styles.botaoVoltar}>
            <Ionicons name="arrow-back" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.titulo} numberOfLines={1}>
            {game ? game.title : 'Jogo'}
          </Text>
        </View>
      )}

      <View style={styles.area}>
        {conteudo}

        {/* Tela de carregando por cima do emulador */}
        {mostrarCarregando && (
          <View style={styles.carregando}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.carregandoTitulo}>
              {game.title}
            </Text>
            <Text style={styles.carregandoTexto}>Carregando jogo...</Text>
          </View>
        )}
      </View>

      {/* Deitado: tela cheia, só um botão de voltar por cima */}
      {deitado && (
        <TouchableOpacity onPress={voltar} style={styles.voltarFlutuante}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#3A2F55',
  },
  botaoVoltar: {
    marginRight: 12,
  },
  titulo: {
    flex: 1,
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  area: {
    flex: 1,
    backgroundColor: '#000',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000',
  },
  carregando: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1E1830',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  carregandoTitulo: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    textAlign: 'center',
  },
  carregandoTexto: {
    color: '#B8B0C8',
    fontSize: 14,
    marginTop: 6,
  },
  voltarFlutuante: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  mensagem: {
    color: '#FF9AA8',
    fontSize: 16,
    textAlign: 'center',
  },
});