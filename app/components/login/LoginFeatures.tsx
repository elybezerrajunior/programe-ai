import { classNames } from '~/utils/classNames';
import { Card } from '~/components/ui/Card';

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <Card
      className={classNames(
        'p-4 transition-all hover:border-programe-elements-borderColorActive rounded-xl',
        'bg-programe-elements-background-depth-2'
      )}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-accent/10 flex-shrink-0">
          <span className={classNames(icon, 'text-xl text-accent')} />
        </div>
      </div>
      <h3 className="text-lg font-semibold text-programe-elements-textPrimary mb-2">{title}</h3>
      <p className="text-sm text-programe-elements-textSecondary line-clamp-2">{description}</p>
    </Card>
  );
}

export function LoginFeatures() {
  const features = [
    {
      icon: 'i-ph:grid-four',
      title: 'Gerar telas',
      description: 'Crie telas rapidamente a partir da sua ideia.',
    },
    {
      icon: 'i-ph:database',
      title: 'Criar APIs e banco',
      description: 'Backend completo em minutos, pronto para evoluir.',
    },
    {
      icon: 'i-ph:rocket-launch',
      title: 'Projeto pronto para deploy',
      description: 'Estrutura organizada para publicar quando quiser.',
    },
  ];

  const includes = [
    'Templates prontos para uso',
    'Tutoria guiada por IA em cada etapa',
    'Histórico de versões automático',
  ];

  return (
    <div className="flex flex-col flex-1">
      <div className="mb-8">
        <div className="inline-block px-3 py-1 rounded-full bg-accent-500/10 border border-accent-500/20 mb-6">
          <span className="text-xs font-semibold text-accent-500 uppercase tracking-wide">
            POR QUE USAR O STUDIO?
          </span>
        </div>
        <h2 className="text-3xl font-bold text-programe-elements-textPrimary">
          O que você vai construir aqui
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-8">
        {features.map((feature, index) => (
          <FeatureCard
            key={index}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
          />
        ))}
      </div>

      <div className="mt-auto">
        <h3 className="text-sm font-semibold text-programe-elements-textSecondary uppercase tracking-wide mb-4">
          INCLUI:
        </h3>
        <ul className="flex flex-col gap-3">
          {includes.map((item, index) => (
            <li key={index} className="flex items-center gap-3">
              <span className="i-ph:check-circle w-5 h-5 text-accent-500 flex-shrink-0" />
              <span className="text-sm text-programe-elements-textSecondary">
                {item}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

