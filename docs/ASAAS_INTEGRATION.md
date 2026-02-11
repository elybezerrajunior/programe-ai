# Guia de Implementação de Pagamento com ASAAS

Este documento fornece um guia completo passo a passo para implementar pagamento usando os serviços do ASAAS no projeto.

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Configuração Inicial](#configuração-inicial)
3. [Estrutura de Banco de Dados](#estrutura-de-banco-de-dados)
4. [Implementação do Serviço ASAAS](#implementação-do-serviço-asaas)
5. [Rotas de API](#rotas-de-api)
6. [Componentes de UI](#componentes-de-ui)
7. [Webhooks](#webhooks)
8. [Testes](#testes)

---

## 🔧 Pré-requisitos

1. Conta no ASAAS (https://www.asaas.com/)
2. API Key do ASAAS (Sandbox e Produção)
3. Supabase configurado e funcionando
4. Variáveis de ambiente configuradas

---

## ⚙️ Configuração Inicial

### 1. Adicionar Variáveis de Ambiente

Adicione as seguintes variáveis no arquivo `.env.local`:

```env
# ASAAS Configuration
ASAAS_API_KEY=your_asaas_api_key_here
ASAAS_API_URL=https://api-sandbox.asaas.com/v3  # Para desenvolvimento
# ASAAS_API_URL=https://api.asaas.com/v3        # Para produção
ASAAS_WEBHOOK_TOKEN=your_webhook_token_here
```

### 2. Instalar Dependências (se necessário)

O projeto já tem `@supabase/supabase-js` instalado. Não são necessárias dependências adicionais para a integração básica com ASAAS.

---

## 🗄️ Estrutura de Banco de Dados

### Criar Tabelas no Supabase

Execute os seguintes SQLs no Supabase SQL Editor:

```sql
-- Tabela de assinaturas/planos
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asaas_customer_id TEXT,
  asaas_subscription_id TEXT,
  plan_type TEXT NOT NULL, -- 'free', 'basic', 'premium', 'enterprise'
  status TEXT NOT NULL, -- 'active', 'canceled', 'expired', 'pending'
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_asaas_customer_id ON subscriptions(asaas_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Tabela de pagamentos
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  asaas_payment_id TEXT UNIQUE,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'BRL',
  status TEXT NOT NULL, -- 'pending', 'confirmed', 'overdue', 'refunded', 'cancelled'
  payment_method TEXT, -- 'credit_card', 'pix', 'boleto', 'bank_transfer'
  due_date DATE,
  payment_date TIMESTAMP WITH TIME ZONE,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_asaas_payment_id ON payments(asaas_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Tabela de webhooks do ASAAS
CREATE TABLE IF NOT EXISTS asaas_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  asaas_id TEXT,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice
CREATE INDEX IF NOT EXISTS idx_asaas_webhooks_processed ON asaas_webhooks(processed);
CREATE INDEX IF NOT EXISTS idx_asaas_webhooks_event_type ON asaas_webhooks(event_type);

-- RLS (Row Level Security) Policies
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Políticas para subscriptions
CREATE POLICY "Users can view their own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions"
  ON subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- Políticas para payments
CREATE POLICY "Users can view their own payments"
  ON payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payments"
  ON payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

---

## 🔌 Implementação do Serviço ASAAS

### Passo 1: Criar o Serviço de Integração

Crie o arquivo `app/lib/services/asaasService.ts`:

```typescript
// app/lib/services/asaasService.ts
import type { ActionFunctionArgs } from '@remix-run/cloudflare';

interface AsaasConfig {
  apiKey: string;
  apiUrl: string;
}

interface AsaasCustomer {
  name: string;
  email: string;
  cpfCnpj?: string;
  phone?: string;
  postalCode?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  city?: string;
  state?: string;
}

interface AsaasPayment {
  customer: string; // ID do cliente no ASAAS
  billingType: 'CREDIT_CARD' | 'PIX' | 'BOLETO' | 'DEBIT_CARD';
  value: number;
  dueDate: string; // YYYY-MM-DD
  description?: string;
  externalReference?: string;
}

interface AsaasSubscription {
  customer: string;
  billingType: 'CREDIT_CARD' | 'PIX' | 'BOLETO';
  value: number;
  nextDueDate: string;
  cycle: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY';
  description?: string;
  externalReference?: string;
}

export class AsaasService {
  private config: AsaasConfig;

  constructor(context?: ActionFunctionArgs['context']) {
    const env = (context?.cloudflare?.env as any) || process.env;
    
    this.config = {
      apiKey: env.ASAAS_API_KEY || '',
      apiUrl: env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3',
    };

    if (!this.config.apiKey) {
      throw new Error('ASAAS_API_KEY não configurada');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.apiUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'access_token': this.config.apiKey,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
      throw new Error(`ASAAS API Error: ${error.message || response.statusText}`);
    }

    return response.json();
  }

  // Criar cliente no ASAAS
  async createCustomer(customer: AsaasCustomer) {
    return this.request<{ id: string }>('/customers', {
      method: 'POST',
      body: JSON.stringify(customer),
    });
  }

  // Buscar cliente no ASAAS
  async getCustomer(customerId: string) {
    return this.request<AsaasCustomer & { id: string }>(`/customers/${customerId}`);
  }

  // Atualizar cliente no ASAAS
  async updateCustomer(customerId: string, customer: Partial<AsaasCustomer>) {
    return this.request<{ id: string }>(`/customers/${customerId}`, {
      method: 'PUT',
      body: JSON.stringify(customer),
    });
  }

  // Criar pagamento único
  async createPayment(payment: AsaasPayment) {
    return this.request<{ id: string; invoiceUrl: string; status: string }>('/payments', {
      method: 'POST',
      body: JSON.stringify(payment),
    });
  }

  // Criar assinatura
  async createSubscription(subscription: AsaasSubscription) {
    return this.request<{ id: string; status: string }>('/subscriptions', {
      method: 'POST',
      body: JSON.stringify(subscription),
    });
  }

  // Cancelar assinatura
  async cancelSubscription(subscriptionId: string) {
    return this.request<{ id: string; status: string }>(`/subscriptions/${subscriptionId}`, {
      method: 'DELETE',
    });
  }

  // Buscar assinatura
  async getSubscription(subscriptionId: string) {
    return this.request<{ id: string; status: string; currentCycle: any }>(
      `/subscriptions/${subscriptionId}`
    );
  }

  // Buscar pagamento
  async getPayment(paymentId: string) {
    return this.request<{ id: string; status: string; value: number }>(`/payments/${paymentId}`);
  }
}

export const asaasService = new AsaasService();
```

---

## 🛣️ Rotas de API

### Passo 2: Criar Rotas de API

#### 2.1. Rota para criar cliente no ASAAS

Crie `app/routes/api.asaas.create-customer.ts`:

```typescript
// app/routes/api.asaas.create-customer.ts
import { json, type ActionFunctionArgs } from '@remix-run/cloudflare';
import { AsaasService } from '~/lib/services/asaasService';
import { requireAuth } from '~/lib/auth/session';
import { supabase } from '~/lib/auth/supabase-client';

export const action = async ({ request, context }: ActionFunctionArgs) => {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const session = await requireAuth(request);
    const asaasService = new AsaasService(context);
    
    const body = await request.json();
    const { name, email, cpfCnpj, phone } = body;

    // Criar cliente no ASAAS
    const asaasCustomer = await asaasService.createCustomer({
      name,
      email,
      cpfCnpj,
      phone,
    });

    // Salvar referência no Supabase
    if (supabase) {
      const { error } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: session.user.id,
          asaas_customer_id: asaasCustomer.id,
          plan_type: 'free',
          status: 'active',
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error saving customer:', error);
      }
    }

    return json({ customerId: asaasCustomer.id });
  } catch (error) {
    console.error('Error creating customer:', error);
    return json(
      { error: error instanceof Error ? error.message : 'Erro ao criar cliente' },
      { status: 500 }
    );
  }
};
```

#### 2.2. Rota para criar assinatura

Crie `app/routes/api.asaas.create-subscription.ts`:

```typescript
// app/routes/api.asaas.create-subscription.ts
import { json, type ActionFunctionArgs } from '@remix-run/cloudflare';
import { AsaasService } from '~/lib/services/asaasService';
import { requireAuth } from '~/lib/auth/session';
import { supabase } from '~/lib/auth/supabase-client';

export const action = async ({ request, context }: ActionFunctionArgs) => {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const session = await requireAuth(request);
    const asaasService = new AsaasService(context);
    
    const body = await request.json();
    const { customerId, planType, billingType, value, cycle } = body;

    // Criar assinatura no ASAAS
    const asaasSubscription = await asaasService.createSubscription({
      customer: customerId,
      billingType: billingType || 'CREDIT_CARD',
      value,
      nextDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      cycle: cycle || 'MONTHLY',
      description: `Assinatura ${planType}`,
      externalReference: session.user.id,
    });

    // Salvar no Supabase
    if (supabase) {
      const { error } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: session.user.id,
          asaas_customer_id: customerId,
          asaas_subscription_id: asaasSubscription.id,
          plan_type: planType,
          status: 'pending',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error saving subscription:', error);
      }
    }

    return json({ subscriptionId: asaasSubscription.id });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return json(
      { error: error instanceof Error ? error.message : 'Erro ao criar assinatura' },
      { status: 500 }
    );
  }
};
```

#### 2.3. Rota para webhook do ASAAS

Crie `app/routes/api.asaas.webhook.ts`:

```typescript
// app/routes/api.asaas.webhook.ts
import { json, type ActionFunctionArgs } from '@remix-run/cloudflare';
import { supabase } from '~/lib/auth/supabase-client';

export const action = async ({ request, context }: ActionFunctionArgs) => {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const env = (context?.cloudflare?.env as any) || process.env;
    const webhookToken = env.ASAAS_WEBHOOK_TOKEN;

    // Verificar token do webhook (opcional, mas recomendado)
    const token = request.headers.get('asaas-access-token');
    if (webhookToken && token !== webhookToken) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await request.json();
    const event = payload.event;

    // Salvar webhook no banco
    if (supabase) {
      await supabase.from('asaas_webhooks').insert({
        event_type: event,
        asaas_id: payload.payment?.id || payload.subscription?.id,
        payload: payload,
        processed: false,
      });
    }

    // Processar eventos
    if (event === 'PAYMENT_CONFIRMED') {
      // Atualizar status do pagamento
      if (supabase && payload.payment) {
        await supabase
          .from('payments')
          .update({
            status: 'confirmed',
            payment_date: new Date().toISOString(),
          })
          .eq('asaas_payment_id', payload.payment.id);
      }
    } else if (event === 'PAYMENT_OVERDUE') {
      // Pagamento vencido
      if (supabase && payload.payment) {
        await supabase
          .from('payments')
          .update({ status: 'overdue' })
          .eq('asaas_payment_id', payload.payment.id);
      }
    } else if (event === 'SUBSCRIPTION_CREATED' || event === 'SUBSCRIPTION_UPDATED') {
      // Atualizar assinatura
      if (supabase && payload.subscription) {
        await supabase
          .from('subscriptions')
          .update({
            status: payload.subscription.status === 'ACTIVE' ? 'active' : 'pending',
          })
          .eq('asaas_subscription_id', payload.subscription.id);
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
```

---

## 🎨 Componentes de UI

### Passo 3: Criar Componentes de Interface

#### 3.1. Componente de Seleção de Plano

Crie `app/components/payment/PlanSelector.tsx`:

```typescript
// app/components/payment/PlanSelector.tsx
import { useState } from 'react';
import { Button } from '~/components/ui/Button';
import { Card } from '~/components/ui/Card';

interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
  popular?: boolean;
}

const plans: Plan[] = [
  {
    id: 'basic',
    name: 'Básico',
    price: 29.90,
    features: ['Recursos básicos', 'Suporte por email', '5 projetos'],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 79.90,
    features: ['Todos os recursos', 'Suporte prioritário', 'Projetos ilimitados', 'API access'],
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199.90,
    features: ['Tudo do Premium', 'Suporte 24/7', 'Customização', 'SLA garantido'],
  },
];

export function PlanSelector({ onSelectPlan }: { onSelectPlan: (plan: Plan) => void }) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {plans.map((plan) => (
        <Card
          key={plan.id}
          className={`p-6 relative ${plan.popular ? 'border-accent-500 border-2' : ''}`}
        >
          {plan.popular && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent-500 text-black px-3 py-1 rounded-full text-xs font-semibold">
              Mais Popular
            </div>
          )}
          <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
          <div className="mb-4">
            <span className="text-3xl font-bold">R$ {plan.price.toFixed(2)}</span>
            <span className="text-sm text-programe-elements-textSecondary">/mês</span>
          </div>
          <ul className="space-y-2 mb-6">
            {plan.features.map((feature, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <span className="i-ph:check text-green-500" />
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>
          <Button
            variant={plan.popular ? 'default' : 'outline'}
            className="w-full"
            onClick={() => {
              setSelectedPlan(plan.id);
              onSelectPlan(plan);
            }}
          >
            Selecionar Plano
          </Button>
        </Card>
      ))}
    </div>
  );
}
```

#### 3.2. Componente de Checkout

Crie `app/components/payment/CheckoutForm.tsx`:

```typescript
// app/components/payment/CheckoutForm.tsx
import { useState } from 'react';
import { Form } from '@remix-run/react';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { Label } from '~/components/ui/Label';

interface CheckoutFormProps {
  planId: string;
  planName: string;
  planPrice: number;
  onSuccess?: () => void;
}

export function CheckoutForm({ planId, planName, planPrice, onSuccess }: CheckoutFormProps) {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CREDIT_CARD' | 'PIX' | 'BOLETO'>('CREDIT_CARD');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      
      // Criar cliente no ASAAS
      const customerResponse = await fetch('/api/asaas/create-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // ⚠️ OBRIGATÓRIO: Envia cookies de autenticação
        body: JSON.stringify({
          name: formData.get('name'),
          email: formData.get('email'),
          cpfCnpj: formData.get('cpfCnpj'),
          phone: formData.get('phone'),
        }),
      });

      if (!customerResponse.ok) {
        const error = await customerResponse.json();
        throw new Error(error.error || 'Erro ao criar cliente');
      }

      const { customerId } = await customerResponse.json();

      // Criar assinatura
      const subscriptionResponse = await fetch('/api/asaas/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // ⚠️ OBRIGATÓRIO: Envia cookies de autenticação
        body: JSON.stringify({
          customerId,
          planType: planId,
          billingType: paymentMethod,
          value: planPrice,
          cycle: 'MONTHLY',
        }),
      });

      if (!subscriptionResponse.ok) {
        const error = await subscriptionResponse.json();
        throw new Error(error.error || 'Erro ao criar assinatura');
      }

      const { subscriptionId } = await subscriptionResponse.json();

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Erro ao processar pagamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Nome Completo</Label>
        <Input id="name" name="name" required />
      </div>

      <div>
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" required />
      </div>

      <div>
        <Label htmlFor="cpfCnpj">CPF/CNPJ</Label>
        <Input id="cpfCnpj" name="cpfCnpj" required />
      </div>

      <div>
        <Label htmlFor="phone">Telefone</Label>
        <Input id="phone" name="phone" required />
      </div>

      <div>
        <Label>Método de Pagamento</Label>
        <div className="flex gap-4 mt-2">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="CREDIT_CARD"
              checked={paymentMethod === 'CREDIT_CARD'}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
            />
            Cartão de Crédito
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="PIX"
              checked={paymentMethod === 'PIX'}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
            />
            PIX
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="BOLETO"
              checked={paymentMethod === 'BOLETO'}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
            />
            Boleto
          </label>
        </div>
      </div>

      <div className="pt-4 border-t">
        <div className="flex justify-between items-center mb-4">
          <span className="font-semibold">Total:</span>
          <span className="text-2xl font-bold">R$ {planPrice.toFixed(2)}</span>
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Processando...' : 'Finalizar Pagamento'}
        </Button>
      </div>
    </Form>
  );
}
```

---

## 🔔 Webhooks

### Passo 4: Configurar Webhook no ASAAS

1. Acesse o painel do ASAAS
2. Vá em **Configurações > Webhooks**
3. Adicione a URL: `https://seu-dominio.com/api/asaas/webhook`
4. Selecione os eventos que deseja receber:
   - `PAYMENT_CONFIRMED`
   - `PAYMENT_OVERDUE`
   - `SUBSCRIPTION_CREATED`
   - `SUBSCRIPTION_UPDATED`
   - `SUBSCRIPTION_DELETED`

---

## ✅ Próximos Passos

1. **Testar em Sandbox**: Use as credenciais de sandbox do ASAAS para testes
2. **Implementar página de planos**: Crie uma rota `/pricing` que use o `PlanSelector`
3. **Dashboard de assinatura**: Crie uma página para o usuário gerenciar sua assinatura
4. **Notificações**: Implemente notificações quando pagamentos forem confirmados
5. **Migração para produção**: Quando estiver pronto, altere as variáveis de ambiente para produção

---

## 📚 Recursos Adicionais

- [Documentação ASAAS](https://docs.asaas.com/)
- [API Reference](https://docs.asaas.com/reference)
- [Webhooks Guide](https://docs.asaas.com/docs/webhooks)

---

## ⚠️ Notas Importantes

1. **Segurança**: Sempre valide webhooks e use HTTPS em produção
2. **Idempotência**: Implemente verificações para evitar processar o mesmo evento duas vezes
3. **Testes**: Use sempre o ambiente sandbox antes de ir para produção
4. **Logs**: Mantenha logs de todas as transações para auditoria
