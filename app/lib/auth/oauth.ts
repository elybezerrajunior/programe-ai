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
 * Gera um state aleatório para validação CSRF no callback OAuth
 * Compatível com Edge Runtime (Web Crypto API)
 */
function generateState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Inicia o fluxo de login OAuth com o provedor especificado
 * @param provider - Provedor OAuth ('google' ou 'github')
 * @param redirectTo - URL para redirecionar após login (opcional, padrão: '/')
 * @returns Promise que resolve quando o redirecionamento é iniciado
 */
export async function signInWithOAuth(
  provider: OAuthProvider,
  redirectTo: string = '/'
): Promise<void> {
  try {
    // Validar provedor
    if (!validateProvider(provider)) {
      throw new AuthenticationError(`Provedor OAuth não suportado: ${provider}`);
    }

    // Validar redirectTo para prevenir open redirects
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    if (!validateRedirectTo(redirectTo, origin)) {
      throw new AuthenticationError('URL de redirecionamento inválida');
    }

    // Gerar state para validação CSRF
    const state = generateState();
    
    // Armazenar state no sessionStorage para validação no callback
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('oauth_state', state);
      sessionStorage.setItem('oauth_redirect_to', redirectTo);
    }

    // Construir URL de callback com redirectTo como query param
    const callbackUrl = new URL('/auth/callback', origin);
    if (redirectTo && redirectTo !== '/') {
      callbackUrl.searchParams.set('redirectTo', redirectTo);
    }

    // Iniciar fluxo OAuth
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: callbackUrl.toString(),
        queryParams: {
          state,
        },
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
 * Obtém o state armazenado para validação CSRF
 */
export function getStoredOAuthState(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return sessionStorage.getItem('oauth_state');
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
  sessionStorage.removeItem('oauth_state');
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

