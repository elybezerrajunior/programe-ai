import { json, redirect, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { getSessionFromRequest } from '~/lib/auth/session';
import { default as IndexRoute } from './_index';

export async function loader({ request, params, context }: LoaderFunctionArgs) {
  const env = context?.cloudflare?.env as unknown as Record<string, string> | undefined;
  const session = await getSessionFromRequest(request, env);
  if (!session) {
    const url = new URL(request.url);
    const searchParams = new URLSearchParams();
    searchParams.set('redirectTo', url.pathname);
    throw redirect(`/login?${searchParams.toString()}`);
  }
  return json({ id: params.id, session });
}

export default IndexRoute;
