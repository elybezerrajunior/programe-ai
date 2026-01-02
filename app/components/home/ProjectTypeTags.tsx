import { classNames } from '~/utils/classNames';

const projectTypes = [
  { id: 'agenda', label: 'Agenda' },
  { id: 'crm', label: 'CRM' },
  { id: 'ecommerce', label: 'E-commerce' },
  { id: 'landing', label: 'Landing Page' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'study', label: 'App de Estudo' },
  { id: 'chatbot', label: 'Chatbot' },
];

interface ProjectTypeTagsProps {
  selectedTypes?: string[];
  onTypeSelect?: (typeId: string) => void;
}

export function ProjectTypeTags({ selectedTypes = [], onTypeSelect }: ProjectTypeTagsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 justify-center px-6">
      {projectTypes.map((type) => {
        const isSelected = selectedTypes.includes(type.id);
        return (
          <button
            key={type.id}
            onClick={() => onTypeSelect?.(type.id)}
            className={classNames(
              'px-4 py-2 rounded-full text-sm font-medium transition-all',
              'border border-bolt-elements-borderColor',
              isSelected
                ? 'bg-accent/10 text-accent border-accent'
                : 'bg-bolt-elements-background-depth-1 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:border-bolt-elements-borderColorActive'
            )}
          >
            {type.label}
          </button>
        );
      })}
    </div>
  );
}

