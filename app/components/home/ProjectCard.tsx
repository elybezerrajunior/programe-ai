import { classNames } from '~/utils/classNames';
import { Card } from '~/components/ui/Card';

export interface Project {
  id: string;
  /** Internal chat id used for delete in persistence */
  chatId: string;
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
  onDelete?: (project: Project) => void;
}

const statusConfig = {
  active: { label: 'ATIVO', color: 'bg-green-500/20 text-green-500 border-green-500/30' },
  wip: { label: 'WIP', color: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' },
  completed: { label: 'CONCLUÍDO', color: 'bg-blue-500/20 text-blue-500 border-blue-500/30' },
};

export function ProjectCard({ project, onClick, onDelete }: ProjectCardProps) {
  const status = statusConfig[project.status];

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete?.(project);
  };

  return (
    <Card
      className={classNames(
        'p-4 cursor-pointer transition-all hover:border-programe-elements-borderColorActive rounded-xl',
        'bg-programe-elements-background-depth-2 group/card'
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
            <div className="w-10 h-10 rounded-xl bg-programe-elements-background-depth-3 flex items-center justify-center">
              <div className="i-ph:folder text-xl text-programe-elements-textSecondary" />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onDelete && (
            <button
              type="button"
              onClick={handleDeleteClick}
              className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors i-ph:trash h-4 w-4 opacity-0 group-hover/card:opacity-100"
              title="Excluir projeto"
              aria-label="Excluir projeto"
            />
          )}
          <span
            className={classNames(
              'px-2 py-0.5 rounded-lg text-xs font-medium border',
              status.color
            )}
          >
            {status.label}
          </span>
        </div>
      </div>
      <h3 className="text-lg font-semibold text-programe-elements-textPrimary mb-2">{project.title}</h3>
      <p className="text-sm text-programe-elements-textSecondary mb-4 line-clamp-2">{project.description}</p>
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-programe-elements-textSecondary">
          <div className="i-ph:code text-base" />
          <span>{project.technologies.join(' + ')}</span>
        </div>
        <span className="text-programe-elements-textTertiary">{project.lastUpdated}</span>
      </div>
    </Card>
  );
}

