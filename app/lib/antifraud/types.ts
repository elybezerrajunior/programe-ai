/**
 * Tipos TypeScript para o Sistema Antifraude
 * 
 * Arquitetura modular que separa:
 * - Coleta de sinais
 * - Cálculo de risco
 * - Gerenciamento de confiança
 * - Regras de negócio
 */

// =============================================================================
// SINAIS COLETADOS
// =============================================================================

/**
 * Sinais coletados do dispositivo/navegador (frontend)
 */
export interface DeviceSignals {
  fingerprintId: string | null;
  fingerprintConfidence: number;
  userAgent: string;
  screenResolution: string;
  language: string;
  timezone: string;
  browserName: string;
  browserVersion: string;
  osName: string;
  osVersion: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
}

/**
 * Sinais de rede coletados (backend via Cloudflare headers)
 */
export interface NetworkSignals {
  ipAddress: string;
  countryCode: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  asn: number;
  asnOrg: string;
  isVpn: boolean;
  isProxy: boolean;
  isTor: boolean;
  isDatacenter: boolean;
  isMobile: boolean;
}

/**
 * Sinais de e-mail
 */
export interface EmailSignals {
  email: string;
  domain: string;
  isDisposable: boolean;
  mxValid: boolean;
}

/**
 * Token do Cloudflare Turnstile
 */
export interface TurnstileSignals {
  token: string;
  valid: boolean;
  action: string;
  challengeTimestamp: string;
}

/**
 * Todos os sinais combinados
 */
export interface AntifraudSignals {
  device: DeviceSignals;
  network: NetworkSignals;
  email: EmailSignals;
  turnstile: TurnstileSignals;
  timestamp: Date;
}

// =============================================================================
// RISK SCORE
// =============================================================================

/**
 * Scores individuais por categoria
 */
export interface RiskScoreBreakdown {
  ipScore: number;        // Risco baseado em IP (0-100)
  fingerprintScore: number; // Risco baseado em fingerprint (0-100)
  emailScore: number;     // Risco baseado em e-mail (0-100)
  velocityScore: number;  // Risco baseado em velocidade (0-100)
  networkScore: number;   // Risco baseado em rede (VPN, proxy, etc) (0-100)
}

/**
 * Flags de risco detectados
 */
export type RiskFlag = 
  | 'multiple_accounts_same_ip'
  | 'multiple_accounts_same_fingerprint'
  | 'disposable_email'
  | 'vpn_detected'
  | 'proxy_detected'
  | 'tor_detected'
  | 'datacenter_ip'
  | 'high_velocity_signup'
  | 'suspicious_user_agent'
  | 'fingerprint_mismatch'
  | 'geo_mismatch'
  | 'blocklisted_ip'
  | 'blocklisted_fingerprint'
  | 'turnstile_failed'
  | 'bot_detected';

/**
 * Decisão do sistema antifraude
 */
export type RiskDecision = 'allow' | 'review' | 'block' | 'pending';

/**
 * Resultado completo da análise de risco
 */
export interface RiskAnalysisResult {
  riskScore: number;        // Score total (0-100)
  breakdown: RiskScoreBreakdown;
  flags: RiskFlag[];
  decision: RiskDecision;
  decisionReason: string;
  version: string;          // Versão do algoritmo
  processedAt: Date;
}

// =============================================================================
// CRÉDITOS
// =============================================================================

/**
 * Créditos fixos para novos usuários
 */
export const INITIAL_CREDITS = 200;

// =============================================================================
// RATE LIMITING
// =============================================================================

/**
 * Estatísticas de rate limit por IP
 */
export interface IpStats {
  ipAddress: string;
  totalSignups: number;
  signupsLastHour: number;
  signupsLastDay: number;
  lastSignupAt: Date | null;
  isBlocklisted: boolean;
  blocklistReason: string | null;
}

/**
 * Estatísticas de rate limit por fingerprint
 */
export interface FingerprintStats {
  fingerprintId: string;
  totalSignups: number;
  signupsLastHour: number;
  signupsLastDay: number;
  lastSignupAt: Date | null;
  avgConfidence: number;
  isBlocklisted: boolean;
  blocklistReason: string | null;
}

// =============================================================================
// CONFIGURAÇÃO
// =============================================================================

/**
 * Limites configuráveis do sistema
 */
export interface AntifraudLimits {
  // Rate limits
  maxSignupsPerIpPerHour: number;
  maxSignupsPerIpPerDay: number;
  maxSignupsPerFingerprintPerHour: number;
  maxSignupsPerFingerprintPerDay: number;
  
  // Thresholds de score
  riskScoreBlockThreshold: number;   // Score acima disso = bloqueio
  riskScoreReviewThreshold: number;  // Score acima disso = revisão
  
}

/**
 * Configuração padrão do sistema
 */
export const DEFAULT_ANTIFRAUD_LIMITS: AntifraudLimits = {
  // Rate limits conservadores
  maxSignupsPerIpPerHour: 3,
  maxSignupsPerIpPerDay: 5,
  maxSignupsPerFingerprintPerHour: 2,
  maxSignupsPerFingerprintPerDay: 3,
  
  // Thresholds de risco
  riskScoreBlockThreshold: 80,   // 80+ = bloqueio automático
  riskScoreReviewThreshold: 50,  // 50-79 = precisa de revisão
};

// =============================================================================
// EVENTOS DE AUDITORIA
// =============================================================================

/**
 * Tipos de eventos antifraude
 */
export type AntifraudEventType = 
  | 'signup_attempt'
  | 'signup_blocked'
  | 'signup_allowed'
  | 'signup_review'
  | 'ip_blocklisted'
  | 'fingerprint_blocklisted'
  | 'trust_level_changed'
  | 'verification_completed'
  | 'suspicious_activity'
  | 'rate_limit_exceeded';

/**
 * Evento de auditoria
 */
export interface AntifraudEvent {
  id: string;
  userId: string | null;
  eventType: AntifraudEventType;
  eventData: Record<string, unknown>;
  ipAddress: string;
  fingerprintId: string | null;
  riskScore: number | null;
  decision: RiskDecision | null;
  createdAt: Date;
}

// =============================================================================
// PAYLOAD DO SIGNUP
// =============================================================================

/**
 * Dados enviados do frontend para validação antifraude
 */
export interface SignupAntifraudPayload {
  // Dados do formulário
  email: string;
  name: string;
  
  // Sinais do dispositivo (coletados via FingerprintJS)
  fingerprintId: string | null;
  fingerprintConfidence: number;
  
  // Token do Turnstile
  turnstileToken: string;
  
  // Dados do navegador
  userAgent: string;
  screenResolution: string;
  language: string;
  timezone: string;
}

/**
 * Resposta da validação antifraude
 */
export interface AntifraudValidationResult {
  allowed: boolean;
  riskScore: number;
  decision: RiskDecision;
  reason: string;
  flags: RiskFlag[];
  
  // Créditos fixos (5 para todos)
  initialCredits: number;
  
  // ID para referência
  signalId: string | null;
}
