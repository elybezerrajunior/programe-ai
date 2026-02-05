/**
 * Módulo de Validadores Antifraude
 * 
 * Validações externas:
 * - Cloudflare Turnstile
 * - E-mails descartáveis
 * - Validação de MX (DNS)
 */

import type { TurnstileSignals, EmailSignals } from './types';

// =============================================================================
// CLOUDFLARE TURNSTILE
// =============================================================================

/**
 * Resposta da API do Turnstile
 */
interface TurnstileVerifyResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
  action?: string;
  cdata?: string;
}

/**
 * Valida o token do Cloudflare Turnstile
 * 
 * @param token - Token gerado pelo widget Turnstile no frontend
 * @param secretKey - Secret key do Turnstile (do .env)
 * @param remoteIp - IP do usuário (opcional, mas recomendado)
 */
export async function validateTurnstileToken(
  token: string,
  secretKey: string,
  remoteIp?: string
): Promise<TurnstileSignals> {
  if (!token) {
    return {
      token: '',
      valid: false,
      action: '',
      challengeTimestamp: '',
    };
  }
  
  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (remoteIp) {
      formData.append('remoteip', remoteIp);
    }
    
    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      }
    );
    
    const result: TurnstileVerifyResponse = await response.json();
    
    return {
      token,
      valid: result.success,
      action: result.action || '',
      challengeTimestamp: result.challenge_ts || '',
    };
  } catch (error) {
    console.error('Turnstile validation error:', error);
    return {
      token,
      valid: false,
      action: '',
      challengeTimestamp: '',
    };
  }
}

// =============================================================================
// VALIDAÇÃO DE E-MAIL
// =============================================================================

/**
 * Verifica se o domínio do e-mail é descartável
 * Consulta a tabela disposable_email_domains no Supabase
 */
export async function isDisposableEmail(
  email: string,
  supabaseClient: any // SupabaseClient
): Promise<boolean> {
  const domain = email.split('@')[1]?.toLowerCase();
  
  if (!domain) {
    return false;
  }
  
  try {
    const { data, error } = await supabaseClient
      .from('disposable_email_domains')
      .select('domain')
      .eq('domain', domain)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      // PGRST116 = não encontrado, outros erros logamos
      console.error('Error checking disposable email:', error);
    }
    
    return !!data;
  } catch (error) {
    console.error('Error checking disposable email:', error);
    return false;
  }
}

/**
 * Lista de domínios de e-mail gratuitos conhecidos
 * Não são bloqueados, mas podem receber score menor
 */
const FREE_EMAIL_PROVIDERS = new Set([
  'gmail.com',
  'yahoo.com',
  'yahoo.com.br',
  'hotmail.com',
  'outlook.com',
  'live.com',
  'icloud.com',
  'protonmail.com',
  'proton.me',
  'mail.com',
  'aol.com',
  'zoho.com',
  'yandex.com',
  'gmx.com',
  'gmx.net',
]);

/**
 * Verifica se o e-mail é de um provedor gratuito
 */
export function isFreeEmailProvider(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return FREE_EMAIL_PROVIDERS.has(domain || '');
}

/**
 * Valida se o e-mail tem formato válido
 */
export function isValidEmailFormat(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Extrai e valida informações do e-mail
 */
export async function validateEmailSignals(
  email: string,
  supabaseClient: any
): Promise<EmailSignals> {
  const domain = email.split('@')[1]?.toLowerCase() || '';
  const isDisposable = await isDisposableEmail(email, supabaseClient);
  
  return {
    email: email.toLowerCase(),
    domain,
    isDisposable,
    mxValid: true, // Simplificação - validação MX pode ser cara
  };
}

// =============================================================================
// VALIDAÇÃO DE VPN/PROXY (INTEGRAÇÃO EXTERNA)
// =============================================================================

/**
 * Interface para resposta de serviço de detecção de VPN/Proxy
 * Compatível com IPInfo, MaxMind, etc.
 */
interface VpnProxyCheckResult {
  isVpn: boolean;
  isProxy: boolean;
  isTor: boolean;
  isDatacenter: boolean;
  service?: string;
  confidence?: number;
}

/**
 * Verifica se o IP é de VPN/Proxy usando serviço externo
 * 
 * Opções de serviços:
 * - IPInfo.io (possui endpoint de privacy)
 * - MaxMind (minFraud)
 * - IPQS (IP Quality Score)
 * 
 * Esta implementação usa IPInfo como exemplo
 */
export async function checkVpnProxy(
  ipAddress: string,
  apiToken?: string
): Promise<VpnProxyCheckResult> {
  // Se não tem token, retorna valores padrão
  if (!apiToken) {
    return {
      isVpn: false,
      isProxy: false,
      isTor: false,
      isDatacenter: false,
    };
  }
  
  try {
    // Exemplo com IPInfo.io
    const response = await fetch(
      `https://ipinfo.io/${ipAddress}?token=${apiToken}`,
      { method: 'GET' }
    );
    
    if (!response.ok) {
      throw new Error(`IPInfo API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // IPInfo retorna privacy info se você tem plano adequado
    const privacy = data.privacy || {};
    
    return {
      isVpn: privacy.vpn || false,
      isProxy: privacy.proxy || false,
      isTor: privacy.tor || false,
      isDatacenter: privacy.hosting || false,
      service: 'ipinfo',
      confidence: 0.9,
    };
  } catch (error) {
    console.error('VPN/Proxy check error:', error);
    return {
      isVpn: false,
      isProxy: false,
      isTor: false,
      isDatacenter: false,
    };
  }
}

// =============================================================================
// VALIDAÇÃO DE FINGERPRINT
// =============================================================================

/**
 * Valida a integridade do fingerprint
 * 
 * Verifica:
 * - Formato válido
 * - Confiança mínima
 * - Não é um fingerprint genérico/falso
 */
export function validateFingerprint(
  fingerprintId: string | null,
  confidence: number
): { valid: boolean; reason: string } {
  if (!fingerprintId) {
    return { valid: false, reason: 'Fingerprint não fornecido' };
  }
  
  if (fingerprintId.length < 10) {
    return { valid: false, reason: 'Fingerprint muito curto' };
  }
  
  // Fingerprints genéricos conhecidos (ex: "000000000000")
  if (/^0+$/.test(fingerprintId) || /^f+$/i.test(fingerprintId)) {
    return { valid: false, reason: 'Fingerprint genérico detectado' };
  }
  
  if (confidence < 0.3) {
    return { valid: false, reason: 'Confiança do fingerprint muito baixa' };
  }
  
  return { valid: true, reason: 'Fingerprint válido' };
}

// =============================================================================
// RATE LIMITING HELPERS
// =============================================================================

/**
 * Verifica se deve aplicar rate limit baseado no tempo desde última ação
 */
export function shouldRateLimit(
  lastActionAt: Date | null,
  minIntervalSeconds: number
): boolean {
  if (!lastActionAt) {
    return false;
  }
  
  const now = new Date();
  const diffSeconds = (now.getTime() - lastActionAt.getTime()) / 1000;
  
  return diffSeconds < minIntervalSeconds;
}

/**
 * Calcula tempo restante para poder tentar novamente
 */
export function getRateLimitRemainingSeconds(
  lastActionAt: Date | null,
  minIntervalSeconds: number
): number {
  if (!lastActionAt) {
    return 0;
  }
  
  const now = new Date();
  const diffSeconds = (now.getTime() - lastActionAt.getTime()) / 1000;
  
  return Math.max(0, Math.ceil(minIntervalSeconds - diffSeconds));
}
