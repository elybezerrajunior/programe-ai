import { classNames } from '~/utils/classNames';

const projectTypes = [
  { 
    id: 'agenda', 
    label: 'Agenda',
    suggestion: 'Criar um aplicativo de agenda e calendário com funcionalidades de agendamento de eventos, lembretes e sincronização'
  },
  { 
    id: 'crm', 
    label: 'CRM',
    suggestion: 'Criar um sistema CRM (Customer Relationship Management) para gerenciar clientes, contatos e vendas'
  },
  { 
    id: 'ecommerce', 
    label: 'E-commerce',
    suggestion: 'Criar uma loja virtual e-commerce completa com carrinho de compras, checkout e integração de pagamentos'
  },
  { 
    id: 'landing', 
    label: 'Landing Page',
    suggestion: 'Criar uma landing page moderna e responsiva para captação de leads e apresentação de produto'
  },
  { 
    id: 'dashboard', 
    label: 'Dashboard',
    suggestion: 'Criar um dashboard administrativo com gráficos, métricas e visualização de dados'
  },
  { 
    id: 'study', 
    label: 'App de Estudo',
    suggestion: 'Criar um aplicativo de estudos com flashcards, quizzes e organização de materiais de aprendizado'
  },
  { 
    id: 'chatbot', 
    label: 'Chatbot',
    suggestion: 'Criar um chatbot inteligente para atendimento ao cliente ou assistente virtual'
  },
];

interface ProjectTypeTagsProps {
  selectedTypes?: string[];
  onTypeSelect?: (typeId: string, suggestion?: string) => void;
}

export function ProjectTypeTags({ selectedTypes = [], onTypeSelect }: ProjectTypeTagsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 justify-center px-6">
      {projectTypes.map((type) => {
        const isSelected = selectedTypes.includes(type.id);
        return (
          <button
            key={type.id}
            onClick={() => onTypeSelect?.(type.id, type.suggestion)}
            className={classNames(
              'px-4 py-2 rounded-full text-sm font-medium transition-all',
              'border border-programe-elements-borderColor',
              isSelected
                ? 'bg-accent/10 text-accent border-accent'
                : 'bg-programe-elements-background-depth-1 text-programe-elements-textSecondary hover:text-programe-elements-textPrimary hover:border-programe-elements-borderColorActive'
            )}
          >
            {type.label}
          </button>
        );
      })}
    </div>
  );
}

