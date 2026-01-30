import { useStore } from '@nanostores/react';
import { useEffect } from 'react';
import { authStore, setAuthSession, setAuthLoading } from '~/lib/stores/auth';
import { getSession } from '~/lib/auth/supabase-auth';
import { supabase } from '~/lib/auth/supabase-client';
import { syncAuthFromCookies } from '~/lib/auth/sync-auth';

/**
 * Hook para acessar o estado de autenticação
 * Sincroniza estado do Supabase com a store
 */
export function useAuth() {
  const auth = useStore(authStore);

  // Sincronizar sessão do Supabase com a store
  useEffect(() => {
    let mounted = true;

    async function syncSession() {
      setAuthLoading(true);

      try {
        // Primeiro, tentar obter a sessão do Supabase (pode estar no localStorage)
        let session = await getSession();

        // Se não houver sessão no Supabase, tentar sincronizar dos cookies
        if (!session && typeof window !== 'undefined') {
          const synced = await syncAuthFromCookies();
          if (synced) {
            // Tentar obter a sessão novamente após sincronização
            session = await getSession();
          }
        }

        if (mounted) {
          setAuthSession(session);
        }
      } catch (error) {
        console.error('[useAuth] Error syncing session:', error);
        if (mounted) {
          setAuthSession(null);
        }
      } finally {
        if (mounted) {
          setAuthLoading(false);
        }
      }
    }

    // Verificar sessão inicial
    syncSession();

    if (!supabase) return;

    // Escutar mudanças de autenticação do Supabase
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setAuthSession(session);
        setAuthLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    user: auth.user,
    session: auth.session,
    isLoading: auth.isLoading,
    isAuthenticated: auth.isAuthenticated,
  };
}
