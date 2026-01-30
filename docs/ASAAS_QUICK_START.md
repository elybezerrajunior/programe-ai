# 🚀 Quick Start - Integração ASAAS

## Checklist de Implementação

### ✅ Passo 1: Configuração Inicial (5 minutos)

1. **Adicionar variáveis de ambiente** no `.env.local`:
   ```env
   ASAAS_API_KEY=your_asaas_api_key_here
   ASAAS_API_URL=https://sandbox.asaas.com/api/v3
   ASAAS_WEBHOOK_TOKEN=your_webhook_token_here
   ```

2. **Obter credenciais do ASAAS**:
   - Acesse: https://www.asaas.com/
   - Crie uma conta (ou use sandbox para testes)
   - Vá em **Configurações > Integrações > API**
   - Copie sua API Key

### ✅ Passo 2: Configurar Banco de Dados (10 minutos)

1. **Acesse o Supabase SQL Editor**
2. **Execute o SQL** fornecido em `ASAAS_INTEGRATION.md` (seção "Estrutura de Banco de Dados")
3. **Verifique as tabelas criadas**:
   - `subscriptions`
   - `payments`
   - `asaas_webhooks`

### ✅ Passo 3: Testar Integração (15 minutos)

1. **Testar criação de cliente**:
   ```bash
   curl -X POST http://localhost:5173/api/asaas/create-customer \
     -H "Content-Type: application/json" \
     -H "Cookie: seu-cookie-de-sessao" \
     -d '{
       "name": "João Silva",
       "email": "joao@example.com",
       "cpfCnpj": "12345678900",
       "phone": "11999999999"
     }'
   ```

2. **Verificar no Supabase** se o cliente foi criado na tabela `subscriptions`

### ✅ Passo 4: Configurar Webhook (Opcional - Apenas para Produção)

**⚠️ IMPORTANTE**: O webhook NÃO é necessário para testes básicos! Você só precisa configurar o webhook quando quiser receber notificações automáticas de eventos (pagamentos confirmados, etc.).

**Para testes básicos, você pode pular este passo.**

**Quando configurar o webhook:**
- Quando estiver em produção
- Quando quiser receber notificações automáticas de pagamentos
- Quando quiser atualizar status de assinaturas automaticamente

**Como configurar (quando necessário):**

1. **No painel do ASAAS**:
   - Vá em **Configurações > Webhooks**
   - Adicione URL: `https://seu-dominio.com/api/asaas/webhook`
   - Selecione eventos:
     - ✅ PAYMENT_CONFIRMED
     - ✅ PAYMENT_OVERDUE
     - ✅ PAYMENT_RECEIVED
     - ✅ SUBSCRIPTION_CREATED
     - ✅ SUBSCRIPTION_UPDATED
     - ✅ SUBSCRIPTION_DELETED

2. **Para desenvolvimento local**, use um túnel (ngrok, Cloudflare Tunnel, etc.):
   ```bash
   # Exemplo com ngrok
   ngrok http 5173
   # Use a URL gerada no webhook do ASAAS
   ```

### ✅ Passo 5: Criar Interface de Usuário (Opcional)

Os componentes de UI estão documentados em `ASAAS_INTEGRATION.md`. Você pode:

1. Criar uma rota `/pricing` para exibir planos
2. Criar uma rota `/checkout` para processar pagamentos
3. Criar uma rota `/subscription` para gerenciar assinatura

## 📝 Exemplo de Uso Completo

```typescript
// 1. Criar cliente
const customerResponse = await fetch('/api/asaas/create-customer', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'João Silva',
    email: 'joao@example.com',
    cpfCnpj: '12345678900',
    phone: '11999999999'
  })
});
const { customerId } = await customerResponse.json();

// 2. Criar assinatura
const subscriptionResponse = await fetch('/api/asaas/create-subscription', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customerId,
    planType: 'premium',
    billingType: 'CREDIT_CARD',
    value: 79.90,
    cycle: 'MONTHLY'
  })
});
const { subscriptionId } = await subscriptionResponse.json();
```

## 🔍 Verificação

**Para testes básicos, verifique:**

- [ ] Variáveis de ambiente configuradas (ASAAS_API_KEY, ASAAS_API_URL)
- [ ] Tabelas criadas no Supabase
- [ ] Está logado no sistema
- [ ] Cliente pode ser criado via API
- [ ] Assinatura pode ser criada via API

**Para produção (quando configurar webhook):**

- [ ] Webhook está recebendo eventos
- [ ] Webhooks estão sendo salvos no banco
- [ ] Status de pagamentos está sendo atualizado automaticamente

## 🐛 Troubleshooting

### Erro: "ASAAS_API_KEY não configurada"
- Verifique se a variável está no `.env.local`
- Reinicie o servidor de desenvolvimento

### Erro: "Unauthorized" no webhook
- Verifique se `ASAAS_WEBHOOK_TOKEN` está configurado
- Confirme que o token no header corresponde ao configurado

### Webhook não está sendo recebido
- Verifique a URL configurada no ASAAS
- Use um túnel para desenvolvimento local
- Verifique os logs do servidor

## 📚 Próximos Passos

**Para continuar os testes:**

1. ✅ Testar criação de cliente (já pode fazer agora!)
2. ✅ Testar criação de assinatura (já pode fazer agora!)
3. Implementar componentes de UI (veja `ASAAS_INTEGRATION.md`)
4. Criar dashboard para usuário gerenciar assinatura

**Para produção:**

5. Configurar webhook no ASAAS
6. Adicionar notificações quando pagamentos forem confirmados
7. Implementar cancelamento de assinatura
8. Adicionar histórico de pagamentos
9. Migrar para produção quando estiver pronto

## 🔗 Links Úteis

- [Documentação ASAAS](https://docs.asaas.com/)
- [API Reference](https://docs.asaas.com/reference)
- [Webhooks Guide](https://docs.asaas.com/docs/webhooks)
- [Sandbox ASAAS](https://sandbox.asaas.com/)
