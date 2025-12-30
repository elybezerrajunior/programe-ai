import { useState, useEffect } from 'react';
import type { ProviderInfo } from '~/types/model';
import { PROVIDER_LIST } from '~/utils/constants';

interface LLMConfigResponse {
  provider?: string;
  model?: string;
  configured: boolean;
  error?: string;
}

interface LLMConfig {
  provider: ProviderInfo | null;
  model: string | null;
  configured: boolean;
}

interface UseLLMConfigReturn {
  config: LLMConfig | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook que lê configuração de LLM de variáveis de ambiente
 */
export function useLLMConfig(): UseLLMConfigReturn {
  const [config, setConfig] = useState<LLMConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/llm-config');

        if (!response.ok) {
          const data = (await response.json()) as LLMConfigResponse;
          setError(data.error || 'Erro ao buscar configuração');
          setConfig({ provider: null, model: null, configured: false });
          setIsLoading(false);

          return;
        }

        const data = (await response.json()) as LLMConfigResponse;

        if (data.configured && data.provider && data.model) {
          // Buscar ProviderInfo completo - PROVIDER_LIST retorna BaseProvider[], mas podemos usar como ProviderInfo
          const provider = (PROVIDER_LIST.find((p) => p.name === data.provider) as ProviderInfo | undefined) || null;

          setConfig({
            provider,
            model: data.model,
            configured: true,
          });
        } else {
          setError(data.error || 'Configuração não encontrada');
          setConfig({ provider: null, model: null, configured: false });
        }

        setIsLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(errorMessage);
        setConfig({ provider: null, model: null, configured: false });
        setIsLoading(false);
      }
    };

    fetchConfig();
  }, []);

  return { config, isLoading, error };
}
