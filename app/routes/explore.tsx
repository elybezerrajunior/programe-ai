import { json, type LoaderFunctionArgs, type MetaFunction } from '@remix-run/cloudflare';
import { useLoaderData } from '@remix-run/react';
import { useState, useMemo } from 'react';
import BackgroundRays from '~/components/ui/BackgroundRays';
import { Header } from '~/components/header/Header';
import { requireAuth } from '~/lib/auth/session';
import { getSupabaseClient } from '~/lib/auth/supabase-client';
import { classNames } from '~/utils/classNames';
import { Dialog, DialogTitle, DialogRoot } from '~/components/ui/Dialog';
import { Button } from '~/components/ui/Button';

export const meta: MetaFunction = () => [
  { title: 'Explorar - Programe Studio' },
  { name: 'description', content: 'Explore modelos e recursos do Programe Studio.' },
];

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  const env = context?.cloudflare?.env as unknown as Record<string, string> | undefined;
  await requireAuth(request, undefined, env);

  const client = getSupabaseClient(env);
  let dbTemplates: any[] = [];

  if (client) {
    console.log('Loader: Supabase client initialized');
    const { data, error } = await client
      .from('templates')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Loader: Error fetching templates:', error);
    } else if (data) {
      console.log(`Loader: Fetched ${data.length} templates`);
      dbTemplates = data;
    }
  } else {
    console.warn('Loader: Supabase client NOT initialized');
  }

  return json({ dbTemplates });
};

const CATEGORIES = [
  { id: 'all', label: 'Todos', icon: 'i-ph:squares-four' },
  { id: 'landing', label: 'Landing Pages', icon: 'i-ph:layout' },
  { id: 'components', label: 'Componentes', icon: 'i-ph:package' },
  { id: 'dashboards', label: 'Dashboards', icon: 'i-ph:chart-bar' },
];

const STATIC_TEMPLATES = [
  {
    id: '1',
    title: 'Nano Banana Pro Playground',
    description: 'Um ambiente de desenvolvimento divertido e rápido para prototipagem.',
    views: '4.2K',
    likes: 523,
    tag: 'Free',
    category: 'apps',
    technologies: ['React', 'Vite', 'TailwindCSS'],
    gradient: 'from-yellow-400 to-orange-500',
  },
  {
    id: '2',
    title: 'Brilliance SaaS Landing Page',
    description: 'Landing page moderna e responsiva para produtos SaaS, com seções de features e pricing.',
    views: '10.2K',
    likes: 1600,
    tag: 'Free',
    category: 'landing',
    technologies: ['React', 'Framer Motion', 'Radix UI'],
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    id: '3',
    title: '3D Gallery Photography Template',
    description: 'Galeria imersiva com efeitos 3D para fotógrafos e artistas visuais.',
    views: '2.8K',
    likes: 706,
    tag: '1 Credit',
    category: 'components',
    technologies: ['Three.js', 'React Three Fiber', 'WebGL'],
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    id: '4',
    title: 'Opus Landing Page',
    description: 'Template minimalista focado em tipografia e espaço em branco.',
    views: '696',
    likes: 188,
    tag: 'Free',
    category: 'landing',
    technologies: ['HTML', 'CSS', 'Vanilla JS'],
    gradient: 'from-emerald-400 to-teal-600',
  },
  {
    id: '5',
    title: 'AI Gateway Starter',
    description: 'Starter kit para criar gateways de API com integração de IA.',
    views: '1.1K',
    likes: 224,
    tag: 'Free',
    category: 'apps',
    technologies: ['Node.js', 'OpenAI API', 'Express'],
    gradient: 'from-slate-700 to-slate-900',
  },
  {
    id: '6',
    title: 'Globe To Map Transform',
    description: 'Componente visual de transição suave entre globo 3D e mapa 2D.',
    views: '1.4K',
    likes: 434,
    tag: 'Free',
    category: 'components',
    technologies: ['D3.js', 'React', 'SVG'],
    gradient: 'from-cyan-400 to-blue-500',
  },
];

export default function Explore() {
  const { dbTemplates } = useLoaderData<typeof loader>();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Combine Static + DB Templates
  const allTemplates = useMemo(() => {
    // Map DB templates to UI structure if needed
    const mappedDbTemplates = dbTemplates.map((t: any) => ({
      id: t.id,
      title: t.title,
      description: t.description || '',
      views: t.views || 0, // Fallback if DB is null
      likes: t.likes || 0,
      tag: 'Community', // Default tag for DB templates
      category: t.category || 'other',
      technologies: t.technologies || [],
      gradient: t.gradient || 'from-gray-700 to-gray-900', // Default gradient
    }));

    return [...mappedDbTemplates, ...STATIC_TEMPLATES];
  }, [dbTemplates]);

  const [selectedTemplate, setSelectedTemplate] = useState<(typeof allTemplates)[0] | null>(null);

  const filteredTemplates = useMemo(() => {
    return allTemplates.filter((t) => {
      const matchesCategory = activeCategory === 'all' || t.category === activeCategory;
      const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery, allTemplates]);

  return (
    <div className="flex flex-col min-h-screen w-full bg-programe-elements-background-depth-1 overflow-auto">
      <Header />
      <BackgroundRays />

      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-8 relative z-10">
        {/* Header da Seção */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-6">
          <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold text-programe-elements-textPrimary mb-2">
              Explore Modelos
            </h1>
            <p className="text-programe-elements-textSecondary">
              Inicie seu próximo projeto com templates prontos para produção.
            </p>
          </div>

          {/* Barra de Busca */}
          <div className="relative w-full md:w-80 group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="i-ph:magnifying-glass w-5 h-5 text-programe-elements-textTertiary group-focus-within:text-accent-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Buscar templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-programe-elements-background-depth-2 border border-programe-elements-borderColor rounded-xl text-sm text-programe-elements-textPrimary focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500 transition-all placeholder-programe-elements-textTertiary"
            />
          </div>
        </div>

        {/* Filtros de Categoria */}
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-10">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={classNames(
                'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
                activeCategory === cat.id
                  ? 'bg-accent-500/10 text-accent-500 border border-accent-500/50 shadow-sm shadow-accent-500/20'
                  : 'text-programe-elements-textSecondary hover:text-programe-elements-textPrimary border border-programe-elements-borderColor/50 hover:border-programe-elements-borderColor bg-programe-elements-background-depth-2 hover:bg-programe-elements-background-depth-3'
              )}
            >
              <span className={classNames(cat.icon, 'w-4 h-4')} />
              {cat.label}
            </button>
          ))}
        </div>

        {/* Grid de Templates */}
        {filteredTemplates.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTemplates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTemplate(t)}
                className="group flex flex-col text-left h-full rounded-2xl overflow-hidden border border-programe-elements-borderColor bg-programe-elements-background-depth-2 hover:border-accent-500/50 hover:shadow-lg hover:shadow-accent-500/5 transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* Imagem / Preview (Gradiente) */}
                <div className={classNames(
                  'aspect-[4/3] w-full relative overflow-hidden',
                  'bg-gradient-to-br', t.gradient
                )}>
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />

                  {/* Badge Tag */}
                  <div className="absolute top-3 right-3">
                    <span
                      className={classNames(
                        'text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider backdrop-blur-md border border-white/20 shadow-sm',
                        t.tag === 'Free'
                          ? 'bg-white/90 text-gray-800'
                          : 'bg-black/80 text-white'
                      )}
                    >
                      {t.tag}
                    </span>
                  </div>

                  {/* Icone Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="i-ph:arrows-out-simple w-10 h-10 text-white drop-shadow-md transform scale-75 group-hover:scale-100 transition-transform" />
                  </div>
                </div>

                {/* Conteúdo do Card */}
                <div className="flex flex-col flex-1 p-5">
                  <h3 className="text-lg font-bold text-programe-elements-textPrimary mb-2 group-hover:text-accent-500 transition-colors">
                    {t.title}
                  </h3>
                  <p className="text-sm text-programe-elements-textSecondary mb-4 line-clamp-2 flex-1">
                    {t.description}
                  </p>

                  <div className="flex items-center justify-end pt-4 border-t border-programe-elements-borderColor/50">
                    {/* Tech Stacks (Mini ícones ou texto) */}

                    <div className="flex -space-x-2">
                      {t.technologies.slice(0, 3).map((tech: string, i: number) => (
                        <div key={i} title={tech} className="w-6 h-6 rounded-full bg-programe-elements-background-depth-3 border border-programe-elements-borderColor flex items-center justify-center text-[10px] text-programe-elements-textSecondary font-bold ring-2 ring-programe-elements-background-depth-2">
                          {tech[0]}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-programe-elements-background-depth-2 rounded-full flex items-center justify-center mb-4">
              <span className="i-ph:magnifying-glass w-8 h-8 text-programe-elements-textTertiary" />
            </div>
            <h3 className="text-xl font-medium text-programe-elements-textPrimary mb-2">Nenhum template encontrado</h3>
            <p className="text-programe-elements-textSecondary max-w-md mx-auto">
              Tente ajustar sua busca ou mudar o filtro de categoria para encontrar o que procura.
            </p>
            <button
              onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
              className="mt-6 text-accent-500 font-medium hover:underline"
            >
              Limpar filtros
            </button>
          </div>
        )}
      </main>

      {/* Modal de Detalhes do Projeto */}
      <DialogRoot open={!!selectedTemplate} onOpenChange={(open) => !open && setSelectedTemplate(null)}>
        <Dialog onClose={() => setSelectedTemplate(null)} className="w-full max-w-2xl overflow-hidden p-0 !bg-programe-elements-background-depth-1">
          {selectedTemplate && (
            <div className="flex flex-col max-h-[90vh]">
              {/* Header do Modal com Imagem */}
              <div className={classNames(
                'relative h-48 w-full shrink-0',
                'bg-gradient-to-br', selectedTemplate.gradient
              )}>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-sm transition-colors"
                >
                  <span className="i-ph:x w-5 h-5" />
                </button>
                <div className="absolute bottom-4 left-6">
                  <span className="px-3 py-1 bg-white/90 text-gray-900 text-xs font-bold rounded-full uppercase tracking-wide">
                    {selectedTemplate.category.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Corpo do Modal */}
              <div className="p-6 md:p-8 overflow-y-auto">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                  <div>
                    <DialogTitle className="text-2xl font-bold mb-2">{selectedTemplate.title}</DialogTitle>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={classNames(
                      'px-3 py-1.5 rounded-lg text-sm font-semibold border',
                      selectedTemplate.tag === 'Free'
                        ? 'border-green-500/30 text-green-600 bg-green-500/10'
                        : 'border-purple-500/30 text-purple-600 bg-purple-500/10'
                    )}>
                      {selectedTemplate.tag}
                    </span>
                  </div>
                </div>

                <div className="prose dark:prose-invert text-programe-elements-textSecondary text-sm leading-relaxed mb-8">
                  <p>{selectedTemplate.description}</p>
                  <p>
                    Este template é otimizado para performance e segue as melhores práticas de SEO e acessibilidade.
                    Perfeito para quem quer começar rápido sem configurar tudo do zero.
                  </p>
                </div>

                <div className="mb-8">
                  <h4 className="text-sm font-bold text-programe-elements-textPrimary uppercase tracking-wider mb-4">Tecnologias</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.technologies.map((tech: string) => (
                      <span
                        key={tech}
                        className="px-3 py-1.5 bg-programe-elements-background-depth-2 border border-programe-elements-borderColor rounded-md text-sm text-programe-elements-textSecondary font-medium"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 mt-auto border-t border-programe-elements-borderColor">
                  <Button
                    className="w-full sm:flex-1 bg-accent-500 hover:bg-accent-600 text-white font-medium py-2.5 rounded-xl transition-all shadow-lg shadow-accent-500/20"
                    onClick={() => {
                      // Navegar para a página inicial com o parâmetro do template
                      // O Loader da página inicial (ou Chat) deverá ler esse parâmetro e carregar o conteúdo inicial
                      window.location.href = `/?templateId=${selectedTemplate.id}`;
                    }}
                  >
                    <span className="i-ph:rocket-launch w-5 h-5 mr-2" />
                    Começar com este Template
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Dialog>
      </DialogRoot>
    </div>
  );
}
