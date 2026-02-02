import { useEffect, useRef } from 'react';
import { useSearchParams } from '@remix-run/react';
import { supabase } from '~/lib/auth/supabase-client';
import { setAuthSession, clearAuth } from '~/lib/stores/auth';

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
 * - Sincroniza tokens da URL (login com email/senha)
 * - Inicializa sessão existente do localStorage
 * - Sincroniza sessão com o servidor via cookies (para OAuth)
 */
export function AuthSync() {
  const [searchParams] = useSearchParams();
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

  // 3. Sincronizar tokens da URL (login com email/senha - fluxo legado)
  useEffect(() => {
    async function syncTokensFromUrl() {
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');

      if (accessToken && refreshToken && supabase) {
        try {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('[AuthSync] Error setting session from URL:', error);
            return;
          }

          if (data.session) {
            setAuthSession(data.session);

            // Remover tokens da URL por segurança
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete('access_token');
            newUrl.searchParams.delete('refresh_token');
            window.history.replaceState({}, '', newUrl.toString());
          }
        } catch (error) {
          console.error('[AuthSync] Unexpected error:', error);
        }
      }
    }

    syncTokensFromUrl();
  }, [searchParams]);

  return null;
}

