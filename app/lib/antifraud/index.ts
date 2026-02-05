/**
 * Sistema Antifraude - Módulo Principal
 * 
 * Exporta todas as funcionalidades do sistema antifraude.
 * 
 * Arquitetura:
 * 
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                        Frontend (React)                         │
 * │  ┌───────────────┐  ┌───────────────┐  ┌───────────────────┐   │
 * │  │  FingerprintJS │  │   Turnstile   │  │   SignupForm      │   │
 * │  │  (coleta FP)   │  │  (CAPTCHA)    │  │  (envia dados)    │   │
 * │  └───────────────┘  └───────────────┘  └───────────────────┘   │
 * └─────────────────────────────────────────────────────────────────┘
 *                                │
 *                                ▼
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                    API (Cloudflare Workers)                     │
 * │  ┌───────────────────────────────────────────────────────────┐  │
 * │  │                    service.ts                              │  │
 * │  │  - validateSignup()                                        │  │
 * │  │  - finalizeSignupAntifraud()                              │  │
 * │  └───────────────────────────────────────────────────────────┘  │
 * │                           │                                     │
 * │     ┌─────────────────────┼─────────────────────┐               │
 * │     ▼                     ▼                     ▼               │
 * │  ┌─────────┐        ┌───────────┐        ┌───────────┐          │
 * │  │signals.ts│        │risk-score │        │validators │          │
 * │  │(coleta)  │        │(cálculo)  │        │(validação)│          │
 * │  └─────────┘        └───────────┘        └───────────┘          │
 * │     │                     │                     │               │
 * │     └─────────────────────┼─────────────────────┘               │
 * │                           ▼                                     │
 * │  ┌───────────────────────────────────────────────────────────┐  │
 * │  │                   repository.ts                           │  │
 * │  │  - saveAntifraudSignals()                                 │  │
 * │  │  - saveRiskScore()                                        │  │
 * │  │  - getIpStats() / getFingerprintStats()                   │  │
 * │  └───────────────────────────────────────────────────────────┘  │
 * └─────────────────────────────────────────────────────────────────┘
 *                                │
 *                                ▼
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                    PostgreSQL (Supabase)                        │
 * │  ┌─────────────────┐ ┌──────────────────┐ ┌────────────────┐   │
 * │  │antifraud_signals│ │antifraud_risk_   │ │antifraud_ip_   │   │
 * │  │                 │ │scores            │ │stats           │   │
 * │  └─────────────────┘ └──────────────────┘ └────────────────┘   │
 * │  ┌─────────────────┐ ┌──────────────────┐                      │
 * │  │antifraud_       │ │antifraud_        │                      │
 * │  │fingerprint_stats│ │events            │                      │
 * │  └─────────────────┘ └──────────────────┘                      │
 * └─────────────────────────────────────────────────────────────────┘
 */

// =============================================================================
// TIPOS
// =============================================================================

export type {
  // Sinais
  DeviceSignals,
  NetworkSignals,
  EmailSignals,
  TurnstileSignals,
  AntifraudSignals,
  
  // Risk Score
  RiskScoreBreakdown,
  RiskFlag,
  RiskDecision,
  RiskAnalysisResult,
  
  // Rate Limiting
  IpStats,
  FingerprintStats,
  
  // Configuração
  AntifraudLimits,
  
  // Eventos
  AntifraudEventType,
  AntifraudEvent,
  
  // Payload
  SignupAntifraudPayload,
  AntifraudValidationResult,
} from './types';

export { DEFAULT_ANTIFRAUD_LIMITS, INITIAL_CREDITS } from './types';

// =============================================================================
// SERVIÇO PRINCIPAL
// =============================================================================

export {
  validateSignup,
  finalizeSignupAntifraud,
} from './service';

// =============================================================================
// SINAIS
// =============================================================================

export {
  extractNetworkSignals,
  parseUserAgent,
  extractEmailSignals,
  isSuspiciousUserAgent,
  isValidFingerprint,
  isDatacenterAsn,
  normalizeIp,
  getIpBlock,
} from './signals';

// =============================================================================
// RISK SCORE
// =============================================================================

export {
  calculateRiskScore,
  calculateIpScore,
  calculateFingerprintScore,
  calculateEmailScore,
  calculateNetworkScore,
  calculateVelocityScore,
  isAllowed,
  getScoreColor,
  formatScore,
} from './risk-score';

// =============================================================================
// VALIDADORES
// =============================================================================

export {
  validateTurnstileToken,
  isDisposableEmail,
  isFreeEmailProvider,
  isValidEmailFormat,
  validateEmailSignals,
  checkVpnProxy,
  validateFingerprint,
  shouldRateLimit,
  getRateLimitRemainingSeconds,
} from './validators';

// =============================================================================
// REPOSITÓRIO (para uso avançado)
// =============================================================================

export {
  saveAntifraudSignals,
  saveRiskScore,
  getRiskScore,
  getIpStats,
  getFingerprintStats,
  incrementIpStats,
  incrementFingerprintStats,
  logAntifraudEvent,
  blocklistIp,
  blocklistFingerprint,
} from './repository';
