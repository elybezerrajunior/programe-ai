import { useEffect, useState, useRef } from 'react';
import { useNavigate } from '@remix-run/react';
import type { MetaFunction } from '@remix-run/cloudflare';
import { supabase } from '~/lib/auth/supabase-client';
import { setAuthSession } from '~/lib/stores/auth';

export const meta: MetaFunction = () => {
  return [{ title: 'Autenticando... - Programe Studio' }];
};

/**
 * Sincroniza a sessão OAuth com o servidor criando cookies HTTP-only
 * Isso é necessário porque o OAuth salva apenas no localStorage do cliente,
 * mas as APIs do servidor precisam de cookies para autenticação.
 */
async function syncSessionToServer(accessToken: string, refreshToken: string): Promise<boolean> {
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
      console.error('[Auth Callback] Failed to sync session to server:', response.status);
      return false;
    }

    console.log('[Auth Callback] Session synced to server successfully');
    return true;
  } catch (error) {
    console.error('[Auth Callback] Error syncing session to server:', error);
    return false;
  }
}

/**
 * Rota de callback OAuth (Client-Side)
 * 
 * Com Implicit Flow, o Supabase retorna os tokens diretamente no hash fragment:
 * /auth/callback#access_token=...&refresh_token=...&token_type=bearer&...
 * 
 * O Supabase com detectSessionInUrl: true processa isso automaticamente.
 * Este componente aguarda a sessão ser estabelecida, sincroniza com o servidor
 * via cookies, e então redireciona.
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Evitar processamento duplo
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    async function handleCallback() {
      const url = new URL(window.location.href);
      const hash = url.hash;
      const searchParams = url.searchParams;
      
      console.log('[Auth Callback] Processing...');
      console.log('[Auth Callback] URL:', window.location.href);

      // Verificar se há erro na query string
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (error) {
        console.error('[Auth Callback] OAuth error:', error, errorDescription);
        setStatus('error');
        setErrorMessage(errorDescription || error);
        setTimeout(() => {
          navigate(`/login?error=${encodeURIComponent(errorDescription || error)}`);
        }, 2000);
        return;
      }

      // Verificar se há erro no hash
      if (hash) {
        const hashParams = new URLSearchParams(hash.substring(1));
        const hashError = hashParams.get('error');
        const hashErrorDescription = hashParams.get('error_description');
        
        if (hashError) {
          console.error('[Auth Callback] OAuth error in hash:', hashError, hashErrorDescription);
          setStatus('error');
          setErrorMessage(hashErrorDescription || hashError);
          setTimeout(() => {
            navigate(`/login?error=${encodeURIComponent(hashErrorDescription || hashError)}`);
          }, 2000);
          return;
        }
      }

      if (!supabase) {
        setStatus('error');
        setErrorMessage('Supabase não configurado');
        setTimeout(() => navigate('/login?error=Supabase não configurado'), 2000);
        return;
      }

      // Com detectSessionInUrl: true, o Supabase processa automaticamente
      // os tokens do hash. Vamos aguardar a sessão ser estabelecida.
      
      // Primeiro, dar um tempo para o Supabase processar o hash
      // O onAuthStateChange será disparado automaticamente
      
      let attempts = 0;
      const maxAttempts = 10;
      const checkInterval = 500; // 500ms entre tentativas

      const checkSession = async (): Promise<boolean> => {
        try {
          const { data: { session }, error } = await supabase!.auth.getSession();
          
          if (error) {
            console.error('[Auth Callback] Error getting session:', error);
            return false;
          }
          
          if (session) {
            console.log('[Auth Callback] Session found!');
            
            // IMPORTANTE: Sincronizar sessão com o servidor via cookies
            // Isso permite que as APIs do servidor reconheçam o usuário
            if (session.access_token && session.refresh_token) {
              await syncSessionToServer(session.access_token, session.refresh_token);
            }
            
            setAuthSession(session);
            
            // Obter redirectTo
            const redirectTo = sessionStorage.getItem('oauth_redirect_to') || '/';
            sessionStorage.removeItem('oauth_redirect_to');
            
            // Limpar hash da URL
            window.history.replaceState({}, '', window.location.pathname);
            
            navigate(redirectTo);
            return true;
          }
          
          return false;
        } catch (err) {
          console.error('[Auth Callback] Error:', err);
          return false;
        }
      };

      // Tentar obter sessão imediatamente
      if (await checkSession()) {
        return;
      }

      // Se não encontrou, aguardar e tentar novamente
      const pollSession = async () => {
        while (attempts < maxAttempts) {
          attempts++;
          console.log(`[Auth Callback] Checking session (attempt ${attempts}/${maxAttempts})...`);
          
          await new Promise(resolve => setTimeout(resolve, checkInterval));
          
          if (await checkSession()) {
            return;
          }
        }

        // Timeout - nenhuma sessão encontrada
        console.error('[Auth Callback] Timeout waiting for session');
        setStatus('error');
        setErrorMessage('Tempo esgotado aguardando autenticação. Tente novamente.');
        setTimeout(() => {
          navigate('/login?error=' + encodeURIComponent('Tempo esgotado. Tente fazer login novamente.'));
        }, 2000);
      };

      await pollSession();
    }

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-bolt-elements-background-depth-1 flex items-center justify-center p-6">
      <div className="text-center">
        {status === 'processing' ? (
          <>
            <div className="i-svg-spinners:90-ring-with-bg text-accent text-6xl mx-auto mb-6" />
            <h1 className="text-2xl font-semibold text-bolt-elements-textPrimary mb-2">
              Autenticando...
            </h1>
            <p className="text-bolt-elements-textSecondary">
              Aguarde enquanto processamos seu login
            </p>
          </>
        ) : (
          <>
            <div className="i-ph:warning-circle text-red-500 text-6xl mx-auto mb-6" />
            <h1 className="text-2xl font-semibold text-bolt-elements-textPrimary mb-2">
              Erro na autenticação
            </h1>
            <p className="text-bolt-elements-textSecondary mb-4">
              {errorMessage}
            </p>
            <p className="text-sm text-bolt-elements-textTertiary">
              Redirecionando para o login...
            </p>
          </>
        )}
      </div>
    </div>
  );
}
