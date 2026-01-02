import { useState } from 'react';
import { classNames } from '~/utils/classNames';
import { SearchInput } from '~/components/ui/SearchInput';
import { ProjectCard, type Project } from './ProjectCard';
import { NewProjectCard } from './NewProjectCard';

interface ProjectsSectionProps {
  projects?: Project[];
  onProjectClick?: (project: Project) => void;
  onNewProjectClick?: () => void;
}

const mockProjects: Project[] = [
  {
    id: '1',
    title: 'StudyBuddy AI',
    description: 'Gerador de cronograma de estudos personalizado usando GPT-4.',
    technologies: ['React', 'Python'],
    status: 'active',
    lastUpdated: '2h atrás',
    icon: 'i-ph:graduation-cap',
    iconColor: 'text-purple-500',
  },
  {
    id: '2',
    title: 'Foodie Finder',
    description: 'App de descoberta de restaurantes locais com foco em opções sustentáveis.',
    technologies: ['Flutter'],
    status: 'wip',
    lastUpdated: '1d atrás',
    icon: 'i-ph:fork-knife',
    iconColor: 'text-orange-500',
  },
];

export function ProjectsSection({ projects = mockProjects, onProjectClick, onNewProjectClick }: ProjectsSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  const filteredProjects = projects.filter((project) =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="i-ph:grid-four text-xl text-accent" />
          <h2 className="text-2xl font-semibold text-bolt-elements-textPrimary">Seus projetos</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-64">
            <SearchInput
              placeholder="Buscar projetos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-xl bg-bolt-elements-background-depth-1 border-bolt-elements-borderColor"
            />
          </div>
          <button
            className={classNames(
              'px-3 py-2 rounded-xl text-sm font-medium',
              'border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1',
              'text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary',
              'flex items-center gap-2 transition-colors'
            )}
          >
            <span>Mais recentes</span>
            <div className="i-ph:caret-down text-xs" />
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <NewProjectCard onClick={onNewProjectClick} />
        {filteredProjects.map((project) => (
          <ProjectCard key={project.id} project={project} onClick={() => onProjectClick?.(project)} />
        ))}
      </div>
    </div>
  );
}

