import { useState } from 'react';
import { classNames } from '~/utils/classNames';
import { Button } from '~/components/ui/Button';
import { Card } from '~/components/ui/Card';
import { Tooltip } from '~/components/ui/Tooltip';
import { chatStore } from '~/lib/stores/chat';
import Cookies from 'js-cookie';
import { PROMPT_COOKIE_KEY } from '~/utils/constants';
import styles from './PromptBorderEffect.module.scss';

interface HomeHeroProps {
  onGenerateProject?: (description: string) => void;
  onAttachFiles?: () => void;
  onPromptTips?: () => void;
}

export function HomeHero({ onGenerateProject, onAttachFiles, onPromptTips }: HomeHeroProps) {
  const [projectDescription, setProjectDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (projectDescription.trim()) {
      // Cache the prompt in cookies (Chat component reads from this)
      Cookies.set(PROMPT_COOKIE_KEY, projectDescription.trim(), { expires: 30 });
      
      // Mark chat as started - this will trigger the Chat component to show
      chatStore.setKey('started', true);
      
      // Call the callback if provided
      onGenerateProject?.(projectDescription);
      
      // Small delay to ensure Chat component has rendered, then focus textarea
      setTimeout(() => {
        const textarea = document.querySelector('textarea[placeholder*="Como o Programe"]') as HTMLTextAreaElement;
        if (textarea) {
          textarea.value = projectDescription.trim();
          textarea.focus();
          // Trigger input event to update chat state
          const event = new Event('input', { bubbles: true });
          textarea.dispatchEvent(event);
        }
      }, 100);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-12">
      {/* Headline */}
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-bolt-elements-textPrimary mb-4">
          Construa seu aplicativo a partir de uma{' '}
          <span className="text-accent">ideia.</span>
        </h1>
        <p className="text-lg md:text-xl text-bolt-elements-textSecondary max-w-2xl mx-auto">
          Transforme texto em software. A Programe Studio estrutura, codifica e guia você.
        </p>
      </div>

      {/* Card with Project Description Input */}
      <div className="relative">
        {/* Glow effect behind card */}
        <div 
          className="absolute -inset-4 rounded-[2rem] opacity-30 blur-3xl pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(34, 244, 198, 0.4) 0%, rgba(34, 244, 198, 0) 70%)',
          }}
        />
        <Card className="p-6 rounded-[2rem] relative z-10">
          {/* Border glow effect */}
          <svg className={classNames(styles.PromptEffectContainer)}>
            <defs>
              <linearGradient
                id="home-line-gradient"
                x1="20%"
                y1="0%"
                x2="-14%"
                y2="10%"
                gradientUnits="userSpaceOnUse"
                gradientTransform="rotate(-45)"
              >
                <stop offset="0%" stopColor="#22F4C6" stopOpacity="0%"></stop>
                <stop offset="40%" stopColor="#22F4C6" stopOpacity="80%"></stop>
                <stop offset="50%" stopColor="#22F4C6" stopOpacity="80%"></stop>
                <stop offset="100%" stopColor="#22F4C6" stopOpacity="0%"></stop>
              </linearGradient>
            </defs>
            <rect className={classNames(styles.PromptEffectLine)} pathLength="100" strokeLinecap="round"></rect>
          </svg>
        <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="i-ph:lightbulb text-xl text-accent-500" />
              <label htmlFor="project-description" className="text-sm font-medium text-bolt-elements-textPrimary">
                Descreva seu projeto
              </label>
            </div>
            <button
              type="button"
              onClick={onPromptTips}
              className="flex items-center gap-1 text-sm text-accent-500 hover:text-accent-400 transition-colors bg-transparent"
            >
              <div className="i-ph:question text-base text-accent-500" />
              <span>Dicas de prompt</span>
            </button>
          </div>
          <textarea
            id="project-description"
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
            placeholder="Ex: Um aplicativo de marketplace para fotógrafos freelances encontrarem clientes, com portfólio, sistema de agendamento e pagamentos via Stripe..."
            className={classNames(
              'w-full min-h-[120px] px-4 py-3 rounded-2xl',
              'border border-accent-500 bg-bolt-elements-background-depth-1',
              'text-bolt-elements-textPrimary placeholder:text-bolt-elements-textTertiary',
              'focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent-500',
              'resize-none transition-all'
            )}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between text-sm pt-2">
          <div className="flex gap-1 items-center">
            <Tooltip content="Paleta de Design" side="top">
              <button
                type="button"
                className="flex items-center text-bolt-elements-item-contentDefault bg-transparent hover:text-bolt-elements-item-contentActive rounded-md p-1 hover:bg-bolt-elements-item-backgroundActive focus:outline-none transition-all"
              >
                <div className="i-ph:paint-brush text-xl" />
              </button>
            </Tooltip>
            <div className="relative">
              <Tooltip content="Ferramentas MCP Disponíveis" side="top">
                <button
                  type="button"
                  className="flex items-center text-bolt-elements-item-contentDefault bg-transparent hover:text-bolt-elements-item-contentActive rounded-md p-1 hover:bg-bolt-elements-item-backgroundActive disabled:cursor-not-allowed focus:outline-none transition-all disabled:opacity-50"
                >
                  <div className="i-ph:wrench text-xl" />
                </button>
              </Tooltip>
            </div>
            <Tooltip content="Enviar arquivo" side="top">
              <button
                type="button"
                onClick={onAttachFiles}
                className="flex items-center text-bolt-elements-item-contentDefault bg-transparent hover:text-bolt-elements-item-contentActive rounded-md p-1 hover:bg-bolt-elements-item-backgroundActive focus:outline-none transition-all"
              >
                <div className="i-ph:folder-plus text-xl" />
              </button>
            </Tooltip>
            <Tooltip content="Melhorar prompt" side="top">
              <button
                type="button"
                className="flex items-center text-bolt-elements-item-contentDefault bg-transparent hover:text-bolt-elements-item-contentActive rounded-md p-1 hover:bg-bolt-elements-item-backgroundActive focus:outline-none transition-all"
              >
                <div className="i-ph:magic-wand text-xl" />
              </button>
            </Tooltip>
            <Tooltip content="Reconhecimento de voz" side="top">
              <button
                type="button"
                className="flex items-center text-bolt-elements-item-contentDefault bg-transparent hover:text-bolt-elements-item-contentActive rounded-md p-1 hover:bg-bolt-elements-item-backgroundActive focus:outline-none transition-all"
              >
                <div className="i-ph:waveform text-xl" />
              </button>
            </Tooltip>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-bolt-elements-textTertiary">
              Use <kbd className="kdb px-1.5 py-0.5 rounded bg-bolt-elements-background-depth-2">Shift</kbd> + <kbd className="kdb px-1.5 py-0.5 rounded bg-bolt-elements-background-depth-2">Enter</kbd> para nova linha
            </div>
            <button
              type="submit"
              disabled={!projectDescription.trim()}
              className={classNames(
                'px-6 py-2.5 flex items-center gap-2 rounded-2xl font-medium transition-colors',
                {
                  'bg-accent-500 hover:bg-accent-400 text-black': projectDescription.trim(),
                  'bg-bolt-elements-background-depth-2 text-bolt-elements-textSecondary cursor-not-allowed': !projectDescription.trim(),
                }
              )}
            >
              <div className="i-bolt:stars text-lg" />
              <span>Gerar projeto</span>
            </button>
          </div>
        </div>
      </form>
        </Card>
      </div>
    </div>
  );
}

