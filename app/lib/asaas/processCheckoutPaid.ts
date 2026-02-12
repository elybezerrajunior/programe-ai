/**
 * Lógica compartilhada para processar CHECKOUT_PAID (webhook e simulação em dev).
 */

import { sendSubscriptionNotification } from '~/lib/notifications/subscription-notifications';

const PLAN_CREDITS: Record<string, number> = {
  free: 200,
  starter: 200,
  builder: 700,
  pro: 1600,
  enterprise: 500,
};

export interface CheckoutForProcess {
  id: string;
  externalReference?: string;
  items?: Array<{ value: number; quantity?: number }>;
  customer?: string;
}

export interface ProcessCheckoutPaidResult {
  success: boolean;
  error?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function processCheckoutPaid(supabase: any, checkout: CheckoutForProcess): Promise<ProcessCheckoutPaidResult> {
  if (!supabase) {
    return { success: false, error: 'Supabase não configurado' };
  }

  let checkoutData: {
    userId?: string;
    planType?: string;
    creditsPerMonth?: number;
    billingCycle?: string;
    price?: number;
  } | null = null;

  if (checkout.externalReference) {
    try {
      checkoutData = JSON.parse(checkout.externalReference);
    } catch {
      checkoutData = null;
    }
  }

  if (!checkoutData?.userId || !checkoutData?.planType) {
    return { success: false, error: 'externalReference inválido ou ausente' };
  }

  const { userId, planType, creditsPerMonth, billingCycle, price } = checkoutData;
  const credits = creditsPerMonth ?? PLAN_CREDITS[planType] ?? 100;
  const totalValue =
    checkout.items?.reduce((sum, item) => sum + (item.value * (item.quantity ?? 1)), 0) ?? price ?? 0;

  const periodStart = new Date();
  const periodEnd = new Date();
  periodEnd.setDate(periodEnd.getDate() + (billingCycle === 'YEARLY' ? 365 : 30));

  try {
    await supabase.from('subscriptions').upsert(
      {
        user_id: userId,
        asaas_customer_id: checkout.customer || null,
        plan_type: planType,
        status: 'active',
        credits_per_month: credits,
        monthly_price: totalValue || undefined,
        billing_cycle: billingCycle || 'MONTHLY',
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

    await addCreditsToUser(supabase, userId, credits, planType);

    await supabase
      .from('asaas_checkouts')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('checkout_id', checkout.id);

    // Enviar notificação de boas-vindas ou bem-vindo de volta
    // Usa o checkout.id como chave de idempotência para evitar duplicatas
    await sendSubscriptionNotification(supabase, {
      userId,
      planType,
      idempotencyKey: `checkout_${checkout.id}`,
    });

    console.log('[processCheckoutPaid] Sucesso para user', userId);
    return { success: true };
  } catch (err) {
    console.error('[processCheckoutPaid] Erro:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro ao processar',
    };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function addCreditsToUser(supabase: any, userId: string, credits: number, planType: string) {
  const { data: existingCredits } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_id', userId)
    .single();

  const rollover = planType !== 'free';

  if (existingCredits) {
    const newTotal = rollover ? existingCredits.total_credits + credits : credits;
    await supabase
      .from('user_credits')
      .update({
        total_credits: newTotal,
        used_credits: rollover ? existingCredits.used_credits : 0,
        daily_credits_used: 0,
        last_reset_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);
  } else {
    await supabase.from('user_credits').insert({
      user_id: userId,
      total_credits: credits,
      used_credits: 0,
      bonus_credits: 0,
      daily_credits_used: 0,
      last_reset_at: new Date().toISOString(),
    });
  }
}
