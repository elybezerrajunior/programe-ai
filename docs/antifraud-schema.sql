-- ============================================================================
-- SCHEMA ANTIFRAUDE - Programe Studio
-- Sistema de detecção de fraude para prevenção de farming de créditos
-- 
-- Créditos: 5 fixos para todos os novos usuários
-- ============================================================================

-- ============================================================================
-- TABELA: antifraud_signals
-- Armazena todos os sinais coletados durante o signup
-- ============================================================================
CREATE TABLE IF NOT EXISTS antifraud_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Sinais de identificação
    ip_address INET NOT NULL,
    fingerprint_id VARCHAR(255),  -- ID do FingerprintJS
    fingerprint_confidence DECIMAL(5,4),  -- Confiança do fingerprint (0-1)
    user_agent TEXT,
    
    -- Geolocalização (via Cloudflare ou MaxMind)
    country_code VARCHAR(2),
    region VARCHAR(100),
    city VARCHAR(100),
    timezone VARCHAR(50),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Metadados de rede
    asn INTEGER,  -- Autonomous System Number
    asn_org VARCHAR(255),  -- Nome da organização do ASN
    is_vpn BOOLEAN DEFAULT FALSE,
    is_proxy BOOLEAN DEFAULT FALSE,
    is_tor BOOLEAN DEFAULT FALSE,
    is_datacenter BOOLEAN DEFAULT FALSE,
    is_mobile BOOLEAN DEFAULT FALSE,
    
    -- Dados do navegador/dispositivo
    browser_name VARCHAR(100),
    browser_version VARCHAR(50),
    os_name VARCHAR(100),
    os_version VARCHAR(50),
    device_type VARCHAR(50),  -- desktop, mobile, tablet
    screen_resolution VARCHAR(20),
    language VARCHAR(10),
    
    -- Dados de validação
    email_domain VARCHAR(255),
    is_disposable_email BOOLEAN DEFAULT FALSE,
    email_mx_valid BOOLEAN,
    
    -- Turnstile
    turnstile_token VARCHAR(500),
    turnstile_valid BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- ============================================================================
-- TABELA: antifraud_risk_scores
-- Armazena o score de risco calculado para cada signup
-- ============================================================================
CREATE TABLE IF NOT EXISTS antifraud_risk_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    signal_id UUID REFERENCES antifraud_signals(id) ON DELETE SET NULL,
    
    -- Score principal (0-100, quanto maior = mais risco)
    risk_score INTEGER NOT NULL DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    
    -- Scores individuais por categoria (para debugging e ajuste)
    ip_score INTEGER DEFAULT 0,
    fingerprint_score INTEGER DEFAULT 0,
    email_score INTEGER DEFAULT 0,
    velocity_score INTEGER DEFAULT 0,
    network_score INTEGER DEFAULT 0,
    
    -- Decisão tomada
    decision VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (decision IN ('allow', 'review', 'block', 'pending')),
    decision_reason TEXT,
    
    -- Flags de risco detectados
    risk_flags JSONB DEFAULT '[]'::JSONB,
    
    -- Metadados
    version VARCHAR(10) DEFAULT '1.0',  -- Versão do algoritmo usado
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES auth.users(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABELA: antifraud_ip_stats
-- Estatísticas agregadas por IP para detecção de padrões
-- ============================================================================
CREATE TABLE IF NOT EXISTS antifraud_ip_stats (
    ip_address INET PRIMARY KEY,
    
    -- Contadores
    total_signups INTEGER DEFAULT 0,
    successful_signups INTEGER DEFAULT 0,
    blocked_signups INTEGER DEFAULT 0,
    
    -- Timestamps
    first_seen_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Rate limiting
    signups_last_hour INTEGER DEFAULT 0,
    signups_last_day INTEGER DEFAULT 0,
    last_signup_at TIMESTAMPTZ,
    
    -- Flags
    is_blocklisted BOOLEAN DEFAULT FALSE,
    blocklist_reason TEXT,
    blocklisted_at TIMESTAMPTZ,
    
    -- Metadados
    associated_users UUID[] DEFAULT '{}',  -- Array de user_ids
    
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABELA: antifraud_fingerprint_stats
-- Estatísticas agregadas por fingerprint
-- ============================================================================
CREATE TABLE IF NOT EXISTS antifraud_fingerprint_stats (
    fingerprint_id VARCHAR(255) PRIMARY KEY,
    
    -- Contadores
    total_signups INTEGER DEFAULT 0,
    successful_signups INTEGER DEFAULT 0,
    blocked_signups INTEGER DEFAULT 0,
    
    -- Confiança média do fingerprint
    avg_confidence DECIMAL(5,4) DEFAULT 0,
    
    -- Timestamps
    first_seen_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Rate limiting
    signups_last_hour INTEGER DEFAULT 0,
    signups_last_day INTEGER DEFAULT 0,
    last_signup_at TIMESTAMPTZ,
    
    -- Flags
    is_blocklisted BOOLEAN DEFAULT FALSE,
    blocklist_reason TEXT,
    blocklisted_at TIMESTAMPTZ,
    
    -- Metadados
    associated_users UUID[] DEFAULT '{}',
    associated_ips INET[] DEFAULT '{}',
    
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABELA: antifraud_events
-- Log de eventos para auditoria e análise
-- ============================================================================
CREATE TABLE IF NOT EXISTS antifraud_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB DEFAULT '{}'::JSONB,
    
    ip_address INET,
    fingerprint_id VARCHAR(255),
    
    risk_score INTEGER,
    decision VARCHAR(20),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABELA: disposable_email_domains
-- Lista de domínios de e-mail descartáveis (atualizada periodicamente)
-- ============================================================================
CREATE TABLE IF NOT EXISTS disposable_email_domains (
    domain VARCHAR(255) PRIMARY KEY,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    source VARCHAR(100)  -- Fonte da informação
);

-- ============================================================================
-- ÍNDICES OTIMIZADOS
-- ============================================================================

-- antifraud_signals
CREATE INDEX IF NOT EXISTS idx_signals_user_id ON antifraud_signals(user_id);
CREATE INDEX IF NOT EXISTS idx_signals_ip ON antifraud_signals(ip_address);
CREATE INDEX IF NOT EXISTS idx_signals_fingerprint ON antifraud_signals(fingerprint_id);
CREATE INDEX IF NOT EXISTS idx_signals_created_at ON antifraud_signals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_signals_email_domain ON antifraud_signals(email_domain);

-- antifraud_risk_scores
CREATE INDEX IF NOT EXISTS idx_risk_user_id ON antifraud_risk_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_risk_score ON antifraud_risk_scores(risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_risk_decision ON antifraud_risk_scores(decision);

-- antifraud_ip_stats
CREATE INDEX IF NOT EXISTS idx_ip_last_seen ON antifraud_ip_stats(last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_ip_blocklisted ON antifraud_ip_stats(is_blocklisted) WHERE is_blocklisted = TRUE;

-- antifraud_fingerprint_stats
CREATE INDEX IF NOT EXISTS idx_fp_last_seen ON antifraud_fingerprint_stats(last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_fp_blocklisted ON antifraud_fingerprint_stats(is_blocklisted) WHERE is_blocklisted = TRUE;

-- antifraud_events
CREATE INDEX IF NOT EXISTS idx_events_user_id ON antifraud_events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON antifraud_events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON antifraud_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_ip ON antifraud_events(ip_address);

-- ============================================================================
-- FUNÇÕES UTILITÁRIAS
-- ============================================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_risk_scores_updated_at
    BEFORE UPDATE ON antifraud_risk_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ip_stats_updated_at
    BEFORE UPDATE ON antifraud_ip_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fp_stats_updated_at
    BEFORE UPDATE ON antifraud_fingerprint_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNÇÃO: Limpar estatísticas de rate limit (executar via cron)
-- ============================================================================
CREATE OR REPLACE FUNCTION reset_hourly_rate_limits()
RETURNS void AS $$
BEGIN
    UPDATE antifraud_ip_stats 
    SET signups_last_hour = 0, updated_at = NOW()
    WHERE signups_last_hour > 0;
    
    UPDATE antifraud_fingerprint_stats 
    SET signups_last_hour = 0, updated_at = NOW()
    WHERE signups_last_hour > 0;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RLS (Row Level Security) Policies
-- ============================================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE antifraud_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE antifraud_risk_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE antifraud_events ENABLE ROW LEVEL SECURITY;

-- Políticas: apenas service_role pode acessar (backend)
CREATE POLICY "Service role full access to signals" ON antifraud_signals
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to risk_scores" ON antifraud_risk_scores
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to events" ON antifraud_events
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- DADOS INICIAIS: Domínios de e-mail descartáveis mais comuns
-- ============================================================================
INSERT INTO disposable_email_domains (domain, source) VALUES
    ('tempmail.com', 'initial'),
    ('guerrillamail.com', 'initial'),
    ('10minutemail.com', 'initial'),
    ('throwaway.email', 'initial'),
    ('mailinator.com', 'initial'),
    ('yopmail.com', 'initial'),
    ('temp-mail.org', 'initial'),
    ('fakeinbox.com', 'initial'),
    ('trashmail.com', 'initial'),
    ('dispostable.com', 'initial'),
    ('sharklasers.com', 'initial'),
    ('guerrillamailblock.com', 'initial'),
    ('pokemail.net', 'initial'),
    ('spam4.me', 'initial'),
    ('grr.la', 'initial'),
    ('getairmail.com', 'initial'),
    ('mohmal.com', 'initial'),
    ('tempail.com', 'initial'),
    ('burnermail.io', 'initial'),
    ('mailsac.com', 'initial')
ON CONFLICT (domain) DO NOTHING;

-- ============================================================================
-- COMENTÁRIOS NAS TABELAS
-- ============================================================================
COMMENT ON TABLE antifraud_signals IS 'Armazena sinais coletados durante signup para análise de fraude';
COMMENT ON TABLE antifraud_risk_scores IS 'Score de risco calculado para cada usuário no momento do signup';
COMMENT ON TABLE antifraud_ip_stats IS 'Estatísticas agregadas por IP para detecção de padrões';
COMMENT ON TABLE antifraud_fingerprint_stats IS 'Estatísticas agregadas por fingerprint de dispositivo';
COMMENT ON TABLE antifraud_events IS 'Log de todos os eventos antifraude para auditoria';
COMMENT ON TABLE disposable_email_domains IS 'Lista de domínios de e-mail descartáveis conhecidos';
