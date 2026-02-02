import { json, redirect, type ActionFunctionArgs } from '@remix-run/cloudflare';
import { AsaasService } from '~/lib/services/asaasService';
import { getSessionFromRequest } from '~/lib/auth/session';
import { supabase } from '~/lib/auth/supabase-client';

interface CreateCheckoutBody {
  planType: 'pro' | 'business';
  billingCycle: 'MONTHLY' | 'YEARLY';
  creditsPerMonth: number;
  price: number;
}

// Configuração dos planos
const PLAN_CONFIG = {
  pro: {
    name: 'Plano Pro',
    description: 'Acesso completo ao Programe Studio com créditos mensais',
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

  try {
    const session = await getSessionFromRequest(request);
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
    // Em Cloudflare (produção) as variáveis vêm de context.cloudflare.env
    // ASAAS não aceita localhost nas URLs de callback
    const env = (context?.cloudflare?.env as Record<string, string | undefined>) || process.env;
    let baseUrl = env.APP_URL || env.VITE_APP_URL;
    
    if (!baseUrl) {
      const url = new URL(request.url);
      baseUrl = `${url.protocol}//${url.host}`;
      
      // Se for localhost, usar URL de exemplo para sandbox (o webhook ainda funcionará)
      if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
        // Para sandbox do ASAAS, podemos usar qualquer URL válida
        // O redirecionamento não funcionará em dev, mas o checkout será criado
        baseUrl = 'https://programe.studio';
      }
    }

    // Criar referência externa para rastrear o checkout
    const externalReference = JSON.stringify({
      userId: session.user.id,
      planType,
      creditsPerMonth,
      billingCycle,
      price,
      timestamp: Date.now(),
    });

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
