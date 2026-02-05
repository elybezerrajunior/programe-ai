import { supabase, getSupabaseClient, getSupabaseProjectRef } from './supabase-client';
import type { CloudflareEnv } from './supabase-client';
import { parseCookies } from '~/lib/api/cookies';
import type { AuthError } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Erro de autenticação customizado com mensagem em português
 */
export class AuthenticationError extends Error {
  constructor(
    message: string,
    public originalError?: AuthError,
    public code?: string
  ) {
    super(message);
    this.name = 'AuthenticationError';
  }

  /** Indica se o erro é por rate limit (muitas tentativas) */
  get isRateLimit(): boolean {
    if (this.code === '429' || this.originalError?.status === 429) return true;
    const msg = (this.originalError?.message ?? this.message).toLowerCase();
    return msg.includes('too many') || msg.includes('rate limit');
  }
}

/**
 * Mapeia erros do Supabase para mensagens amigáveis em português
 */
function mapAuthError(error: AuthError): string {
  const errorMessage = error.message.toLowerCase();

  if (errorMessage.includes('invalid login credentials') || errorMessage.includes('invalid credentials')) {
    return 'E-mail ou senha inválidos';
  }

  if (errorMessage.includes('email not confirmed') || errorMessage.includes('email_not_confirmed')) {
    return 'Por favor, verifique seu e-mail antes de fazer login';
  }

  if (errorMessage.includes('user not found')) {
    return 'E-mail não cadastrado';
  }

  if (errorMessage.includes('too many requests') || errorMessage.includes('rate limit')) {
    return 'Muitas tentativas. Aguarde 15–30 minutos e tente novamente. Se estiver em desenvolvimento, verifique os limites do projeto no painel do Supabase.';
  }

  if (errorMessage.includes('signup_disabled')) {
    return 'Cadastro de novos usuários está desabilitado';
  }

  if (errorMessage.includes('user already registered') || errorMessage.includes('already registered')) {
    return 'Este e-mail já está cadastrado';
  }

  if (errorMessage.includes('password') && errorMessage.includes('weak')) {
    return 'Senha muito fraca. Use pelo menos 6 caracteres';
  }

  if (errorMessage.includes('email address already exists')) {
    return 'Este e-mail já está cadastrado';
  }

  if (errorMessage.includes('signup') && errorMessage.includes('failed')) {
    return 'Falha ao criar conta. Verifique seus dados e tente novamente';
  }

  if (errorMessage.includes('email_address_not_authorized')) {
    return 'Este endereço de e-mail não está autorizado';
  }

  if (errorMessage.includes('access_denied') || errorMessage.includes('user cancelled')) {
    return 'Login cancelado pelo usuário';
  }

  if (errorMessage.includes('oauth') || errorMessage.includes('oauth_error')) {
    if (errorMessage.includes('invalid_request') || errorMessage.includes('invalid_state')) {
      return 'Requisição OAuth inválida. Tente novamente';
    }
    if (errorMessage.includes('server_error') || errorMessage.includes('temporarily unavailable')) {
      return 'Serviço OAuth temporariamente indisponível. Tente novamente em alguns instantes';
    }
    return 'Erro ao fazer login com OAuth. Tente novamente';
  }

  return error.message || 'Erro ao fazer login. Tente novamente';
}

/**
 * Realiza login com email e senha
 * @param envOrClient - Variáveis de ambiente (Cloudflare) ou cliente Supabase (server-side)
 */
export async function signInWithPassword(
  email: string,
  password: string,
  envOrClient?: CloudflareEnv | SupabaseClient | null
) {
  const client =
    envOrClient && 'auth' in envOrClient
      ? envOrClient
      : getSupabaseClient((envOrClient as CloudflareEnv) ?? undefined) ?? supabase;
  if (!client) throw new AuthenticationError('Supabase não configurado');
  try {
    const { data, error } = await client.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      throw new AuthenticationError(mapAuthError(error), error, error.status?.toString());
    }

    if (!data.session) {
      throw new AuthenticationError('Não foi possível criar uma sessão');
    }

    return {
      user: data.user,
      session: data.session,
    };
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }

    throw new AuthenticationError(
      'Erro inesperado ao fazer login. Tente novamente',
      error as AuthError
    );
  }
}

/**
 * Realiza cadastro com email e senha
 * @param options.client - Cliente Supabase opcional (uso server-side quando env vem do context)
 * @param options.emailRedirectTo - URL para redirecionar após confirmação de email (deve estar em Redirect URLs no Supabase)
 */
export async function signUpWithPassword(
  email: string,
  password: string,
  options?: {
    name?: string;
    metadata?: Record<string, unknown>;
    client?: SupabaseClient | null;
    emailRedirectTo?: string;
  }
) {
  const authClient = options?.client ?? supabase;
  if (!authClient) throw new AuthenticationError('Supabase não configurado');
  try {
    const { data, error } = await authClient.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: options?.emailRedirectTo,
        data: {
          name: options?.name,
          full_name: options?.name,
          ...options?.metadata,
        },
      },
    });

    if (error) {
      throw new AuthenticationError(mapAuthError(error), error, error.status?.toString());
    }

    if (!data.session && data.user) {
      return {
        user: data.user,
        session: null,
        requiresEmailConfirmation: true,
      };
    }

    if (!data.user) {
      throw new AuthenticationError('Não foi possível criar o usuário');
    }

    return {
      user: data.user,
      session: data.session,
      requiresEmailConfirmation: false,
    };
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }

    throw new AuthenticationError(
      'Erro inesperado ao criar conta. Tente novamente',
      error as AuthError
    );
  }
}

/**
 * Realiza logout
 */
export async function signOut() {
  if (!supabase) throw new AuthenticationError('Supabase não configurado');
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new AuthenticationError('Erro ao fazer logout', error);
    }

    return { success: true };
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }

    throw new AuthenticationError('Erro inesperado ao fazer logout', error as AuthError);
  }
}

/**
 * Obtém a sessão atual (client-side)
 */
export async function getSession() {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Error getting session:', error);
      return null;
    }

    return data.session;
  } catch (error) {
    console.error('Unexpected error getting session:', error);
    return null;
  }
}

/**
 * Obtém o usuário atual (client-side)
 */
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user ?? null;
}

/**
 * Obtém a sessão a partir dos cookies (server-side)
 */
export async function getSessionFromCookies(cookieHeader: string | null) {
  if (!supabase || !cookieHeader) {
    return null;
  }

  try {
    const cookies = parseCookies(cookieHeader);
    const projectRef = getSupabaseProjectRef();
    const accessToken = cookies['sb-access-token'] || cookies[`sb-${projectRef}-auth-token`];
    const refreshToken = cookies['sb-refresh-token'] || cookies[`sb-${projectRef}-auth-refresh-token`];

    if (!accessToken) {
      return null;
    }

    const { data, error } = await supabase.auth.getUser(accessToken);

    if (error || !data.user) {
      return null;
    }

    return {
      user: data.user,
      accessToken,
    };
  } catch (error) {
    console.error('Error getting session from cookies:', error);
    return null;
  }
}

