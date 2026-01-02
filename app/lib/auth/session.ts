import { parseCookies } from '~/lib/api/cookies';

const SESSION_COOKIE_NAME = 'programe_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 dias

export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface Session {
  user: User;
  expiresAt: number;
}

export function createSessionCookie(user: User): string {
  const session: Session = {
    user,
    expiresAt: Date.now() + SESSION_MAX_AGE * 1000,
  };

  const sessionValue = JSON.stringify(session);
  const encodedValue = encodeURIComponent(sessionValue);

  return `${SESSION_COOKIE_NAME}=${encodedValue}; Path=/; Max-Age=${SESSION_MAX_AGE}; HttpOnly; SameSite=Lax; Secure`;
}

export function getSessionFromRequest(request: Request): Session | null {
  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) {
    return null;
  }

  const cookies = parseCookies(cookieHeader);
  const sessionCookie = cookies[SESSION_COOKIE_NAME];

  if (!sessionCookie) {
    return null;
  }

  try {
    const session: Session = JSON.parse(decodeURIComponent(sessionCookie));

    // Verificar se a sessão expirou
    if (session.expiresAt < Date.now()) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export function createLogoutCookie(): string {
  return `${SESSION_COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`;
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): boolean {
  return password.length >= 6;
}

