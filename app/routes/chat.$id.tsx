import { json, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { requireAuth } from '~/lib/auth/session';
import { default as IndexRoute } from './_index';

export async function loader(args: LoaderFunctionArgs) {
  const env = (args.context?.cloudflare?.env as unknown as Record<string, string> | undefined) ?? undefined;
  await requireAuth(args.request, undefined, env ?? undefined);
  return json({ id: args.params.id });
}

export default IndexRoute;
