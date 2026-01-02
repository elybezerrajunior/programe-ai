import { atom } from 'nanostores';

// Store to temporarily hold files from HomeHero before chat starts
export const homeHeroFilesStore = atom<File[]>([]);

