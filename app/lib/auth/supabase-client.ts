import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Tipo para variáveis de ambiente do Cloudflare
export interface CloudflareEnv {
  VITE_SUPABASE_URL?: string;
  SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  SUPABASE_ANON_KEY?: string;
}

// Função helper para obter variáveis de ambiente de forma segura
function getEnvVar(key: string): string | undefined {
  // No cliente (browser)
  if (typeof window !== 'undefined') {
    return import.meta.env[key];
  }

  // No servidor - tentar process.env (Node.js) ou retornar undefined (Cloudflare)
  // No Cloudflare, process.env pode não estar disponível ou não ter as variáveis
  // Nesse caso, as variáveis devem vir do context.cloudflare.env
  try {
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key];
    }
  } catch {
    // Ignorar erro se process não estiver disponível (Cloudflare)
  }

  return undefined;
}

// Variáveis de ambiente - não lançar erro se não estiverem disponíveis no servidor
// Isso permite que o código funcione no Cloudflare onde as variáveis vêm do context
const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

/** Cria um cliente Supabase (uso server-side com env do context) */
export function createSupabaseClient(url: string, anonKey: string): SupabaseClient {
  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      storage: undefined,
      storageKey: 'sb-auth',
    },
  });
}

// Só criar o cliente se as variáveis estiverem disponíveis
// No Cloudflare, o cliente pode ser criado dinamicamente com variáveis do context
let supabase: ReturnType<typeof createClient> | null = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true, // Permite Supabase processar tokens na URL automaticamente
      flowType: 'implicit', // Usar Implicit flow (tokens direto na URL, sem code_verifier)
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'sb-auth',
    },
  });
} else if (typeof window !== 'undefined') {
  // No cliente, sempre exigir as variáveis
  throw new Error(
    'Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY'
  );
}

/**
 * Cria um cliente Supabase a partir de variáveis de ambiente do Cloudflare
 * Use em rotas server-side quando o singleton for null
 */
function createSupabaseClientFromEnv(env: CloudflareEnv): SupabaseClient | null {
  const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
  const anonKey = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.error('[Supabase] Missing environment variables:', {
      hasUrl: !!url,
      hasAnonKey: !!anonKey,
    });
    return null;
  }

  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

/**
 * Obtém o cliente Supabase, tentando o singleton primeiro e criando dinamicamente se necessário
 */
export function getSupabaseClient(env?: CloudflareEnv): SupabaseClient | null {
  if (supabase) return supabase;
  if (env) return createSupabaseClientFromEnv(env);
  return null;
}

/**
 * Retorna o project ref da URL do Supabase (para nomes de cookies etc.)
 */
export function getSupabaseProjectRef(env?: CloudflareEnv): string {
  const url = supabaseUrl || env?.VITE_SUPABASE_URL || env?.SUPABASE_URL || '';
  const match = url.match(/https?:\/\/([^.]+)\.supabase\.co/);
  return match ? match[1] : '';
}

/**
 * Cliente Supabase singleton
 * Funciona tanto no browser quanto no servidor (SSR)
 * No Cloudflare, pode ser null se as variáveis não estiverem disponíveis no módulo
 */
export { supabase };

