/**
 * Notificações de assinatura
 * Gerencia o envio de notificações após confirmação de pagamento
 */

// Tipos de notificação de assinatura
export type SubscriptionNotificationType = 'welcome' | 'welcome_back';

interface SubscriptionNotificationData {
  userId: string;
  planType: string;
  // Identificador único para idempotência (payment_id, checkout_id, etc)
  idempotencyKey: string;
}

/**
 * Envia notificação de boas-vindas ou bem-vindo de volta
 * - Nova assinatura: "Bem-vindo ao plano X!"
 * - Reativação: "Bem-vindo de volta ao plano X!"
 * 
 * Usa idempotência para evitar duplicatas
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function sendSubscriptionNotification(
  supabase: any,
  data: SubscriptionNotificationData
): Promise<{ success: boolean; type?: SubscriptionNotificationType; error?: string }> {
  const { userId, planType, idempotencyKey } = data;

  if (!supabase || !userId) {
    return { success: false, error: 'Supabase ou userId não fornecido' };
  }

  try {
    // 1. Verificar idempotência - se já enviamos notificação para este evento
    const { data: existingNotification } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', userId)
      .like('link', `%idempotency=${idempotencyKey}%`)
      .maybeSingle();

    if (existingNotification) {
      console.log('[SubscriptionNotification] Notificação já enviada para:', idempotencyKey);
      return { success: true, error: 'Notificação já enviada (idempotência)' };
    }

    // 2. Verificar histórico de assinaturas do usuário
    const { data: subscriptionHistory } = await supabase
      .from('asaas_webhooks')
      .select('id, event_type, created_at')
      .or(`payload->checkout->externalReference.cs.%"userId":"${userId}"%, payload->payment->externalReference.cs.%"userId":"${userId}"%`)
      .in('event_type', ['CHECKOUT_PAID', 'PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED'])
      .order('created_at', { ascending: true });

    // Alternativa: verificar pela tabela de assinaturas se teve cancelamento/reativação anterior
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('created_at, updated_at, status')
      .eq('user_id', userId)
      .maybeSingle();

    // Determinar se é nova assinatura ou reativação
    // É reativação se: há mais de 1 pagamento confirmado OU se a assinatura existia antes
    const paymentCount = subscriptionHistory?.length || 0;
    const isReactivation = paymentCount > 1 || 
      (subscription?.created_at && subscription?.updated_at && 
       new Date(subscription.updated_at).getTime() - new Date(subscription.created_at).getTime() > 86400000); // > 1 dia

    const notificationType: SubscriptionNotificationType = isReactivation ? 'welcome_back' : 'welcome';
    
    // 3. Preparar dados da notificação
    const planNames: Record<string, string> = {
      free: 'Gratuito',
      pro: 'Pro',
      business: 'Business',
      enterprise: 'Enterprise',
    };

    const planName = planNames[planType] || planType;
    
    const notificationData = isReactivation
      ? {
          title: `Bem-vindo de volta! 🎉`,
          message: `Sua assinatura do plano ${planName} foi reativada com sucesso. Todos os seus benefícios estão disponíveis novamente.`,
          type: 'success' as const,
        }
      : {
          title: `Bem-vindo ao Programe Studio! 🚀`,
          message: `Sua assinatura do plano ${planName} foi ativada com sucesso. Aproveite todos os recursos exclusivos!`,
          type: 'success' as const,
        };

    // 4. Inserir notificação com link contendo chave de idempotência
    const { error: insertError } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        read: false,
        link: `/settings?tab=subscription&idempotency=${idempotencyKey}`,
      });

    if (insertError) {
      console.error('[SubscriptionNotification] Erro ao inserir:', insertError);
      return { success: false, error: insertError.message };
    }

    console.log(`[SubscriptionNotification] Notificação enviada: ${notificationType} para user ${userId}`);
    return { success: true, type: notificationType };

  } catch (error) {
    console.error('[SubscriptionNotification] Erro inesperado:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
}

/**
 * Verifica se o usuário já teve assinatura paga anteriormente
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function hasSubscriptionHistory(supabase: any, userId: string): Promise<boolean> {
  if (!supabase || !userId) return false;

  try {
    // Verificar se há pagamentos anteriores confirmados
    const { data, count } = await supabase
      .from('asaas_webhooks')
      .select('id', { count: 'exact', head: true })
      .or(`payload->checkout->externalReference.cs.%"userId":"${userId}"%, payload->payment->externalReference.cs.%"userId":"${userId}"%`)
      .in('event_type', ['CHECKOUT_PAID', 'PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED']);

    return (count || 0) > 1;
  } catch (error) {
    console.error('[SubscriptionNotification] Erro ao verificar histórico:', error);
    return false;
  }
}
