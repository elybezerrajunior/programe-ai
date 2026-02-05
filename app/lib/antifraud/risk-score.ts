/**
 * Módulo de Cálculo de Risk Score
 * 
 * Implementa um sistema de pontuação de risco baseado em múltiplos sinais.
 * 
 * Filosofia:
 * - Score de 0-100 (0 = sem risco, 100 = risco máximo)
 * - Cada categoria contribui com um peso específico
 * - Flags são coletados para explicabilidade
 * - Decisão final baseada em thresholds configuráveis
 */

import type {
  AntifraudSignals,
  RiskAnalysisResult,
  RiskScoreBreakdown,
  RiskFlag,
  RiskDecision,
  IpStats,
  FingerprintStats,
  AntifraudLimits,
} from './types';
import { DEFAULT_ANTIFRAUD_LIMITS } from './types';
import { isDatacenterAsn, isSuspiciousUserAgent, isValidFingerprint } from './signals';

// =============================================================================
// CONFIGURAÇÃO DE PESOS
// =============================================================================

/**
 * Pesos para cada categoria no score final
 * Soma deve ser aproximadamente 100
 */
const WEIGHTS = {
  ip: 20,           // Peso do score de IP
  fingerprint: 25,  // Peso do score de fingerprint
  email: 20,        // Peso do score de e-mail
  velocity: 20,     // Peso do score de velocidade
  network: 15,      // Peso do score de rede
};

/**
 * Pontos adicionados por cada flag de risco
 */
const FLAG_POINTS: Record<RiskFlag, number> = {
  multiple_accounts_same_ip: 20,
  multiple_accounts_same_fingerprint: 30,
  disposable_email: 25,
  vpn_detected: 15,
  proxy_detected: 20,
  tor_detected: 40,
  datacenter_ip: 25,
  high_velocity_signup: 30,
  suspicious_user_agent: 35,
  fingerprint_mismatch: 25,
  geo_mismatch: 15,
  blocklisted_ip: 100,
  blocklisted_fingerprint: 100,
  turnstile_failed: 40,
  bot_detected: 50,
};

// =============================================================================
// CÁLCULO DE SCORES INDIVIDUAIS
// =============================================================================

/**
 * Calcula o score de risco baseado no IP
 */
export function calculateIpScore(
  ipStats: IpStats | null,
  limits: AntifraudLimits
): { score: number; flags: RiskFlag[] } {
  const flags: RiskFlag[] = [];
  let score = 0;
  
  if (!ipStats) {
    return { score: 0, flags };
  }
  
  // IP na blocklist
  if (ipStats.isBlocklisted) {
    flags.push('blocklisted_ip');
    return { score: 100, flags };
  }
  
  // Múltiplas contas do mesmo IP
  if (ipStats.totalSignups > 2) {
    flags.push('multiple_accounts_same_ip');
    score += Math.min(50, ipStats.totalSignups * 10);
  }
  
  // Rate limit por hora
  if (ipStats.signupsLastHour >= limits.maxSignupsPerIpPerHour) {
    flags.push('high_velocity_signup');
    score += 30;
  }
  
  // Rate limit por dia
  if (ipStats.signupsLastDay >= limits.maxSignupsPerIpPerDay) {
    score += 20;
  }
  
  return { score: Math.min(100, score), flags };
}

/**
 * Calcula o score de risco baseado no fingerprint
 */
export function calculateFingerprintScore(
  fingerprintId: string | null,
  fingerprintConfidence: number,
  fpStats: FingerprintStats | null,
  limits: AntifraudLimits
): { score: number; flags: RiskFlag[] } {
  const flags: RiskFlag[] = [];
  let score = 0;
  
  // Sem fingerprint válido
  if (!isValidFingerprint(fingerprintId, fingerprintConfidence)) {
    score += 30;
  }
  
  // Confiança baixa do fingerprint
  if (fingerprintConfidence < 0.5 && fingerprintConfidence > 0) {
    flags.push('fingerprint_mismatch');
    score += 20;
  }
  
  if (!fpStats || !fingerprintId) {
    return { score, flags };
  }
  
  // Fingerprint na blocklist
  if (fpStats.isBlocklisted) {
    flags.push('blocklisted_fingerprint');
    return { score: 100, flags };
  }
  
  // Múltiplas contas do mesmo fingerprint (muito suspeito)
  if (fpStats.totalSignups > 1) {
    flags.push('multiple_accounts_same_fingerprint');
    score += Math.min(60, fpStats.totalSignups * 20);
  }
  
  // Rate limit por hora
  if (fpStats.signupsLastHour >= limits.maxSignupsPerFingerprintPerHour) {
    flags.push('high_velocity_signup');
    score += 40;
  }
  
  return { score: Math.min(100, score), flags };
}

/**
 * Calcula o score de risco baseado no e-mail
 */
export function calculateEmailScore(
  isDisposable: boolean,
  mxValid: boolean
): { score: number; flags: RiskFlag[] } {
  const flags: RiskFlag[] = [];
  let score = 0;
  
  // E-mail descartável
  if (isDisposable) {
    flags.push('disposable_email');
    score += 60;
  }
  
  // MX inválido
  if (!mxValid) {
    score += 30;
  }
  
  return { score: Math.min(100, score), flags };
}

/**
 * Calcula o score de risco baseado na rede (VPN, proxy, datacenter)
 */
export function calculateNetworkScore(
  isVpn: boolean,
  isProxy: boolean,
  isTor: boolean,
  isDatacenter: boolean,
  asn: number
): { score: number; flags: RiskFlag[] } {
  const flags: RiskFlag[] = [];
  let score = 0;
  
  // Tor é o mais suspeito
  if (isTor) {
    flags.push('tor_detected');
    score += 50;
  }
  
  // Proxy
  if (isProxy) {
    flags.push('proxy_detected');
    score += 35;
  }
  
  // VPN
  if (isVpn) {
    flags.push('vpn_detected');
    score += 25;
  }
  
  // IP de datacenter
  if (isDatacenter || isDatacenterAsn(asn)) {
    flags.push('datacenter_ip');
    score += 30;
  }
  
  return { score: Math.min(100, score), flags };
}

/**
 * Calcula o score de risco baseado em velocidade/comportamento
 */
export function calculateVelocityScore(
  userAgent: string,
  turnstileValid: boolean
): { score: number; flags: RiskFlag[] } {
  const flags: RiskFlag[] = [];
  let score = 0;
  
  // User-Agent suspeito (bot/automação)
  if (isSuspiciousUserAgent(userAgent)) {
    flags.push('suspicious_user_agent');
    flags.push('bot_detected');
    score += 60;
  }
  
  // Turnstile falhou
  if (!turnstileValid) {
    flags.push('turnstile_failed');
    score += 40;
  }
  
  return { score: Math.min(100, score), flags };
}

// =============================================================================
// CÁLCULO DO SCORE FINAL
// =============================================================================

/**
 * Calcula o score de risco final combinando todos os sinais
 */
export function calculateRiskScore(
  signals: AntifraudSignals,
  ipStats: IpStats | null,
  fpStats: FingerprintStats | null,
  limits: AntifraudLimits = DEFAULT_ANTIFRAUD_LIMITS
): RiskAnalysisResult {
  const allFlags: RiskFlag[] = [];
  
  // Calcular scores individuais
  const ipResult = calculateIpScore(ipStats, limits);
  const fpResult = calculateFingerprintScore(
    signals.device.fingerprintId,
    signals.device.fingerprintConfidence,
    fpStats,
    limits
  );
  const emailResult = calculateEmailScore(
    signals.email.isDisposable,
    signals.email.mxValid
  );
  const networkResult = calculateNetworkScore(
    signals.network.isVpn,
    signals.network.isProxy,
    signals.network.isTor,
    signals.network.isDatacenter,
    signals.network.asn
  );
  const velocityResult = calculateVelocityScore(
    signals.device.userAgent,
    signals.turnstile.valid
  );
  
  // Agregar flags
  allFlags.push(...ipResult.flags);
  allFlags.push(...fpResult.flags);
  allFlags.push(...emailResult.flags);
  allFlags.push(...networkResult.flags);
  allFlags.push(...velocityResult.flags);
  
  // Montar breakdown
  const breakdown: RiskScoreBreakdown = {
    ipScore: ipResult.score,
    fingerprintScore: fpResult.score,
    emailScore: emailResult.score,
    velocityScore: velocityResult.score,
    networkScore: networkResult.score,
  };
  
  // Calcular score ponderado
  const weightedScore = 
    (breakdown.ipScore * WEIGHTS.ip +
     breakdown.fingerprintScore * WEIGHTS.fingerprint +
     breakdown.emailScore * WEIGHTS.email +
     breakdown.velocityScore * WEIGHTS.velocity +
     breakdown.networkScore * WEIGHTS.network) / 100;
  
  // Adicionar pontos extras por flags críticos
  let bonusPoints = 0;
  for (const flag of allFlags) {
    if (flag === 'blocklisted_ip' || flag === 'blocklisted_fingerprint') {
      bonusPoints = 100;  // Bloqueio imediato
      break;
    }
    if (flag === 'bot_detected') {
      bonusPoints += 20;
    }
  }
  
  const riskScore = Math.min(100, Math.round(weightedScore + bonusPoints));
  
  // Determinar decisão
  const { decision, reason } = determineDecision(riskScore, allFlags, limits);
  
  return {
    riskScore,
    breakdown,
    flags: [...new Set(allFlags)],  // Remove duplicatas
    decision,
    decisionReason: reason,
    version: '1.0',
    processedAt: new Date(),
  };
}

// =============================================================================
// DECISÃO FINAL
// =============================================================================

/**
 * Determina a decisão final baseada no score e flags
 */
function determineDecision(
  riskScore: number,
  flags: RiskFlag[],
  limits: AntifraudLimits
): { decision: RiskDecision; reason: string } {
  // Bloqueio imediato por blocklist
  if (flags.includes('blocklisted_ip')) {
    return { decision: 'block', reason: 'IP está na lista de bloqueio' };
  }
  if (flags.includes('blocklisted_fingerprint')) {
    return { decision: 'block', reason: 'Dispositivo está na lista de bloqueio' };
  }
  
  // Bloqueio por score alto
  if (riskScore >= limits.riskScoreBlockThreshold) {
    const mainFlags = flags.slice(0, 3).join(', ');
    return { 
      decision: 'block', 
      reason: `Score de risco muito alto (${riskScore}). Flags: ${mainFlags}` 
    };
  }
  
  // Revisão necessária
  if (riskScore >= limits.riskScoreReviewThreshold) {
    return { 
      decision: 'review', 
      reason: `Score de risco moderado (${riskScore}). Requer revisão manual` 
    };
  }
  
  // Bot detectado - bloqueia
  if (flags.includes('bot_detected')) {
    return { decision: 'block', reason: 'Comportamento de bot detectado' };
  }
  
  // Turnstile falhou - bloqueia
  if (flags.includes('turnstile_failed')) {
    return { decision: 'block', reason: 'Falha na verificação de segurança (Turnstile)' };
  }
  
  // Permitido
  return { decision: 'allow', reason: 'Perfil de baixo risco' };
}

// =============================================================================
// FUNÇÕES UTILITÁRIAS
// =============================================================================

/**
 * Verifica se a decisão permite prosseguir com o signup
 */
export function isAllowed(decision: RiskDecision): boolean {
  return decision === 'allow' || decision === 'review';
}

/**
 * Retorna a cor apropriada para exibição do score
 */
export function getScoreColor(score: number): 'green' | 'yellow' | 'red' {
  if (score < 30) return 'green';
  if (score < 60) return 'yellow';
  return 'red';
}

/**
 * Formata o score para exibição
 */
export function formatScore(score: number): string {
  if (score < 30) return 'Baixo risco';
  if (score < 50) return 'Risco moderado';
  if (score < 70) return 'Risco elevado';
  return 'Alto risco';
}
