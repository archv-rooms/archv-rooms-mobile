// Fontes
export const FONT = 'Rajdhani_500Medium';
export const FONT_SEMI = 'Rajdhani_600SemiBold';
export const FONT_BOLD = 'Rajdhani_700Bold';

// Cores do app
export const BG_TOP = '#14111F';
export const BG_BOTTOM = '#221B38';
export const SURFACE = '#2D2545';
export const SURFACE_LIGHT = '#3A3058';
export const ACCENT = '#8E7CF0';
export const BUTTON_PURPLE = '#6A5BD6';
export const WHITE = '#FFFFFF';
export const TEXT_MUTED = '#B4AACB';
export const PINK = '#FF6B8A';
export const ERROR = '#FF9AA8';

// Cor de cada console (usada quando o jogo não tem imagem)
export const CONSOLE_COLORS = {
  NES: '#FF4D4D',
  SNES: '#9B8CFF',
  SFC: '#9B8CFF',
  MD: '#3F8CFF',
  'MEGA DRIVE': '#3F8CFF',
  GB: '#7CE06B',
  GBC: '#7CE06B',
  GBA: '#C77CFF',
  N64: '#FFB23C',
  PS1: '#9AA3B5',
  PSX: '#9AA3B5',
};

export function consoleColor(name) {
  return CONSOLE_COLORS[(name || '').toUpperCase()] || ACCENT;
}