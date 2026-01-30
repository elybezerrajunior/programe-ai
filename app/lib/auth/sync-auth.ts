import { supabase } from './supabase-client';

/**
 * Sincroniza a sessão dos cookies para o localStorage do Supabase
 * Isso é necessário porque o login é feito no servidor, mas o Supabase no cliente
 * usa localStorage para gerenciar a sessão
 */
export async function syncAuthFromCookies(): Promise<boolean> {
  if (typeof window === 'undefined' || !supabase) {
    return false;
  }

  try {
    // Verificar se já há sessão no Supabase
    const { data: existingSession } = await supabase.auth.getSession();
    if (existingSession.session) {
      return true;
    }

    // Parse cookies
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [name, ...rest] = cookie.trim().split('=');
      if (name && rest.length > 0) {
        acc[decodeURIComponent(name.trim())] = decodeURIComponent(rest.join('=').trim());
      }
      return acc;
    }, {} as Record<string, string>);

    // Extrair project ref da URL do Supabase
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const projectRefMatch = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/);
    const projectRef = projectRefMatch ? projectRefMatch[1] : '';

    // Tentar diferentes formatos de cookie
    const accessToken =
      cookies[`sb-${projectRef}-auth-token`] ||
      cookies['sb-access-token'] ||
      cookies['programe_session'];

    const refreshToken =
      cookies[`sb-${projectRef}-auth-refresh-token`] ||
      cookies['sb-refresh-token'] ||
      '';

    if (!accessToken || !supabase) {
      return false;
    }

    // Definir sessão no Supabase
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) {
      console.error('[syncAuth] Error setting session:', error);
      return false;
    }

    if (data.session) {
      return true;
    }

    return false;
  } catch (error) {
    console.error('[syncAuth] Unexpected error:', error);
    return false;
  }
}

