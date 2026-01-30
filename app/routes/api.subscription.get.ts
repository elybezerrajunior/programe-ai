import { json, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { getSessionFromRequest } from '~/lib/auth/session';
import { supabase } from '~/lib/auth/supabase-client';

export interface SubscriptionData {
  id: string | null;
  userId: string;
  asaasCustomerId: string | null;
  asaasSubscriptionId: string | null;
  planType: 'free' | 'pro' | 'business' | 'enterprise';
  status: 'active' | 'canceled' | 'expired' | 'pending';
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return json({ error: 'Não autenticado' }, { status: 401 });
    }

    if (!supabase) {
      return json({ error: 'Supabase não configurado' }, { status: 500 });
    }

    // Buscar assinatura do usuário
    const { data: subscription, error } = await (supabase as any)
      .from('subscriptions')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned (usuário sem assinatura ainda)
      console.error('Error fetching subscription:', error);
      return json({ error: 'Erro ao buscar assinatura' }, { status: 500 });
    }

    // Se não tem assinatura, retorna plano free
    if (!subscription) {
      return json({
        subscription: {
          id: null,
          userId: session.user.id,
          asaasCustomerId: null,
          asaasSubscriptionId: null,
          planType: 'free',
          status: 'active',
          currentPeriodStart: null,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
          createdAt: new Date().toISOString(),
        } as SubscriptionData,
      });
    }

    const sub = subscription as { id: string; user_id: string; asaas_customer_id: string | null; asaas_subscription_id: string | null; plan_type: string; status: string; current_period_start: string | null; current_period_end: string | null; cancel_at_period_end: boolean; created_at: string };
    return json({
      subscription: {
        id: sub.id,
        userId: sub.user_id,
        asaasCustomerId: sub.asaas_customer_id,
        asaasSubscriptionId: sub.asaas_subscription_id,
        planType: sub.plan_type,
        status: sub.status,
        currentPeriodStart: sub.current_period_start,
        currentPeriodEnd: sub.current_period_end,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        createdAt: sub.created_at,
      } as SubscriptionData,
    });
  } catch (error) {
    console.error('Error in subscription loader:', error);
    return json(
      { error: error instanceof Error ? error.message : 'Erro ao buscar assinatura' },
      { status: 500 }
    );
  }
};
