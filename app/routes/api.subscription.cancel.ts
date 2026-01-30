import { json, type ActionFunctionArgs } from '@remix-run/cloudflare';
import { AsaasService } from '~/lib/services/asaasService';
import { getSessionFromRequest } from '~/lib/auth/session';
import { supabase } from '~/lib/auth/supabase-client';

export const action = async ({ request, context }: ActionFunctionArgs) => {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return json({ error: 'Não autenticado' }, { status: 401 });
    }

    if (!supabase) {
      return json({ error: 'Supabase não configurado' }, { status: 500 });
    }

    // Buscar assinatura atual do usuário
    const { data: subscription, error: fetchError } = await (supabase as any)
      .from('subscriptions')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (fetchError || !subscription) {
      return json({ error: 'Assinatura não encontrada' }, { status: 404 });
    }

    const sub = subscription as { plan_type: string; asaas_subscription_id: string | null };
    if (sub.plan_type === 'free') {
      return json({ error: 'Não é possível cancelar o plano gratuito' }, { status: 400 });
    }

    // Cancelar no Asaas se tiver subscription ID
    if (sub.asaas_subscription_id) {
      try {
        const asaasService = new AsaasService(context);
        await asaasService.cancelSubscription(sub.asaas_subscription_id);
      } catch (asaasError) {
        console.error('Error canceling in Asaas:', asaasError);
        // Continua mesmo se falhar no Asaas (pode já estar cancelado)
      }
    }

    // Atualizar no banco de dados
    const { error: updateError } = await (supabase as any)
      .from('subscriptions')
      .update({
        status: 'canceled',
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', session.user.id);

    if (updateError) {
      console.error('Error updating subscription:', updateError);
      return json({ error: 'Erro ao cancelar assinatura' }, { status: 500 });
    }

    return json({ 
      success: true, 
      message: 'Assinatura cancelada. Você manterá acesso até o fim do período atual.' 
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return json(
      { error: error instanceof Error ? error.message : 'Erro ao cancelar assinatura' },
      { status: 500 }
    );
  }
};
