import { json, redirect, type ActionFunctionArgs } from '@remix-run/cloudflare';
import { AsaasService } from '~/lib/services/asaasService';
import { getSessionFromRequest } from '~/lib/auth/session';
import { supabase } from '~/lib/auth/supabase-client';

interface CreateCheckoutBody {
  planType: 'starter' | 'builder' | 'pro' | 'business';
  billingCycle: 'MONTHLY' | 'YEARLY';
  creditsPerMonth: number;
  price: number;
}

// Configuração dos planos
const PLAN_CONFIG = {
  starter: {
    name: 'Plano Starter',
    description: 'Acesso completo ao Programe Studio com créditos mensais',
  },
  builder: {
    name: 'Plano Builder',
    description: 'Mais créditos e recursos para quem constrói',
  },
  pro: {
    name: 'Plano Pro',
    description: 'Volume e performance para profissionais',
  },
  business: {
    name: 'Plano Business',
    description: 'Recursos avançados e controles empresariais',
  },
};

export const action = async ({ request, context }: ActionFunctionArgs) => {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  const env = context?.cloudflare?.env as unknown as Record<string, string> | undefined;
  try {
    const session = await getSessionFromRequest(request, env);
    if (!session) {
      return json({ error: 'Não autenticado' }, { status: 401 });
    }

    const asaasService = new AsaasService(context);
    const body = await request.json() as CreateCheckoutBody;
    const { planType, billingCycle, creditsPerMonth, price } = body;

    if (!planType || !price || !creditsPerMonth) {
      return json({ error: 'Dados obrigatórios faltando' }, { status: 400 });
    }

    const planConfig = PLAN_CONFIG[planType];
    if (!planConfig) {
      return json({ error: 'Plano inválido' }, { status: 400 });
    }

    // Obter URL base do ambiente
    // ASAAS exige que successUrl seja HTTPS e do domínio registrado na conta
    // Em desenvolvimento com localhost, isso não funciona - usar URL de produção
    const processEnv = process.env;
    let baseUrl = processEnv.APP_URL || processEnv.VITE_APP_URL;

    // Se não tiver URL configurada, usar da requisição
    if (!baseUrl) {
      const url = new URL(request.url);
      baseUrl = `${url.protocol}//${url.host}`;
    }

    // ASAAS não aceita localhost ou HTTP nas URLs de callback
    // Sempre usar URL de produção HTTPS para callbacks do ASAAS
    if (baseUrl.includes('localhost') || baseUrl.startsWith('http://')) {
      // Para sandbox do ASAAS, usar a URL de produção
      baseUrl = 'https://programe-ia.pages.dev';
      console.log('[Checkout] Using production URL for ASAAS callbacks:', baseUrl);
    }

    // Criar referência externa para rastrear o checkout
    // Criar referência externa para rastrear o checkout
    // Usar formato simplificado user_id|plan_type para evitar limite de caracteres do ASAAS
    // Formato: userId|planType|creditsPerMonth|billingCycle|price|timestamp
    const externalReference = [
      session.user.id,
      planType,
      creditsPerMonth,
      billingCycle,
      price,
      Date.now()
    ].join('|');

    // Calcular próxima data de vencimento (amanhã)
    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + 1);
    const nextDueDateStr = nextDueDate.toISOString().split('T')[0];

    // Para assinaturas recorrentes, ASAAS só aceita CREDIT_CARD
    // PIX e Boleto só funcionam para pagamentos únicos (DETACHED)
    // Nome do item deve ter no máximo 30 caracteres
    const itemName = `Plano ${planType} ${creditsPerMonth}cr`.substring(0, 30);

    // Preparar dados do checkout (sem campos no nível raiz que não existem na API)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const checkoutData: any = {
      billingTypes: ['CREDIT_CARD'], // Recorrente só aceita cartão de crédito
      chargeTypes: ['RECURRENT'],
      items: [
        {
          name: itemName,
          description: `Assinatura ${billingCycle === 'YEARLY' ? 'anual' : 'mensal'} - ${creditsPerMonth} créditos/mês`,
          quantity: 1,
          value: price,
        },
      ],
      callback: {
        successUrl: `${baseUrl}/plans?checkout=success&plan=${planType}`,
        cancelUrl: `${baseUrl}/plans?checkout=cancelled`,
        expiredUrl: `${baseUrl}/plans?checkout=expired`,
        autoRedirect: true,
      },
      minutesToExpire: 60, // 1 hora para completar o checkout
      subscription: {
        cycle: billingCycle === 'YEARLY' ? 'YEARLY' : 'MONTHLY',
        nextDueDate: nextDueDateStr,
      },
      externalReference,
    };

    // Só adicionar customerData se tiver AMBOS email e name
    // Se customerData for enviado, o campo 'name' é obrigatório no ASAAS
    // Se não tiver os dados completos, o cliente preencherá no checkout
    const userEmail = session.user.email;
    const userName = (session.user as { user_metadata?: { name?: string } }).user_metadata?.name;

    if (userEmail && userName) {
      checkoutData.customerData = {
        email: userEmail,
        name: userName.substring(0, 100),
      };
    }
    // Se não tiver ambos, não enviamos customerData e o cliente preenche no checkout

    if (process.env.NODE_ENV === 'development') {
      console.log('[Checkout] Sending data to ASAAS:', JSON.stringify(checkoutData, null, 2));
    }

    const checkout = await asaasService.createCheckout(checkoutData);

    // Salvar checkout pendente no banco para rastreamento (opcional)
    if (supabase) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('asaas_checkouts')
          .insert({
            user_id: session.user.id,
            checkout_id: checkout.id,
            checkout_url: checkout.url,
            plan_type: planType,
            credits_per_month: creditsPerMonth,
            price,
            billing_cycle: billingCycle,
            status: 'pending',
            expires_at: checkout.expirationDate,
          });
      } catch (e) {
        console.warn('[Checkout] asaas_checkouts insert failed:', e);
      }
    }

    // Retornar URL do checkout para redirecionamento no cliente
    return json({
      checkoutId: checkout.id,
      checkoutUrl: checkout.url,
      expiresAt: checkout.expirationDate,
    });
  } catch (error) {
    console.error('Error creating checkout:', error);
    return json(
      { error: error instanceof Error ? error.message : 'Erro ao criar checkout' },
      { status: 500 }
    );
  }
};
