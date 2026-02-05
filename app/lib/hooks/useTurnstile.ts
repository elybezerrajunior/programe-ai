/**
 * Hook para Cloudflare Turnstile
 * 
 * Turnstile é uma alternativa gratuita ao reCAPTCHA que preserva a privacidade.
 * 
 * Configuração:
 * 1. Acesse https://dash.cloudflare.com/?to=/:account/turnstile
 * 2. Crie um site e obtenha o Site Key
 * 3. Adicione VITE_TURNSTILE_SITE_KEY ao .env
 * 4. Adicione TURNSTILE_SECRET_KEY ao .env (para validação no backend)
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Estado do Turnstile
 */
export interface TurnstileState {
  token: string | null;
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  isExpired: boolean;
}

/**
 * Opções do hook
 */
export interface UseTurnstileOptions {
  siteKey: string;
  action?: string;  // Ação para analytics (ex: 'signup', 'login')
  cData?: string;   // Dados customizados
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
  autoReset?: boolean;  // Resetar automaticamente após expiração
}

/**
 * Resultado do hook
 */
export interface UseTurnstileResult extends TurnstileState {
  reset: () => void;
  execute: () => void;
}

// Declaração global do Turnstile
declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: any) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
      execute: (widgetId: string) => void;
      getResponse: (widgetId: string) => string | undefined;
    };
    onTurnstileLoad?: () => void;
  }
}

// Estado global para evitar múltiplos carregamentos do script
let scriptLoaded = false;
let scriptLoading = false;
const loadCallbacks: (() => void)[] = [];

/**
 * Carrega o script do Turnstile
 */
function loadTurnstileScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (scriptLoaded) {
      resolve();
      return;
    }
    
    if (scriptLoading) {
      loadCallbacks.push(resolve);
      return;
    }
    
    scriptLoading = true;
    
    // Callback global chamado quando o script carrega
    window.onTurnstileLoad = () => {
      scriptLoaded = true;
      scriptLoading = false;
      resolve();
      loadCallbacks.forEach(cb => cb());
      loadCallbacks.length = 0;
    };
    
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad';
    script.async = true;
    script.defer = true;
    
    script.onerror = () => {
      scriptLoading = false;
      reject(new Error('Falha ao carregar Turnstile'));
    };
    
    document.head.appendChild(script);
  });
}

/**
 * Hook para gerenciar o Cloudflare Turnstile
 * 
 * @param containerId - ID do elemento container onde o widget será renderizado
 * @param options - Opções de configuração
 */
export function useTurnstile(
  containerId: string,
  options: UseTurnstileOptions
): UseTurnstileResult {
  const [token, setToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  
  const widgetIdRef = useRef<string | null>(null);
  const containerIdRef = useRef(containerId);
  
  // Atualizar ref quando containerId mudar
  useEffect(() => {
    containerIdRef.current = containerId;
  }, [containerId]);
  
  // Renderizar widget
  const renderWidget = useCallback(() => {
    if (!window.turnstile) {
      return;
    }
    
    const container = document.getElementById(containerIdRef.current);
    if (!container) {
      console.warn(`Turnstile container #${containerIdRef.current} not found`);
      return;
    }
    
    // Remover widget anterior se existir
    if (widgetIdRef.current) {
      try {
        window.turnstile.remove(widgetIdRef.current);
      } catch (e) {
        // Ignorar erro se widget já foi removido
      }
    }
    
    try {
      widgetIdRef.current = window.turnstile.render(container, {
        sitekey: options.siteKey,
        action: options.action,
        cData: options.cData,
        theme: options.theme || 'auto',
        size: options.size || 'normal',
        callback: (newToken: string) => {
          setToken(newToken);
          setIsExpired(false);
          setError(null);
        },
        'expired-callback': () => {
          setToken(null);
          setIsExpired(true);
          if (options.autoReset !== false) {
            // Resetar automaticamente após expiração
            setTimeout(() => {
              reset();
            }, 1000);
          }
        },
        'error-callback': () => {
          setError('Erro na verificação de segurança');
          setToken(null);
        },
      });
      
      setIsReady(true);
      setIsLoading(false);
      
    } catch (e) {
      console.error('Error rendering Turnstile:', e);
      setError('Erro ao carregar verificação de segurança');
      setIsLoading(false);
    }
  }, [options.siteKey, options.action, options.cData, options.theme, options.size, options.autoReset]);
  
  // Inicializar
  useEffect(() => {
    let mounted = true;
    
    const init = async () => {
      try {
        await loadTurnstileScript();
        
        if (mounted) {
          renderWidget();
        }
      } catch (e) {
        if (mounted) {
          setError('Falha ao carregar verificação de segurança');
          setIsLoading(false);
        }
      }
    };
    
    init();
    
    return () => {
      mounted = false;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (e) {
          // Ignorar
        }
      }
    };
  }, [renderWidget]);
  
  // Reset do widget
  const reset = useCallback(() => {
    if (widgetIdRef.current && window.turnstile) {
      try {
        window.turnstile.reset(widgetIdRef.current);
        setToken(null);
        setIsExpired(false);
        setError(null);
      } catch (e) {
        console.error('Error resetting Turnstile:', e);
      }
    }
  }, []);
  
  // Executar manualmente (para modo invisible)
  const execute = useCallback(() => {
    if (widgetIdRef.current && window.turnstile) {
      try {
        window.turnstile.execute(widgetIdRef.current);
      } catch (e) {
        console.error('Error executing Turnstile:', e);
      }
    }
  }, []);
  
  return {
    token,
    isReady,
    isLoading,
    error,
    isExpired,
    reset,
    execute,
  };
}

/**
 * Componente Turnstile para uso declarativo
 */
export interface TurnstileProps {
  siteKey: string;
  onSuccess?: (token: string) => void;
  onError?: (error: string) => void;
  onExpired?: () => void;
  action?: string;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
  className?: string;
}

// O componente React é implementado em TurnstileWidget.tsx
