import { json, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { requireAuth } from '~/lib/auth/session';
import { default as IndexRoute } from './_index';

export async function loader(args: LoaderFunctionArgs) {
  // Proteger rota - requer autenticação
  await requireAuth(args.request);

  return json({ id: args.params.id });
}

export default IndexRoute;
