import React from 'react';
import { classNames } from '~/utils/classNames';

const PROJECT_TYPES = [
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

interface ExamplePromptsProps {
  onSelectPrompt?: (suggestion: string) => void;
}

export function ExamplePrompts({ onSelectPrompt }: ExamplePromptsProps) {
  return (
    <div id="examples" className="relative flex flex-col gap-9 w-full max-w-3xl mx-auto flex justify-center mt-6">
      <div
        className="flex flex-wrap items-center gap-2 justify-center px-6"
        style={{
          animation: '.25s ease-out 0s 1 _fade-and-move-in_g2ptj_1 forwards',
        }}
      >
        {PROJECT_TYPES.map((type) => {
          return (
            <button
              key={type.id}
              onClick={() => {
                onSelectPrompt?.(type.suggestion);
              }}
              className={classNames(
                'px-4 py-2 rounded-full text-sm font-medium transition-all',
                'border border-bolt-elements-borderColor',
                'bg-bolt-elements-background-depth-1 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:border-bolt-elements-borderColorActive'
              )}
            >
              {type.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
