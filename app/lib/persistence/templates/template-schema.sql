-- Tabela para armazenar os templates de projetos
CREATE TABLE templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('apps', 'landing', 'components', 'dashboards', 'other')),
  tags TEXT[], -- Ex: ['React', 'Tailwind', 'Free']
  technologies TEXT[], -- Ex: ['React', 'Vite', 'TailwindCSS']
  
  -- Para controle de acesso/visibilidade
  is_public BOOLEAN DEFAULT false,
  author_id uuid REFERENCES auth.users(id),
  
  -- Informações visuais
  image_url TEXT, -- URL da thumbnail ou preview
  gradient TEXT, -- Ex: 'from-blue-500 to-indigo-600' (para fallback visual)
  
  -- Métricas (opcional, já que removemos da tela, mas útil ter no banco)
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  
  -- O CONTEÚDO DO PROJETO
  -- Armazena: { "src/App.tsx": { "file": { "contents": "..." } }, ... }
  content_snapshot JSONB NOT NULL
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso

-- 1. Qualquer pessoa pode ver templates públicos
CREATE POLICY "Public templates are viewable by everyone" 
ON templates FOR SELECT 
USING (is_public = true);

-- 2. Apenas admins ou o autor podem editar (exemplo simplificado: apenas autor)
CREATE POLICY "Authors can update their own templates" 
ON templates FOR UPDATE 
USING (auth.uid() = author_id);

-- 3. Apenas admins ou o autor podem deletar
CREATE POLICY "Authors can delete their own templates" 
ON templates FOR DELETE 
USING (auth.uid() = author_id);

-- 4. Autores autenticados podem inserir novos templates
CREATE POLICY "Authenticated users can insert templates" 
ON templates FOR INSERT 
WITH CHECK (auth.uid() = author_id);
