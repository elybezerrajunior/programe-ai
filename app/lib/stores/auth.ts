import { atom, computed } from 'nanostores';
import type { User as SupabaseUser, Session as SupabaseSession } from '@supabase/supabase-js';

/**
 * Tipo de usuário autenticado
 */
export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
}

/**
 * Estado da autenticação
 */
export interface AuthState {
  user: AuthUser | null;
  session: SupabaseSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// Estado inicial
const initialState: AuthState = {
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
};

// Store de autenticação
export const authStore = atom<AuthState>(initialState);

// Computed: usuário autenticado
export const authUser = computed(authStore, (state) => state.user);

// Computed: se está autenticado
export const isAuthenticated = computed(authStore, (state) => state.isAuthenticated);

// Computed: se está carregando
export const isLoading = computed(authStore, (state) => state.isLoading);

/**
 * Atualiza o estado de autenticação
 */
export function setAuthState(state: Partial<AuthState>) {
  const current = authStore.get();
  const newState: AuthState = {
    ...current,
    ...state,
    // Atualizar isAuthenticated baseado no user
    isAuthenticated: !!state.user || (state.user === null ? false : current.isAuthenticated),
  };

  authStore.set(newState);
}

/**
 * Define o usuário autenticado
 */
export function setAuthUser(user: SupabaseUser | null) {
  if (!user) {
    setAuthState({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
    });
    return;
  }

  setAuthState({
    user: {
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.name || user.user_metadata?.full_name || undefined,
      avatar: user.user_metadata?.avatar_url || undefined,
    },
    isAuthenticated: true,
    isLoading: false,
  });
}

/**
 * Define a sessão
 */
export function setAuthSession(session: SupabaseSession | null) {
  const current = authStore.get();

  setAuthState({
    session,
    user: session?.user
      ? {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || session.user.user_metadata?.full_name || undefined,
          avatar: session.user.user_metadata?.avatar_url || undefined,
        }
      : null,
    isAuthenticated: !!session,
    isLoading: false,
  });
}

/**
 * Limpa o estado de autenticação (logout)
 */
export function clearAuth() {
  setAuthState({
    user: null,
    session: null,
    isAuthenticated: false,
    isLoading: false,
  });
}

/**
 * Define o estado de loading
 */
export function setAuthLoading(isLoading: boolean) {
  setAuthState({ isLoading });
}

/**
 * Sessão do servidor (cookies HttpOnly) - usada para hidratar o cliente em produção
 */
export interface ServerSession {
  user: { id: string; email: string; name?: string };
  accessToken: string;
}

/**
 * Hidrata o estado de autenticação a partir da sessão obtida no servidor (loader).
 * Necessário em produção porque os cookies de sessão são HttpOnly e o cliente
 * não consegue lê-los; o servidor lê os cookies e envia a sessão no loader.
 */
export function setAuthFromServerSession(serverSession: ServerSession | null) {
  if (!serverSession) {
    setAuthState({ user: null, session: null, isAuthenticated: false, isLoading: false });
    return;
  }
  setAuthState({
    user: {
      id: serverSession.user.id,
      email: serverSession.user.email,
      name: serverSession.user.name,
      avatar: undefined,
    },
    session: null,
    isAuthenticated: true,
    isLoading: false,
  });
}

