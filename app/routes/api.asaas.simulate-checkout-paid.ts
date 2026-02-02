/**
 * Rota APENAS para desenvolvimento: simula o webhook CHECKOUT_PAID
 * quando você paga no checkout mas o ASAAS não consegue enviar o webhook (ex: localhost).
 *
 * Uso: após "pagar" no checkout do ASAAS, chame esta rota para gravar assinatura/créditos no Supabase.
 * Em produção (NODE_ENV !== 'development') esta rota retorna 404.
 */
import { json, type ActionFunctionArgs } from '@remix-run/cloudflare';
import { getSessionFromRequest } from '~/lib/auth/session';
import { supabase } from '~/lib/auth/supabase-client';
import { processCheckoutPaid } from '~/lib/asaas/processCheckoutPaid';

interface SimulateBody {
  planType: string;
  creditsPerMonth?: number;
  billingCycle?: string;
  price?: number;
  checkoutId?: string;
}

export const action = async ({ request, context }: ActionFunctionArgs) => {
  if (process.env.NODE_ENV !== 'development') {
    return json({ error: 'Disponível apenas em desenvolvimento' }, { status: 404 });
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  const env = (context?.cloudflare?.env as unknown as Record<string, string> | undefined) ?? undefined;
  const session = await getSessionFromRequest(request, env ?? undefined);
  if (!session) {
    return json({ error: 'Não autenticado' }, { status: 401 });
  }

  if (!supabase) {
    return json({ error: 'Supabase não configurado' }, { status: 500 });
  }

  let body: SimulateBody;
  try {
    body = (await request.json()) as SimulateBody;
  } catch {
    return json({ error: 'Body JSON inválido' }, { status: 400 });
  }

  const { planType, creditsPerMonth, billingCycle, price, checkoutId } = body;
  if (!planType) {
    return json({ error: 'planType é obrigatório' }, { status: 400 });
  }

  const userId = session.user.id;
  const externalReference = JSON.stringify({
    userId,
    planType,
    creditsPerMonth: creditsPerMonth ?? 100,
    billingCycle: billingCycle ?? 'MONTHLY',
    price: price ?? 0,
  });

  const checkout = {
    id: checkoutId || `sim-${Date.now()}`,
    externalReference,
    items: [{ value: price ?? 0, quantity: 1 }],
    customer: undefined as string | undefined,
  };

  const result = await processCheckoutPaid(supabase, checkout);

  if (!result.success) {
    return json({ error: result.error ?? 'Erro ao processar' }, { status: 500 });
  }

  return json({
    success: true,
    message: 'Pagamento simulado. Assinatura e créditos atualizados no Supabase.',
    userId,
    planType,
    creditsPerMonth: creditsPerMonth ?? 100,
  });
};
