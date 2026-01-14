import { redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { createLogoutCookies } from '~/lib/auth/session';
import { signOut } from '~/lib/auth/supabase-auth';

export const loader = async () => {
  return redirect('/login');
};

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    // Fazer logout no Supabase
    await signOut();
  } catch (error) {
    console.error('Logout error:', error);
    // Continuar mesmo se houver erro, para limpar cookies
  }

  // Criar cookies para limpar sessão
  const cookies = createLogoutCookies();

  // Redirecionar para login
  return redirect('/login', {
    headers: {
      'Set-Cookie': cookies,
    },
  });
};
