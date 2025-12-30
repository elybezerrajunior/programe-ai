import type { LoaderFunction } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';
import { LLMManager } from '~/lib/modules/llm/manager';
import { getLLMConfigFromEnv, validateLLMConfig } from '~/utils/envConfig';

interface LLMConfigResponse {
  provider?: string;
  model?: string;
  configured: boolean;
  error?: string;
}

/**
 * Endpoint que retorna configuração de LLM das variáveis de ambiente
 */
export const loader: LoaderFunction = async ({ context }) => {
  try {
    const env = (context?.cloudflare?.env as Record<string, any>) || {};
    const config = getLLMConfigFromEnv(env);

    if (!config) {
      return json<LLMConfigResponse>(
        {
          error: 'BOLT_LLM_PROVIDER e BOLT_LLM_MODEL devem ser configuradas',
          configured: false,
        },
        { status: 400 },
      );
    }

    // Validar contra lista de provedores disponíveis
    const llmManager = LLMManager.getInstance(env);
    const providers = llmManager.getAllProviders();
    const validation = validateLLMConfig(config.provider, config.model, providers);

    if (!validation.valid) {
      return json<LLMConfigResponse>(
        {
          error: validation.error,
          configured: false,
        },
        { status: 400 },
      );
    }

    return json<LLMConfigResponse>({
      provider: config.provider,
      model: config.model,
      configured: true,
    });
  } catch (error) {
    console.error('Error in api.llm-config:', error);

    return json<LLMConfigResponse>(
      {
        error: error instanceof Error ? error.message : 'Erro desconhecido ao ler configuração',
        configured: false,
      },
      { status: 500 },
    );
  }
};
