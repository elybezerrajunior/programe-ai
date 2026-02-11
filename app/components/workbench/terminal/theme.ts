import type { ITheme } from '@xterm/xterm';

const style = getComputedStyle(document.documentElement);
const cssVar = (token: string) => style.getPropertyValue(token) || undefined;

export function getTerminalTheme(overrides?: ITheme): ITheme {
  return {
    cursor: cssVar('--programe-elements-terminal-cursorColor'),
    cursorAccent: cssVar('--programe-elements-terminal-cursorColorAccent'),
    foreground: cssVar('--programe-elements-terminal-textColor'),
    background: cssVar('--programe-elements-terminal-backgroundColor'),
    selectionBackground: cssVar('--programe-elements-terminal-selection-backgroundColor'),
    selectionForeground: cssVar('--programe-elements-terminal-selection-textColor'),
    selectionInactiveBackground: cssVar('--programe-elements-terminal-selection-backgroundColorInactive'),

    // ansi escape code colors
    black: cssVar('--programe-elements-terminal-color-black'),
    red: cssVar('--programe-elements-terminal-color-red'),
    green: cssVar('--programe-elements-terminal-color-green'),
    yellow: cssVar('--programe-elements-terminal-color-yellow'),
    blue: cssVar('--programe-elements-terminal-color-blue'),
    magenta: cssVar('--programe-elements-terminal-color-magenta'),
    cyan: cssVar('--programe-elements-terminal-color-cyan'),
    white: cssVar('--programe-elements-terminal-color-white'),
    brightBlack: cssVar('--programe-elements-terminal-color-brightBlack'),
    brightRed: cssVar('--programe-elements-terminal-color-brightRed'),
    brightGreen: cssVar('--programe-elements-terminal-color-brightGreen'),
    brightYellow: cssVar('--programe-elements-terminal-color-brightYellow'),
    brightBlue: cssVar('--programe-elements-terminal-color-brightBlue'),
    brightMagenta: cssVar('--programe-elements-terminal-color-brightMagenta'),
    brightCyan: cssVar('--programe-elements-terminal-color-brightCyan'),
    brightWhite: cssVar('--programe-elements-terminal-color-brightWhite'),

    ...overrides,
  };
}
