import { json, type ActionFunctionArgs } from '@remix-run/cloudflare';
import { createSessionCookies, createSessionHeaders } from '~/lib/auth/session';
import { getSupabaseClient } from '~/lib/auth/supabase-client';

// Tipo para variáveis de ambiente do Cloudflare
interface CloudflareEnv {
  VITE_SUPABASE_URL?: string;
  SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  SUPABASE_ANON_KEY?: string;
}

/**
 * API para sincronizar a sessão OAuth do cliente com o servidor
 * 
 * O OAuth com Implicit Flow salva os tokens apenas no localStorage do cliente.
 * Esta API recebe os tokens e cria cookies HTTP-only para que as APIs
 * do servidor possam autenticar o usuário.
 * 
 * POST /api/auth/sync-session
 * Body: { accessToken: string, refreshToken: string }
 */
export async function action({ request, context }: ActionFunctionArgs) {
  // Apenas aceitar POST
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = await request.json();
    const { accessToken, refreshToken } = body as { accessToken?: string; refreshToken?: string };

    // Validar tokens
    if (!accessToken) {
      return json({ error: 'Access token is required' }, { status: 400 });
    }

    // Obter variáveis de ambiente do Cloudflare
    const env = (context?.cloudflare?.env as unknown as CloudflareEnv) || undefined;
    const supabase = getSupabaseClient(env);

    // Validar token com Supabase para garantir que é válido
    if (supabase) {
      const { data, error } = await supabase.auth.getUser(accessToken);

      if (error || !data.user) {
        console.error('[Sync Session] Invalid token:', error?.message);
        return json({ error: 'Invalid or expired token' }, { status: 401 });
      }

      console.log('[Sync Session] Token validated for user:', data.user.email);
    } else {
      console.warn('[Sync Session] Supabase not configured, skipping token validation');
    }

    // Criar cookies de sessão
    const cookies = createSessionCookies(accessToken, refreshToken || '', true, env);

    // Retornar sucesso com os cookies definidos
    return json(
      { success: true },
      {
        headers: createSessionHeaders(cookies),
      }
    );
  } catch (error) {
    console.error('[Sync Session] Error:', error);
    return json(
      { error: 'Failed to sync session' },
      { status: 500 }
    );
  }
}

/**
 * Loader para rejeitar requisições GET
 */
export async function loader() {
  return json({ error: 'Method not allowed' }, { status: 405 });
}
