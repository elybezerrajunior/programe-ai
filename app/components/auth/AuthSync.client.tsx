import { useEffect, useRef } from 'react';
import { useSearchParams } from '@remix-run/react';
import { supabase } from '~/lib/auth/supabase-client';
import { setAuthSession, clearAuth } from '~/lib/stores/auth';

/**
 * Componente que sincroniza a autenticação
 * - Monitora mudanças de estado de auth do Supabase
 * - Sincroniza tokens da URL (login com email/senha)
 * - Inicializa sessão existente do localStorage
 */
export function AuthSync() {
  const [searchParams] = useSearchParams();
  const hasInitialized = useRef(false);

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
        } else if (event === 'SIGNED_OUT') {
          clearAuth();
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

