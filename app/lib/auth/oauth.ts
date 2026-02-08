import { supabase } from './supabase-client';
import type { AuthError } from '@supabase/supabase-js';
import { AuthenticationError } from './supabase-auth';

/**
 * Tipos de provedores OAuth suportados
 */
export type OAuthProvider = 'google' | 'github';

/**
 * Valida se o provedor OAuth é suportado
 */
function validateProvider(provider: string): provider is OAuthProvider {
  return provider === 'google' || provider === 'github';
}

/**
 * Valida se a URL de redirect é segura (apenas URLs internas)
 * Previne open redirect attacks
 */
function validateRedirectTo(redirectTo: string, origin: string): boolean {
  try {
    const url = new URL(redirectTo, origin);
    // Apenas permitir URLs do mesmo origin
    return url.origin === origin || redirectTo.startsWith('/');
  } catch {
    // Se não for uma URL válida, verificar se é um path relativo
    return redirectTo.startsWith('/');
  }
}



/**
 * Inicia o fluxo de login OAuth com o provedor especificado
 * @param provider - Provedor OAuth ('google' ou 'github')
 * @param redirectTo - URL para redirecionar após login (opcional, padrão: '/')
 * @param appUrl - URL base da aplicação (do servidor). Garante callback correto em produção.
 * @returns Promise que resolve quando o redirecionamento é iniciado
 */
export async function signInWithOAuth(
  provider: OAuthProvider,
  redirectTo: string = '/',
  appUrl?: string
): Promise<void> {
  try {
    // Validar provedor
    if (!validateProvider(provider)) {
      throw new AuthenticationError(`Provedor OAuth não suportado: ${provider}`);
    }

    // URL base para o callback OAuth - prioridade: appUrl (servidor) > VITE_APP_URL > window.location
    // URL base para o callback OAuth
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    console.log('[OAuth] Origin for callback:', origin);

    if (!validateRedirectTo(redirectTo, origin)) {
      throw new AuthenticationError('URL de redirecionamento inválida');
    }

    // Armazenar redirectTo no sessionStorage
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('oauth_redirect_to', redirectTo);
    }

    // Construir URL de callback com redirectTo como query param
    const callbackUrl = new URL('/auth/callback', origin);
    if (redirectTo && redirectTo !== '/') {
      callbackUrl.searchParams.set('redirectTo', redirectTo);
    }

    // Iniciar fluxo OAuth
    // NOTA: Não injetamos 'state' manualmente nos queryParams pois isso sobrescreve
    // o state interno do Supabase e causa erro "invalid state" / "token malformed" no callback.
    if (!supabase) throw new Error('Supabase não configurado');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: callbackUrl.toString(),
      },
    });

    if (error) {
      throw new AuthenticationError(
        `Erro ao iniciar login com ${provider}: ${error.message}`,
        error
      );
    }

    // Redirecionar para URL de autorização do provedor
    if (data.url) {
      window.location.href = data.url;
    } else {
      throw new AuthenticationError('Não foi possível obter URL de autorização');
    }
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }

    throw new AuthenticationError(
      `Erro inesperado ao iniciar login OAuth: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      error as AuthError
    );
  }
}

/**
 * Obtém o redirectTo armazenado
 */
export function getStoredOAuthRedirectTo(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return sessionStorage.getItem('oauth_redirect_to');
}

/**
 * Remove dados OAuth do sessionStorage (após validação)
 */
export function clearStoredOAuthData(): void {
  if (typeof window === 'undefined') {
    return;
  }
  sessionStorage.removeItem('oauth_redirect_to');
}

/**
 * Mapeia erros OAuth do Supabase para mensagens amigáveis em português
 */
export function mapOAuthError(error: AuthError | Error): string {
  const errorMessage = error.message.toLowerCase();

  if (errorMessage.includes('access_denied') || errorMessage.includes('user cancelled')) {
    return 'Login cancelado pelo usuário';
  }

  if (errorMessage.includes('invalid_request') || errorMessage.includes('invalid_state')) {
    return 'Requisição inválida. Tente novamente';
  }

  if (errorMessage.includes('server_error') || errorMessage.includes('temporarily unavailable')) {
    return 'Serviço temporariamente indisponível. Tente novamente em alguns instantes';
  }

  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return 'Erro de conexão. Verifique sua internet e tente novamente';
  }

  if (errorMessage.includes('timeout')) {
    return 'Tempo de espera esgotado. Tente novamente';
  }

  // Erro genérico
  return error.message || 'Erro ao fazer login com OAuth. Tente novamente';
}

