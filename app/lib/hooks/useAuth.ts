import { useLoaderData } from '@remix-run/react';

export interface AuthData {
  user: {
    id: string;
    email: string;
    name?: string;
  } | null;
  isAuthenticated: boolean;
}

/**
 * Hook para acessar dados de autenticação do loader
 * 
 * Exemplo de uso no loader:
 * ```ts
 * export const loader = async ({ request }: LoaderFunctionArgs) => {
 *   const session = getSessionFromRequest(request);
 *   return json({ 
 *     auth: { 
 *       user: session?.user || null, 
 *       isAuthenticated: !!session 
 *     } 
 *   });
 * };
 * ```
 */
export function useAuth(): AuthData {
  const data = useLoaderData<{ auth?: AuthData }>();
  return data.auth || { user: null, isAuthenticated: false };
}

