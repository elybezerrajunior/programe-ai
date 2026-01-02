import { redirect, type ActionFunctionArgs } from '@remix-run/cloudflare';
import { createLogoutCookie } from '~/lib/auth/session';

export const action = async ({ request }: ActionFunctionArgs) => {
  const logoutCookie = createLogoutCookie();
  
  return redirect('/login', {
    headers: {
      'Set-Cookie': logoutCookie,
    },
  });
};

export const loader = async () => {
  return redirect('/login');
};

