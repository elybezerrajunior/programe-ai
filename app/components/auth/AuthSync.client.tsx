import { useEffect, useRef } from 'react';
import { supabase } from '~/lib/auth/supabase-client';
import { setAuthSession, clearAuth } from '~/lib/stores/auth';
import { profileStore, updateProfile } from '~/lib/stores/profile';

/**
 * Sincroniza a sessão com o servidor via cookies
 * Isso garante que as APIs do servidor reconheçam o usuário
 */
async function syncSessionToServer(accessToken: string, refreshToken: string): Promise<void> {
  try {
    const response = await fetch('/api/auth/sync-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accessToken,
        refreshToken,
      }),
    });

    if (!response.ok) {
      console.error('[AuthSync] Failed to sync session to server:', response.status);
    }
  } catch (error) {
    console.error('[AuthSync] Error syncing session to server:', error);
  }
}

/**
 * Componente que sincroniza a autenticação
 * - Monitora mudanças de estado de auth do Supabase
 * - Inicializa sessão existente do localStorage
 * - Sincroniza sessão com o servidor via cookies (para OAuth e refresh)
 */
export function AuthSync() {
  const hasInitialized = useRef(false);
  const lastSyncedToken = useRef<string | null>(null);

  useEffect(() => {
    if (!supabase || hasInitialized.current) {
      return;
    }

    hasInitialized.current = true;

    // 1. Configurar listener de mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AuthSync] Auth state changed:', event);
        
        if (session) {
          setAuthSession(session);
          const name =
            session.user.user_metadata?.name ||
            session.user.user_metadata?.full_name ||
            session.user.email ||
            '';
          updateProfile({
            username: name,
            avatar: session.user.user_metadata?.avatar_url ?? profileStore.get().avatar ?? '',
          });

          // Sincronizar com o servidor quando o token mudar (ex: refresh)
          // Evitar sincronizações duplicadas
          if (session.access_token && session.access_token !== lastSyncedToken.current) {
            lastSyncedToken.current = session.access_token;
            
            // Sincronizar em background (não bloquear)
            if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
              syncSessionToServer(session.access_token, session.refresh_token || '');
            }
          }
        } else if (event === 'SIGNED_OUT') {
          clearAuth();
          lastSyncedToken.current = null;
          updateProfile({ username: '', avatar: '' });
        }
      }
    );

    // 2. Verificar sessão existente (pode ter sido salva pelo OAuth callback)
    async function initSession() {
      try {
        const { data: { session } } = await supabase!.auth.getSession();
        
        if (session) {
          console.log('[AuthSync] Found existing session');
          setAuthSession(session);
          const name =
            session.user.user_metadata?.name ||
            session.user.user_metadata?.full_name ||
            session.user.email ||
            '';
          updateProfile({
            username: name,
            avatar: session.user.user_metadata?.avatar_url ?? profileStore.get().avatar ?? '',
          });

          // Sincronizar sessão existente com o servidor
          // Isso garante que cookies estejam atualizados após refresh da página
          if (session.access_token && session.access_token !== lastSyncedToken.current) {
            lastSyncedToken.current = session.access_token;
            syncSessionToServer(session.access_token, session.refresh_token || '');
          }
        }
      } catch (error) {
        console.error('[AuthSync] Error getting session:', error);
      }
    }

    initSession();

    // Cleanup
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return null;
}

