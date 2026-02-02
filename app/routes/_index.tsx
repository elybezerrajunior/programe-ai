import { json, redirect, type LoaderFunctionArgs, type MetaFunction } from '@remix-run/cloudflare';
import { useLoaderData } from '@remix-run/react';
import { useLayoutEffect } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { BaseChat } from '~/components/chat/BaseChat';
import { Chat } from '~/components/chat/Chat.client';
import { Header } from '~/components/header/Header';
import { ProjectTypeTags } from '~/components/home/ProjectTypeTags';
import { ProjectsSection } from '~/components/home/ProjectsSection';
import BackgroundRays from '~/components/ui/BackgroundRays';
import { HomePageContent } from '~/components/home/HomePageContent.client';
import { getSessionFromRequest } from '~/lib/auth/session';
import { setAuthFromServerSession } from '~/lib/stores/auth';

export const meta: MetaFunction = () => {
  return [
    { title: 'Programe Studio' },
    { name: 'description', content: 'Transforme texto em software. A Programe Studio estrutura, codifica e guia você.' },
  ];
};

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  const env = (context?.cloudflare?.env as unknown as Record<string, string> | undefined) ?? undefined;
  const session = await getSessionFromRequest(request, env ?? undefined);
  if (!session) {
    const url = new URL(request.url);
    const searchParams = new URLSearchParams();
    searchParams.set('redirectTo', url.pathname);
    throw redirect(`/login?${searchParams.toString()}`);
  }
  return json({ session });
};

/**
 * Hidrata a store de autenticação com a sessão do servidor (cookies HttpOnly).
 * Em produção o cliente não consegue ler os cookies; o loader envia a sessão e este
 * componente atualiza a store para o Header/UserMenu exibirem o usuário e o logout.
 * Usado em _index e em chat.$id (que reutiliza este componente); só atualiza se o loader retornar session.
 */
function AuthHydration() {
  const loaderData = useLoaderData<{ session?: Awaited<ReturnType<typeof getSessionFromRequest>>; id?: string }>();
  const session = 'session' in loaderData ? loaderData.session : undefined;
  // useLayoutEffect para rodar antes do useAuth e evitar que a store seja limpa em produção
  useLayoutEffect(() => {
    if (session !== undefined) {
      setAuthFromServerSession(session ?? null);
    }
  }, [session]);
  return null;
}

/**
 * Landing page component for Bolt
 * Note: Settings functionality should ONLY be accessed through the sidebar menu.
 * Do not add settings button/panel to this landing page as it was intentionally removed
 * to keep the UI clean and consistent with the design system.
 */
export default function Index() {
  return (
    <div className="flex flex-col h-full w-full bg-bolt-elements-background-depth-1 overflow-auto page-enter">
      <AuthHydration />
      <BackgroundRays />
      <Header />
      <ClientOnly fallback={<BaseChat />}>
        {() => (
          <HomePageContent>
            <Chat />
          </HomePageContent>
        )}
      </ClientOnly>
    </div>
  );
}
