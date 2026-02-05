# Sistema Antifraude - Programe Studio

Sistema de proteção contra farming de créditos para plataformas SaaS freemium.

## Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Instalação](#instalação)
4. [Configuração](#configuração)
5. [Schema SQL](#schema-sql)
6. [Fluxo do Signup](#fluxo-do-signup)
7. [Risk Score](#risk-score)
8. [Trust Score Progressivo](#trust-score-progressivo)
9. [API Reference](#api-reference)
10. [Boas Práticas](#boas-práticas)

---

## Visão Geral

O sistema antifraude foi projetado para impedir que usuários mal-intencionados criem múltiplas contas para farmar créditos gratuitos. Ele utiliza múltiplos sinais de risco combinados para tomar decisões inteligentes.

### Sinais Coletados

| Sinal | Descrição | Peso |
|-------|-----------|------|
| **IP Address** | Detecta múltiplas contas do mesmo IP | 20% |
| **Fingerprint** | Identificação única do dispositivo via FingerprintJS | 25% |
| **E-mail** | Detecção de domínios descartáveis | 20% |
| **Velocidade** | Taxa de criação de contas | 20% |
| **Rede** | Detecção de VPN, Proxy, Tor, Datacenter | 15% |

### Decisões Possíveis

- **allow**: Signup permitido normalmente
- **review**: Permitido mas marcado para revisão manual
- **block**: Signup bloqueado

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                         │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────────┐   │
│  │  FingerprintJS │  │   Turnstile   │  │   SignupForm      │   │
│  │  (coleta FP)   │  │  (CAPTCHA)    │  │  (envia dados)    │   │
│  └───────────────┘  └───────────────┘  └───────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend (Cloudflare Workers)                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    service.ts                              │  │
│  │  - validateSignup() - Valida antes de criar conta         │  │
│  │  - finalizeSignupAntifraud() - Salva dados após signup    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│     ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│     │ signals.ts  │  │risk-score.ts│  │trust-score.ts│          │
│     │ (coleta)    │  │ (cálculo)   │  │(progressivo) │          │
│     └─────────────┘  └─────────────┘  └─────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PostgreSQL (Supabase)                        │
│  • antifraud_signals      • antifraud_risk_scores               │
│  • antifraud_trust_levels • antifraud_ip_stats                  │
│  • antifraud_fingerprint_stats • antifraud_events               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Instalação

### 1. Dependências

```bash
# FingerprintJS (identificação de dispositivo)
pnpm add @fingerprintjs/fingerprintjs

# Opcional: FingerprintJS Pro (maior precisão)
# pnpm add @fingerprintjs/fingerprintjs-pro
```

### 2. Variáveis de Ambiente

Adicione ao seu `.env`:

```env
# Cloudflare Turnstile
VITE_TURNSTILE_SITE_KEY=0x4AAAAAAA...
TURNSTILE_SECRET_KEY=0x4AAAAAAA...

# IPInfo (opcional - detecção de VPN)
IPINFO_TOKEN=your_token

# Habilitar/desabilitar
ANTIFRAUD_ENABLED=true
```

### 3. Schema SQL

Execute o script em `docs/antifraud-schema.sql` no Supabase:

```bash
# Via Supabase CLI
supabase db push

# Ou via Dashboard
# Project → SQL Editor → Cole o conteúdo do arquivo
```

---

## Configuração

### Cloudflare Turnstile

1. Acesse [Cloudflare Dashboard](https://dash.cloudflare.com/?to=/:account/turnstile)
2. Crie um novo site
3. Anote o Site Key (frontend) e Secret Key (backend)

### IPInfo (Opcional)

Para detecção de VPN/Proxy/Datacenter:

1. Crie uma conta em [ipinfo.io](https://ipinfo.io)
2. Obtenha seu token de API
3. Adicione ao `.env`

### Limites Configuráveis

```typescript
const DEFAULT_ANTIFRAUD_LIMITS = {
  // Rate limits
  maxSignupsPerIpPerHour: 3,
  maxSignupsPerIpPerDay: 5,
  maxSignupsPerFingerprintPerHour: 2,
  maxSignupsPerFingerprintPerDay: 3,
  
  // Thresholds
  riskScoreBlockThreshold: 80,  // 80+ = bloqueio
  riskScoreReviewThreshold: 50, // 50-79 = revisão
  
  // Créditos por trust level
  creditsPerTrustLevel: {
    new: 2,
    basic: 5,
    verified: 10,
    trusted: 20,
    premium: 50,
  },
};
```

---

## Schema SQL

### Tabelas Principais

| Tabela | Descrição |
|--------|-----------|
| `antifraud_signals` | Sinais coletados durante signup |
| `antifraud_risk_scores` | Score de risco calculado |
| `antifraud_trust_levels` | Nível de confiança progressivo |
| `antifraud_ip_stats` | Estatísticas agregadas por IP |
| `antifraud_fingerprint_stats` | Estatísticas por fingerprint |
| `antifraud_events` | Log de eventos para auditoria |
| `disposable_email_domains` | Lista de e-mails descartáveis |

### Índices Otimizados

Todos os campos frequentemente consultados possuem índices:
- Busca por IP e fingerprint
- Ordenação por data de criação
- Filtro por decisão e score

---

## Fluxo do Signup

### 1. Frontend Coleta Sinais

```tsx
import { useFingerprint } from '~/lib/hooks/useFingerprint';
import { TurnstileWidget } from '~/components/ui/TurnstileWidget';

function SignupForm() {
  const fingerprint = useFingerprint();
  const [turnstileToken, setTurnstileToken] = useState(null);
  
  // Turnstile widget
  <TurnstileWidget
    siteKey={SITE_KEY}
    onSuccess={setTurnstileToken}
  />
}
```

### 2. Validação Pré-Signup

```typescript
// Antes de criar conta, valida antifraude
const response = await fetch('/api/antifraud/validate', {
  method: 'POST',
  body: JSON.stringify({
    email,
    fingerprintId,
    fingerprintConfidence,
    turnstileToken,
    userAgent,
    // ...
  }),
});

const { allowed, riskScore, decision, reason } = await response.json();

if (!allowed) {
  // Mostra erro ao usuário
  return;
}

// Prossegue com signup
```

### 3. Backend Processa

```typescript
import { validateSignup, finalizeSignupAntifraud } from '~/lib/antifraud';

// 1. Valida antes de criar conta
const result = await validateSignup(supabase, request, payload, config);

if (!result.allowed) {
  return json({ error: result.reason }, { status: 403 });
}

// 2. Cria conta no Supabase Auth
const { user } = await signUpWithPassword(email, password);

// 3. Salva dados antifraude
await finalizeSignupAntifraud(supabase, user.id, request, payload, result, config);
```

---

## Risk Score

### Cálculo

O score final (0-100) é uma média ponderada:

```
RiskScore = (IP × 0.20) + (Fingerprint × 0.25) + (Email × 0.20) + 
            (Velocity × 0.20) + (Network × 0.15) + BonusFlags
```

### Flags de Risco

| Flag | Pontos | Descrição |
|------|--------|-----------|
| `multiple_accounts_same_ip` | 20 | Várias contas do mesmo IP |
| `multiple_accounts_same_fingerprint` | 30 | Várias contas do mesmo dispositivo |
| `disposable_email` | 25 | E-mail temporário |
| `vpn_detected` | 15 | Usando VPN |
| `proxy_detected` | 20 | Usando proxy |
| `tor_detected` | 40 | Usando Tor |
| `datacenter_ip` | 25 | IP de datacenter |
| `high_velocity_signup` | 30 | Criação muito rápida |
| `suspicious_user_agent` | 35 | Bot/automação |
| `turnstile_failed` | 40 | Falha no CAPTCHA |
| `blocklisted_ip` | 100 | IP na blocklist |
| `blocklisted_fingerprint` | 100 | Dispositivo na blocklist |

---

## Trust Score Progressivo

### Níveis de Confiança

| Nível | Créditos | Requisitos |
|-------|----------|------------|
| `new` | 2 | Conta recém-criada |
| `basic` | 5 | E-mail verificado |
| `verified` | 10 | Telefone verificado |
| `trusted` | 20 | 7+ dias ativos, histórico limpo |
| `premium` | 50 | Realizou pagamento |

### Pontos por Verificação

```typescript
const VERIFICATION_POINTS = {
  emailVerified: 15,
  phoneVerified: 25,
  paymentVerified: 35,
  identityVerified: 25,
};
```

### Atualização de Trust

```typescript
// Após verificar e-mail
import { onEmailVerified } from '~/lib/antifraud';
await onEmailVerified(supabase, userId);

// Após verificar telefone
import { onPhoneVerified } from '~/lib/antifraud';
await onPhoneVerified(supabase, userId);

// Após pagamento
import { onPaymentCompleted } from '~/lib/antifraud';
await onPaymentCompleted(supabase, userId);
```

---

## API Reference

### `validateSignup()`

Valida um signup antes de criar a conta.

```typescript
const result = await validateSignup(
  supabase,    // Cliente Supabase
  request,     // Request object (para headers)
  payload,     // SignupAntifraudPayload
  config       // { turnstileSecretKey, ipinfoToken?, enabled? }
);

// Retorno: AntifraudValidationResult
{
  allowed: boolean,
  riskScore: number,
  decision: 'allow' | 'review' | 'block',
  reason: string,
  flags: RiskFlag[],
  initialCredits: number,
  trustLevel: TrustLevel,
  signalId: string | null,
}
```

### `finalizeSignupAntifraud()`

Salva dados antifraude após o signup.

```typescript
await finalizeSignupAntifraud(
  supabase,
  userId,
  request,
  payload,
  validationResult,
  config
);
```

### Hooks

```typescript
// Fingerprint
const { fingerprintId, fingerprintConfidence, loading } = useFingerprint();

// Turnstile
const { token, isReady, reset } = useTurnstile(containerId, options);
```

---

## Boas Práticas

### 1. Fail-Open com Cautela

Em caso de erro na validação, permitimos o signup mas com créditos reduzidos:

```typescript
catch (error) {
  // Permite, mas com revisão
  return {
    allowed: true,
    riskScore: 30,
    decision: 'review',
    initialCredits: 2,  // Mínimo
  };
}
```

### 2. Não Exponha Detalhes

Nunca revele ao usuário quais flags foram ativados:

```typescript
// ❌ Ruim
return json({ error: 'VPN detectada', flags: ['vpn_detected'] });

// ✅ Bom
return json({ error: 'Não foi possível criar sua conta' });
```

### 3. Monitore Falsos Positivos

Use os eventos de auditoria para ajustar thresholds:

```sql
-- Verificar taxa de bloqueio
SELECT 
  decision,
  COUNT(*) as count,
  AVG(risk_score) as avg_score
FROM antifraud_risk_scores
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY decision;
```

### 4. Atualize Lista de E-mails Descartáveis

```sql
-- Adicionar domínios
INSERT INTO disposable_email_domains (domain, source)
VALUES ('newspam.com', 'manual')
ON CONFLICT (domain) DO NOTHING;
```

### 5. Revisão Manual

Implemente interface de admin para revisar casos suspeitos:

```sql
-- Buscar signups para revisão
SELECT 
  s.*,
  r.risk_score,
  r.risk_flags,
  r.decision_reason
FROM antifraud_signals s
JOIN antifraud_risk_scores r ON r.user_id = s.user_id
WHERE r.decision = 'review'
ORDER BY s.created_at DESC;
```

---

## Manutenção

### Cron Jobs Recomendados

```sql
-- Resetar contadores horários (a cada hora)
SELECT reset_hourly_rate_limits();

-- Limpar eventos antigos (mensal)
DELETE FROM antifraud_events 
WHERE created_at < NOW() - INTERVAL '90 days';
```

### Métricas para Dashboard

1. Taxa de bloqueio por dia
2. Distribuição de risk scores
3. Top IPs com mais tentativas
4. Top flags ativados
5. Evolução de trust levels

---

## Suporte

Para dúvidas ou problemas, consulte:

- Logs de eventos: `antifraud_events`
- Decisões tomadas: `antifraud_risk_scores`
- Configuração: `.env` e `types.ts`
