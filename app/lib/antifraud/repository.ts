/**
 * Repositório de Dados Antifraude
 * 
 * Encapsula todas as operações de banco de dados relacionadas ao antifraude.
 * Usa Supabase como backend PostgreSQL.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  AntifraudSignals,
  RiskAnalysisResult,
  IpStats,
  FingerprintStats,
  AntifraudEventType,
} from './types';

// =============================================================================
// TIPOS DE BANCO DE DADOS
// =============================================================================

interface DbRiskScore {
  id: string;
  user_id: string;
  signal_id: string | null;
  risk_score: number;
  ip_score: number;
  fingerprint_score: number;
  email_score: number;
  velocity_score: number;
  network_score: number;
  decision: string;
  decision_reason: string | null;
  risk_flags: string[];
  version: string;
  processed_at: string;
  created_at: string;
}

// =============================================================================
// SINAIS ANTIFRAUDE
// =============================================================================

/**
 * Salva os sinais coletados durante o signup
 */
export async function saveAntifraudSignals(
  supabase: SupabaseClient,
  userId: string,
  signals: AntifraudSignals
): Promise<string | null> {
  const { data, error } = await supabase
    .from('antifraud_signals')
    .insert({
      user_id: userId,
      ip_address: signals.network.ipAddress,
      fingerprint_id: signals.device.fingerprintId,
      fingerprint_confidence: signals.device.fingerprintConfidence,
      user_agent: signals.device.userAgent,
      country_code: signals.network.countryCode,
      region: signals.network.region,
      city: signals.network.city,
      timezone: signals.device.timezone,
      latitude: signals.network.latitude,
      longitude: signals.network.longitude,
      asn: signals.network.asn,
      asn_org: signals.network.asnOrg,
      is_vpn: signals.network.isVpn,
      is_proxy: signals.network.isProxy,
      is_tor: signals.network.isTor,
      is_datacenter: signals.network.isDatacenter,
      is_mobile: signals.network.isMobile,
      browser_name: signals.device.browserName,
      browser_version: signals.device.browserVersion,
      os_name: signals.device.osName,
      os_version: signals.device.osVersion,
      device_type: signals.device.deviceType,
      screen_resolution: signals.device.screenResolution,
      language: signals.device.language,
      email_domain: signals.email.domain,
      is_disposable_email: signals.email.isDisposable,
      email_mx_valid: signals.email.mxValid,
      turnstile_token: signals.turnstile.token,
      turnstile_valid: signals.turnstile.valid,
    })
    .select('id')
    .single();
  
  if (error) {
    console.error('Error saving antifraud signals:', error);
    return null;
  }
  
  return data?.id || null;
}

// =============================================================================
// RISK SCORE
// =============================================================================

/**
 * Salva o resultado da análise de risco
 */
export async function saveRiskScore(
  supabase: SupabaseClient,
  userId: string,
  signalId: string | null,
  result: RiskAnalysisResult
): Promise<void> {
  const { error } = await supabase
    .from('antifraud_risk_scores')
    .upsert({
      user_id: userId,
      signal_id: signalId,
      risk_score: result.riskScore,
      ip_score: result.breakdown.ipScore,
      fingerprint_score: result.breakdown.fingerprintScore,
      email_score: result.breakdown.emailScore,
      velocity_score: result.breakdown.velocityScore,
      network_score: result.breakdown.networkScore,
      decision: result.decision,
      decision_reason: result.decisionReason,
      risk_flags: result.flags,
      version: result.version,
      processed_at: result.processedAt.toISOString(),
    }, {
      onConflict: 'user_id',
    });
  
  if (error) {
    console.error('Error saving risk score:', error);
  }
}

/**
 * Busca o risk score de um usuário
 */
export async function getRiskScore(
  supabase: SupabaseClient,
  userId: string
): Promise<RiskAnalysisResult | null> {
  const { data, error } = await supabase
    .from('antifraud_risk_scores')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  const dbData = data as DbRiskScore;
  
  return {
    riskScore: dbData.risk_score,
    breakdown: {
      ipScore: dbData.ip_score,
      fingerprintScore: dbData.fingerprint_score,
      emailScore: dbData.email_score,
      velocityScore: dbData.velocity_score,
      networkScore: dbData.network_score,
    },
    flags: dbData.risk_flags as any,
    decision: dbData.decision as any,
    decisionReason: dbData.decision_reason || '',
    version: dbData.version,
    processedAt: new Date(dbData.processed_at),
  };
}

// =============================================================================
// IP STATS
// =============================================================================

/**
 * Busca estatísticas de um IP
 */
export async function getIpStats(
  supabase: SupabaseClient,
  ipAddress: string
): Promise<IpStats | null> {
  const { data, error } = await supabase
    .from('antifraud_ip_stats')
    .select('*')
    .eq('ip_address', ipAddress)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  return {
    ipAddress: data.ip_address,
    totalSignups: data.total_signups,
    signupsLastHour: data.signups_last_hour,
    signupsLastDay: data.signups_last_day,
    lastSignupAt: data.last_signup_at ? new Date(data.last_signup_at) : null,
    isBlocklisted: data.is_blocklisted,
    blocklistReason: data.blocklist_reason,
  };
}

/**
 * Incrementa estatísticas de um IP após signup
 */
export async function incrementIpStats(
  supabase: SupabaseClient,
  ipAddress: string,
  userId: string,
  blocked: boolean = false
): Promise<void> {
  // Tenta fazer upsert com incremento atômico
  const { data: existing } = await supabase
    .from('antifraud_ip_stats')
    .select('associated_users')
    .eq('ip_address', ipAddress)
    .single();
  
  const associatedUsers = existing?.associated_users || [];
  if (!associatedUsers.includes(userId)) {
    associatedUsers.push(userId);
  }
  
  const { error } = await supabase
    .from('antifraud_ip_stats')
    .upsert({
      ip_address: ipAddress,
      total_signups: 1,
      successful_signups: blocked ? 0 : 1,
      blocked_signups: blocked ? 1 : 0,
      signups_last_hour: 1,
      signups_last_day: 1,
      last_signup_at: new Date().toISOString(),
      associated_users: associatedUsers,
    }, {
      onConflict: 'ip_address',
    });
  
  if (error) {
    console.error('Error incrementing IP stats:', error);
  }
  
  // Incrementa contadores usando RPC para atomicidade (se existir)
  await supabase.rpc('increment_ip_signup_stats', {
    p_ip_address: ipAddress,
    p_blocked: blocked,
  }).catch(() => {
    // RPC pode não existir ainda, não é crítico
  });
}

// =============================================================================
// FINGERPRINT STATS
// =============================================================================

/**
 * Busca estatísticas de um fingerprint
 */
export async function getFingerprintStats(
  supabase: SupabaseClient,
  fingerprintId: string
): Promise<FingerprintStats | null> {
  if (!fingerprintId) {
    return null;
  }
  
  const { data, error } = await supabase
    .from('antifraud_fingerprint_stats')
    .select('*')
    .eq('fingerprint_id', fingerprintId)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  return {
    fingerprintId: data.fingerprint_id,
    totalSignups: data.total_signups,
    signupsLastHour: data.signups_last_hour,
    signupsLastDay: data.signups_last_day,
    lastSignupAt: data.last_signup_at ? new Date(data.last_signup_at) : null,
    avgConfidence: data.avg_confidence,
    isBlocklisted: data.is_blocklisted,
    blocklistReason: data.blocklist_reason,
  };
}

/**
 * Incrementa estatísticas de um fingerprint após signup
 */
export async function incrementFingerprintStats(
  supabase: SupabaseClient,
  fingerprintId: string,
  confidence: number,
  userId: string,
  ipAddress: string,
  blocked: boolean = false
): Promise<void> {
  if (!fingerprintId) {
    return;
  }
  
  // Busca dados existentes para atualizar arrays
  const { data: existing } = await supabase
    .from('antifraud_fingerprint_stats')
    .select('associated_users, associated_ips, avg_confidence, total_signups')
    .eq('fingerprint_id', fingerprintId)
    .single();
  
  const associatedUsers = existing?.associated_users || [];
  const associatedIps = existing?.associated_ips || [];
  
  if (!associatedUsers.includes(userId)) {
    associatedUsers.push(userId);
  }
  if (!associatedIps.includes(ipAddress)) {
    associatedIps.push(ipAddress);
  }
  
  // Recalcula média de confiança
  const totalSignups = (existing?.total_signups || 0) + 1;
  const currentAvg = existing?.avg_confidence || confidence;
  const newAvg = ((currentAvg * (totalSignups - 1)) + confidence) / totalSignups;
  
  const { error } = await supabase
    .from('antifraud_fingerprint_stats')
    .upsert({
      fingerprint_id: fingerprintId,
      total_signups: totalSignups,
      successful_signups: blocked ? (existing?.successful_signups || 0) : (existing?.successful_signups || 0) + 1,
      blocked_signups: blocked ? (existing?.blocked_signups || 0) + 1 : (existing?.blocked_signups || 0),
      avg_confidence: newAvg,
      signups_last_hour: 1,
      signups_last_day: 1,
      last_signup_at: new Date().toISOString(),
      associated_users: associatedUsers,
      associated_ips: associatedIps,
    }, {
      onConflict: 'fingerprint_id',
    });
  
  if (error) {
    console.error('Error incrementing fingerprint stats:', error);
  }
}

// =============================================================================
// EVENTOS DE AUDITORIA
// =============================================================================

/**
 * Registra um evento antifraude para auditoria
 */
export async function logAntifraudEvent(
  supabase: SupabaseClient,
  eventType: AntifraudEventType,
  data: {
    userId?: string;
    ipAddress: string;
    fingerprintId?: string;
    riskScore?: number;
    decision?: string;
    eventData?: Record<string, unknown>;
  }
): Promise<void> {
  const { error } = await supabase
    .from('antifraud_events')
    .insert({
      user_id: data.userId || null,
      event_type: eventType,
      event_data: data.eventData || {},
      ip_address: data.ipAddress,
      fingerprint_id: data.fingerprintId || null,
      risk_score: data.riskScore,
      decision: data.decision,
    });
  
  if (error) {
    console.error('Error logging antifraud event:', error);
  }
}

// =============================================================================
// BLOCKLIST
// =============================================================================

/**
 * Adiciona um IP à blocklist
 */
export async function blocklistIp(
  supabase: SupabaseClient,
  ipAddress: string,
  reason: string
): Promise<void> {
  const { error } = await supabase
    .from('antifraud_ip_stats')
    .upsert({
      ip_address: ipAddress,
      is_blocklisted: true,
      blocklist_reason: reason,
      blocklisted_at: new Date().toISOString(),
    }, {
      onConflict: 'ip_address',
    });
  
  if (error) {
    console.error('Error blocklisting IP:', error);
  }
}

/**
 * Adiciona um fingerprint à blocklist
 */
export async function blocklistFingerprint(
  supabase: SupabaseClient,
  fingerprintId: string,
  reason: string
): Promise<void> {
  const { error } = await supabase
    .from('antifraud_fingerprint_stats')
    .upsert({
      fingerprint_id: fingerprintId,
      is_blocklisted: true,
      blocklist_reason: reason,
      blocklisted_at: new Date().toISOString(),
    }, {
      onConflict: 'fingerprint_id',
    });
  
  if (error) {
    console.error('Error blocklisting fingerprint:', error);
  }
}
