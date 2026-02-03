import { json, type LoaderFunctionArgs, type MetaFunction } from '@remix-run/cloudflare';
import { useLoaderData, useRevalidator, useSearchParams } from '@remix-run/react';
import { useState, useEffect } from 'react';
import { Header } from '~/components/header/Header';
import BackgroundRays from '~/components/ui/BackgroundRays';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/Card';
import { Button } from '~/components/ui/Button';
import { Badge } from '~/components/ui/Badge';
import { Switch } from '~/components/ui/Switch';
import { Progress } from '~/components/ui/Progress';
import { classNames } from '~/utils/classNames';
import { getSessionFromRequest } from '~/lib/auth/session';
import { getSupabaseClient } from '~/lib/auth/supabase-client';
import { loadSubscription } from '~/lib/stores/subscription';
import { AsaasService } from '~/lib/services/asaasService';
import { processCheckoutPaid } from '~/lib/asaas/processCheckoutPaid';


export const meta: MetaFunction = () => {
  return [
    { title: 'Planos e Créditos - Programe Studio' },
    { name: 'description', content: 'Gerencie seu plano e créditos no Programe Studio.' },
  ];
};

// Tipos para os dados do Supabase
interface SubscriptionRow {
  id: string;
  user_id: string;
  asaas_customer_id: string | null;
  asaas_subscription_id: string | null;
  plan_type: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

interface UserCreditsRow {
  id: string;
  user_id: string;
  total_credits: number;
  used_credits: number;
  bonus_credits: number;
  daily_credits_used: number;
  last_reset_at: string | null;
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
  try {
    // Obter variáveis de ambiente do Cloudflare
    const env = context?.cloudflare?.env as unknown as Record<string, string> | undefined;
    
    const session = await getSessionFromRequest(request, env);
    if (!session) {
      return json({ redirect: '/login' }, { status: 401 });
    }

    const url = new URL(request.url);
    const checkoutSuccess = url.searchParams.get('checkout') === 'success';
    const supabase = getSupabaseClient(env);
    if (checkoutSuccess && supabase) {
      try {
        const { data: pendingCheckout } = await (supabase as any)
          .from('asaas_checkouts')
          .select('checkout_id')
          .eq('user_id', session.user.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        const checkoutId = (pendingCheckout as { checkout_id?: string } | null)?.checkout_id;
        if (checkoutId) {
          const asaas = new AsaasService(context);
          const checkout = await asaas.getCheckout(checkoutId);
          const paidStatuses = ['CONFIRMED', 'PAID', 'RECEIVED'];
          if (checkout?.status && paidStatuses.includes(checkout.status.toUpperCase())) {
            const result = await processCheckoutPaid(supabase, {
              id: checkout.id,
              externalReference: checkout.externalReference,
              items: checkout.items,
              customer: checkout.customer,
            });
            if (result.success) {
              console.log('[Plans] Pagamento confirmado via retorno (checkout=success), assinatura/créditos atualizados.');
            }
          }
        }
      } catch (e) {
        console.warn('[Plans] Sync checkout on return:', e);
      }
    }

    let subscription: SubscriptionRow | null = null;
    let credits: UserCreditsRow | null = null;

    if (supabase) {
      // Buscar assinatura
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      subscription = subData as SubscriptionRow | null;

      // Buscar créditos
      const { data: creditsData } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      credits = creditsData as UserCreditsRow | null;
    }

    const planType = subscription?.plan_type || 'free';
    const planCredits = PLAN_CREDITS[planType] || 5;
    const dailyCreditsAllowed = DAILY_CREDITS[planType] || 0;

    // Pegar o nome do usuário de forma segura
    const userMetadata = (session.user as { user_metadata?: { name?: string } }).user_metadata;
    const userName = userMetadata?.name || session.user.email;

    return json({
      user: {
        id: session.user.id,
        email: session.user.email,
        name: userName,
      },
      subscription: {
        planType,
        status: subscription?.status || 'active',
        asaasCustomerId: subscription?.asaas_customer_id || null,
        currentPeriodEnd: subscription?.current_period_end || null,
        cancelAtPeriodEnd: subscription?.cancel_at_period_end || false,
      },
      credits: {
        total: credits?.total_credits || planCredits,
        used: credits?.used_credits || 0,
        bonus: credits?.bonus_credits || 0,
        dailyUsed: credits?.daily_credits_used || 0,
        dailyAllowed: dailyCreditsAllowed,
        planCredits,
        creditsRollover: planType !== 'free',
      },
    });
  } catch (error) {
    console.error('Error loading plans page:', error);
    return json({
      user: null,
      subscription: { planType: 'free', status: 'active', asaasCustomerId: null, currentPeriodEnd: null, cancelAtPeriodEnd: false },
      credits: { total: 5, used: 0, bonus: 0, dailyUsed: 0, dailyAllowed: 0, planCredits: 5, creditsRollover: false },
    });
  }
};

interface PlanFeature {
  text: string;
  included: boolean;
  isNew?: boolean;
  tooltip?: string;
}

// Opções de créditos com preços
interface CreditOption {
  credits: number;
  monthlyPrice: number;
  yearlyPrice: number;
}

const CREDIT_OPTIONS: Record<string, CreditOption[]> = {
  pro: [
    { credits: 100, monthlyPrice: 59, yearlyPrice: 49 },
    { credits: 200, monthlyPrice: 99, yearlyPrice: 82 },
    { credits: 500, monthlyPrice: 199, yearlyPrice: 165 },
    { credits: 1000, monthlyPrice: 349, yearlyPrice: 290 },
  ],
  business: [
    { credits: 100, monthlyPrice: 119, yearlyPrice: 99 },
    { credits: 200, monthlyPrice: 199, yearlyPrice: 165 },
    { credits: 500, monthlyPrice: 399, yearlyPrice: 332 },
    { credits: 1000, monthlyPrice: 699, yearlyPrice: 581 },
  ],
};

interface Plan {
  id: string;
  name: string;
  description: string;
  baseMonthlyPrice: number | null;
  baseYearlyPrice: number | null;
  baseCredits: number;
  features: PlanFeature[];
  isPopular?: boolean;
  isEnterprise?: boolean;
  buttonText: string;
}

const plans: Plan[] = [
  {
    id: 'pro',
    name: 'Pro',
    description: 'Ideal para times ágeis construindo projetos em tempo real.',
    baseMonthlyPrice: 59,
    baseYearlyPrice: 49,
    baseCredits: 100,
    buttonText: 'Fazer Upgrade',
    isPopular: true,
    features: [
      { text: 'Créditos mensais configuráveis', included: true, tooltip: 'Escolha a quantidade de créditos' },
      { text: '5 créditos diários bônus', included: true },
      { text: 'Cloud + IA baseado em uso', included: true, tooltip: 'Uso adicional cobrado separadamente' },
      { text: 'Acúmulo de créditos', included: true, tooltip: 'Créditos não usados acumulam' },
      { text: 'Recarga de créditos sob demanda', included: true },
      { text: 'Domínios ilimitados programe.app', included: true },
      { text: 'Domínios personalizados', included: true },
      { text: 'Remover marca Programe', included: true },
      { text: 'Funções e permissões de usuário', included: true },
    ],
  },
  {
    id: 'business',
    name: 'Business',
    description: 'Controles avançados e recursos poderosos para departamentos em crescimento.',
    baseMonthlyPrice: 119,
    baseYearlyPrice: 99,
    baseCredits: 100,
    buttonText: 'Fazer Upgrade',
    features: [
      { text: 'Créditos mensais configuráveis', included: true, tooltip: 'Escolha a quantidade de créditos' },
      { text: 'Publicação interna', included: true, isNew: true },
      { text: 'SSO (Single Sign-On)', included: true },
      { text: 'Projetos pessoais', included: true },
      { text: 'Não participar do treinamento de dados', included: true },
      { text: 'Templates de design', included: true },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Para grandes organizações que precisam de flexibilidade, escala e governança.',
    baseMonthlyPrice: null,
    baseYearlyPrice: null,
    baseCredits: 0,
    buttonText: 'Agendar Demo',
    isEnterprise: true,
    features: [
      { text: 'Suporte dedicado', included: true },
      { text: 'Serviços de onboarding', included: true },
      { text: 'Conexões personalizadas', included: true },
      { text: 'Controle de acesso por grupo', included: true },
      { text: 'SCIM', included: true },
      { text: 'Sistemas de design personalizados', included: true },
    ],
  },
];

function FeatureItem({ feature }: { feature: PlanFeature }) {
  return (
    <li className="flex items-start gap-2 text-sm">
      <span
        className={classNames(
          'i-ph:check text-lg flex-shrink-0 mt-0.5',
          feature.included ? 'text-accent-500' : 'text-bolt-elements-textTertiary',
        )}
      />
      <span className="text-bolt-elements-textSecondary flex items-center gap-2">
        {feature.text}
        {feature.tooltip && (
          <span className="i-ph:info text-bolt-elements-textTertiary cursor-help" title={feature.tooltip} />
        )}
        {feature.isNew && (
          <Badge variant="primary" size="sm">
            Novo
          </Badge>
        )}
      </span>
    </li>
  );
}

function PlanCard({
  plan,
  isAnnual,
  isCurrentPlan,
  onUpgrade,
  isCanceled,
  selectedCredits,
  onCreditsChange,
  isCreatingCheckout,
}: {
  plan: Plan;
  isAnnual: boolean;
  isCurrentPlan: boolean;
  onUpgrade: () => void;
  isCanceled: boolean;
  selectedCredits: number;
  onCreditsChange: (credits: number) => void;
  isCreatingCheckout?: boolean;
}) {
  const creditOptions = CREDIT_OPTIONS[plan.id] || [];
  const selectedOption = creditOptions.find(opt => opt.credits === selectedCredits) || creditOptions[0];
  const price = selectedOption ? (isAnnual ? selectedOption.yearlyPrice : selectedOption.monthlyPrice) : (isAnnual ? plan.baseYearlyPrice : plan.baseMonthlyPrice);

  return (
    <Card
      className={classNames(
        'flex flex-col h-full transition-all duration-300 relative',
        plan.isPopular && 'border-accent-500/50 shadow-lg shadow-accent-500/10',
        isCurrentPlan && 'ring-2 ring-accent-500',
        'hover:border-bolt-elements-borderColorActive hover:shadow-xl',
      )}
    >
      {isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant="primary" size="md" className="shadow-lg">
            Seu Plano Atual
          </Badge>
        </div>
      )}

      <CardHeader className="pb-4 pt-6">
        <CardTitle className="text-xl">{plan.name}</CardTitle>
        <CardDescription className="min-h-[40px]">{plan.description}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 space-y-6">
        {/* Seletor de créditos (apenas para planos pagos não-enterprise) - MOVIDO PARA CIMA */}
        {!plan.isEnterprise && creditOptions.length > 0 && (
          <div className="space-y-2">
            <label className="text-xs text-bolt-elements-textSecondary font-medium">
              Quantidade de créditos mensais
            </label>
            <select
              value={selectedCredits}
              onChange={(e) => onCreditsChange(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-md bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor text-bolt-elements-textPrimary text-sm focus:outline-none focus:border-accent-500 cursor-pointer"
            >
              {creditOptions.map((option) => (
                <option key={option.credits} value={option.credits}>
                  {option.credits} créditos / mês - R${isAnnual ? option.yearlyPrice : option.monthlyPrice}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Preço */}
        <div className="space-y-1">
          {plan.isEnterprise ? (
            <div className="text-3xl font-bold text-bolt-elements-textPrimary">Personalizado</div>
          ) : (
            <>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-bolt-elements-textPrimary">R${price}</span>
                <span className="text-bolt-elements-textSecondary text-sm">por mês</span>
              </div>
              <p className="text-xs text-bolt-elements-textTertiary">
                {selectedCredits} créditos • compartilhado entre usuários ilimitados
              </p>
            </>
          )}
        </div>

        {/* Toggle Anual (apenas para planos pagos) */}
        {!plan.isEnterprise && (
          <div className="flex items-center gap-2">
            <Switch checked={isAnnual} />
            <span className="text-sm text-bolt-elements-textSecondary">Anual</span>
            {isAnnual && (
              <Badge variant="success" size="sm">
                Economize 17%
              </Badge>
            )}
          </div>
        )}

        {/* Botão de ação */}
        <Button
          type="button"
          onClick={onUpgrade}
          className={classNames(
            'w-full',
            plan.isPopular && !isCurrentPlan
              ? 'bg-accent-500 hover:bg-accent-600 text-white'
              : 'bg-bolt-elements-background-depth-3 hover:bg-bolt-elements-background-depth-4 text-bolt-elements-textPrimary',
          )}
          disabled={(isCurrentPlan && !isCanceled) || isCreatingCheckout}
        >
          {isCreatingCheckout
            ? 'Criando checkout...'
            : isCurrentPlan && !isCanceled
              ? 'Plano Atual'
              : isCurrentPlan && isCanceled
                ? 'Reativar'
                : plan.buttonText}
        </Button>

        {/* Descrição dos recursos */}
        <div className="pt-2 border-t border-bolt-elements-borderColor">
          <p className="text-xs text-bolt-elements-textTertiary mb-3">
            {plan.isEnterprise
              ? 'Todos os recursos do Business, mais:'
              : plan.id === 'business'
                ? 'Todos os recursos do Pro, mais:'
                : 'Todos os recursos do Free, mais:'}
          </p>
          <ul className="space-y-2.5">
            {plan.features.map((feature, index) => (
              <FeatureItem key={index} feature={feature} />
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

interface LoaderData {
  user: { id: string; email: string; name: string } | null;
  subscription: {
    planType: string;
    status: string;
    asaasCustomerId: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  };
  credits: {
    total: number;
    used: number;
    bonus: number;
    dailyUsed: number;
    dailyAllowed: number;
    planCredits: number;
    creditsRollover: boolean;
  };
}

function CreditsOverview({ subscription, credits }: { subscription: LoaderData['subscription']; credits: LoaderData['credits'] }) {
  const remaining = credits.total - credits.used + credits.bonus + (credits.dailyAllowed - credits.dailyUsed);
  const total = credits.planCredits + credits.bonus + credits.dailyAllowed;
  const percentUsed = total > 0 ? ((total - remaining) / total) * 100 : 0;
  const isOutOfCredits = remaining <= 0;

  const planDisplayName = subscription.planType.charAt(0).toUpperCase() + subscription.planType.slice(1);

  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6">
          {/* Info do plano atual */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center flex-shrink-0">
              <span className="i-ph:sparkle-fill text-2xl text-white" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-bolt-elements-textPrimary">
                  Você está no Plano {planDisplayName}
                </h2>
                {subscription.planType === 'free' && (
                  <Badge variant="subtle">Upgrade disponível</Badge>
                )}
                {subscription.cancelAtPeriodEnd && (
                  <Badge variant="warning">Cancela em breve</Badge>
                )}
              </div>
              <p className="text-sm text-bolt-elements-textSecondary">
                {subscription.planType === 'free'
                  ? 'Faça upgrade a qualquer momento para desbloquear mais recursos'
                  : subscription.currentPeriodEnd
                    ? `Próxima renovação: ${new Date(subscription.currentPeriodEnd).toLocaleDateString('pt-BR')}`
                    : 'Plano ativo'}
              </p>
              {subscription.planType !== 'free' && (
                <Button variant="outline" size="sm" className="mt-2">
                  Gerenciar Assinatura
                </Button>
              )}
            </div>
          </div>

          {/* Créditos restantes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-bolt-elements-textPrimary">Créditos restantes</h3>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-bolt-elements-textPrimary">
                  {Math.max(0, remaining)}
                </span>
                <span className="text-sm text-bolt-elements-textTertiary">de {total}</span>
              </div>
            </div>

            <Progress
              value={Math.max(0, 100 - percentUsed)}
              className={classNames(
                'h-2.5',
                isOutOfCredits && '[&>div]:bg-red-500',
                !isOutOfCredits && '[&>div]:bg-accent-500',
              )}
            />

            <div className="flex flex-wrap gap-4 text-xs text-bolt-elements-textTertiary">
              <div className="flex items-center gap-1.5">
                {credits.creditsRollover ? (
                  <span className="i-ph:check-circle text-accent-500" />
                ) : (
                  <span className="i-ph:x-circle text-bolt-elements-textTertiary" />
                )}
                <span>{credits.creditsRollover ? 'Créditos acumulam' : 'Créditos não acumulam'}</span>
              </div>
              {credits.dailyAllowed > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="i-ph:check-circle text-accent-500" />
                  <span>+{credits.dailyAllowed} créditos diários (renovam à meia-noite UTC)</span>
                </div>
              )}
              {isOutOfCredits && (
                <div className="flex items-center gap-1.5 text-red-400">
                  <span className="i-ph:warning-circle" />
                  <span>Você está sem créditos</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PlansPage() {
  const { subscription, credits } = useLoaderData<LoaderData>();
  const revalidator = useRevalidator();
  const [searchParams, setSearchParams] = useSearchParams();

  const [isAnnual, setIsAnnual] = useState(false);
  const [selectedCredits, setSelectedCredits] = useState<Record<string, number>>({
    pro: 100,
    business: 100,
  });
  const [isCanceling, setIsCanceling] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);
  const [simulateMessage, setSimulateMessage] = useState<string | null>(null);

  // Processar retorno do checkout
  useEffect(() => {
    const checkoutStatus = searchParams.get('checkout');
    const plan = searchParams.get('plan');

    if (checkoutStatus === 'success') {
      setCheckoutMessage({
        type: 'success',
        message: `Pagamento realizado com sucesso! Seu plano ${plan || ''} foi ativado.`,
      });
      revalidator.revalidate();
      loadSubscription(); // Atualiza header/store (badge do plano)
      setSearchParams({});
    } else if (checkoutStatus === 'cancelled') {
      setCheckoutMessage({
        type: 'warning',
        message: 'Pagamento cancelado. Você pode tentar novamente quando quiser.',
      });
      setSearchParams({});
    } else if (checkoutStatus === 'expired') {
      setCheckoutMessage({
        type: 'error',
        message: 'O checkout expirou. Por favor, tente novamente.',
      });
      setSearchParams({});
    }
  }, [searchParams, revalidator, setSearchParams]);

  // Limpar mensagem após alguns segundos
  useEffect(() => {
    if (checkoutMessage) {
      const timer = setTimeout(() => setCheckoutMessage(null), 10000);
      return () => clearTimeout(timer);
    }
  }, [checkoutMessage]);

  const handleCreditsChange = (planId: string, credits: number) => {
    setSelectedCredits(prev => ({ ...prev, [planId]: credits }));
  };

  /* Checkout nativo - Redirecionamento */
  const handleUpgrade = async (plan: Plan) => {
    if (plan.isEnterprise) {
      window.location.href = 'mailto:contato@programe.studio?subject=Enterprise Plan';
      return;
    }

    setIsCreatingCheckout(true);
    setCheckoutMessage(null);

    try {
      const planCredits = selectedCredits[plan.id] || 100;
      const creditOptions = CREDIT_OPTIONS[plan.id] || [];
      const selectedOption = creditOptions.find(opt => opt.credits === planCredits) || creditOptions[0];
      const price = selectedOption
        ? (isAnnual ? selectedOption.yearlyPrice : selectedOption.monthlyPrice)
        : (isAnnual ? plan.baseYearlyPrice : plan.baseMonthlyPrice) ?? 59;

      const res = await fetch('/api/asaas/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          planType: plan.id,
          billingCycle: isAnnual ? 'YEARLY' : 'MONTHLY',
          creditsPerMonth: planCredits,
          price,
        }),
      });

      const data = await res.json() as { checkoutUrl?: string; error?: string };

      if (!res.ok || !data.checkoutUrl) {
        throw new Error(data.error || 'Erro ao criar checkout');
      }

      // Redirecionar para o Asaas
      window.location.href = data.checkoutUrl;

    } catch (error) {
      console.error('Error creating checkout:', error);
      setCheckoutMessage({
        type: 'error',
        message: error instanceof Error ? error.message : 'Erro ao iniciar pagamento. Tente novamente.',
      });
      setIsCreatingCheckout(false);
    }
  };

  /** Apenas em dev: simula o webhook CHECKOUT_PAID quando o ASAAS não consegue enviar (ex: localhost) */
  const handleSimulateCheckoutPaid = async () => {
    setIsSimulating(true);
    setSimulateMessage(null);
    try {
      const planCredits = selectedCredits.pro || 100;
      const creditOptions = CREDIT_OPTIONS.pro || [];
      const selectedOption = creditOptions.find(opt => opt.credits === planCredits) || creditOptions[0];
      const price = selectedOption ? (isAnnual ? selectedOption.yearlyPrice : selectedOption.monthlyPrice) : 59;
      const res = await fetch('/api/asaas/simulate-checkout-paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planType: 'pro',
          creditsPerMonth: planCredits,
          billingCycle: isAnnual ? 'YEARLY' : 'MONTHLY',
          price,
        }),
      });
      const data = await res.json() as { success?: boolean; error?: string; message?: string };
      if (res.ok && data.success) {
        setSimulateMessage(data.message ?? 'Assinatura e créditos atualizados no Supabase.');
        revalidator.revalidate();
      } else {
        setSimulateMessage(data.error ?? 'Erro ao simular');
      }
    } catch (e) {
      setSimulateMessage(e instanceof Error ? e.message : 'Erro ao simular');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Tem certeza que deseja cancelar sua assinatura? Você manterá acesso até o fim do período atual.')) {
      return;
    }

    setIsCanceling(true);
    try {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
      });

      const data = await response.json() as { error?: string; message?: string };

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao cancelar');
      }

      alert(data.message || 'Assinatura cancelada com sucesso');
      revalidator.revalidate();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro ao cancelar assinatura');
    } finally {
      setIsCanceling(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-bolt-elements-background-depth-1">
      <BackgroundRays />
      <Header />

      {/* Checkout nativo - Redirecionamento */}

      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Mensagem de retorno do checkout */}
          {checkoutMessage && (
            <div
              className={classNames(
                'mb-6 p-4 rounded-lg flex items-center gap-3',
                checkoutMessage.type === 'success' && 'bg-green-500/10 border border-green-500/30 text-green-400',
                checkoutMessage.type === 'error' && 'bg-red-500/10 border border-red-500/30 text-red-400',
                checkoutMessage.type === 'warning' && 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400',
              )}
            >
              <span
                className={classNames(
                  'text-xl',
                  checkoutMessage.type === 'success' && 'i-ph:check-circle-fill',
                  checkoutMessage.type === 'error' && 'i-ph:x-circle-fill',
                  checkoutMessage.type === 'warning' && 'i-ph:warning-circle-fill',
                )}
              />
              <span className="flex-1">{checkoutMessage.message}</span>
              <button
                onClick={() => setCheckoutMessage(null)}
                className="text-current hover:opacity-70"
              >
                <span className="i-ph:x text-lg" />
              </button>
            </div>
          )}

          {/* Header da página */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-bolt-elements-textPrimary mb-2">Planos e Preços</h1>
            <p className="text-bolt-elements-textSecondary max-w-2xl mx-auto">
              Escolha o plano ideal para suas necessidades. Todos os planos incluem acesso ao Programe Studio.
            </p>
          </div>

          {/* Overview de créditos do usuário */}
          <CreditsOverview subscription={subscription} credits={credits} />

          {/* Toggle mensal/anual global */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span
              className={classNames(
                'text-sm font-medium',
                !isAnnual ? 'text-bolt-elements-textPrimary' : 'text-bolt-elements-textTertiary',
              )}
            >
              Mensal
            </span>
            <Switch checked={isAnnual} onCheckedChange={setIsAnnual} />
            <span
              className={classNames(
                'text-sm font-medium',
                isAnnual ? 'text-bolt-elements-textPrimary' : 'text-bolt-elements-textTertiary',
              )}
            >
              Anual
            </span>
            {isAnnual && (
              <Badge variant="success" size="md">
                Economize até 17%
              </Badge>
            )}
          </div>

          {/* Cards de planos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isAnnual={isAnnual}
                isCurrentPlan={subscription.planType === plan.id}
                isCanceled={subscription.cancelAtPeriodEnd}
                onUpgrade={() => handleUpgrade(plan)}
                selectedCredits={selectedCredits[plan.id] || 100}
                onCreditsChange={(credits) => handleCreditsChange(plan.id, credits)}
                isCreatingCheckout={isCreatingCheckout}
              />
            ))}
          </div>

          {/* Cancelar assinatura */}
          {subscription.planType !== 'free' && !subscription.cancelAtPeriodEnd && (
            <div className="text-center mb-8">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelSubscription}
                disabled={isCanceling}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                {isCanceling ? 'Cancelando...' : 'Cancelar Assinatura'}
              </Button>
            </div>
          )}

          {/* Dev: simular pagamento quando webhook não chega (localhost) */}
          {typeof import.meta !== 'undefined' && import.meta.env?.DEV && (
            <Card className="mb-6 border-amber-500/50 bg-amber-500/5">
              <CardContent className="p-4">
                <p className="text-sm text-bolt-elements-textSecondary mb-2">
                  <strong className="text-amber-500">Desenvolvimento:</strong> Como o ASAAS não envia webhook para localhost,
                  use o botão abaixo após &quot;pagar&quot; no checkout para gravar assinatura e créditos no Supabase.
                </p>
                <div className="flex items-center gap-3 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSimulateCheckoutPaid}
                    disabled={isSimulating}
                    className="border-amber-500/50 text-amber-600 hover:bg-amber-500/10"
                  >
                    {isSimulating ? 'Simulando...' : 'Simular pagamento concluído (Pro)'}
                  </Button>
                  {simulateMessage && (
                    <span className={classNames(
                      'text-sm',
                      simulateMessage.startsWith('Assinatura') ? 'text-green-500' : 'text-red-400'
                    )}>
                      {simulateMessage}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* FAQ ou informações adicionais */}
          <Card className="bg-bolt-elements-background-depth-2/50 pt-6">
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-bolt-elements-textPrimary mb-2">
                  Precisa de ajuda para escolher?
                </h3>
                <p className="text-sm text-bolt-elements-textSecondary mb-4">
                  Nossa equipe está disponível para ajudá-lo a encontrar o plano perfeito para suas necessidades.
                </p>
                <div className="flex items-center justify-center gap-4">
                  <Button variant="outline" size="sm">
                    <span className="i-ph:chat-circle mr-2" />
                    Falar com Vendas
                  </Button>
                  <Button variant="ghost" size="sm">
                    <span className="i-ph:question mr-2" />
                    Ver FAQ
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
