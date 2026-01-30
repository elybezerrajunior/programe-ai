# Checklist – Integração Checkout Nativo ASAAS

Este documento descreve o **fluxo atual** do checkout nativo (redirecionamento para o ASAAS) e o que ainda está **pendente** para considerar a integração concluída.

---

## Por que nada aparece no ASAAS / não chega email?

- **Criar checkout** (clicar em "Fazer Upgrade" na sua app) só **gera um link** no ASAAS. Nesse momento o ASAAS envia o webhook **`CHECKOUT_CREATED`** (por isso você vê “logs de webhook de checkout”). Ainda **não existe cobrança nem pagamento** no ASAAS.
- A **cobrança** e o **email** só existem **depois que o cliente abre o link** (ex.: `https://sandbox.asaas.com/checkoutSession/show/...`) e **conclui o pagamento** na página do ASAAS (cartão, etc.). Aí o ASAAS:
  - Cria a cobrança/pagamento no painel
  - Envia o webhook **`CHECKOUT_PAID`**
  - Envia o email de confirmação
- Se você usa **“Simular pagamento concluído”** (botão em dev), isso só atualiza **sua aplicação** (Supabase). **Nenhum pagamento é criado no ASAAS**, então nada aparece no painel do ASAAS e nenhum email é enviado pelo ASAAS.
- **Onde ver no painel do ASAAS:** cobranças de checkout aparecem em **Cobranças / Financeiro** (e na assinatura, se for recorrente). **“Antecipações”** é outro produto (antecipação de recebíveis); não é onde ficam os pagamentos do checkout.

**Resumo:** para aparecer cobrança no ASAAS e receber email, é preciso **abrir o link do checkout e pagar de verdade** na página do ASAAS (no sandbox pode usar cartão de teste).

---

## Como saber se o pagamento do usuário está funcionando?

1. **No painel do ASAAS (sandbox ou produção)**  
   Se a cobrança aparece em **Cobranças** (lista de cobranças), o pagamento foi recebido pelo ASAAS. Isso já indica que o fluxo de checkout e pagamento no link está ok.

2. **Na sua aplicação (assinatura e créditos)**  
   A aplicação fica sabendo que o usuário pagou de duas formas:
   - **Com webhook (URL pública):** o ASAAS envia `CHECKOUT_PAID` para a sua URL; o webhook chama `processCheckoutPaid` e atualiza `subscriptions` e `user_credits`. Para conferir: veja no Supabase as tabelas `subscriptions` e `user_credits` do usuário, ou na UI (plano e créditos na `/plans` e no header).
   - **Sem webhook (ex.: localhost):** quando o usuário volta para `/plans?checkout=success`, o **loader** da página consulta o ASAAS (último checkout pendente do usuário). Se o status do checkout estiver pago (CONFIRMED/PAID/RECEIVED), a aplicação chama `processCheckoutPaid` e atualiza assinatura/créditos na hora. Assim você não precisa de domínio para testar: pague no link do ASAAS, volte para a app e a página já atualiza o plano e os créditos.

3. **Resumo**  
   - Cobrança no ASAAS = pagamento recebido pelo ASAAS.  
   - Plano/créditos atualizados na app = ou o webhook rodou (com URL pública) ou o “sync no retorno” rodou (usuário entrou em `/plans?checkout=success` e o loader confirmou o pagamento no ASAAS e atualizou).

---

## Fluxo atual (como está)

1. **Página de planos (`/plans`)**
   - Usuário escolhe plano (Pro/Business), quantidade de créditos e ciclo (mensal/anual).
   - Clica em **"Fazer Upgrade"** → aparece "Criando checkout..." e o botão fica desabilitado.
   - Front chama `POST /api/asaas/checkout` com `planType`, `billingCycle`, `creditsPerMonth`, `price` e `credentials: 'include'`.

2. **API `/api/asaas/checkout`**
   - Valida sessão, monta payload (itens, callback URLs, subscription, externalReference).
   - Chama ASAAS `POST /checkouts`.
   - Grava em `asaas_checkouts` (se Supabase configurado).
   - Retorna `checkoutUrl` (link do ASAAS).

3. **Redirecionamento**
   - Front faz `window.location.href = data.checkoutUrl` → usuário vai para a página de pagamento do ASAAS (sandbox ou produção).

4. **Após o pagamento no ASAAS**
   - ASAAS redireciona para `successUrl`: `/plans?checkout=success&plan=pro` (ou a URL configurada em `APP_URL`).
   - ASAAS envia webhook `CHECKOUT_PAID` para a URL configurada no painel (quando acessível pela internet).

5. **Webhook `/api/asaas/webhook`**
   - Recebe `CHECKOUT_PAID` com `payload.checkout` (incluindo `externalReference`).
   - `processCheckoutPaid` atualiza `subscriptions` e `user_credits`, marca `asaas_checkouts` como concluído.

6. **Retorno na aplicação**
   - Na `/plans` com `?checkout=success`, a página mostra mensagem de sucesso e chama `revalidator.revalidate()` para atualizar plano/créditos.

---

## O que já está feito

- [x] Criação de checkout no ASAAS e retorno da URL.
- [x] Redirecionamento para a página de pagamento do ASAAS.
- [x] Callbacks configuráveis (success, cancel, expired) com fallback para localhost.
- [x] Tratamento do evento `CHECKOUT_PAID` no webhook.
- [x] Atualização de `subscriptions` e `user_credits` via `processCheckoutPaid`.
- [x] Mensagens de retorno na `/plans` (sucesso/cancelado/expirado).
- [x] Rota de simulação em dev (`/api/asaas/simulate-checkout-paid`) quando o webhook não chega (ex.: localhost).
- [x] `credentials: 'include'` no fetch do checkout e loading no botão ("Criando checkout...").
- [x] AsaasService usando `context.cloudflare.env` quando disponível (Cloudflare).

---

## O que foi implementado (código)

- [x] Webhook resiliente: se as tabelas `asaas_webhooks` ou `payments` não existirem, o webhook continua processando `CHECKOUT_PAID` e atualizando `subscriptions` / `user_credits` / `asaas_checkouts`.
- [x] Insert em `asaas_checkouts` no checkout não quebra o fluxo se a tabela falhar (só log de aviso).
- [x] `console.log` do checkout só em desenvolvimento.
- [x] Após retorno com `?checkout=success`, `loadSubscription()` é chamado para atualizar o header/store.

---

## Pendências para concluir a integração

### 1. Configuração no painel do ASAAS

- [ ] **Webhook**
  - Em **Configurações → Webhooks**, cadastrar a URL do webhook:  
    `https://SEU-DOMINIO.com/api/asaas/webhook`
  - Incluir o evento **`CHECKOUT_PAID`** na lista de eventos.
  - (Opcional) Definir e usar `ASAAS_WEBHOOK_TOKEN` e enviar no header `asaas-access-token`.

- [ ] **Ambiente**
  - Sandbox: usar API Key e URL do sandbox.
  - Produção: trocar para API Key e URL de produção.

### 2. Variáveis de ambiente

- [ ] **Produção / deploy**
  - `ASAAS_API_KEY` – API Key do ASAAS (sandbox ou produção).
  - `ASAAS_API_URL` – `https://api-sandbox.asaas.com/v3` ou `https://api.asaas.com/v3`.
  - `APP_URL` – URL pública da aplicação (ex.: `https://programe.studio`), usada nas URLs de callback (success/cancel/expired). Sem isso, em produção podem ser usadas URLs erradas.
  - (Opcional) `ASAAS_WEBHOOK_TOKEN` – para validar o webhook.

### 3. Banco de dados (Supabase)

- [x] **Já implementado por você:** `subscriptions` (com colunas de créditos), `asaas_checkouts`, `user_credits` (conforme SQLs que você rodou).

- [ ] **Opcional:** para auditoria de webhooks e histórico de pagamentos, executar `docs/sql/asaas_webhooks_and_payments.sql` (tabelas `asaas_webhooks` e `payments`). O fluxo funciona sem elas.

- [ ] Garantir que o backend (e o webhook) tenham permissão para inserir/atualizar nas tabelas que você usa (RLS/policies).

### 4. Testes em desenvolvimento (localhost)

- O ASAAS **não** envia webhook para `http://localhost:...`.
- Opções:
  - Usar o botão **"Simular pagamento concluído (Pro)"** na `/plans` (só em dev) após simular o pagamento no ASAAS.
  - Ou expor a app com **ngrok** (ou similar) e configurar essa URL no webhook do ASAAS para testar o `CHECKOUT_PAID` de ponta a ponta.

### 5. E-mail (opcional)

- Hoje não há envio de e-mail pela aplicação ao confirmar pagamento.
- O ASAAS pode enviar e-mails próprios (em produção); no sandbox costuma não enviar.
- Se quiser e-mail próprio (ex.: “Assinatura ativada”), implementar disparo ao processar `CHECKOUT_PAID` (ou ao simular em dev).

---

## Resumo rápido

| Item                         | Status   |
|-----------------------------|----------|
| Fluxo de criação + redirect  | Pronto   |
| Webhook CHECKOUT_PAID       | Pronto   |
| Credentials + loading botão | Pronto   |
| AsaasService (Cloudflare)   | Pronto   |
| SQLs subscriptions + asaas_checkouts | Feito por você |
| Webhook resiliente (tabelas opcionais) | Pronto   |
| loadSubscription no retorno do checkout | Pronto   |
| console.log só em dev       | Pronto   |
| Webhook no painel ASAAS     | Pendente (configuração manual) |
| APP_URL em produção         | Pendente (variável de ambiente) |
| Tabelas asaas_webhooks/payments | Opcional (`docs/sql/asaas_webhooks_and_payments.sql`) |
| E-mail de confirmação       | Opcional |

Quando o webhook estiver configurado no painel do ASAAS e as variáveis de ambiente (incluindo `APP_URL` em produção) estiverem definidas, a integração do checkout nativo do ASAAS está concluída para o fluxo atual.
