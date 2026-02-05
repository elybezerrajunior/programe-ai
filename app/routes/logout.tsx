import { redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { createLogoutCookies, createSessionHeaders } from '~/lib/auth/session';
import { signOut } from '~/lib/auth/supabase-auth';

export const loader = async () => {
  return redirect('/login');
};

export const action = async ({ request, context }: ActionFunctionArgs) => {
  // Obter variáveis de ambiente do Cloudflare
  const env = context?.cloudflare?.env as unknown as Record<string, string> | undefined;

  try {
    // Fazer logout no Supabase
    await signOut();
  } catch (error) {
    console.error('Logout error:', error);
    // Continuar mesmo se houver erro, para limpar cookies
  }

  // Criar cookies para limpar sessão
  const cookies = createLogoutCookies(env);

  // Redirecionar para login
  return redirect('/login', {
    headers: createSessionHeaders(cookies),
  });
};
