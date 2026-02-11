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

export function SignupFeatures() {
  const features = [
    {
      icon: 'i-ph:sparkle',
      title: 'IA de ponta a ponta',
      description: 'Desenvolvimento completo assistido por inteligência artificial.',
    },
    {
      icon: 'i-ph:lightning',
      title: 'Construção rápida',
      description: 'Transforme ideias em projetos funcionais em minutos.',
    },
    {
      icon: 'i-ph:shield-check',
      title: 'Seguro e confiável',
      description: 'Seus projetos ficam protegidos e você tem controle total.',
    },
  ];

  const benefits = [
    'Acesso ilimitado a todos os recursos',
    'Projetos salvos automaticamente',
    'Deploy em um clique',
  ];

  return (
    <div className="flex flex-col flex-1">
      <div className="mb-8">
        <div className="inline-block px-3 py-1 rounded-full bg-accent-500/10 border border-accent-500/20 mb-6">
          <span className="text-xs font-semibold text-accent-500 uppercase tracking-wide">
            BENEFÍCIOS
          </span>
        </div>
        <h2 className="text-3xl font-bold text-programe-elements-textPrimary">
          Comece a construir hoje
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
          VOCÊ GANHA:
        </h3>
        <ul className="flex flex-col gap-3">
          {benefits.map((item, index) => (
            <li key={index} className="flex items-center gap-3">
              <span className="i-ph:check-circle w-5 h-5 text-accent-500 flex-shrink-0" />
              <span className="text-sm text-programe-elements-textSecondary">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
