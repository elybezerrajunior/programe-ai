import { json, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { requireAuth } from '~/lib/auth/session';
import { default as IndexRoute } from './_index';

export async function loader({ request, params, context }: LoaderFunctionArgs) {
  // Obter variáveis de ambiente do Cloudflare (necessário em produção)
  const env = context?.cloudflare?.env as unknown as Record<string, string> | undefined;

  // Proteger rota - requer autenticação
  await requireAuth(request, undefined, env);

  return json({ id: params.id });
}

export default IndexRoute;
