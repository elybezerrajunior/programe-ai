import { atom } from 'nanostores';
import { logStore } from './logs';

export type Theme = 'dark' | 'light';

export const kTheme = 'bolt_theme';

export function themeIsDark() {
  return themeStore.get() === 'dark';
}

export const DEFAULT_THEME = 'dark';

export const themeStore = atom<Theme>(initStore());

function initStore() {
  // Always return dark theme, ignoring system preferences and localStorage
  if (!import.meta.env.SSR) {
    // Force dark theme on HTML element
    document.querySelector('html')?.setAttribute('data-theme', 'dark');
    // Override any stored theme in localStorage
    localStorage.setItem(kTheme, 'dark');
  }

  return DEFAULT_THEME;
}

export function toggleTheme() {
  // Theme is locked to dark mode, so this function does nothing
  // Keeping the function to avoid breaking components that call it
  logStore.logSystem('Theme toggle attempted, but theme is locked to dark mode');
}
