# 🔧 Troubleshooting - Integração ASAAS

## Erro: 302 Redirect para /login

### Problema
Ao chamar as APIs do ASAAS, você recebe um erro 302 redirecionando para `/login`.

### Causa
A requisição não está enviando os cookies de autenticação ou a sessão não está válida.

### Solução

#### 1. Verificar se está autenticado

Certifique-se de que você está logado antes de chamar as APIs:

```typescript
import { useAuth } from '~/lib/hooks/useAuth';

function MyComponent() {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    return <div>Por favor, faça login primeiro</div>;
  }
  
  // Agora pode chamar as APIs
}
```

#### 2. Garantir que os cookies são enviados

Ao fazer requisições `fetch`, certifique-se de incluir `credentials: 'include'`:

```typescript
// ✅ CORRETO - Envia cookies
const response = await fetch('/api/asaas/create-customer', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // IMPORTANTE: Envia cookies
  body: JSON.stringify({
    name: 'João Silva',
    email: 'joao@example.com',
    cpfCnpj: '12345678900',
    phone: '11999999999'
  })
});

// ❌ ERRADO - Não envia cookies
const response = await fetch('/api/asaas/create-customer', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  // Faltando credentials: 'include'
  body: JSON.stringify({...})
});
```

#### 3. Usar Form do Remix (Recomendado)

A melhor forma é usar o `Form` do Remix, que automaticamente envia cookies:

```typescript
import { Form } from '@remix-run/react';

function CheckoutForm() {
  return (
    <Form method="post" action="/api/asaas/create-customer">
      <input name="name" required />
      <input name="email" type="email" required />
      <button type="submit">Criar Cliente</button>
    </Form>
  );
}
```

#### 4. Verificar cookies no navegador

1. Abra as DevTools (F12)
2. Vá em **Application > Cookies**
3. Verifique se existem cookies de sessão:
   - `sb-{project-ref}-auth-token`
   - `programe_session`
   - Outros cookies relacionados ao Supabase

#### 5. Testar autenticação manualmente

Teste se a sessão está funcionando:

```typescript
// No console do navegador
fetch('/api/asaas/create-customer', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    name: 'Test',
    email: 'test@example.com'
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

## Erro: "ASAAS_API_KEY não configurada"

### Solução

1. Verifique se a variável está no `.env.local`:
   ```env
   ASAAS_API_KEY=sua_chave_aqui
   ```

2. Reinicie o servidor de desenvolvimento:
   ```bash
   pnpm run dev
   ```

3. Para Cloudflare Pages, configure as variáveis no painel do Cloudflare

## Erro: "Não autenticado" (401)

### Causa
A sessão expirou ou os cookies não estão sendo enviados.

### Solução

1. **Faça login novamente**
2. **Verifique se os cookies estão sendo enviados** (veja seção acima)
3. **Verifique se a sessão não expirou** - tente fazer login novamente

## Webhook não está sendo recebido

### Verificações

1. **URL do webhook está correta?**
   - Deve ser: `https://seu-dominio.com/api/asaas/webhook`
   - Para desenvolvimento local, use um túnel (ngrok, Cloudflare Tunnel)

2. **Webhook está configurado no ASAAS?**
   - Acesse: Configurações > Webhooks
   - Verifique se a URL está correta
   - Verifique se os eventos estão selecionados

3. **Token do webhook está configurado?**
   - Verifique `ASAAS_WEBHOOK_TOKEN` no `.env.local`
   - O token deve corresponder ao configurado no ASAAS

4. **Verificar logs**
   - Verifique os logs do servidor
   - Verifique a tabela `asaas_webhooks` no Supabase

## Erro ao criar cliente no ASAAS

### Verificações

1. **Dados obrigatórios estão presentes?**
   - `name` (obrigatório)
   - `email` (obrigatório)
   - `cpfCnpj` (recomendado)

2. **API Key está correta?**
   - Verifique se está usando a chave correta (sandbox ou produção)
   - Verifique se a chave não expirou

3. **Formato dos dados está correto?**
   ```typescript
   {
     name: "João Silva",        // String
     email: "joao@example.com",  // Email válido
     cpfCnpj: "12345678900",    // CPF sem formatação
     phone: "11999999999"        // Telefone sem formatação
   }
   ```

## Erro ao criar assinatura

### Verificações

1. **Cliente existe no ASAAS?**
   - Certifique-se de criar o cliente primeiro
   - Use o `customerId` retornado pela criação do cliente

2. **Valores estão corretos?**
   - `value` deve ser um número (ex: 79.90)
   - `cycle` deve ser um dos valores válidos: 'WEEKLY', 'BIWEEKLY', 'MONTHLY', etc.

3. **Data de vencimento está no futuro?**
   - `nextDueDate` deve ser no formato YYYY-MM-DD
   - Deve ser uma data futura

## Exemplo Completo de Uso

```typescript
import { useState } from 'react';
import { useAuth } from '~/lib/hooks/useAuth';

export function PaymentForm() {
  const { isAuthenticated, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateCustomer = async () => {
    if (!isAuthenticated) {
      setError('Por favor, faça login primeiro');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Criar cliente
      const customerResponse = await fetch('/api/asaas/create-customer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // IMPORTANTE!
        body: JSON.stringify({
          name: user?.name || 'Usuário',
          email: user?.email || '',
          cpfCnpj: '12345678900', // Obter do formulário
          phone: '11999999999',   // Obter do formulário
        }),
      });

      if (!customerResponse.ok) {
        const errorData = await customerResponse.json();
        throw new Error(errorData.error || 'Erro ao criar cliente');
      }

      const { customerId } = await customerResponse.json();

      // 2. Criar assinatura
      const subscriptionResponse = await fetch('/api/asaas/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // IMPORTANTE!
        body: JSON.stringify({
          customerId,
          planType: 'premium',
          billingType: 'CREDIT_CARD',
          value: 79.90,
          cycle: 'MONTHLY',
        }),
      });

      if (!subscriptionResponse.ok) {
        const errorData = await subscriptionResponse.json();
        throw new Error(errorData.error || 'Erro ao criar assinatura');
      }

      const { subscriptionId } = await subscriptionResponse.json();
      console.log('Assinatura criada:', subscriptionId);
      
      // Sucesso!
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return <div>Por favor, faça login para continuar</div>;
  }

  return (
    <div>
      <button 
        onClick={handleCreateCustomer}
        disabled={loading}
      >
        {loading ? 'Processando...' : 'Criar Assinatura'}
      </button>
      {error && <div className="text-red-500">{error}</div>}
    </div>
  );
}
```

## Pagamento via checkout diz "sucesso" mas não aparece no ASAAS nem no app

### 1. Onde ver os pagamentos no Sandbox

No **sandbox**, os pagamentos aparecem em um **painel separado** do ASAAS:

- **Sandbox:** acesse **https://sandbox.asaas.com** (login separado do ASAAS de produção).
- **Produção:** acesse **https://www.asaas.com**.

Se você paga no checkout do sandbox (`sandbox.asaas.com`), as cobranças aparecem apenas no dashboard do **sandbox**, não no dashboard de produção.

### 2. Webhook CHECKOUT_PAID

Quando o cliente paga pelo **link de checkout**, o ASAAS envia o evento **`CHECKOUT_PAID`** (e não `PAYMENT_CONFIRMED`).

É necessário:

1. No painel do ASAAS (sandbox ou produção), ir em **Configurações → Webhooks**.
2. Incluir o evento **`CHECKOUT_PAID`** na lista de eventos do webhook.
3. URL do webhook: `https://seu-dominio.com/api/asaas/webhook`.

Sem o evento `CHECKOUT_PAID` configurado, o app não recebe a confirmação e não atualiza assinatura/créditos.

### 3. Webhook em desenvolvimento (localhost) – por que não salva no Supabase

O ASAAS envia o webhook para a **URL que você configurou no painel**. Se sua app está em **localhost**, o ASAAS **não consegue** acessar sua máquina. Por isso:

- O pagamento aparece como concluído na tela do ASAAS.
- O webhook **nunca chega** na sua app (localhost não é acessível pela internet).
- Nada é salvo no Supabase e o e-mail não é disparado pelo seu sistema (o ASAAS em sandbox também costuma não enviar e-mail).

**Solução rápida (sem ngrok):** em **desenvolvimento**, na página **Planos** (`/plans`) aparece um card amarelo com o botão **"Simular pagamento concluído (Pro)"**. Depois de “pagar” no checkout do ASAAS:

1. Volte para `/plans` (ou abra em outra aba).
2. Clique em **"Simular pagamento concluído (Pro)"**.
3. A assinatura e os créditos serão gravados no Supabase como se o webhook tivesse sido recebido.

Esse botão **só existe em modo dev** (`pnpm run dev`); em produção ele não aparece.

**Para testar o webhook de verdade em desenvolvimento:**

- Use um túnel (ex.: **ngrok**): `ngrok http 5173` e configure no ASAAS a URL que o ngrok gerar (ex.: `https://abc123.ngrok.io/api/asaas/webhook`).
- Ou faça o deploy em um ambiente público (ex.: Vercel, Cloudflare) e use a URL pública no webhook.

### 4. E-mail não enviado

- **Sandbox:** o ASAAS em sandbox costuma **não enviar e-mails** reais (confirmação, boletos etc.). Em produção os e-mails do ASAAS são enviados normalmente.
- **Sua aplicação:** hoje o fluxo **não envia e-mail próprio** ao confirmar pagamento; apenas atualiza Supabase e créditos. Se quiser enviar um e-mail de confirmação, é preciso implementar (por exemplo ao processar o webhook `CHECKOUT_PAID` ou ao chamar a simulação em dev).

---

## Checklist de Debugging

- [ ] Estou logado no sistema?
- [ ] Os cookies de sessão estão presentes no navegador?
- [ ] Estou usando `credentials: 'include'` nas requisições fetch?
- [ ] As variáveis de ambiente estão configuradas?
- [ ] O servidor foi reiniciado após adicionar variáveis?
- [ ] A API Key do ASAAS está correta?
- [ ] Estou usando a URL correta (sandbox vs produção)?
- [ ] Os dados enviados estão no formato correto?
- [ ] O evento **CHECKOUT_PAID** está habilitado no webhook do ASAAS?
- [ ] Para testes locais: a URL do webhook é acessível pela internet (ngrok ou deploy)?
