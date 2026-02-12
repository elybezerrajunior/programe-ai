/**
 * API Endpoint: Validação Antifraude
 * 
 * Endpoint usado pelo frontend para validar um signup antes de criar a conta.
 * 
 * POST /api/antifraud/validate
 * 
 * Body:
 * {
 *   email: string,
 *   name: string,
 *   fingerprintId: string | null,
 *   fingerprintConfidence: number,
 *   turnstileToken: string,
 *   userAgent: string,
 *   screenResolution: string,
 *   language: string,
 *   timezone: string,
 * }
 * 
 * Response:
 * {
 *   allowed: boolean,
 *   riskScore: number,
 *   decision: 'allow' | 'review' | 'block',
 *   reason: string,
 *   initialCredits: number,
 * }
 */

import { json, type ActionFunctionArgs } from '@remix-run/cloudflare';
import { getSupabaseClient } from '~/lib/auth/supabase-client';
import { validateSignup, type SignupAntifraudPayload } from '~/lib/antifraud';

export const action = async ({ request, context }: ActionFunctionArgs) => {
  // Apenas POST é permitido
  if (request.method !== 'POST') {
    return json({ error: 'Método não permitido' }, { status: 405 });
  }
  
  try {
    // Obter variáveis de ambiente do Cloudflare
    const env = context?.cloudflare?.env as unknown as Record<string, string> | undefined;
    
    // Parsear body
    const body = await request.json() as SignupAntifraudPayload;
    
    // Validar campos obrigatórios
    if (!body.email) {
      return json({ error: 'E-mail é obrigatório' }, { status: 400 });
    }
    
    if (!body.turnstileToken) {
      return json({ 
        error: 'Verificação de segurança é obrigatória',
        allowed: false,
        riskScore: 100,
        decision: 'block',
        reason: 'Token Turnstile não fornecido',
      }, { status: 400 });
    }
    
    // Obter cliente Supabase
    const supabase = getSupabaseClient(env);
    
    // Obter secret key do Turnstile
    const turnstileSecretKey = env?.TURNSTILE_SECRET_KEY || 
                               env?.CLOUDFLARE_TURNSTILE_SECRET_KEY ||
                               process.env.TURNSTILE_SECRET_KEY || '';
    
    // Token do IPInfo (opcional)
    const ipinfoToken = env?.IPINFO_TOKEN || process.env.IPINFO_TOKEN;
    
    // Verificar se antifraude está habilitado
    const antifraudEnabled = (env?.ANTIFRAUD_ENABLED || process.env.ANTIFRAUD_ENABLED) !== 'false';
    
    // Validar signup
    const result = await validateSignup(
      supabase,
      request,
      body,
      {
        turnstileSecretKey,
        ipinfoToken,
        enabled: antifraudEnabled,
      }
    );
    
    // Retornar resultado
    return json({
      allowed: result.allowed,
      riskScore: result.riskScore,
      decision: result.decision,
      reason: result.reason,
      initialCredits: result.initialCredits,
      // Não expor flags detalhados para o frontend (segurança)
    });
    
  } catch (error) {
    console.error('Antifraud validation error:', error);
    
    // Em caso de erro, permite com cautela (fail-open com revisão)
    return json({
      allowed: true,
      riskScore: 30,
      decision: 'review',
      reason: 'Erro na validação - permitido com revisão pendente',
      initialCredits: 200,
    });
  }
};

// Loader para informar que GET não é suportado
export const loader = async () => {
  return json({ error: 'Método não suportado. Use POST.' }, { status: 405 });
};
