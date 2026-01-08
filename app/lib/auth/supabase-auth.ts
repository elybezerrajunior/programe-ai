import { supabase } from './supabase-client';
import { parseCookies } from '~/lib/api/cookies';
import type { AuthError } from '@supabase/supabase-js';

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
    return 'Muitas tentativas. Tente novamente em alguns minutos';
  }

  if (errorMessage.includes('signup_disabled')) {
    return 'Cadastro de novos usuários está desabilitado';
  }

  if (errorMessage.includes('email_address_not_authorized')) {
    return 'Este endereço de e-mail não está autorizado';
  }

  // Erros OAuth
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

  // Erro genérico
  return error.message || 'Erro ao fazer login. Tente novamente';
}

/**
 * Realiza login com email e senha
 */
export async function signInWithPassword(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
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
 * Realiza logout
 */
export async function signOut() {
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
  if (!cookieHeader) {
    return null;
  }

  try {
    // O Supabase armazena tokens em cookies específicos
    // Precisamos reconstruir a sessão a partir dos cookies
    const cookies = parseCookies(cookieHeader);
    
    const accessToken = cookies['sb-access-token'] || cookies[`sb-${extractProjectRef(supabase.supabaseUrl)}-auth-token`];
    const refreshToken = cookies['sb-refresh-token'] || cookies[`sb-${extractProjectRef(supabase.supabaseUrl)}-auth-refresh-token`];

    if (!accessToken) {
      return null;
    }

    // Verificar token com Supabase
    const { data, error } = await supabase.auth.getUser(accessToken);

    if (error || !data.user) {
      return null;
    }

    // Retornar dados do usuário (não a sessão completa por questões de segurança no server)
    return {
      user: data.user,
      accessToken,
    };
  } catch (error) {
    console.error('Error getting session from cookies:', error);
    return null;
  }
}


/**
 * Extrai o project ref da URL do Supabase
 */
function extractProjectRef(url: string): string {
  const match = url.match(/https?:\/\/([^.]+)\.supabase\.co/);
  return match ? match[1] : '';
}

