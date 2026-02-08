-- Corrigir e garantir permissões de acesso
-- Execute isso no SQL Editor do Supabase

-- 1. Garantir que as roles do Supabase tenham permissão básica de SELECT na tabela
GRANT SELECT ON templates TO anon;
GRANT SELECT ON templates TO authenticated;
GRANT SELECT ON templates TO service_role;

-- 2. Recriar a política de segurança (RLS) para garantir que funcione para todos (público)
DROP POLICY IF EXISTS "Public templates are viewable by everyone" ON templates;

CREATE POLICY "Public templates are viewable by everyone" 
ON templates FOR SELECT 
TO public
USING (is_public = true);

-- 3. (Opcional) Verificar se existem templates (apenas para debug no editor SQL)
SELECT id, title, is_public FROM templates;
