import { json, redirect, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { getSessionFromRequest } from '~/lib/auth/session';
import { default as IndexRoute } from './_index';

export async function loader(args: LoaderFunctionArgs) {
  const env = (args.context?.cloudflare?.env as unknown as Record<string, string> | undefined) ?? undefined;
  const session = await getSessionFromRequest(args.request, env ?? undefined);
  if (!session) {
    const url = new URL(args.request.url);
    const searchParams = new URLSearchParams();
    searchParams.set('redirectTo', url.pathname);
    throw redirect(`/login?${searchParams.toString()}`);
  }
  return json({ id: args.params.id, session });
}

export default IndexRoute;
