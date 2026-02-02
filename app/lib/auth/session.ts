import { redirect } from '@remix-run/cloudflare';
import { parseCookies } from '~/lib/api/cookies';
import { supabase, getSupabaseProjectRef } from './supabase-client';

const SESSION_COOKIE_NAME = 'programe_session';
const SUPABASE_ACCESS_TOKEN_COOKIE = 'sb-access-token';
const SUPABASE_REFRESH_TOKEN_COOKIE = 'sb-refresh-token';

/**
 * Interface do usuário (mantida para compatibilidade)
 */
export interface User {
  id: string;
  email: string;
  name?: string;
}

/**
 * Interface de sessão (mantida para compatibilidade)
 */
export interface Session {
  user: User;
  accessToken: string;
}

/**
 * Extrai o project ref da URL do Supabase
 */
function extractProjectRef(url: string): string {
  const match = url.match(/https?:\/\/([^.]+)\.supabase\.co/);
  return match ? match[1] : '';
}

/**
 * Obtém o nome do cookie baseado no project ref
 */
function getCookieName(baseName: string): string {
  const projectRef = getSupabaseProjectRef();
  return projectRef ? `sb-${projectRef}-${baseName}` : baseName;
}

/**
 * Valida a sessão do Supabase a partir dos cookies
 * Extrai o token dos cookies e valida com Supabase
 */
export async function getSessionFromRequest(request: Request): Promise<Session | null> {
  if (!supabase) return null;

  const cookieHeader = request.headers.get('Cookie');

  if (!cookieHeader) {
    return null;
  }

  try {
    const cookies = parseCookies(cookieHeader);

    // Tentar diferentes formatos de cookie do Supabase
    const accessToken =
      cookies[SUPABASE_ACCESS_TOKEN_COOKIE] ||
      cookies[getCookieName('auth-token')] ||
      cookies[SESSION_COOKIE_NAME];

    if (!accessToken) {
      return null;
    }

    // Validar token com Supabase usando getUser()
    const { data, error } = await supabase.auth.getUser(accessToken);

    if (error || !data.user) {
      return null;
    }

    const user = data.user;

    return {
      user: {
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.name || user.user_metadata?.full_name || undefined,
      },
      accessToken,
    };
  } catch (error) {
    console.error('Error validating session:', error);
    return null;
  }
}

/**
 * Cria cookies para a sessão do Supabase
 */
/**
 * Cria cookies para a sessão do Supabase
 */
export function createSessionCookies(
  accessToken: string,
  refreshToken: string,
  persist: boolean = false
): string[] {
  const accessTokenCookieName = getCookieName('auth-token');
  const refreshTokenCookieName = getCookieName('auth-refresh-token');

  // Cookies HTTP-only, Secure, SameSite=Lax para segurança
  const cookies: string[] = [];

  // Definir expiração
  // Se persistir:
  // - Access Token: 1 hora
  // - Refresh Token: 30 dias (padrão)
  // - Session Token (compatibilidade): 1 hora
  // Se não persistir (sessão):
  // - Sem Max-Age (expira ao fechar navegador) ou Max-Age curto

  // Vamos usar Max-Age fixo para garantir funcionamento, mas variar o tempo do refresh token
  const accessTokenAge = 3600; // 1 hora
  const refreshTokenAge = persist ? 2592000 : 3600; // 30 dias ou 1 hora (sessão)

  const maxAgeAccess = `Max-Age=${accessTokenAge}`;
  const maxAgeRefresh = `Max-Age=${refreshTokenAge}`;

  // Cookie de access token
  cookies.push(
    `${accessTokenCookieName}=${accessToken}; Path=/; ${maxAgeAccess}; HttpOnly; SameSite=Lax; Secure`
  );

  // Cookie de refresh token
  cookies.push(
    `${refreshTokenCookieName}=${refreshToken}; Path=/; ${maxAgeRefresh}; HttpOnly; SameSite=Lax; Secure`
  );

  // Cookie de compatibilidade (para migração)
  cookies.push(
    `${SESSION_COOKIE_NAME}=${accessToken}; Path=/; ${maxAgeAccess}; HttpOnly; SameSite=Lax; Secure`
  );

  return cookies;
}

/**
 * Cria Headers com múltiplos Set-Cookie (para redirect())
 */
export function createSessionHeaders(cookieStrings: string[]): Headers {
  const headers = new Headers();
  cookieStrings.forEach((c) => headers.append('Set-Cookie', c));
  return headers;
}

/**
 * Cria cookies para limpar sessão (logout)
 */
export function createLogoutCookies(): string[] {
  const accessTokenCookieName = getCookieName('auth-token');
  const refreshTokenCookieName = getCookieName('auth-refresh-token');

  const cookies: string[] = [];

  // Limpar todos os cookies de autenticação
  cookies.push(`${accessTokenCookieName}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure`);
  cookies.push(`${refreshTokenCookieName}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure`);
  cookies.push(`${SESSION_COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure`);

  return cookies;
}

/**
 * Helper para validar email
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Helper para validar senha
 */
export function validatePassword(password: string): boolean {
  return password.length >= 6;
}

/**
 * Helper para validar confirmação de senha
 */
export function validatePasswordConfirmation(password: string, confirmation: string): boolean {
  return password === confirmation && password.length >= 6;
}

/**
 * Helper para proteger rotas (requer autenticação)
 * Redireciona para /login se não autenticado
 */
export async function requireAuth(request: Request, redirectTo?: string) {
  const session = await getSessionFromRequest(request);

  if (!session) {
    const url = new URL(request.url);
    const searchParams = new URLSearchParams();

    if (redirectTo || url.pathname !== '/login') {
      searchParams.set('redirectTo', redirectTo || url.pathname);
    }

    throw redirect(`/login?${searchParams.toString()}`);
  }

  return session;
}
