# Checklist – Variáveis de ambiente para produção

Use este checklist para garantir que todas as variáveis necessárias estão configuradas antes do lançamento em produção.

---

## Obrigatórias (core)

| Variável | Descrição | Onde configurar (prod) |
|----------|-----------|------------------------|
| `VITE_SUPABASE_URL` | URL do projeto Supabase (ex: `https://xxx.supabase.co`) | Cloudflare Pages → Settings → Environment variables |
| `VITE_SUPABASE_ANON_KEY` | Chave anônima (pública) do Supabase | Idem |

Sem essas duas, o app não inicia no cliente (auth e dados quebram).

---

## Pagamentos (ASAAS)

Se você usa planos pagos e checkout ASAAS:

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `ASAAS_API_KEY` | Sim | API Key do ASAAS (produção: painel ASAAS → Integrações) |
| `ASAAS_API_URL` | Sim em prod | Produção: `https://api.asaas.com/v3`. Sandbox: `https://api-sandbox.asaas.com/v3` |
| `ASAAS_WEBHOOK_TOKEN` | Recomendado | Token para validar o webhook (evita chamadas falsas) |
| `APP_URL` | **Sim em prod** | URL pública do app (ex: `https://programe.studio`). Usada nos callbacks do checkout (success/cancel). Sem isso, em prod podem ser geradas URLs erradas. |

No **Cloudflare Pages**, defina essas variáveis em **Settings → Environment variables** (production). O webhook do ASAAS deve apontar para a URL pública, por exemplo: `https://seu-dominio.com/api/asaas/webhook`.

---

## Provedores de LLM (API keys)

Conforme uso, defina as chaves dos provedores que você quer oferecer. O `worker-configuration.d.ts` lista as chaves suportadas; no Cloudflare, use os mesmos nomes nas variáveis de ambiente.

Exemplos:

- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GROQ_API_KEY`
- `OPEN_ROUTER_API_KEY`
- etc.

Para forçar um único provedor/modelo em produção (recomendado em muitos casos):

- `BOLT_LLM_PROVIDER` (ex: `Anthropic`)
- `BOLT_LLM_MODEL` (ex: `claude-sonnet-4-5-20250929`)

---

## Opcionais (integrações)

Podem ser configuradas por usuário na UI ou via env para uso global:

| Variável | Uso |
|----------|-----|
| `VITE_GITHUB_ACCESS_TOKEN` / `GITHUB_ACCESS_TOKEN` | GitHub (repos, branches, template) |
| `VITE_NETLIFY_ACCESS_TOKEN` / `NETLIFY_TOKEN` | Netlify |
| `VITE_VERCEL_ACCESS_TOKEN` | Vercel |
| `VITE_SUPABASE_ACCESS_TOKEN` | Supabase (projeto remoto) |
| `VITE_GITLAB_ACCESS_TOKEN`, `VITE_GITLAB_URL` | GitLab |
| `GITHUB_BUG_REPORT_TOKEN`, `BUG_REPORT_REPO` | Envio de bug reports para um repo |

---

## Outras

| Variável | Uso |
|----------|-----|
| `VITE_LOG_LEVEL` | `debug` \| `info` \| `warn` \| `error`. Em prod use `info` ou `warn`. |
| `VITE_DISABLE_PERSISTENCE` | Se definido, desativa persistência de histórico no cliente. |
| `NODE_ENV` | Normalmente definido pela plataforma (`production` em prod). |

---

## Onde definir em produção (Cloudflare Pages)

1. **Cloudflare Dashboard** → seu projeto → **Workers & Pages** → **Settings** → **Environment variables**.
2. Crie variáveis para o ambiente **Production** (e, se quiser, **Preview** para branches).
3. Variáveis que começam com `VITE_` são expostas ao cliente no build; não coloque segredos em `VITE_*` (use apenas chaves públicas como `VITE_SUPABASE_ANON_KEY`).

---

## Checklist rápido antes do lançamento

- [ ] `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` definidas e corretas para o projeto de **produção**.
- [ ] Se usa ASAAS: `ASAAS_API_KEY`, `ASAAS_API_URL` (produção), `ASAAS_WEBHOOK_TOKEN` e **`APP_URL`** com a URL pública do site.
- [ ] Webhook do ASAAS apontando para `https://seu-dominio.com/api/asaas/webhook` (e evento `CHECKOUT_PAID` habilitado).
- [ ] Pelo menos um provedor de LLM configurado (ex: `OPENAI_API_KEY` ou `ANTHROPIC_API_KEY`), ou `BOLT_LLM_PROVIDER` + `BOLT_LLM_MODEL`.
- [ ] Em produção, `VITE_LOG_LEVEL` não está em `debug` (opcional mas recomendado).

Quando esses itens estiverem ok, suas variáveis de ambiente estão prontas para o lançamento de produção.
