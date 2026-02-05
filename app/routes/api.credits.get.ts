import { json, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { getSessionFromRequest } from '~/lib/auth/session';
import { getSupabaseClient } from '~/lib/auth/supabase-client';

export interface UserCredits {
  userId: string;
  totalCredits: number;
  usedCredits: number;
  remainingCredits: number;
  planCredits: number;
  bonusCredits: number;
  dailyCredits: number;
  dailyCreditsUsed: number;
  lastResetAt: string | null;
  nextResetAt: string | null;
}

// Créditos por plano
const PLAN_CREDITS: Record<string, number> = {
  free: 5,
  pro: 100,
  business: 100,
  enterprise: 500,
};

const DAILY_CREDITS: Record<string, number> = {
  free: 0,
  pro: 5,
  business: 10,
  enterprise: 20,
};

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  const env = context?.cloudflare?.env as unknown as Record<string, string> | undefined;
  try {
    const session = await getSessionFromRequest(request, env);
    if (!session) {
      return json({ error: 'Não autenticado' }, { status: 401 });
    }

    const supabase = getSupabaseClient(env);
    if (!supabase) {
      return json({ error: 'Supabase não configurado' }, { status: 500 });
    }

    // Buscar créditos do usuário
    const { data: credits, error: creditsError } = await (supabase as any)
      .from('user_credits')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    // Buscar plano do usuário
    const { data: subscription } = await (supabase as any)
      .from('subscriptions')
      .select('plan_type, status')
      .eq('user_id', session.user.id)
      .single();

    const planType = (subscription?.plan_type as string) || 'free';
    const planCredits = PLAN_CREDITS[planType] || 5;
    const dailyCreditsAllowed = DAILY_CREDITS[planType] || 0;

    // Se não tem registro de créditos, criar um
    if (creditsError && creditsError.code === 'PGRST116') {
      const newCredits = {
        user_id: session.user.id,
        total_credits: planCredits,
        used_credits: 0,
        bonus_credits: 0,
        daily_credits_used: 0,
        last_reset_at: new Date().toISOString(),
      };

      await (supabase as any).from('user_credits').insert(newCredits);

      return json({
        credits: {
          userId: session.user.id,
          totalCredits: planCredits,
          usedCredits: 0,
          remainingCredits: planCredits,
          planCredits,
          bonusCredits: 0,
          dailyCredits: dailyCreditsAllowed,
          dailyCreditsUsed: 0,
          lastResetAt: new Date().toISOString(),
          nextResetAt: getNextMidnightUTC(),
        } as UserCredits,
      });
    }

    if (creditsError) {
      console.error('Error fetching credits:', creditsError);
      return json({ error: 'Erro ao buscar créditos' }, { status: 500 });
    }

    // Verificar se precisa resetar créditos diários (meia-noite UTC)
    const creditsRow = credits as { last_reset_at?: string; daily_credits_used?: number; total_credits?: number; bonus_credits?: number; used_credits?: number };
    const lastReset = creditsRow.last_reset_at ? new Date(creditsRow.last_reset_at) : null;
    const now = new Date();
    const todayMidnightUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    
    let dailyCreditsUsed = creditsRow.daily_credits_used || 0;
    
    if (!lastReset || lastReset < todayMidnightUTC) {
      // Resetar créditos diários
      dailyCreditsUsed = 0;
      await (supabase as any)
        .from('user_credits')
        .update({
          daily_credits_used: 0,
          last_reset_at: now.toISOString(),
        })
        .eq('user_id', session.user.id);
    }

    const totalCredits = (creditsRow.total_credits ?? 0) + (creditsRow.bonus_credits ?? 0) + (dailyCreditsAllowed - dailyCreditsUsed);
    const remainingCredits = totalCredits - (creditsRow.used_credits ?? 0);

    return json({
      credits: {
        userId: session.user.id,
        totalCredits,
        usedCredits: creditsRow.used_credits ?? 0,
        remainingCredits: Math.max(0, remainingCredits),
        planCredits,
        bonusCredits: creditsRow.bonus_credits ?? 0,
        dailyCredits: dailyCreditsAllowed,
        dailyCreditsUsed,
        lastResetAt: creditsRow.last_reset_at ?? null,
        nextResetAt: getNextMidnightUTC(),
      } as UserCredits,
    });
  } catch (error) {
    console.error('Error in credits loader:', error);
    return json(
      { error: error instanceof Error ? error.message : 'Erro ao buscar créditos' },
      { status: 500 }
    );
  }
};

function getNextMidnightUTC(): string {
  const now = new Date();
  const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return tomorrow.toISOString();
}
