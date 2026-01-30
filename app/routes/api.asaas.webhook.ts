import { json, type ActionFunctionArgs } from '@remix-run/cloudflare';
import { supabase } from '~/lib/auth/supabase-client';
import { processCheckoutPaid } from '~/lib/asaas/processCheckoutPaid';

// Tipagem do payload do webhook ASAAS
interface AsaasWebhookPayload {
  event: string;
  payment?: {
    id?: string;
    subscription?: string;
    customer?: string;
    value?: number;
    externalReference?: string;
  };
  subscription?: { id?: string; status?: string };
  customer?: { id?: string };
  checkout?: { id?: string; externalReference?: string; items?: Array<{ value: number; quantity?: number }>; customer?: string };
}

// Créditos por plano
const PLAN_CREDITS: Record<string, number> = {
  free: 5,
  pro: 100,
  business: 100,
  enterprise: 500,
};

export const action = async ({ request, context }: ActionFunctionArgs) => {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const env = (context?.cloudflare?.env as any) || process.env;
    const webhookToken = env.ASAAS_WEBHOOK_TOKEN;

    // Verificar token do webhook (opcional, mas recomendado)
    if (webhookToken) {
      const token = request.headers.get('asaas-access-token');
      if (token !== webhookToken) {
        return json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const payload = (await request.json()) as AsaasWebhookPayload;
    const event = payload.event;

    const asaasId = payload.payment?.id || payload.subscription?.id || payload.customer?.id || payload.checkout?.id;
    console.log('[Webhook] Received event:', event, 'asaasId:', asaasId);
    if (event === 'CHECKOUT_CREATED') {
      console.log('[Webhook] Checkout criado – cobrança e email só existem quando o cliente pagar no link do ASAAS.');
    }

    // Salvar webhook no banco para auditoria (opcional: se a tabela não existir, continua)
    if (supabase) {
      try {
        await (supabase as any).from('asaas_webhooks').insert({
          event_type: event,
          asaas_id: asaasId,
          payload: payload,
          processed: false,
        });
      } catch (e) {
        console.warn('[Webhook] asaas_webhooks insert failed (table may not exist):', e);
      }
    }

    // CHECKOUT_PAID = pagamento via link de checkout (é esse que o ASAAS envia quando você paga no checkout!)
    if (event === 'CHECKOUT_PAID' && supabase && payload.checkout?.id) {
      const result = await processCheckoutPaid(supabase, {
        id: payload.checkout.id,
        externalReference: payload.checkout.externalReference,
        items: payload.checkout.items,
        customer: payload.checkout.customer,
      });
      if (!result.success) {
        console.warn('[Webhook] CHECKOUT_PAID:', result.error);
      }
    }
    // Processar eventos
    else if (event === 'PAYMENT_CONFIRMED' || event === 'PAYMENT_RECEIVED') {
      // Pagamento confirmado (cartão) ou recebido (PIX/Boleto)
      if (supabase && payload.payment) {
        try {
          await (supabase as any)
            .from('payments')
            .update({
              status: 'confirmed',
              payment_date: new Date().toISOString(),
            })
            .eq('asaas_payment_id', payload.payment.id);
        } catch (e) {
          console.warn('[Webhook] payments update failed:', e);
        }

        // Tentar parsear externalReference como JSON (checkout nativo)
        let checkoutData: { userId?: string; planType?: string; creditsPerMonth?: number; billingCycle?: string } | null = null;
        if (payload.payment.externalReference) {
          try {
            checkoutData = JSON.parse(payload.payment.externalReference);
          } catch {
            // Se não for JSON, pode ser um userId simples (fluxo antigo)
            checkoutData = null;
          }
        }

        // Se veio do checkout nativo do ASAAS (externalReference é JSON)
        if (checkoutData && checkoutData.userId && checkoutData.planType) {
          console.log('[Webhook] Processing checkout payment:', checkoutData);
          
          const { userId, planType, creditsPerMonth, billingCycle } = checkoutData;
          const credits = creditsPerMonth || PLAN_CREDITS[planType] || 100;

          // Calcular datas do período
          const periodStart = new Date();
          const periodEnd = new Date();
          periodEnd.setDate(periodEnd.getDate() + (billingCycle === 'YEARLY' ? 365 : 30));

          // Atualizar/criar assinatura
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any)
            .from('subscriptions')
            .upsert({
              user_id: userId,
              asaas_subscription_id: payload.payment.subscription || null,
              asaas_customer_id: payload.payment.customer || null,
              plan_type: planType,
              status: 'active',
              credits_per_month: credits,
              monthly_price: payload.payment.value,
              billing_cycle: billingCycle || 'MONTHLY',
              current_period_start: periodStart.toISOString(),
              current_period_end: periodEnd.toISOString(),
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'user_id'
            });

          // Adicionar créditos ao usuário
          await addCreditsToUser(userId, credits, planType);

          // Marcar checkout como completado
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any)
            .from('asaas_checkouts')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
              asaas_subscription_id: payload.payment.subscription || null,
            })
            .eq('user_id', userId)
            .eq('status', 'pending');

        } else if (payload.payment.subscription) {
          // Fluxo tradicional: assinatura já existente
          const { data: subscription } = await (supabase as any)
            .from('subscriptions')
            .select('user_id, plan_type, credits_per_month')
            .eq('asaas_subscription_id', payload.payment.subscription)
            .single();

          if (subscription) {
            // Atualizar status da assinatura
            await (supabase as any)
              .from('subscriptions')
              .update({ 
                status: 'active',
                updated_at: new Date().toISOString(),
              })
              .eq('asaas_subscription_id', payload.payment.subscription);

            // Adicionar créditos ao usuário
            const planCredits = subscription.credits_per_month || PLAN_CREDITS[subscription.plan_type] || 100;
            await addCreditsToUser(subscription.user_id, planCredits, subscription.plan_type);
          }
        } else if (payload.payment.externalReference && !checkoutData) {
          // Fluxo antigo: externalReference é apenas userId
          const userId = payload.payment.externalReference;
          
          const { data: userSub } = await (supabase as any)
            .from('subscriptions')
            .select('plan_type, credits_per_month')
            .eq('user_id', userId)
            .single();

          if (userSub) {
            const planCredits = userSub.credits_per_month || PLAN_CREDITS[userSub.plan_type] || 100;
            await addCreditsToUser(userId, planCredits, userSub.plan_type);
          }
        }
      }
    } else if (event === 'PAYMENT_OVERDUE') {
      // Pagamento vencido
      if (supabase && payload.payment) {
        try {
          await (supabase as any)
            .from('payments')
            .update({ status: 'overdue' })
            .eq('asaas_payment_id', payload.payment.id);
        } catch (e) {
          console.warn('[Webhook] payments update failed:', e);
        }

        // Opcional: suspender acesso se pagamento vencido
        if (payload.payment.subscription) {
          await (supabase as any)
            .from('subscriptions')
            .update({ status: 'pending' })
            .eq('asaas_subscription_id', payload.payment.subscription);
        }
      }
    } else if (event === 'SUBSCRIPTION_CREATED') {
      // Nova assinatura criada
      if (supabase && payload.subscription) {
        console.log('[Webhook] Subscription created:', payload.subscription.id);
      }
    } else if (event === 'SUBSCRIPTION_UPDATED') {
      // Atualizar assinatura
      if (supabase && payload.subscription) {
        const statusMap: Record<string, string> = {
          'ACTIVE': 'active',
          'INACTIVE': 'canceled',
          'EXPIRED': 'expired',
        };

        await (supabase as any)
          .from('subscriptions')
          .update({
            status: statusMap[payload.subscription?.status ?? ''] || 'pending',
            updated_at: new Date().toISOString(),
          })
          .eq('asaas_subscription_id', payload.subscription?.id ?? '');
      }
    } else if (event === 'SUBSCRIPTION_DELETED') {
      // Assinatura cancelada
      if (supabase && payload.subscription) {
        await (supabase as any)
          .from('subscriptions')
          .update({ 
            status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('asaas_subscription_id', payload.subscription.id);
      }
    } else if (event === 'PAYMENT_REFUNDED') {
      // Pagamento estornado - remover créditos
      if (supabase && payload.payment) {
        try {
          await (supabase as any)
            .from('payments')
            .update({ status: 'refunded' })
            .eq('asaas_payment_id', payload.payment.id);
        } catch (e) {
          console.warn('[Webhook] payments update failed:', e);
        }

        // Opcional: remover créditos ou marcar assinatura como cancelada
        if (payload.payment.subscription) {
          const { data: subscription } = await (supabase as any)
            .from('subscriptions')
            .select('user_id, plan_type')
            .eq('asaas_subscription_id', payload.payment.subscription)
            .single();

          if (subscription) {
            // Resetar créditos para o plano free
            await (supabase as any)
              .from('user_credits')
              .update({
                total_credits: PLAN_CREDITS.free,
                updated_at: new Date().toISOString(),
              })
              .eq('user_id', subscription.user_id);

            // Atualizar plano para free
            await (supabase as any)
              .from('subscriptions')
              .update({ 
                plan_type: 'free',
                status: 'active',
                updated_at: new Date().toISOString(),
              })
              .eq('user_id', subscription.user_id);
          }
        }
      }
    }

    // Marcar webhook como processado (opcional: se a tabela não existir, ignora)
    if (supabase && asaasId) {
      try {
        await (supabase as any)
          .from('asaas_webhooks')
          .update({ processed: true, processed_at: new Date().toISOString() })
          .eq('event_type', event)
          .eq('asaas_id', asaasId)
          .eq('processed', false);
      } catch (e) {
        console.warn('[Webhook] asaas_webhooks update failed:', e);
      }
    }

    return json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return json(
      { error: error instanceof Error ? error.message : 'Erro ao processar webhook' },
      { status: 500 }
    );
  }
};

/**
 * Adiciona créditos ao usuário
 */
async function addCreditsToUser(userId: string, credits: number, planType: string) {
  if (!supabase) return;

  console.log(`[Webhook] Adding ${credits} credits to user ${userId} (plan: ${planType})`);

  // Verificar se já existe registro de créditos
  const { data: existingCredits } = await (supabase as any)
    .from('user_credits')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (existingCredits) {
    // Atualizar créditos existentes
    // Se o plano permite acúmulo, soma. Senão, substitui
    const rollover = planType !== 'free';
    const newTotal = rollover
      ? existingCredits.total_credits + credits
      : credits;

    await (supabase as any)
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
    // Criar novo registro de créditos
    await (supabase as any)
      .from('user_credits')
      .insert({
        user_id: userId,
        total_credits: credits,
        used_credits: 0,
        bonus_credits: 0,
        daily_credits_used: 0,
        last_reset_at: new Date().toISOString(),
      });
  }
}
