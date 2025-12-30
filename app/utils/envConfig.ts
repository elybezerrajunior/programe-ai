import type { BaseProvider } from '~/lib/modules/llm/base-provider';

/**
 * Lê configuração de LLM de variáveis de ambiente
 * @param env - Objeto com variáveis de ambiente (Cloudflare env ou process.env)
 * @returns Configuração de LLM ou null se não configurado
 */
export function getLLMConfigFromEnv(env?: Record<string, any>): {
  provider: string;
  model: string;
} | null {
  // Tenta ler do env passado (Cloudflare), depois process.env
  const provider = env?.BOLT_LLM_PROVIDER || process?.env?.BOLT_LLM_PROVIDER;
  const model = env?.BOLT_LLM_MODEL || process?.env?.BOLT_LLM_MODEL;

  if (!provider || !model) {
    return null;
  }

  return { provider: provider.trim(), model: model.trim() };
}

/**
 * Valida se provider e model são válidos
 * @param provider - Nome do provedor
 * @param model - Nome do modelo
 * @param availableProviders - Lista de provedores disponíveis
 * @returns Resultado da validação com mensagem de erro se inválido
 */
export function validateLLMConfig(
  provider: string,
  model: string,
  availableProviders: BaseProvider[],
): { valid: boolean; error?: string } {
  // Validação de provider
  const providerInfo = availableProviders.find((p) => p.name === provider);

  if (!providerInfo) {
    const availableNames = availableProviders.map((p) => p.name).join(', ');

    return {
      valid: false,
      error: `Provider "${provider}" não encontrado. Provedores disponíveis: ${availableNames}`,
    };
  }

  /*
   * Validação básica de model (verifica se não está vazio)
   * Validação completa de model requer buscar lista de modelos do provedor (pode ser assíncrono)
   */
  if (!model || model.trim().length === 0) {
    return {
      valid: false,
      error: 'Nome do modelo não pode estar vazio',
    };
  }

  return { valid: true };
}
