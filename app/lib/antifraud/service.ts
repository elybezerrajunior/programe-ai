/**
 * Serviço Principal Antifraude
 * 
 * Orquestra todos os módulos do sistema antifraude:
 * - Coleta de sinais
 * - Cálculo de risco
 * - Persistência
 * 
 * Esta é a interface principal que deve ser usada pela aplicação.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  AntifraudSignals,
  SignupAntifraudPayload,
  AntifraudValidationResult,
  NetworkSignals,
  DeviceSignals,
  EmailSignals,
  TurnstileSignals,
  AntifraudLimits,
} from './types';
import { DEFAULT_ANTIFRAUD_LIMITS, INITIAL_CREDITS } from './types';
import { extractNetworkSignals, parseUserAgent, extractEmailSignals } from './signals';
import { calculateRiskScore, isAllowed } from './risk-score';
import { validateTurnstileToken, isDisposableEmail, checkVpnProxy } from './validators';
import {
  saveAntifraudSignals,
  saveRiskScore,
  getIpStats,
  getFingerprintStats,
  incrementIpStats,
  incrementFingerprintStats,
  logAntifraudEvent,
} from './repository';

// =============================================================================
// CONFIGURAÇÃO
// =============================================================================

interface AntifraudConfig {
  turnstileSecretKey: string;
  ipinfoToken?: string;  // Opcional, para detecção de VPN/proxy
  limits?: AntifraudLimits;
  enabled?: boolean;  // Para desabilitar em desenvolvimento
}

// =============================================================================
// SERVIÇO PRINCIPAL
// =============================================================================

/**
 * Valida um signup contra o sistema antifraude
 * 
 * Este é o método principal que deve ser chamado durante o signup.
 * Ele orquestra todo o fluxo de validação.
 */
export async function validateSignup(
  supabase: SupabaseClient,
  request: Request,
  payload: SignupAntifraudPayload,
  config: AntifraudConfig
): Promise<AntifraudValidationResult> {
  // Se antifraude estiver desabilitado, permite tudo
  if (config.enabled === false) {
    return {
      allowed: true,
      riskScore: 0,
      decision: 'allow',
      reason: 'Antifraude desabilitado',
      flags: [],
      initialCredits: INITIAL_CREDITS,
      signalId: null,
    };
  }
  
  const limits = config.limits || DEFAULT_ANTIFRAUD_LIMITS;
  
  try {
    // 1. Coletar sinais de rede (dos headers do Cloudflare)
    const networkSignals = await collectNetworkSignals(request, config.ipinfoToken);
    
    // 2. Montar sinais do dispositivo (do payload)
    const deviceSignals = collectDeviceSignals(payload);
    
    // 3. Validar Turnstile
    const turnstileSignals = await validateTurnstileToken(
      payload.turnstileToken,
      config.turnstileSecretKey,
      networkSignals.ipAddress
    );
    
    // 4. Validar e-mail
    const emailSignals = await collectEmailSignals(payload.email, supabase);
    
    // 5. Montar objeto completo de sinais
    const signals: AntifraudSignals = {
      device: deviceSignals,
      network: networkSignals,
      email: emailSignals,
      turnstile: turnstileSignals,
      timestamp: new Date(),
    };
    
    // 6. Buscar estatísticas de IP e fingerprint
    const [ipStats, fpStats] = await Promise.all([
      getIpStats(supabase, networkSignals.ipAddress),
      getFingerprintStats(supabase, payload.fingerprintId || ''),
    ]);
    
    // 7. Calcular risk score
    const riskResult = calculateRiskScore(signals, ipStats, fpStats, limits);
    
    // 8. Preparar resultado
    const allowed = isAllowed(riskResult.decision);
    
    // 9. Logar evento
    await logAntifraudEvent(supabase, allowed ? 'signup_attempt' : 'signup_blocked', {
      ipAddress: networkSignals.ipAddress,
      fingerprintId: payload.fingerprintId || undefined,
      riskScore: riskResult.riskScore,
      decision: riskResult.decision,
      eventData: {
        email: payload.email,
        flags: riskResult.flags,
        breakdown: riskResult.breakdown,
      },
    });
    
    return {
      allowed,
      riskScore: riskResult.riskScore,
      decision: riskResult.decision,
      reason: riskResult.decisionReason,
      flags: riskResult.flags,
      initialCredits: allowed ? INITIAL_CREDITS : 0,
      signalId: null,
    };
    
  } catch (error) {
    console.error('Antifraud validation error:', error);
    
    // Em caso de erro, permite com cautela (fail-open)
    return {
      allowed: true,
      riskScore: 30,
      decision: 'review',
      reason: 'Erro na validação - permitido com revisão pendente',
      flags: [],
      initialCredits: INITIAL_CREDITS,
      signalId: null,
    };
  }
}

/**
 * Finaliza o processo antifraude após o signup ser concluído
 * 
 * Deve ser chamado APÓS o usuário ser criado no Supabase Auth,
 * passando o userId.
 */
export async function finalizeSignupAntifraud(
  supabase: SupabaseClient,
  userId: string,
  request: Request,
  payload: SignupAntifraudPayload,
  validationResult: AntifraudValidationResult,
  config: AntifraudConfig
): Promise<void> {
  if (config.enabled === false) {
    return;
  }
  
  try {
    // 1. Coletar sinais novamente para salvar
    const networkSignals = await collectNetworkSignals(request, config.ipinfoToken);
    const deviceSignals = collectDeviceSignals(payload);
    const emailSignals: EmailSignals = {
      email: payload.email.toLowerCase(),
      domain: payload.email.split('@')[1]?.toLowerCase() || '',
      isDisposable: validationResult.flags.includes('disposable_email'),
      mxValid: true,
    };
    const turnstileSignals: TurnstileSignals = {
      token: payload.turnstileToken,
      valid: !validationResult.flags.includes('turnstile_failed'),
      action: 'signup',
      challengeTimestamp: new Date().toISOString(),
    };
    
    const signals: AntifraudSignals = {
      device: deviceSignals,
      network: networkSignals,
      email: emailSignals,
      turnstile: turnstileSignals,
      timestamp: new Date(),
    };
    
    // 2. Salvar sinais
    const signalId = await saveAntifraudSignals(supabase, userId, signals);
    
    // 3. Salvar risk score
    await saveRiskScore(supabase, userId, signalId, {
      riskScore: validationResult.riskScore,
      breakdown: {
        ipScore: 0,
        fingerprintScore: 0,
        emailScore: 0,
        velocityScore: 0,
        networkScore: 0,
      },
      flags: validationResult.flags,
      decision: validationResult.decision,
      decisionReason: validationResult.reason,
      version: '1.0',
      processedAt: new Date(),
    });
    
    // 4. Atualizar estatísticas
    const blocked = validationResult.decision === 'block';
    
    await Promise.all([
      incrementIpStats(supabase, networkSignals.ipAddress, userId, blocked),
      incrementFingerprintStats(
        supabase,
        payload.fingerprintId || '',
        payload.fingerprintConfidence,
        userId,
        networkSignals.ipAddress,
        blocked
      ),
    ]);
    
    // 5. Logar evento final
    await logAntifraudEvent(
      supabase,
      validationResult.allowed ? 'signup_allowed' : 'signup_blocked',
      {
        userId,
        ipAddress: networkSignals.ipAddress,
        fingerprintId: payload.fingerprintId || undefined,
        riskScore: validationResult.riskScore,
        decision: validationResult.decision,
        eventData: {
          email: payload.email,
          signalId,
        },
      }
    );
    
  } catch (error) {
    console.error('Error finalizing signup antifraud:', error);
    // Não falha o signup por erro no antifraude
  }
}

// =============================================================================
// FUNÇÕES AUXILIARES
// =============================================================================

/**
 * Coleta sinais de rede com detecção de VPN/proxy
 */
async function collectNetworkSignals(
  request: Request,
  ipinfoToken?: string
): Promise<NetworkSignals> {
  const baseSignals = extractNetworkSignals(request);
  
  // Se temos token do IPInfo, verifica VPN/proxy
  if (ipinfoToken) {
    const vpnCheck = await checkVpnProxy(baseSignals.ipAddress, ipinfoToken);
    return {
      ...baseSignals,
      isVpn: vpnCheck.isVpn,
      isProxy: vpnCheck.isProxy,
      isTor: vpnCheck.isTor,
      isDatacenter: vpnCheck.isDatacenter,
    };
  }
  
  return baseSignals;
}

/**
 * Monta sinais do dispositivo a partir do payload
 */
function collectDeviceSignals(payload: SignupAntifraudPayload): DeviceSignals {
  const parsedUA = parseUserAgent(payload.userAgent);
  
  return {
    fingerprintId: payload.fingerprintId,
    fingerprintConfidence: payload.fingerprintConfidence,
    userAgent: payload.userAgent,
    screenResolution: payload.screenResolution,
    language: payload.language,
    timezone: payload.timezone,
    browserName: parsedUA.browserName || 'Unknown',
    browserVersion: parsedUA.browserVersion || '',
    osName: parsedUA.osName || 'Unknown',
    osVersion: parsedUA.osVersion || '',
    deviceType: parsedUA.deviceType || 'unknown',
  };
}

/**
 * Coleta e valida sinais de e-mail
 */
async function collectEmailSignals(
  email: string,
  supabase: SupabaseClient
): Promise<EmailSignals> {
  const baseSignals = extractEmailSignals(email);
  const isDisposable = await isDisposableEmail(email, supabase);
  
  return {
    ...baseSignals,
    isDisposable,
  };
}
