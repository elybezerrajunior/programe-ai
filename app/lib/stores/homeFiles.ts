import { atom } from 'nanostores';

// Store to temporarily hold files from HomeHero before chat starts
export const homeHeroFilesStore = atom<File[]>([]);

// Store to temporarily hold prompt from HomeHero before chat starts
export const homeHeroPromptStore = atom<string>('');
