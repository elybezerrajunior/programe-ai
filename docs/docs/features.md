# Especificação Funcional Detalhada - bolt.diy

## Índice

- [1. Sistema de Chat e IA](#1-sistema-de-chat-e-ia)
- [2. Gerenciamento de Provedores de IA](#2-gerenciamento-de-provedores-de-ia)
- [3. Ambiente de Desenvolvimento (WebContainer)](#3-ambiente-de-desenvolvimento-webcontainer)
- [4. Editor de Código](#4-editor-de-código)
- [5. Sistema de Arquivos](#5-sistema-de-arquivos)
- [6. Terminal Integrado](#6-terminal-integrado)
- [7. Preview e Visualização](#7-preview-e-visualização)
- [8. Histórico de Chat e Persistência](#8-histórico-de-chat-e-persistência)
- [9. Deploy e Publicação](#9-deploy-e-publicação)
- [10. Integração Git](#10-integração-git)
- [11. Integração Supabase](#11-integração-supabase)
- [12. MCP (Model Context Protocol)](#12-mcp-model-context-protocol)
- [13. Configurações e Personalização](#13-configurações-e-personalização)
- [14. Exportação e Importação](#14-exportação-e-importação)
- [15. Requisitos de UX/UI](#15-requisitos-de-uxui)
- [16. Segurança e Privacidade](#16-segurança-e-privacidade)
- [17. Performance e Confiabilidade](#17-performance-e-confiabilidade)

---

## 1. Sistema de Chat e IA

### 1.1 Chat Principal

#### Descrição
Interface de chat principal onde o usuário interage com a IA para criar e desenvolver projetos. Suporta dois modos: "build" (construção) e "discuss" (discussão).

#### Campos e Validações

**Campos:**
- `input` (string): Texto da mensagem do usuário
  - Tipo: `string`
  - Validação: Máximo 100.000 caracteres
  - Obrigatório: Sim (para enviar mensagem)
  
- `model` (string): Modelo de IA selecionado
  - Tipo: `string`
  - Validação: Deve existir na lista de modelos disponíveis do provedor
  - Obrigatório: Sim
  
- `provider` (ProviderInfo): Provedor de IA selecionado
  - Tipo: `object` com propriedades `{ name: string, ... }`
  - Validação: Deve estar habilitado e configurado
  - Obrigatório: Sim

- `chatMode` ('discuss' | 'build'): Modo de chat
  - Tipo: `'discuss' | 'build'`
  - Validação: Apenas valores permitidos
  - Obrigatório: Sim
  - Default: `'build'`

- `messages` (Message[]): Histórico de mensagens
  - Tipo: `Array<Message>`
  - Estrutura de Message:
    ```typescript
    {
      id: string;
      role: 'user' | 'assistant' | 'system';
      content: string;
      createdAt?: Date;
    }
    ```
  - Validação: Array não pode exceder 10.000 mensagens

- `uploadedFiles` (File[]): Arquivos anexados
  - Tipo: `Array<File>`
  - Validação: Máximo 10 arquivos, tamanho máximo 10MB por arquivo
  - Formatos suportados: Qualquer tipo de arquivo de texto

- `imageDataList` (string[]): Imagens anexadas (base64)
  - Tipo: `Array<string>`
  - Validação: Máximo 5 imagens, tamanho máximo 5MB por imagem
  - Formatos: JPEG, PNG, WebP

#### Regras de Negócio

1. **Modo Build**:
   - IA gera código e cria/modifica arquivos automaticamente
   - Artifacts são processados e executados no WebContainer
   - Preview é atualizado automaticamente após mudanças
   - Comandos shell são executados no terminal integrado

2. **Modo Discuss**:
   - IA fornece orientações e planos sem implementação automática
   - Foco em consulta técnica e discussão
   - Não executa código ou modifica arquivos

3. **Streaming de Respostas**:
   - Respostas são transmitidas em tempo real via Server-Sent Events (SSE)
   - Suporte a recovery de stream em caso de timeout
   - Máximo de 45 segundos de timeout, 2 tentativas de retry

4. **Context Optimization**:
   - Opção para otimizar contexto enviado para IA
   - Seleciona apenas arquivos relevantes baseado no prompt
   - Reduz uso de tokens e melhora performance

#### Validações

**Client-side:**
- Validação de comprimento de input antes de enviar
- Validação de formato de arquivos anexados
- Validação de tamanho de imagens
- Verificação de conexão antes de enviar

**Server-side:**
- Validação de mensagens recebidas
- Sanitização de conteúdo de mensagens
- Validação de provedor e modelo selecionado
- Verificação de API keys válidas

#### Rotas Remix Envolvidas

- `POST /api/chat`: Endpoint principal para envio de mensagens
- `GET /api/health`: Verificação de saúde do sistema

---

### 1.2 Prompt Enhancement

#### Descrição
Sistema que melhora automaticamente os prompts do usuário antes de enviá-los para a IA, tornando-os mais efetivos.

#### Campos

- `originalPrompt` (string): Prompt original do usuário
  - Tipo: `string`
  - Obrigatório: Sim

- `enhancedPrompt` (string): Prompt melhorado pela IA
  - Tipo: `string`
  - Gerado automaticamente

#### Regras de Negócio

1. O enhancement é opcional e pode ser acionado pelo usuário
2. Usa um modelo de IA separado para melhorar o prompt
3. Mantém a intenção original do usuário
4. Adiciona contexto relevante quando necessário

#### Validações

- Prompt original deve ter pelo menos 10 caracteres
- Prompt melhorado não pode exceder 10.000 caracteres

---

### 1.3 Parsing de Mensagens e Artifacts

#### Descrição
Sistema que processa respostas da IA e extrai artifacts (arquivos, comandos, ações) para execução.

#### Estrutura de Artifact

```typescript
interface Artifact {
  id: string;
  title: string;
  actions: Array<{
    type: 'file' | 'shell' | 'start';
    filePath?: string;
    content?: string;
    contentType?: string;
    command?: string;
  }>;
}
```

#### Regras de Negócio

1. **File Actions**:
   - Cria ou atualiza arquivos no WebContainer
   - Cria diretórios automaticamente se necessário
   - Suporta múltiplos tipos de conteúdo (text/plain, application/json, etc.)

2. **Shell Actions**:
   - Executa comandos no terminal integrado
   - Suporta comandos npm, yarn, pnpm
   - Valida comandos antes de executar

3. **Start Actions**:
   - Inicia servidores de desenvolvimento
   - Atualiza preview automaticamente
   - Gerencia múltiplos processos

4. **Enhanced Parsing**:
   - Detecta blocos de código mesmo sem tags de artifact
   - Identifica padrões de arquivos em mensagens de texto
   - Extrai comandos shell do conteúdo

#### Validações

- File paths devem ser válidos e relativos ao diretório de trabalho
- Comandos shell são validados contra lista de comandos permitidos
- Conteúdo de arquivos deve ser texto (não binário)

---

## 2. Gerenciamento de Provedores de IA

### 2.1 Configuração de Provedores

#### Descrição
Sistema de gerenciamento de múltiplos provedores de IA com configuração de API keys e seleção de modelos.

#### Provedores Suportados

**Cloud Providers:**
- OpenAI
- Anthropic
- Google (Gemini)
- Groq
- xAI
- DeepSeek
- Mistral
- Cohere
- Together AI
- Perplexity
- HuggingFace
- OpenRouter
- Moonshot (Kimi)
- Hyperbolic
- GitHub Models
- Amazon Bedrock

**Local Providers:**
- Ollama
- LM Studio
- OpenAI-like (provedores compatíveis)

#### Campos

**Provider Configuration:**
- `name` (string): Nome do provedor
  - Tipo: `string`
  - Validação: Deve ser um dos provedores suportados
  
- `enabled` (boolean): Se o provedor está habilitado
  - Tipo: `boolean`
  - Default: `false`

- `apiKey` (string): Chave de API do provedor
  - Tipo: `string`
  - Validação: Formato específico por provedor
  - Armazenamento: Cookies criptografados

- `baseUrl` (string, opcional): URL base customizada
  - Tipo: `string`
  - Validação: URL válida
  - Obrigatório: Apenas para provedores locais

- `models` (string[]): Lista de modelos disponíveis
  - Tipo: `Array<string>`
  - Gerado automaticamente via API

#### Regras de Negócio

1. **Armazenamento de API Keys**:
   - Keys são armazenadas em cookies criptografados
   - Nunca são enviadas para o servidor em logs
   - Podem ser configuradas via UI ou variáveis de ambiente

2. **Validação de Keys**:
   - Validação em tempo real ao inserir
   - Verificação de formato antes de salvar
   - Teste de conectividade ao habilitar provedor

3. **Seleção de Modelos**:
   - Lista de modelos é atualizada dinamicamente
   - Suporte a busca e filtros
   - Informações de preço (quando disponível)

4. **Bulk Operations**:
   - Habilitar/desabilitar todos os provedores cloud
   - Exportar/importar configurações de API keys

#### Validações

**Client-side:**
- Formato de API key específico por provedor
- URL base deve ser acessível (para provedores locais)
- Verificação de conectividade

**Server-side:**
- Validação de API key ao fazer requisições
- Rate limiting por provedor
- Tratamento de erros de autenticação

#### Rotas Remix Envolvidas

- `GET /api/configured-providers`: Lista provedores configurados
- `GET /api/models`: Lista modelos disponíveis
- `GET /api/models/:provider`: Modelos de um provedor específico
- `POST /api/check-env-key`: Verifica validade de API key

---

### 2.2 OpenRouter Integration

#### Descrição
Integração especial com OpenRouter para acesso unificado a múltiplos modelos.

#### Funcionalidades Especiais

- **Free Models Filter**: Filtro para mostrar apenas modelos gratuitos
- **Pricing Information**: Exibição de custos de input/output
- **Model Search**: Busca fuzzy através de todos os modelos disponíveis
- **Auto-detection**: Detecção automática de modelos populares

#### Campos Adicionais

- `showFreeOnly` (boolean): Mostrar apenas modelos gratuitos
  - Tipo: `boolean`
  - Default: `false`

- `pricing` (object): Informações de preço
  - Tipo: `{ input: number, output: number }`
  - Preço por token em dólares

---

### 2.3 Ollama Integration

#### Descrição
Integração com Ollama para execução local de modelos de IA.

#### Funcionalidades Especiais

- **Model Installer**: Interface para instalar novos modelos
- **Progress Tracking**: Progresso de download em tempo real
- **Model Details**: Visualização de tamanho, parâmetros e quantização
- **Auto-refresh**: Detecção automática de modelos recém-instalados

#### Campos Adicionais

- `endpoint` (string): Endpoint da API Ollama
  - Tipo: `string`
  - Default: `http://127.0.0.1:11434`
  - Validação: URL válida e acessível

- `installedModels` (array): Modelos instalados localmente
  - Tipo: `Array<{ name: string, size: number, ... }>`
  - Atualizado via polling

#### Rotas Remix Envolvidas

- `GET /api/models/ollama`: Lista modelos Ollama instalados
- Polling automático para detectar novos modelos

---

## 3. Ambiente de Desenvolvimento (WebContainer)

### 3.1 Inicialização do WebContainer

#### Descrição
WebContainer é inicializado uma vez por sessão e fornece um ambiente Node.js completo no navegador.

#### Configuração

```typescript
WebContainer.boot({
  coep: 'credentialless',
  workdirName: WORK_DIR_NAME, // 'home/project'
  forwardPreviewErrors: true
})
```

#### Regras de Negócio

1. **Singleton Pattern**: Apenas uma instância por sessão
2. **Hot Module Replacement**: Mantém estado durante desenvolvimento
3. **Error Forwarding**: Erros do preview são capturados e exibidos
4. **Inspector Script**: Script customizado injetado no preview para debugging

#### Comandos Disponíveis

**Sistema:**
- `cat`, `chmod`, `cp`, `echo`, `hostname`, `kill`, `ln`, `ls`, `mkdir`, `mv`, `ps`, `pwd`, `rm`, `rmdir`, `xxd`

**Extras:**
- `alias`, `cd`, `clear`, `env`, `false`, `getconf`, `head`, `sort`, `tail`, `touch`, `true`, `uptime`, `which`

**Interpreters:**
- `node`, `python`, `python3`

**Não Disponíveis:**
- Git (usar isomorphic-git)
- Compiladores nativos (C/C++, Rust)
- Supabase CLI

---

### 3.2 Gerenciamento de Arquivos

#### Descrição
Sistema completo de gerenciamento de arquivos no WebContainer.

#### Operações Suportadas

1. **Criação de Arquivos**:
   - Criar arquivos individuais
   - Criar diretórios recursivamente
   - Suporte a múltiplos arquivos em lote

2. **Modificação de Arquivos**:
   - Edição de arquivos existentes
   - Rastreamento de arquivos modificados
   - Sistema de file locking para evitar conflitos

3. **Exclusão de Arquivos**:
   - Exclusão de arquivos individuais
   - Exclusão de diretórios recursivos
   - Rastreamento de paths deletados

4. **Leitura de Arquivos**:
   - Leitura de conteúdo completo
   - Leitura de metadados
   - Listagem de diretórios

#### Campos e Validações

**File Path:**
- Tipo: `string`
- Validação: Path relativo ao workdir, não pode conter `..`
- Obrigatório: Sim

**File Content:**
- Tipo: `string` (UTF-8)
- Validação: Apenas texto, não binário
- Limite: Praticamente ilimitado (limitado por memória do browser)

**File Locking:**
- Arquivos podem ser bloqueados durante operações da IA
- Previne conflitos de escrita simultânea
- Auto-release após operação completar

#### Rotas Relacionadas

- Operações de arquivo são executadas diretamente no WebContainer
- Não há rotas HTTP específicas (execução client-side)

---

## 4. Editor de Código

### 4.1 Editor Principal

#### Descrição
Editor de código integrado baseado em CodeMirror 6 com suporte a múltiplas linguagens.

#### Funcionalidades

- **Syntax Highlighting**: Suporte a 20+ linguagens
- **Auto-complete**: Autocompletar baseado em contexto
- **Multi-cursor**: Edição em múltiplas posições
- **Find & Replace**: Busca e substituição
- **Line Numbers**: Numeração de linhas
- **Folding**: Colapsar/expandir blocos de código

#### Linguagens Suportadas

- JavaScript/TypeScript
- HTML/CSS/SCSS
- Python
- JSON
- Markdown
- C/C++
- Vue
- WAST
- E mais...

#### Campos

- `selectedFile` (string | undefined): Arquivo selecionado no editor
  - Tipo: `string | undefined`
  - Validação: Deve existir no sistema de arquivos

- `unsavedFiles` (Set<string>): Arquivos modificados não salvos
  - Tipo: `Set<string>`
  - Usado para indicadores visuais

#### Regras de Negócio

1. **Auto-save**: Arquivos são salvos automaticamente no WebContainer
2. **File Selection**: Apenas um arquivo editável por vez
3. **Unsaved Indicator**: Indica arquivos com mudanças não persistidas
4. **Theme Support**: Suporte a temas claro/escuro

---

### 4.2 Diff View

#### Descrição
Visualização de diferenças entre versões de arquivos.

#### Funcionalidades

- **Side-by-side Comparison**: Comparação lado a lado
- **Inline Diffs**: Diffs inline com highlighting
- **Unified View**: Visualização unificada
- **Syntax Highlighting**: Highlighting preservado no diff

#### Campos

- `originalContent` (string): Conteúdo original
  - Tipo: `string`
  - Obrigatório: Sim

- `modifiedContent` (string): Conteúdo modificado
  - Tipo: `string`
  - Obrigatório: Sim

#### Regras de Negócio

1. Diffs são gerados automaticamente quando IA modifica arquivos
2. Usuário pode aceitar/rejeitar mudanças
3. Diffs são temporários e não persistem

---

## 5. Sistema de Arquivos

### 5.1 File Store

#### Descrição
Store reativo que gerencia o estado de todos os arquivos no WebContainer.

#### Estrutura de Dados

```typescript
type FileMap = Record<string, Dirent | undefined>;

interface Dirent {
  name: string;
  kind: 'file' | 'directory';
  // ... outros metadados
}
```

#### Funcionalidades

1. **Sync com WebContainer**: Mantém sincronização bidirecional
2. **File Watching**: Observa mudanças no sistema de arquivos
3. **Modified Files Tracking**: Rastreia arquivos modificados
4. **Deleted Paths Tracking**: Rastreia paths deletados para prevenir re-criação

#### Campos

- `files` (MapStore<FileMap>): Mapa de todos os arquivos
  - Tipo: `MapStore<FileMap>`
  - Reativo via Nanostores

- `filesCount` (number): Número total de arquivos
  - Tipo: `number`
  - Calculado automaticamente

- `modifiedFiles` (Map<string, string>): Arquivos modificados com conteúdo original
  - Tipo: `Map<string, string>`
  - Usado para contexto na próxima mensagem

---

## 6. Terminal Integrado

### 6.1 Terminal Principal

#### Descrição
Terminal funcional integrado baseado em xterm.js para executar comandos.

#### Funcionalidades

- **Command Execution**: Execução de comandos shell
- **Output Streaming**: Saída em tempo real
- **Multiple Terminals**: Suporte a múltiplos terminais
- **Scroll History**: Histórico de scroll
- **Copy/Paste**: Copiar/colar funcional

#### Campos

- `output` (string): Saída do terminal
  - Tipo: `string`
  - Atualizado em tempo real

- `exitCode` (number | undefined): Código de saída do último comando
  - Tipo: `number | undefined`

#### Regras de Negócio

1. **Command Queue**: Comandos são executados em fila
2. **Auto-scroll**: Scroll automático para nova saída
3. **Error Handling**: Erros são capturados e exibidos
4. **Process Management**: Gerenciamento de processos em execução

---

## 7. Preview e Visualização

### 7.1 Preview Store

#### Descrição
Sistema que gerencia múltiplas visualizações de preview do projeto.

#### Funcionalidades

- **Multiple Previews**: Suporte a múltiplos previews simultâneos
- **Auto-reload**: Reload automático quando arquivos mudam
- **URL Management**: Gerenciamento de URLs de preview
- **Error Display**: Exibição de erros do preview

#### Campos

```typescript
interface PreviewInfo {
  url: string;
  port: number;
  baseUrl: string;
}
```

#### Regras de Negócio

1. **Port Management**: Portas são atribuídas automaticamente
2. **Error Forwarding**: Erros são capturados e exibidos no UI
3. **Refresh**: Preview atualiza automaticamente após mudanças
4. **Isolation**: Cada preview é isolado em iframe

---

## 8. Histórico de Chat e Persistência

### 8.1 Chat History

#### Descrição
Sistema de persistência de histórico de conversas usando IndexedDB.

#### Funcionalidades

- **Save Chat**: Salvar conversas automaticamente
- **Load Chat**: Carregar conversas anteriores
- **Delete Chat**: Excluir conversas
- **Bulk Operations**: Operações em lote (delete múltiplo)
- **Export/Import**: Exportar e importar chats

#### Campos

```typescript
interface ChatHistoryItem {
  id: string;
  description: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    projectType?: string;
    model?: string;
    provider?: string;
  };
}
```

#### Regras de Negócio

1. **Auto-save**: Chats são salvos automaticamente após cada mensagem
2. **Description Generation**: Descrição é gerada automaticamente pela IA
3. **Date Binning**: Agrupamento por data no sidebar
4. **Search**: Busca através do histórico

#### Validações

- ID único para cada chat
- Messages devem ser válidos
- Descrição não pode exceder 200 caracteres

#### Rotas Remix Envolvidas

- Persistência é client-side via IndexedDB
- Não há rotas HTTP específicas

---

## 9. Deploy e Publicação

### 9.1 Netlify Deploy

#### Descrição
Deploy direto de projetos para Netlify.

#### Campos

- `siteName` (string): Nome do site
  - Tipo: `string`
  - Validação: URL-safe, único
  - Obrigatório: Sim

- `buildCommand` (string): Comando de build
  - Tipo: `string`
  - Default: `npm run build`
  - Obrigatório: Não

- `publishDirectory` (string): Diretório de publicação
  - Tipo: `string`
  - Default: `dist` ou `build`
  - Obrigatório: Não

#### Regras de Negócio

1. **Authentication**: Requer autenticação Netlify via OAuth
2. **Build Process**: Build é executado antes do deploy
3. **Status Tracking**: Rastreamento de status do deploy
4. **Error Handling**: Tratamento de erros de deploy

#### Validações

- Site name deve ser único na conta Netlify
- Build command deve ser válido
- Publish directory deve existir após build

#### Rotas Remix Envolvidas

- `GET /api/netlify-user`: Informações do usuário Netlify
- `POST /api/netlify-deploy`: Iniciar deploy

---

### 9.2 Vercel Deploy

#### Descrição
Deploy direto de projetos para Vercel.

#### Campos e Validações

Similar ao Netlify, com:
- Suporte a projetos e deployments
- Configuração via `vercel.json`
- Rastreamento de deployments

#### Rotas Remix Envolvidas

- `GET /api/vercel-user`: Informações do usuário Vercel
- `POST /api/vercel-deploy`: Iniciar deploy

---

### 9.3 GitHub Pages Deploy

#### Descrição
Deploy para GitHub Pages através de repositório Git.

#### Requisitos

- Repositório GitHub existente ou criar novo
- Permissões de write no repositório
- GitHub Actions habilitado

#### Rotas Remix Envolvidas

- `POST /api/github-deploy`: Iniciar deploy para GitHub Pages
- Requer integração com GitHub API

---

## 10. Integração Git

### 10.1 Clone de Repositórios

#### Descrição
Clone de repositórios Git para o WebContainer usando isomorphic-git.

#### Funcionalidades

- **GitHub Clone**: Clone de repositórios GitHub
- **GitLab Clone**: Clone de repositórios GitLab
- **Branch Selection**: Seleção de branch específico
- **Shallow Clone**: Clone raso para projetos grandes

#### Campos

- `repositoryUrl` (string): URL do repositório
  - Tipo: `string`
  - Validação: URL Git válida
  - Obrigatório: Sim

- `branch` (string): Branch a clonar
  - Tipo: `string`
  - Default: `main` ou `master`
  - Validação: Branch deve existir

#### Regras de Negócio

1. **Git Proxy**: Usa proxy server-side para clone
2. **Progress Tracking**: Progresso de clone exibido
3. **Error Handling**: Tratamento de erros de rede/repositório

#### Rotas Remix Envolvidas

- `GET /api/git-proxy/*`: Proxy para operações Git
- `GET /api/git-info`: Informações do repositório Git
- `GET /api/github-branches`: Lista branches GitHub
- `GET /api/gitlab-branches`: Lista branches GitLab

---

### 10.2 GitHub Integration

#### Descrição
Integração com GitHub para operações avançadas.

#### Funcionalidades

- **User Info**: Informações do usuário autenticado
- **Repository List**: Lista de repositórios
- **Branch List**: Lista de branches
- **Stats**: Estatísticas de repositórios
- **Template Import**: Importar templates GitHub

#### Rotas Remix Envolvidas

- `GET /api/github-user`: Informações do usuário
- `GET /api/github-branches`: Branches de um repositório
- `GET /api/github-stats`: Estatísticas
- `GET /api/github-template`: Importar template

---

### 10.3 GitLab Integration

#### Descrição
Integração com GitLab similar ao GitHub.

#### Rotas Remix Envolvidas

- `GET /api/gitlab-projects`: Projetos GitLab
- `GET /api/gitlab-branches`: Branches de um projeto

---

## 11. Integração Supabase

### 11.1 Conexão Supabase

#### Descrição
Integração com Supabase para gerenciamento de bancos de dados.

#### Campos

```typescript
interface SupabaseCredentials {
  supabaseUrl: string;
  anonKey: string;
  serviceRoleKey?: string;
}

interface SupabaseConnectionState {
  user: User | null;
  token: string;
  stats?: DatabaseStats;
  selectedProjectId?: string;
  isConnected: boolean;
  project?: Project;
  credentials?: SupabaseCredentials;
}
```

#### Validações

- `supabaseUrl`: Deve ser URL válida do Supabase
- `anonKey`: Deve ser chave válida
- Credenciais são armazenadas localmente (localStorage)

#### Regras de Negócio

1. **Authentication**: Conexão via OAuth ou credentials
2. **Project Selection**: Seleção de projeto Supabase
3. **Database Stats**: Estatísticas do banco exibidas
4. **Query Execution**: Execução de queries SQL

#### Rotas Remix Envolvidas

- `GET /api/supabase-user`: Informações do usuário Supabase
- `POST /api/supabase/query`: Executar query SQL
- `GET /api/supabase/variables`: Variáveis de ambiente

---

## 12. MCP (Model Context Protocol)

### 12.1 MCP Integration

#### Descrição
Integração com MCP para ferramentas e contextos avançados de IA.

#### Funcionalidades

- **Server Management**: Gerenciamento de servidores MCP
- **Tool Discovery**: Descoberta de ferramentas disponíveis
- **Tool Execution**: Execução de ferramentas MCP
- **Config Management**: Gerenciamento de configuração

#### Campos

```typescript
interface MCPSettings {
  mcpConfig: MCPConfig;
}

interface MCPConfig {
  servers: Record<string, MCPServerConfig>;
}
```

#### Regras de Negócio

1. **Server Availability**: Verificação de disponibilidade de servidores
2. **Tool Registration**: Registro automático de ferramentas
3. **Error Handling**: Tratamento de erros de servidores

#### Rotas Remix Envolvidas

- `GET /api/mcp-check`: Verificar disponibilidade de servidores
- `POST /api/mcp-update-config`: Atualizar configuração MCP

---

## 13. Configurações e Personalização

### 13.1 Settings Store

#### Descrição
Sistema centralizado de configurações da aplicação.

#### Categorias de Settings

1. **Providers**: Configuração de provedores de IA
2. **Theme**: Configuração de tema (dark/light)
3. **Editor**: Configurações do editor
4. **Terminal**: Configurações do terminal
5. **Advanced**: Configurações avançadas

#### Campos

- `selectedTab` (string): Tab selecionado nas settings
  - Tipo: `string`
  - Validação: Deve existir na lista de tabs

- `theme` ('dark' | 'light'): Tema selecionado
  - Tipo: `'dark' | 'light'`
  - Default: `'dark'`
  - Persistido em localStorage

#### Rotas Remix Envolvidas

- Settings são persistidas client-side
- Não há rotas HTTP específicas

---

### 13.2 Theme System

#### Descrição
Sistema de temas dinâmico baseado em CSS variables.

#### Funcionalidades

- **Dark/Light Mode**: Alternância entre temas
- **CSS Variables**: Cores definidas via variáveis CSS
- **Smooth Transitions**: Transições suaves entre temas
- **Persistent**: Tema persiste entre sessões

#### Variáveis CSS Principais

```css
--programe-elements-background-depth-1
--programe-elements-background-depth-2
--programe-elements-textPrimary
--programe-elements-textSecondary
--programe-elements-borderColor
/* ... e muitas outras */
```

---

## 14. Exportação e Importação

### 14.1 Export de Projeto

#### Descrição
Exportar projeto completo como arquivo ZIP.

#### Funcionalidades

- **Full Export**: Todos os arquivos do projeto
- **ZIP Generation**: Geração de arquivo ZIP no browser
- **Download**: Download automático do ZIP

#### Regras de Negócio

1. Todos os arquivos do WebContainer são incluídos
2. Estrutura de diretórios é preservada
3. Arquivos binários são excluídos (apenas texto)

---

### 14.2 Export/Import de Chat

#### Descrição
Exportar e importar conversas de chat.

#### Formato

- **Export**: JSON com estrutura completa do chat
- **Import**: Restaura chat completo incluindo histórico

#### Campos Exportados

- `description`: Descrição do chat
- `messages`: Todas as mensagens
- `metadata`: Metadados adicionais

---

## 15. Requisitos de UX/UI

### 15.1 Responsividade

#### Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

#### Adaptações

- Layout adaptativo para mobile
- Sidebar colapsável em mobile
- Touch-friendly controls
- Scroll otimizado para touch

---

### 15.2 Acessibilidade

#### Requisitos

- **WCAG 2.1 AA**: Conformidade com diretrizes WCAG
- **Keyboard Navigation**: Navegação completa por teclado
- **Screen Readers**: Suporte a leitores de tela
- **ARIA Labels**: Labels apropriados em todos os elementos
- **Focus Management**: Gerenciamento de foco adequado
- **Color Contrast**: Contraste mínimo 4.5:1 para texto

#### Atalhos de Teclado

- `Cmd/Ctrl + K`: Busca global
- `Cmd/Ctrl + /`: Mostrar atalhos
- `Esc`: Fechar modais/dropdowns
- `Tab`: Navegação entre elementos

---

### 15.3 Performance

#### Requisitos

- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **Lazy Loading**: Carregamento lazy de componentes pesados
- **Code Splitting**: Splitting automático de código
- **Memoization**: Uso adequado de memo/callback

---

## 16. Segurança e Privacidade

### 16.1 API Keys

#### Armazenamento

- **Client-side**: Armazenadas em cookies criptografados
- **Nunca no servidor**: Keys nunca são logadas ou armazenadas no servidor
- **HTTPS Only**: Cookies apenas via HTTPS em produção

#### Validação

- Validação de formato antes de salvar
- Teste de conectividade sem expor key em logs
- Rate limiting por key

---

### 16.2 Sanitização

#### Input Sanitization

- Sanitização de todos os inputs do usuário
- Escape de HTML em mensagens
- Validação de file paths
- Prevenção de path traversal

---

### 16.3 Content Security Policy

#### Headers

- CSP headers configurados
- Restrições de origem para recursos externos
- Sandboxing de iframes de preview

---

## 17. Performance e Confiabilidade

### 17.1 Stream Recovery

#### Descrição
Sistema de recovery para streams de IA que podem falhar.

#### Funcionalidades

- **Timeout Detection**: Detecção de timeouts (45s)
- **Auto-retry**: Retry automático (2 tentativas)
- **Resume**: Retomar stream do ponto de falha
- **Error Reporting**: Reporte de erros persistentes

---

### 17.2 Caching

#### Estratégias

- **Model List Caching**: Cache de lista de modelos
- **Provider Settings Caching**: Cache de configurações
- **Chat History Caching**: Cache de histórico no IndexedDB

---

### 17.3 Error Handling

#### Níveis

1. **Client-side Errors**: Tratamento e exibição no UI
2. **Server-side Errors**: Logging e reporte ao usuário
3. **Network Errors**: Retry e fallback
4. **WebContainer Errors**: Captura e exibição de erros

---

*Documentação completa e atualizada. Para mais detalhes técnicos, veja [ARCHITECTURE.md](./ARCHITECTURE.md)*

