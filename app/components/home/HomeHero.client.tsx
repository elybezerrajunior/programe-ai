import { useState, useRef, useEffect } from 'react';
import { classNames } from '~/utils/classNames';
import { Card } from '~/components/ui/Card';
import { Tooltip } from '~/components/ui/Tooltip';
import { chatStore } from '~/lib/stores/chat';
import Cookies from 'js-cookie';
import { PROMPT_COOKIE_KEY, DEFAULT_MODEL, DEFAULT_PROVIDER, PROVIDER_LIST } from '~/utils/constants';
import styles from './PromptBorderEffect.module.scss';
import { toast } from 'react-toastify';
import type { DesignScheme } from '~/types/design-scheme';
import { defaultDesignScheme } from '~/types/design-scheme';
import type { ProviderInfo } from '~/types/model';
import { usePromptEnhancer } from '~/lib/hooks/usePromptEnhancer';
import { useSettings } from '~/lib/hooks/useSettings';
import { useLLMConfig } from '~/lib/hooks/useLLMConfig';
import { homeHeroFilesStore } from '~/lib/stores/homeFiles';

interface HomeHeroProps {
  onGenerateProject?: (description: string) => void;
  setUploadedFiles?: (files: File[]) => void;
  uploadedFiles?: File[];
  initialDescription?: string;
}

export function HomeHero({ onGenerateProject, setUploadedFiles, uploadedFiles = [], initialDescription = '' }: HomeHeroProps) {
  const [projectDescription, setProjectDescription] = useState(initialDescription);

  // Update description when initialDescription changes
  useEffect(() => {
    if (initialDescription !== undefined) {
      setProjectDescription(initialDescription);
    }
  }, [initialDescription]);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [designScheme, setDesignScheme] = useState<DesignScheme>(defaultDesignScheme);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const MAX_FILES = 10;
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  // Get model, provider, and API keys from settings
  const { activeProviders } = useSettings();
  const { config: llmConfig } = useLLMConfig();
  const [model, setModel] = useState(() => {
    if (llmConfig?.configured && llmConfig.model) {
      return llmConfig.model;
    }
    return Cookies.get('selectedModel') || DEFAULT_MODEL;
  });
  const [provider, setProvider] = useState<ProviderInfo>(() => {
    if (llmConfig?.configured && llmConfig.provider) {
      return llmConfig.provider;
    }
    const savedProvider = Cookies.get('selectedProvider');
    return (PROVIDER_LIST.find((p) => p.name === savedProvider) || DEFAULT_PROVIDER) as ProviderInfo;
  });
  const [apiKeys, setApiKeys] = useState<Record<string, string>>(() => {
    try {
      const stored = Cookies.get('apiKeys');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Use prompt enhancer hook
  const { enhancingPrompt, enhancePrompt: enhancePromptFunc } = usePromptEnhancer();

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;

      recognitionInstance.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0])
          .map((result) => result.transcript)
          .join('');

        setProjectDescription(transcript);
      };

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (projectDescription.trim()) {
      // Cache the prompt in cookies (Chat component reads from this)
      Cookies.set(PROMPT_COOKIE_KEY, projectDescription.trim(), { expires: 30 });

      // Store uploaded files temporarily so Chat component can access them
      if (uploadedFiles.length > 0) {
        homeHeroFilesStore.set(uploadedFiles);
      }

      // Mark chat as started - this will trigger the Chat component to show
      chatStore.setKey('started', true);

      // Call the callback if provided
      onGenerateProject?.(projectDescription);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Allow Shift+Enter for new line, Enter to submit
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;

    // Validate file count (check current + new)
    const totalFiles = uploadedFiles.length + files.length;
    if (totalFiles > MAX_FILES) {
      toast.error(`Máximo de ${MAX_FILES} arquivos permitidos. Você já tem ${uploadedFiles.length} arquivo(s).`);
      return;
    }

    // Validate file sizes
    const invalidFiles = files.filter(file => file.size > MAX_FILE_SIZE);
    if (invalidFiles.length > 0) {
      toast.error(`Alguns arquivos excedem o tamanho máximo de ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
      return;
    }

    // Combine with existing files
    setUploadedFiles?.([...uploadedFiles, ...files]);
    toast.success(`${files.length} arquivo(s) anexado(s)`);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEnhancePrompt = async () => {
    if (!projectDescription.trim()) {
      toast.warning('Digite um prompt antes de melhorar');
      return;
    }

    try {
      await enhancePromptFunc(
        projectDescription,
        (enhancedText) => setProjectDescription(enhancedText),
        model,
        provider,
        apiKeys,
      );
      toast.success('Prompt melhorado!');
    } catch (error) {
      toast.error('Erro ao melhorar o prompt');
      console.error(error);
    }
  };

  const handleToggleListening = () => {
    if (isListening) {
      recognition?.stop();
      setIsListening(false);
    } else {
      recognition?.start();
      setIsListening(true);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;

    if (!items) {
      return;
    }

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();

        const file = item.getAsFile();

        if (file) {
          // Validate file size
          if (file.size > MAX_FILE_SIZE) {
            toast.error(`O arquivo excede o tamanho máximo de ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
            return;
          }

          // Validate file count
          if (uploadedFiles.length >= MAX_FILES) {
            toast.error(`Máximo de ${MAX_FILES} arquivos permitidos.`);
            return;
          }

          // Add file to uploaded files
          setUploadedFiles?.([...uploadedFiles, file]);
          toast.success('Imagem colada!');
        }

        break;
      }
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
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />

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
                onClick={handleEnhancePrompt}
                disabled={!projectDescription.trim() || enhancingPrompt}
                className={classNames(
                  'flex items-center gap-1 text-sm text-accent-500 hover:text-accent-400 transition-colors bg-transparent',
                  (!projectDescription.trim() || enhancingPrompt) && 'opacity-50 cursor-not-allowed'
                )}
              >
                {enhancingPrompt ? (
                  <div className="i-svg-spinners:90-ring-with-bg text-bolt-elements-loader-progress text-base animate-spin" />
                ) : (
                  <div className="i-ph:question text-base text-accent-500" />
                )}
                <span>Melhore sua ideia</span>
              </button>
            </div>
            <textarea
              id="project-description"
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder="Ex: Um aplicativo de marketplace para fotógrafos freelances encontrarem clientes, com portfólio, sistema de agendamento e pagamentos via Stripe..."
              className={classNames(
                'w-full min-h-[120px] px-4 py-3 rounded-2xl',
                'border border-accent-500 bg-bolt-elements-background-depth-1',
                'text-bolt-elements-textPrimary placeholder:text-bolt-elements-textTertiary',
                'focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent-500',
                'resize-none transition-all',
                '[&::-webkit-scrollbar]:hidden'
              )}
              style={{
                scrollbarWidth: 'none',
              }}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between text-sm pt-2">
            <div className="flex gap-1 items-center">
              {/* <ColorSchemeDialog designScheme={designScheme || defaultDesignScheme} setDesignScheme={setDesignScheme} /> */}
              {/* <McpTools /> */}
              <Tooltip content="Enviar arquivo" side="top">
                <button
                  type="button"
                  onClick={handleFileUpload}
                  className="flex items-center text-bolt-elements-item-contentDefault bg-transparent hover:text-bolt-elements-item-contentActive rounded-md p-1 hover:bg-bolt-elements-item-backgroundActive focus:outline-none transition-all"
                >
                  <div className="i-ph:folder-plus text-xl" />
                </button>
              </Tooltip>
              <Tooltip content={isListening ? 'Parar reconhecimento de voz' : 'Reconhecimento de voz'} side="top">
                <button
                  type="button"
                  onClick={handleToggleListening}
                  disabled={!recognition}
                  className={classNames(
                    'flex items-center bg-transparent rounded-md p-1 focus:outline-none transition-all',
                    isListening
                      ? 'text-bolt-elements-item-contentAccent hover:bg-bolt-elements-item-backgroundActive'
                      : 'text-bolt-elements-item-contentDefault hover:text-bolt-elements-item-contentActive hover:bg-bolt-elements-item-backgroundActive',
                    !recognition && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {isListening ? (
                    <div className="i-ph:microphone-slash text-xl" />
                  ) : (
                    <div className="i-ph:waveform text-xl" />
                  )}
                </button>
              </Tooltip>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={!projectDescription.trim()}
                className={classNames(
                  'px-6 py-2.5 flex items-center gap-2 rounded-2xl font-medium transition-colors',
                  projectDescription.trim()
                    ? 'bg-accent-500 hover:bg-accent-400 text-black'
                    : 'bg-bolt-elements-background-depth-2 text-bolt-elements-textSecondary cursor-not-allowed'
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

