import { useState, useEffect, useMemo, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import { toast } from 'react-toastify';
import { classNames } from '~/utils/classNames';
import { SearchInput } from '~/components/ui/SearchInput';
import { ProjectCard, type Project } from './ProjectCard';
import { NewProjectCard } from './NewProjectCard';
import { getAll, deleteById } from '~/lib/persistence/db';
import type { ChatHistoryItem } from '~/lib/persistence/useChatHistory';
import { authStore } from '~/lib/stores/auth';

// Hook to connect to the database
function useBoltHistoryDB() {
  const [db, setDb] = useState<IDBDatabase | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initDB = async () => {
      try {
        setIsLoading(true);
        const database = await openDatabase();
        setDb(database || null);
      } catch (err) {
        console.error('Error initializing database:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initDB();
  }, []);

  return { db, isLoading };
}

interface ProjectsSectionProps {
  projects?: Project[];
  onProjectClick?: (project: Project) => void;
  onNewProjectClick?: () => void;
}

type SortOption = 'recent' | 'oldest' | 'az' | 'za';

function formatRelativeTime(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const diffInMs = now.getTime() - then.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInSeconds < 60) return 'Agora';
  if (diffInMinutes < 60) return `${diffInMinutes}min atrás`;
  if (diffInHours < 24) return `${diffInHours}h atrás`;
  if (diffInDays < 7) return `${diffInDays}d atrás`;
  
  return then.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function chatToProject(chat: ChatHistoryItem): Project {
  // Determine status based on metadata or messages
  let status: 'active' | 'wip' | 'completed' = 'active';
  
  // Extract technologies from messages if available
  const technologies: string[] = [];
  const lastMessage = chat.messages[chat.messages.length - 1];
  if (lastMessage) {
    const content = typeof lastMessage.content === 'string' ? lastMessage.content : '';
    // Try to detect technologies from message content
    const techPatterns = ['React', 'Vue', 'Angular', 'Next.js', 'TypeScript', 'JavaScript', 'Python', 'Node.js'];
    techPatterns.forEach(tech => {
      if (content.includes(tech) && !technologies.includes(tech)) {
        technologies.push(tech);
      }
    });
  }

  // Try to determine icon based on description or technologies
  let icon = 'i-ph:code';
  let iconColor = 'text-accent';
  
  if (chat.description) {
    const desc = chat.description.toLowerCase();
    if (desc.includes('mobile') || desc.includes('app')) {
      icon = 'i-ph:device-mobile';
      iconColor = 'text-blue-500';
    } else if (desc.includes('web') || desc.includes('site')) {
      icon = 'i-ph:globe';
      iconColor = 'text-green-500';
    } else if (desc.includes('dashboard') || desc.includes('admin')) {
      icon = 'i-ph:chart-line';
      iconColor = 'text-purple-500';
    }
  }

  return {
    id: chat.urlId || chat.id,
    chatId: chat.id,
    title: chat.description || 'Projeto sem título',
    description: chat.description || 'Sem descrição',
    technologies: technologies.length > 0 ? technologies : ['TypeScript'],
    status,
    lastUpdated: formatRelativeTime(chat.timestamp),
    icon,
    iconColor,
    urlId: chat.urlId,
  };
}

export function ProjectsSection({ projects: providedProjects, onProjectClick, onNewProjectClick }: ProjectsSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [isOpen, setIsOpen] = useState(false);
  const { db } = useBoltHistoryDB();
  const [loadedProjects, setLoadedProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const auth = useStore(authStore);
  const currentUserId = auth.user?.id;

  // Load projects from database - filtrado por userId
  useEffect(() => {
    if (db) {
      setIsLoading(true);
      // Passar userId para filtrar apenas projetos do usuário logado
      getAll(db, currentUserId)
        .then((chats: ChatHistoryItem[]) => {
          // Filter chats that have urlId and description (valid projects)
          const validChats = chats.filter((chat) => chat.urlId && chat.description);
          const projects = validChats.map(chatToProject);
          setLoadedProjects(projects);
        })
        .catch((error) => {
          console.error('Error loading projects:', error);
          setLoadedProjects([]);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [db, currentUserId]); // Adicionar currentUserId como dependência

  // Use provided projects or loaded projects
  const projects = providedProjects || loadedProjects;

  const loadProjects = useCallback(() => {
    if (db) {
      getAll(db, currentUserId)
        .then((chats: ChatHistoryItem[]) => {
          const validChats = chats.filter((chat) => chat.urlId && chat.description);
          setLoadedProjects(validChats.map(chatToProject));
        })
        .catch((error) => {
          console.error('Error loading projects:', error);
          setLoadedProjects([]);
        });
    }
  }, [db, currentUserId]);

  const handleDeleteProject = useCallback(
    async (project: Project) => {
      if (!db) {
        toast.error('Banco de dados indisponível');
        return;
      }
      try {
        const snapshotKey = `snapshot:${project.chatId}`;
        localStorage.removeItem(snapshotKey);
        await deleteById(db, project.chatId);
        toast.success('Projeto excluído com sucesso', {
          position: 'bottom-right',
          autoClose: 3000,
        });
        loadProjects();
      } catch (error) {
        console.error('Failed to delete project:', error);
        toast.error('Falha ao excluir projeto', {
          position: 'bottom-right',
          autoClose: 3000,
        });
        loadProjects();
      }
    },
    [db, loadProjects],
  );

  // Filter and sort projects
  const filteredAndSortedProjects = useMemo(() => {
    let filtered = projects.filter((project) =>
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort projects
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'recent': {
          // Parse lastUpdated to sort by date (this is a simplified approach)
          // In a real implementation, you'd want to store the actual date
          return 0; // Keep original order for now (already sorted by timestamp in DB)
        }
        case 'oldest': {
          return 0; // Reverse of recent
        }
        case 'az': {
          return a.title.localeCompare(b.title);
        }
        case 'za': {
          return b.title.localeCompare(a.title);
        }
        default:
          return 0;
      }
    });

    return sorted;
  }, [projects, searchQuery, sortBy]);

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'recent', label: 'Mais recentes' },
    { value: 'oldest', label: 'Mais antigos' },
    { value: 'az', label: 'A-Z' },
    { value: 'za', label: 'Z-A' },
  ];

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
          <div className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={classNames(
                'px-3 py-2 rounded-xl text-sm font-medium',
                'border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1',
                'text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary',
                'flex items-center gap-2 transition-colors'
              )}
            >
              <span>{sortOptions.find((opt) => opt.value === sortBy)?.label || 'Ordenar'}</span>
              <div className="i-ph:caret-down text-xs" />
            </button>
            {isOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-xl shadow-lg z-20 py-1">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSortBy(option.value);
                        setIsOpen(false);
                      }}
                      className={classNames(
                        'w-full text-left px-4 py-2 text-sm transition-colors',
                        sortBy === option.value
                          ? 'bg-bolt-elements-background-depth-3 text-bolt-elements-textPrimary'
                          : 'text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-3'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <NewProjectCard onClick={onNewProjectClick} />
        {isLoading ? (
          <div className="col-span-full text-center py-8 text-bolt-elements-textSecondary">
            Carregando projetos...
          </div>
        ) : filteredAndSortedProjects.length === 0 ? (
          <div className="col-span-full text-center py-8 text-bolt-elements-textSecondary">
            {searchQuery ? 'Nenhum projeto encontrado' : 'Nenhum projeto ainda. Crie seu primeiro projeto!'}
          </div>
        ) : (
          filteredAndSortedProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => onProjectClick?.(project)}
              onDelete={handleDeleteProject}
            />
          ))
        )}
      </div>
    </div>
  );
}
