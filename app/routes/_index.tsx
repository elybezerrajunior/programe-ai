import { json, type LoaderFunctionArgs, type MetaFunction } from '@remix-run/cloudflare';
import { ClientOnly } from 'remix-utils/client-only';
import { BaseChat } from '~/components/chat/BaseChat';
import { Chat } from '~/components/chat/Chat.client';
import { Header } from '~/components/header/Header';
import { ProjectTypeTags } from '~/components/home/ProjectTypeTags';
import { ProjectsSection } from '~/components/home/ProjectsSection';
import BackgroundRays from '~/components/ui/BackgroundRays';
import { HomePageContent } from '~/components/home/HomePageContent.client';
import { requireAuth } from '~/lib/auth/session';

export const meta: MetaFunction = () => {
  return [
    { title: 'Programe Studio' },
    { name: 'description', content: 'Transforme texto em software. A Programe Studio estrutura, codifica e guia você.' },
  ];
};

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  const env = (context?.cloudflare?.env as unknown as Record<string, string> | undefined) ?? undefined;
  await requireAuth(request, undefined, env ?? undefined);
  return json({});
};

/**
 * Landing page component for Bolt
 * Note: Settings functionality should ONLY be accessed through the sidebar menu.
 * Do not add settings button/panel to this landing page as it was intentionally removed
 * to keep the UI clean and consistent with the design system.
 */
export default function Index() {
  return (
    <div className="flex flex-col h-full w-full bg-bolt-elements-background-depth-1 overflow-auto">
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
