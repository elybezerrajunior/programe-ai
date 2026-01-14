import { useEffect, useRef } from 'react';
import { useSearchParams } from '@remix-run/react';
import { supabase } from '~/lib/auth/supabase-client';
import { setAuthSession } from '~/lib/stores/auth';

/**
 * Componente que sincroniza a autenticação após login
 * Lê tokens da URL (passados temporariamente) e define no Supabase
 * Executa imediatamente para garantir que a sessão esteja disponível
 */
export function AuthSync() {
  const [searchParams] = useSearchParams();
  const hasSynced = useRef(false);

  useEffect(() => {
    // Sincronizar apenas uma vez
    if (hasSynced.current) {
      return;
    }

    async function syncAuth() {
      // Verificar se há tokens na URL (após login)
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');

      if (accessToken && refreshToken) {
        hasSynced.current = true;

        try {
          // Definir sessão no Supabase
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('[AuthSync] Error setting session:', error);
            return;
          }

          if (data.session) {
            // A função setAuthSession já atualiza a store
            // O onAuthStateChange do Supabase será disparado automaticamente
            setAuthSession(data.session);

            // Remover tokens da URL por segurança
            const newSearchParams = new URLSearchParams(searchParams);
            newSearchParams.delete('access_token');
            newSearchParams.delete('refresh_token');
            
            // Atualizar URL sem recarregar a página
            const newUrl = new URL(window.location.href);
            newUrl.search = newSearchParams.toString();
            window.history.replaceState({}, '', newUrl.toString());
          }
        } catch (error) {
          console.error('[AuthSync] Unexpected error:', error);
        }
      }
    }

    // Executar imediatamente
    syncAuth();
  }, [searchParams]);

  return null;
}

