import { json, type LoaderFunctionArgs, type MetaFunction } from '@remix-run/cloudflare';
import BackgroundRays from '~/components/ui/BackgroundRays';
import { Header } from '~/components/header/Header';
import { requireAuth } from '~/lib/auth/session';
import { classNames } from '~/utils/classNames';

export const meta: MetaFunction = () => [
  { title: 'Explorar - Programe Studio' },
  { name: 'description', content: 'Explore modelos e recursos do Programe Studio.' },
];

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  // Obter variáveis de ambiente do Cloudflare (necessário em produção)
  const env = context?.cloudflare?.env as unknown as Record<string, string> | undefined;

  await requireAuth(request, undefined, env);
  return json({});
};

const CATEGORIES = [
  { id: 'apps', label: 'Apps e Jogos', icon: 'i-ph:grid-four' },
  { id: 'landing', label: 'Landing Pages', icon: 'i-ph:layout' },
  { id: 'components', label: 'Componentes', icon: 'i-ph:package' },
  { id: 'dashboards', label: 'Dashboards', icon: 'i-ph:chart-bar' },
];

const TEMPLATES = [
  { id: '1', title: 'Nano Banana Pro Playground', views: '4.2K', likes: 523, tag: 'Free' },
  { id: '2', title: 'Brilliance SaaS Landing Page', views: '10.2K', likes: 1600, tag: 'Free' },
  { id: '3', title: '3D Gallery Photography Template', views: '2.8K', likes: 706, tag: '1 Credit' },
  { id: '4', title: 'Opus landing page', views: '696', likes: 188, tag: 'Free' },
  { id: '5', title: 'AI Gateway Starter', views: '1.1K', likes: 224, tag: 'Free' },
  { id: '6', title: 'Globe To Map Transform', views: '1.4K', likes: 434, tag: 'Free' },
];

export default function Explore() {
  return (
    <div className="flex flex-col min-h-screen w-full bg-bolt-elements-background-depth-1 overflow-auto">
      <Header />
      <BackgroundRays />

      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-8">
        {/* Título */}
        <h1 className="text-3xl md:text-4xl font-bold text-bolt-elements-textPrimary mb-8">
          Comece com um modelo
        </h1>

        {/* Pills de categoria */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {CATEGORIES.map((cat, i) => (
            <button
              key={cat.id}
              type="button"
              className={classNames(
                'flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap',
                i === 0
                  ? 'bg-bolt-elements-background-depth-2 text-bolt-elements-textPrimary border border-bolt-elements-borderColor'
                  : 'text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary border border-bolt-elements-borderColor/50 hover:border-bolt-elements-borderColor bg-transparent'
              )}
            >
              <span className={classNames(cat.icon, 'w-4 h-4')} />
              {cat.label}
            </button>
          ))}
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary transition-colors"
          >
            Ver todos
            <span className="i-ph:caret-right w-4 h-4" />
          </button>
        </div>

        {/* Grid de templates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              className="group text-left rounded-xl overflow-hidden border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 hover:border-bolt-elements-borderColorActive transition-colors"
            >
              <div className="aspect-[4/3] bg-bolt-elements-background-depth-3 border-b border-bolt-elements-borderColor flex items-center justify-center">
                <span className="text-bolt-elements-textTertiary text-xs">Preview</span>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-bolt-elements-textPrimary mb-3 line-clamp-2 group-hover:text-accent-500 transition-colors">
                  {t.title}
                </h3>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 text-bolt-elements-textTertiary text-xs">
                    <span className="flex items-center gap-1">
                      <span className="i-ph:eye w-3.5 h-3.5" />
                      {t.views}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="i-ph:heart w-3.5 h-3.5" />
                      {t.likes}
                    </span>
                  </div>
                  <span
                    className={classNames(
                      'text-xs font-medium px-2 py-1 rounded',
                      t.tag === 'Free'
                        ? 'bg-bolt-elements-background-depth-1 text-bolt-elements-textSecondary'
                        : 'bg-accent-500/20 text-accent-500'
                    )}
                  >
                    {t.tag}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Botão Ver todos (rodapé da seção) */}
        <div className="flex justify-center mt-12">
          <button
            type="button"
            className="px-8 py-3 rounded-xl text-sm font-medium border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-3 hover:border-bolt-elements-borderColorActive transition-colors"
          >
            Ver todos
          </button>
        </div>
      </main>
    </div>
  );
}
