-- Tabelas opcionais para auditoria e histórico de pagamentos
-- Execute no Supabase SQL Editor se quiser log de webhooks e tabela payments.
-- O checkout funciona sem essas tabelas (o webhook é resiliente).

-- Tabela de webhooks do ASAAS (auditoria)
CREATE TABLE IF NOT EXISTS asaas_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  asaas_id TEXT,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_asaas_webhooks_processed ON asaas_webhooks(processed);
CREATE INDEX IF NOT EXISTS idx_asaas_webhooks_event_type ON asaas_webhooks(event_type);
CREATE INDEX IF NOT EXISTS idx_asaas_webhooks_asaas_id ON asaas_webhooks(asaas_id);

-- Tabela de pagamentos (usada em PAYMENT_CONFIRMED, PAYMENT_OVERDUE, PAYMENT_REFUNDED)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  asaas_payment_id TEXT UNIQUE,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'BRL',
  status TEXT NOT NULL,
  payment_method TEXT,
  due_date DATE,
  payment_date TIMESTAMP WITH TIME ZONE,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_asaas_payment_id ON payments(asaas_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- RLS (opcional)
ALTER TABLE asaas_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Política: apenas service role / backend atualiza asaas_webhooks (ou use policy por necessidade)
CREATE POLICY "Allow all for asaas_webhooks" ON asaas_webhooks FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Users can view their own payments" ON payments FOR SELECT USING (auth.uid() = user_id);
