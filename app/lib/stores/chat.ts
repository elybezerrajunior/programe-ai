import { map } from 'nanostores';
import type { DesignScheme } from '~/types/design-scheme';

export const chatStore = map<{
  started: boolean;
  aborted: boolean;
  showChat: boolean;
  /** Design scheme selecionado na HomeHero - passado ao Chat ao iniciar projeto */
  designScheme?: DesignScheme;
}>({
  started: false,
  aborted: false,
  showChat: true,
  designScheme: undefined,
});
