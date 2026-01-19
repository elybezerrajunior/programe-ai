type CommonRequest = Omit<RequestInit, 'body'> & { body?: URLSearchParams };

export async function request(url: string, init?: CommonRequest) {
  // No Cloudflare, sempre usar fetch nativo
  // node-fetch e node:https não estão disponíveis
  if (import.meta.env.DEV) {
    try {
      const nodeFetch = await import('node-fetch');
      const https = await import('node:https');

      const agent = url.startsWith('https') ? new https.Agent({ rejectUnauthorized: false }) : undefined;

      return nodeFetch.default(url, { ...init, agent });
    } catch (error) {
      // Se node-fetch ou node:https não estiverem disponíveis (ex: Cloudflare),
      // usar fetch nativo como fallback
      console.warn('node-fetch not available, using native fetch:', error);
      return fetch(url, init);
    }
  }

  return fetch(url, init);
}
