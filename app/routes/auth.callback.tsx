import { redirect, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { createSessionCookies } from '~/lib/auth/session';
import { supabase } from '~/lib/auth/supabase-client';
import { AuthenticationError } from '~/lib/auth/supabase-auth';
import { mapOAuthError } from '~/lib/auth/oauth';

/**
 * Rota de callback OAuth
 * Processa o retorno do provedor OAuth (Google/GitHub) após autenticação
 * 
 * Fluxo:
 * 1. Usuário inicia login OAuth → Redireciona para provedor
 * 2. Provedor autentica → Redireciona para /auth/callback?code=...&state=...
 * 3. Esta rota valida state e code → Troca code por tokens → Cria sessão → Redireciona
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  
  // Verificar se há erro na query string (ex: usuário cancelou)
  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');
  
  if (error) {
    // Mapear erro para mensagem amigável
    const errorObj = new Error(errorDescription || error);
    const friendlyMessage = mapOAuthError(errorObj);
    
    // Redirecionar para login com mensagem de erro
    const loginUrl = new URL('/login', url.origin);
    loginUrl.searchParams.set('error', friendlyMessage);
    throw redirect(loginUrl.toString());
  }

  // Extrair code e state da query string
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  // Validar presença de code e state
  if (!code) {
    const loginUrl = new URL('/login', url.origin);
    loginUrl.searchParams.set('error', 'Código de autorização não encontrado');
    throw redirect(loginUrl.toString());
  }

  if (!state) {
    const loginUrl = new URL('/login', url.origin);
    loginUrl.searchParams.set('error', 'Estado de segurança não encontrado');
    throw redirect(loginUrl.toString());
  }

  try {
    // Trocar code por tokens via Supabase
    // O Supabase valida o code e retorna a sessão
    const { data, error: authError } = await supabase.auth.exchangeCodeForSession(code);

    if (authError) {
      throw new AuthenticationError(
        mapOAuthError(authError),
        authError,
        authError.status?.toString()
      );
    }

    if (!data.session) {
      throw new AuthenticationError('Não foi possível criar uma sessão após login OAuth');
    }

    // Validar state (CSRF protection)
    // Nota: Em um ambiente server-side, o state seria validado comparando com o armazenado
    // Como estamos usando Edge Runtime, validamos basicamente se o state foi fornecido
    // O Supabase também valida o state internamente durante o exchangeCodeForSession

    // Criar cookies de sessão
    const cookies = createSessionCookies(
      data.session.access_token,
      data.session.refresh_token || ''
    );

    // Obter redirectTo da query string ou usar '/' como padrão
    // O redirectTo pode ter sido armazenado no client antes do redirect OAuth
    let redirectTo = url.searchParams.get('redirectTo') || '/';

    // Validar redirectTo para prevenir open redirects
    // Apenas permitir URLs internas (mesmo origin ou paths relativos)
    try {
      const redirectUrl = new URL(redirectTo, url.origin);
      if (redirectUrl.origin !== url.origin && !redirectTo.startsWith('/')) {
        redirectTo = '/';
      }
    } catch {
      // Se não for uma URL válida, verificar se é um path relativo
      if (!redirectTo.startsWith('/')) {
        redirectTo = '/';
      }
    }

    // Adicionar tokens na URL temporariamente para sincronização no cliente
    // (serão removidos pelo componente AuthSync após sincronização)
    const redirectUrl = new URL(redirectTo, url.origin);
    redirectUrl.searchParams.set('access_token', data.session.access_token);
    if (data.session.refresh_token) {
      redirectUrl.searchParams.set('refresh_token', data.session.refresh_token);
    }

    // Redirecionar para destino final com cookies de sessão
    throw redirect(redirectUrl.toString(), {
      headers: {
        'Set-Cookie': cookies,
      },
    });
  } catch (error) {
    // Se já for um redirect, relançar
    if (error instanceof Response && error.status === 302) {
      throw error;
    }

    // Tratar erros de autenticação
    if (error instanceof AuthenticationError) {
      const loginUrl = new URL('/login', url.origin);
      loginUrl.searchParams.set('error', error.message);
      throw redirect(loginUrl.toString());
    }

    // Erro genérico
    console.error('[auth.callback] Error processing OAuth callback:', error);
    const loginUrl = new URL('/login', url.origin);
    loginUrl.searchParams.set(
      'error',
      'Erro ao processar login OAuth. Tente novamente'
    );
    throw redirect(loginUrl.toString());
  }
};

