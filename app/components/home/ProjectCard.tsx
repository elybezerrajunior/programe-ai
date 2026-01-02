import { classNames } from '~/utils/classNames';
import { Card } from '~/components/ui/Card';

export interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  status: 'active' | 'wip' | 'completed';
  lastUpdated: string;
  icon?: string;
  iconColor?: string;
  urlId?: string;
}

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
}

const statusConfig = {
  active: { label: 'ATIVO', color: 'bg-green-500/20 text-green-500 border-green-500/30' },
  wip: { label: 'WIP', color: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' },
  completed: { label: 'CONCLUÍDO', color: 'bg-blue-500/20 text-blue-500 border-blue-500/30' },
};

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const status = statusConfig[project.status];

  return (
    <Card
      className={classNames(
        'p-4 cursor-pointer transition-all hover:border-bolt-elements-borderColorActive rounded-xl',
        'bg-bolt-elements-background-depth-2'
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {project.icon ? (
            <div
              className={classNames(
                'w-10 h-10 rounded-xl flex items-center justify-center',
                project.iconColor || 'bg-accent/10'
              )}
            >
              <div className={classNames(project.icon, 'text-xl', project.iconColor || 'text-accent')} />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-bolt-elements-background-depth-3 flex items-center justify-center">
              <div className="i-ph:folder text-xl text-bolt-elements-textSecondary" />
            </div>
          )}
        </div>
        <span
          className={classNames(
            'px-2 py-0.5 rounded-lg text-xs font-medium border',
            status.color
          )}
        >
          {status.label}
        </span>
      </div>
      <h3 className="text-lg font-semibold text-bolt-elements-textPrimary mb-2">{project.title}</h3>
      <p className="text-sm text-bolt-elements-textSecondary mb-4 line-clamp-2">{project.description}</p>
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-bolt-elements-textSecondary">
          <div className="i-ph:code text-base" />
          <span>{project.technologies.join(' + ')}</span>
        </div>
        <span className="text-bolt-elements-textTertiary">{project.lastUpdated}</span>
      </div>
    </Card>
  );
}

