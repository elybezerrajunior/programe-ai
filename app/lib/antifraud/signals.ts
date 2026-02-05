/**
 * Módulo de Coleta de Sinais Antifraude
 * 
 * Responsável por:
 * - Extrair sinais de rede dos headers (Cloudflare)
 * - Parsear User-Agent
 * - Normalizar dados para análise
 */

import type { NetworkSignals, DeviceSignals, EmailSignals } from './types';

// =============================================================================
// EXTRAÇÃO DE SINAIS DE REDE (CLOUDFLARE HEADERS)
// =============================================================================

/**
 * Extrai sinais de rede dos headers HTTP (Cloudflare)
 * 
 * Cloudflare adiciona headers úteis como:
 * - CF-Connecting-IP: IP real do usuário
 * - CF-IPCountry: País do IP
 * - CF-Ray: ID da request
 * - CF-Visitor: Esquema usado (http/https)
 */
export function extractNetworkSignals(request: Request): NetworkSignals {
  const headers = request.headers;
  
  // IP do usuário - tenta múltiplas fontes
  const ipAddress = 
    headers.get('cf-connecting-ip') ||
    headers.get('x-real-ip') ||
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    '0.0.0.0';
  
  // Geolocalização do Cloudflare
  const countryCode = headers.get('cf-ipcountry') || 'XX';
  const city = headers.get('cf-ipcity') || '';
  const region = headers.get('cf-ipregion') || '';
  
  // Latitude e longitude (se disponível via Cloudflare Workers)
  const latitude = parseFloat(headers.get('cf-iplatitude') || '0');
  const longitude = parseFloat(headers.get('cf-iplongitude') || '0');
  
  // ASN (Autonomous System Number)
  const asnHeader = headers.get('cf-asn') || '';
  const asn = parseInt(asnHeader, 10) || 0;
  const asnOrg = headers.get('cf-asorganization') || '';
  
  // Detecção de rede (flags que podem ser adicionados via Cloudflare Workers ou serviço externo)
  const isMobile = headers.get('cf-device-type') === 'mobile';
  
  // Esses flags precisam ser detectados via serviço externo (IPInfo, MaxMind, etc)
  // Por padrão, assumimos false e deixamos a detecção para o risk-score
  const isVpn = false;
  const isProxy = false;
  const isTor = false;
  const isDatacenter = false;
  
  return {
    ipAddress,
    countryCode,
    region,
    city,
    latitude,
    longitude,
    asn,
    asnOrg,
    isVpn,
    isProxy,
    isTor,
    isDatacenter,
    isMobile,
  };
}

// =============================================================================
// EXTRAÇÃO DE SINAIS DO DISPOSITIVO (USER-AGENT)
// =============================================================================

/**
 * Parseia o User-Agent para extrair informações do dispositivo
 * 
 * Nota: O fingerprint principal vem do FingerprintJS no frontend.
 * Isso é apenas para complementar com dados do User-Agent.
 */
export function parseUserAgent(userAgent: string): Partial<DeviceSignals> {
  // Detecção básica de browser
  let browserName = 'Unknown';
  let browserVersion = '';
  
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    browserName = 'Chrome';
    const match = userAgent.match(/Chrome\/(\d+\.\d+)/);
    browserVersion = match ? match[1] : '';
  } else if (userAgent.includes('Firefox')) {
    browserName = 'Firefox';
    const match = userAgent.match(/Firefox\/(\d+\.\d+)/);
    browserVersion = match ? match[1] : '';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browserName = 'Safari';
    const match = userAgent.match(/Version\/(\d+\.\d+)/);
    browserVersion = match ? match[1] : '';
  } else if (userAgent.includes('Edg')) {
    browserName = 'Edge';
    const match = userAgent.match(/Edg\/(\d+\.\d+)/);
    browserVersion = match ? match[1] : '';
  }
  
  // Detecção básica de OS
  let osName = 'Unknown';
  let osVersion = '';
  
  if (userAgent.includes('Windows')) {
    osName = 'Windows';
    if (userAgent.includes('Windows NT 10')) osVersion = '10';
    else if (userAgent.includes('Windows NT 11')) osVersion = '11';
    else if (userAgent.includes('Windows NT 6.3')) osVersion = '8.1';
    else if (userAgent.includes('Windows NT 6.1')) osVersion = '7';
  } else if (userAgent.includes('Mac OS X')) {
    osName = 'macOS';
    const match = userAgent.match(/Mac OS X (\d+[._]\d+)/);
    osVersion = match ? match[1].replace('_', '.') : '';
  } else if (userAgent.includes('Linux')) {
    osName = 'Linux';
    if (userAgent.includes('Ubuntu')) osVersion = 'Ubuntu';
    else if (userAgent.includes('Android')) {
      osName = 'Android';
      const match = userAgent.match(/Android (\d+(\.\d+)?)/);
      osVersion = match ? match[1] : '';
    }
  } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    osName = 'iOS';
    const match = userAgent.match(/OS (\d+_\d+)/);
    osVersion = match ? match[1].replace('_', '.') : '';
  }
  
  // Detecção de tipo de dispositivo
  let deviceType: DeviceSignals['deviceType'] = 'desktop';
  
  if (userAgent.includes('Mobile') || userAgent.includes('Android')) {
    deviceType = 'mobile';
  } else if (userAgent.includes('iPad') || userAgent.includes('Tablet')) {
    deviceType = 'tablet';
  }
  
  return {
    browserName,
    browserVersion,
    osName,
    osVersion,
    deviceType,
    userAgent,
  };
}

// =============================================================================
// VALIDAÇÃO DE SINAIS
// =============================================================================

/**
 * Lista de User-Agents suspeitos (bots, scrapers, headless browsers)
 */
const SUSPICIOUS_USER_AGENTS = [
  'headlesschrome',
  'phantomjs',
  'selenium',
  'webdriver',
  'puppeteer',
  'playwright',
  'cypress',
  'bot',
  'crawler',
  'spider',
  'scraper',
  'curl',
  'wget',
  'python-requests',
  'axios',
  'fetch',
  'node-fetch',
  'go-http-client',
  'java/',
  'libwww',
];

/**
 * Verifica se o User-Agent é suspeito (possível bot/automação)
 */
export function isSuspiciousUserAgent(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return SUSPICIOUS_USER_AGENTS.some(suspicious => ua.includes(suspicious));
}

/**
 * Verifica se o fingerprint tem confiança adequada
 * FingerprintJS retorna um score de 0 a 1
 */
export function isValidFingerprint(fingerprintId: string | null, confidence: number): boolean {
  if (!fingerprintId) return false;
  if (fingerprintId.length < 10) return false;
  if (confidence < 0.3) return false;  // Confiança muito baixa
  return true;
}

// =============================================================================
// EXTRAÇÃO DE SINAIS DE EMAIL
// =============================================================================

/**
 * Extrai sinais do e-mail para análise
 */
export function extractEmailSignals(email: string): EmailSignals {
  const domain = email.split('@')[1]?.toLowerCase() || '';
  
  return {
    email: email.toLowerCase(),
    domain,
    isDisposable: false,  // Será verificado via banco de dados
    mxValid: true,        // Será verificado se necessário
  };
}

// =============================================================================
// ASN CONHECIDOS (DATACENTERS)
// =============================================================================

/**
 * Lista de ASNs conhecidos de datacenters/cloud providers
 * Signups vindos desses ASNs são mais suspeitos
 */
const DATACENTER_ASNS = new Set([
  // AWS
  14618, 16509, 7224,
  // Google Cloud
  15169, 19527, 36040,
  // Microsoft Azure
  8075, 8068, 8069,
  // DigitalOcean
  14061,
  // Linode
  63949,
  // Vultr
  20473,
  // OVH
  16276,
  // Hetzner
  24940,
  // Cloudflare
  13335,
  // Oracle Cloud
  31898,
]);

/**
 * Verifica se o ASN é de um datacenter conhecido
 */
export function isDatacenterAsn(asn: number): boolean {
  return DATACENTER_ASNS.has(asn);
}

// =============================================================================
// NORMALIZAÇÃO DE DADOS
// =============================================================================

/**
 * Normaliza o IP para formato consistente (remove portas, espaços, etc)
 */
export function normalizeIp(ip: string): string {
  return ip.trim().split(':')[0];
}

/**
 * Gera um hash parcial do IP para agrupamento
 * Útil para agrupar IPs do mesmo bloco /24
 */
export function getIpBlock(ip: string): string {
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
  }
  return ip;
}
