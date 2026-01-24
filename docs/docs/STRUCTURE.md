# Estrutura de Pastas e Organização - bolt.diy

## Índice

- [Estrutura Geral do Projeto](#estrutura-geral-do-projeto)
- [Raiz do Projeto](#raiz-do-projeto)
- [Core - Funcionalidades Compartilhadas](#core---funcionalidades-compartilhadas)
- [Features - Módulos da Aplicação](#features---módulos-da-aplicação)
- [Estrutura de Rotas Remix](#estrutura-de-rotas-remix)
- [Convenções de Nomenclatura](#convenções-de-nomenclatura)
- [Barrel Files](#barrel-files)
- [Configuração e Build](#configuração-e-build)
- [Assets](#assets)
- [Estrutura de Testes](#estrutura-de-testes)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Resumo da Organização](#resumo-da-organização)
- [Checklist para Criar uma Nova Feature](#checklist-para-criar-uma-nova-feature)
- [Exemplo Completo de uma Feature](#exemplo-completo-de-uma-feature)

---

## Estrutura Geral do Projeto

```
bolt.diy/
├── app/                      # Código fonte principal (Remix app directory)
│   ├── components/           # Componentes React organizados por feature
│   ├── lib/                  # Lógica de negócio e utilitários
│   ├── routes/               # Rotas Remix (file-based routing)
│   ├── styles/               # Estilos globais (SCSS, CSS)
│   ├── types/                # Tipos TypeScript compartilhados
│   ├── utils/                # Utilitários e helpers
│   ├── root.tsx              # Root component do Remix
│   ├── entry.client.tsx      # Client entry point
│   └── entry.server.tsx      # Server entry point
├── assets/                   # Assets estáticos (icons, etc.)
├── docs/                     # Documentação
├── electron/                 # Código do Electron (desktop app)
│   ├── main/                 # Electron main process
│   └── preload/              # Electron preload scripts
├── functions/                # Cloudflare Functions (se aplicável)
├── icons/                    # SVG icons do projeto
├── public/                   # Arquivos públicos estáticos
├── scripts/                  # Scripts de build e utilitários
├── .env.example              # Exemplo de variáveis de ambiente
├── docker-compose.yaml       # Configuração Docker
├── Dockerfile                # Dockerfile para container
├── electron-builder.yml      # Configuração Electron Builder
├── package.json              # Dependências e scripts
├── pnpm-lock.yaml            # Lock file do pnpm
├── tsconfig.json             # Configuração TypeScript
├── uno.config.ts             # Configuração UnoCSS
├── vite.config.ts            # Configuração Vite
└── wrangler.toml             # Configuração Cloudflare Workers
```

---

## Raiz do Projeto

### Estrutura do Remix (app/ directory)

O Remix utiliza a convenção de `app/` directory, onde todos os arquivos da aplicação são organizados.

```
app/
├── components/               # Componentes React
├── lib/                      # Biblioteca de código compartilhado
├── routes/                   # Rotas do Remix
├── styles/                   # Estilos globais
├── types/                    # Tipos TypeScript
├── utils/                    # Funções utilitárias
├── root.tsx                  # Root layout component
├── entry.client.tsx          # Client-side entry point
└── entry.server.tsx          # Server-side entry point
```

### Arquivos de Configuração

#### `root.tsx`
- Componente raiz da aplicação Remix
- Define estrutura HTML base
- Gerencia temas e providers globais

#### `entry.client.tsx`
- Ponto de entrada do cliente
- Hidrata a aplicação React
- Configura hot module replacement

#### `entry.server.tsx`
- Ponto de entrada do servidor
- Renderiza HTML no servidor
- Configurações específicas do Cloudflare Workers

---

## Core - Funcionalidades Compartilhadas

### `app/lib/` - Biblioteca Compartilhada

```
lib/
├── .server/                  # Código exclusivo do servidor
│   └── llm/                  # Lógica de LLM server-side
│       ├── constants.ts
│       ├── create-summary.ts
│       ├── select-context.ts
│       ├── stream-recovery.ts
│       ├── stream-text.ts
│       └── utils.ts
├── api/                      # Clientes de API
│   ├── github.ts
│   ├── gitlab.ts
│   ├── netlify.ts
│   ├── supabase.ts
│   └── vercel.ts
├── common/                   # Código comum
│   ├── prompt-library.ts
│   └── prompts/              # System prompts
│       ├── discuss-prompt.ts
│       ├── new-prompt.ts
│       ├── optimized.ts
│       └── prompts.ts
├── crypto.ts                 # Funções de criptografia
├── fetch.ts                  # Cliente HTTP customizado
├── hooks/                    # Hooks customizados compartilhados
│   ├── index.ts              # Barrel file
│   ├── useConnectionStatus.ts
│   ├── useDataOperations.ts
│   ├── useEditChatDescription.ts
│   ├── useFeatures.ts
│   ├── useGit.ts
│   ├── useGitHubAPI.ts
│   ├── useGitHubConnection.ts
│   ├── useGitHubStats.ts
│   ├── useGitLabAPI.ts
│   ├── useGitLabConnection.ts
│   ├── useIndexedDB.ts
│   ├── useLocalModelHealth.ts
│   ├── useLocalProviders.ts
│   ├── useMessageParser.ts
│   ├── useNotifications.ts
│   ├── usePromptEnhancer.ts
│   ├── useSearchFilter.ts
│   ├── useSettings.ts
│   ├── useShortcuts.ts
│   ├── useSupabaseConnection.ts
│   └── useViewport.ts
├── modules/                  # Módulos organizados por funcionalidade
│   ├── chat.ts
│   ├── deploy.ts
│   └── ...
├── persistence/              # Lógica de persistência
│   ├── description.ts
│   ├── history.ts
│   └── ...
├── runtime/                  # Runtime e execução
│   ├── action-runner.ts
│   ├── enhanced-message-parser.ts
│   ├── message-parser.ts
│   └── ...
├── security.ts               # Funções de segurança
├── services/                 # Serviços e casos de uso
│   ├── chatService.ts
│   ├── mcpService.ts
│   └── ...
├── stores/                   # Stores de estado global
│   ├── chat.ts
│   ├── editor.ts
│   ├── files.ts
│   ├── github.ts
│   ├── mcp.ts
│   ├── previews.ts
│   ├── profile.ts
│   ├── settings.ts
│   ├── supabase.ts
│   ├── tabConfigurationStore.ts
│   ├── terminal.ts
│   ├── theme.ts
│   ├── vercel.ts
│   └── workbench.ts
├── utils/                    # Utilitários compartilhados
│   └── logger.ts
└── webcontainer/             # Integração WebContainer
    ├── index.ts
    └── types.ts
```

#### Descrição de Cada Módulo

**`.server/`**: Código que roda exclusivamente no servidor (loaders, actions, server-side LLM calls)

**`api/`**: Clientes para APIs externas (GitHub, GitLab, Supabase, etc.)

**`common/`**: Código compartilhado entre client e server (prompts, configurações)

**`hooks/`**: Hooks React customizados reutilizáveis

**`modules/`**: Módulos organizados por funcionalidade principal

**`persistence/`**: Lógica de persistência de dados (IndexedDB, localStorage)

**`runtime/`**: Runtime da aplicação (parsing de mensagens, execução de ações)

**`services/`**: Serviços e casos de uso que orquestram lógica de negócio

**`stores/`**: Stores de estado global (Zustand, Nanostores)

**`webcontainer/`**: Integração com WebContainer API

---

### `app/components/` - Componentes React

```
components/
├── @settings/                # Feature: Settings (Route Groups)
│   ├── core/                 # Componentes core das settings
│   ├── index.ts              # Barrel file
│   ├── shared/               # Componentes compartilhados das settings
│   ├── tabs/                 # Tabs das settings
│   └── utils/                # Utilitários das settings
├── chat/                     # Feature: Chat
│   ├── APIKeyManager.tsx
│   ├── Artifact.tsx
│   ├── AssistantMessage.tsx
│   ├── BaseChat.module.scss
│   ├── BaseChat.tsx
│   ├── Chat.client.tsx
│   ├── ChatAlert.tsx
│   ├── ChatBox.tsx
│   ├── CodeBlock.module.scss
│   ├── CodeBlock.tsx
│   ├── DicussMode.tsx
│   ├── ExamplePrompts.tsx
│   ├── FilePreview.tsx
│   ├── GitCloneButton.tsx
│   ├── ImportFolderButton.tsx
│   ├── LLMApiAlert.tsx
│   ├── Markdown.module.scss
│   ├── Markdown.spec.ts
│   ├── Markdown.tsx
│   ├── MCPTools.tsx
│   ├── Messages.client.tsx
│   ├── ModelSelector.tsx
│   ├── NetlifyDeploymentLink.client.tsx
│   ├── ProgressCompilation.tsx
│   ├── ScreenshotStateManager.tsx
│   ├── SendButton.client.tsx
│   ├── SpeechRecognition.tsx
│   ├── StarterTemplates.tsx
│   ├── SupabaseAlert.tsx
│   ├── SupabaseConnection.tsx
│   ├── ThoughtBox.tsx
│   ├── ToolInvocations.tsx
│   ├── UserMessage.tsx
│   └── VercelDeploymentLink.client.tsx
├── deploy/                   # Feature: Deploy
│   ├── DeployAlert.tsx
│   ├── DeployButton.tsx
│   ├── GitHubDeploy.client.tsx
│   ├── GitHubDeploymentDialog.tsx
│   ├── GitLabDeploy.client.tsx
│   ├── GitLabDeploymentDialog.tsx
│   ├── NetlifyDeploy.client.tsx
│   └── VercelDeploy.client.tsx
├── editor/                   # Feature: Code Editor
│   └── codemirror/           # Integração CodeMirror
│       ├── CodeMirrorEditor.tsx
│       ├── extensions.ts
│       ├── languages.ts
│       ├── theme.ts
│       └── utils.ts
├── git/                      # Feature: Git Integration
│   └── GitUrlImport.client.tsx
├── header/                   # Feature: Header
│   ├── Header.tsx
│   └── HeaderActionButtons.client.tsx
├── sidebar/                  # Feature: Sidebar
│   ├── date-binning.ts
│   ├── HistoryItem.tsx
│   └── Menu.client.tsx
├── ui/                       # Componentes UI reutilizáveis
│   ├── Accordion.tsx
│   ├── Alert.tsx
│   ├── BackgroundRays.tsx
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Checkbox.tsx
│   ├── Dialog.tsx
│   ├── DropdownMenu.tsx
│   ├── Input.tsx
│   ├── Label.tsx
│   ├── Popover.tsx
│   ├── Progress.tsx
│   ├── ScrollArea.tsx
│   ├── Separator.tsx
│   ├── Switch.tsx
│   ├── Tabs.tsx
│   ├── Tooltip.tsx
│   └── ...
└── workbench/                # Feature: Workbench (Editor, Preview, Terminal)
    ├── DiffView.tsx
    ├── Editor.tsx
    ├── FileExplorer.tsx
    ├── Preview.tsx
    ├── Terminal.tsx
    ├── Workbench.tsx
    └── ...
```

---

### `app/types/` - Tipos TypeScript

```
types/
├── actions.ts                # Tipos de ações e alerts
├── artifact.ts               # Tipos de artifacts
├── context.ts                # Tipos de contexto
├── design-scheme.ts          # Tipos de design scheme
├── GitHub.ts                 # Tipos da API GitHub
├── GitLab.ts                 # Tipos da API GitLab
├── global.d.ts               # Tipos globais
├── model.ts                  # Tipos de modelos de IA
├── netlify.ts                # Tipos da API Netlify
├── supabase.ts               # Tipos da API Supabase
├── template.ts               # Tipos de templates
├── terminal.ts               # Tipos do terminal
└── vercel.ts                 # Tipos da API Vercel
```

---

### `app/utils/` - Utilitários

```
utils/
├── buffer.ts                 # Utilitários de Buffer
├── classNames.ts             # Helper para classNames
├── constants.ts              # Constantes da aplicação
├── debounce.ts               # Função debounce
├── debugLogger.ts            # Logger de debug
├── diff.spec.ts              # Testes de diff
├── diff.ts                   # Funções de diff
├── easings.ts                # Funções de easing para animações
├── fileLocks.ts              # Sistema de file locking
├── fileUtils.ts              # Utilitários de arquivos
├── folderImport.ts           # Importação de pastas
├── formatSize.ts             # Formatação de tamanhos
├── getLanguageFromExtension.ts
├── githubStats.ts            # Estatísticas GitHub
├── gitlabStats.ts            # Estatísticas GitLab
├── logger.ts                 # Logger principal
├── markdown.ts               # Utilitários de Markdown
├── mobile.ts                 # Detecção de mobile
├── os.ts                     # Detecção de OS
├── path.ts                   # Utilitários de path
├── projectCommands.ts        # Comandos de projeto
├── promises.ts               # Utilitários de Promises
├── react.ts                  # Utilitários React
├── sampler.ts                # Funções de sampling
├── selectStarterTemplate.ts
├── shell.ts                  # Utilitários de shell
├── stacktrace.ts             # Limpeza de stack traces
├── stripIndent.ts            # Remove indentação
└── unreachable.ts            # Função para casos unreachable
```

---

### `app/styles/` - Estilos Globais

```
styles/
├── animations.scss           # Animações CSS
├── components/               # Estilos de componentes
│   ├── button.scss
│   ├── card.scss
│   └── ...
├── diff-view.css             # Estilos do diff view
├── index.scss                # Estilos principais
├── variables.scss            # Variáveis CSS (cores, espaçamento)
└── z-index.scss              # Z-index scale
```

---

## Features - Módulos da Aplicação

### Organização por Feature

As features são organizadas em `components/` agrupadas por funcionalidade principal. Cada feature pode ter:

- Componentes específicos da feature
- Hooks customizados (quando necessário)
- Utilitários específicos
- Tipos relacionados

### Estrutura Típica de uma Feature

```
components/
└── feature-name/
    ├── FeatureComponent.tsx
    ├── FeatureSubComponent.tsx
    ├── Feature.module.scss      # Estilos do componente (se necessário)
    ├── hooks/                   # Hooks específicos da feature
    │   └── useFeature.ts
    └── utils/                   # Utilitários específicos
        └── featureUtils.ts
```

---

## Estrutura de Rotas Remix

### File-based Routing

```
routes/
├── _index.tsx                 # Rota raiz: /
├── api.bug-report.ts          # Resource route: /api/bug-report
├── api.chat.ts                # Action route: POST /api/chat
├── api.check-env-key.ts       # Loader route: GET /api/check-env-key
├── api.configured-providers.ts
├── api.enhancer.ts
├── api.export-api-keys.ts
├── api.git-info.ts
├── api.git-proxy.$.ts         # Catch-all: /api/git-proxy/*
├── api.github-branches.ts
├── api.github-stats.ts
├── api.github-template.ts
├── api.github-user.ts
├── api.gitlab-branches.ts
├── api.gitlab-projects.ts
├── api.health.ts              # Health check endpoint
├── api.llmcall.ts
├── api.mcp-check.ts
├── api.mcp-update-config.ts
├── api.models.$provider.ts    # Dynamic: /api/models/:provider
├── api.models.ts              # /api/models
├── api.netlify-deploy.ts
├── api.netlify-user.ts
├── api.supabase-user.ts
├── api.supabase.query.ts
├── api.supabase.ts
├── api.supabase.variables.ts
├── api.system.diagnostics.ts
├── api.system.disk-info.ts
├── api.system.git-info.ts
├── api.update.ts
├── api.vercel-deploy.ts
├── api.vercel-user.ts
├── chat.$id.tsx               # Dynamic: /chat/:id
├── git.tsx                    # Static: /git
├── webcontainer.connect.$id.tsx
└── webcontainer.preview.$id.tsx
```

### Convenções de Nomenclatura de Rotas

- **`_index.tsx`**: Rota raiz (`/`)
- **`api.*.ts`**: Resource routes (`/api/*`)
- **`$param.tsx`**: Dynamic segment (`/:param`)
- **`$.tsx`**: Catch-all route (`/*`)
- **`.client.tsx`**: Client-only component
- **`.server.tsx`**: Server-only component (Remix v2+)

### Nested Routes (Route Groups)

Remix não usa route groups por padrão neste projeto, mas pode ser organizado com:

```
routes/
├── settings._index.tsx        # /settings
├── settings.providers.tsx     # /settings/providers
└── settings.tsx               # Layout para /settings/*
```

---

## Convenções de Nomenclatura

### Arquivos

#### Componentes React

- **PascalCase**: `ChatBox.tsx`, `UserProfile.tsx`, `HeaderActionButtons.tsx`
- **Sufixos especiais**:
  - `.client.tsx`: Componente que roda apenas no cliente
  - `.server.tsx`: Componente que roda apenas no servidor
  - `.module.scss`: Stylesheet CSS Modules

#### Hooks

- **camelCase com prefixo `use`**: `useChat.ts`, `useDebounce.ts`, `useConnectionStatus.ts`

#### Utilitários

- **camelCase**: `formatDate.ts`, `parseJson.ts`, `classNames.ts`

#### Stores

- **camelCase**: `workbench.ts`, `chatStore.ts`, `settings.ts`

#### Types

- **camelCase ou PascalCase**: `types.ts`, `ChatTypes.ts`, `model.ts`

#### Rotas Remix

- **kebab-case ou dot notation**: `api.chat.ts`, `chat.$id.tsx`, `git.tsx`

### Pastas

- **kebab-case**: `components/`, `chat-components/`, `api-clients/`
- **camelCase**: Para features específicas quando apropriado

### Componentes

- **PascalCase**: `const ChatBox: React.FC = ...`

### Funções e Variáveis

- **camelCase**: `function sendMessage()`, `const userInput = ...`

### Tipos e Interfaces

- **PascalCase**: `interface ChatMessage`, `type MessageRole`

### Constantes

- **UPPER_SNAKE_CASE**: `const MAX_MESSAGE_LENGTH = 10000`
- **camelCase**: Para constantes locais ou objetos

---

## Barrel Files

### Estrutura Hierárquica

Barrel files (`index.ts`) são usados para exportar múltiplos módulos de uma pasta, facilitando imports.

#### Exemplo

```typescript
// lib/hooks/index.ts
export { useChat } from './useChat';
export { useDebounce } from './useDebounce';
export { useGit } from './useGit';

// Uso
import { useChat, useDebounce, useGit } from '~/lib/hooks';
```

#### Quando Criar Barrel Files

- ✅ Quando uma pasta tem 3+ exports relacionados
- ✅ Quando exports são frequentemente importados juntos
- ✅ Para simplificar imports públicos de uma feature

#### Quando NÃO Criar

- ❌ Para exports internos que raramente são usados externamente
- ❌ Quando pode causar circular dependencies
- ❌ Para arquivos únicos sem necessidade de agrupamento

---

## Configuração e Build

### Arquivos de Configuração na Raiz

```
├── package.json              # Dependências e scripts npm
├── pnpm-lock.yaml            # Lock file do pnpm
├── tsconfig.json             # Configuração TypeScript
├── vite.config.ts            # Configuração Vite
├── uno.config.ts             # Configuração UnoCSS
├── eslint.config.mjs         # Configuração ESLint
├── wrangler.toml             # Configuração Cloudflare Workers
├── electron-builder.yml      # Configuração Electron Builder
├── docker-compose.yaml       # Configuração Docker Compose
└── Dockerfile                # Dockerfile para container
```

### Scripts do package.json

```json
{
  "scripts": {
    "dev": "node pre-start.cjs && remix vite:dev",
    "build": "remix vite:build",
    "start": "...",
    "preview": "pnpm run build && pnpm run start",
    "test": "vitest --run",
    "typecheck": "tsc",
    "lint": "eslint --cache --cache-location ./node_modules/.cache/eslint app"
  }
}
```

---

## Assets

### Organização de Assets

```
public/                       # Arquivos públicos (servidos diretamente)
├── favicon.ico
├── favicon.svg
├── logo.svg
├── icons/                    # Ícones SVG
│   └── ...
└── images/                   # Imagens estáticas
    └── ...

assets/                       # Assets de build (processados)
└── icons/
    ├── icon.icns            # macOS icon
    ├── icon.ico             # Windows icon
    └── icon.png             # Linux icon

icons/                        # Ícones SVG customizados
├── angular.svg
├── react.svg
└── ...
```

### Importação de Assets

```typescript
// Imagens estáticas
import logo from '~/public/logo.svg';

// Assets processados pelo Vite
import icon from '~/assets/icons/icon.png';

// URLs públicas (servidas de /public)
const faviconUrl = '/favicon.ico';
```

---

## Estrutura de Testes

### Organização de Testes

```
app/
├── components/
│   └── chat/
│       └── Markdown.spec.ts   # Teste junto ao componente
├── utils/
│   └── diff.spec.ts           # Teste junto ao utilitário
└── __tests__/                 # Testes gerais (se necessário)
    └── integration/
        └── ...
```

### Convenções

- **`.spec.ts` ou `.test.ts`**: Arquivos de teste
- Testes colocalizados com código quando possível
- Testes de integração em pastas separadas

---

## Variáveis de Ambiente

### Arquivos .env

```
.env.example                  # Template de variáveis
.env                          # Variáveis locais (não versionado)
.env.local                    # Variáveis locais (não versionado)
```

### Tipos de Ambiente

- **Development**: `.env.local` ou `.env`
- **Production**: Configuradas no Cloudflare Workers
- **Testing**: Configuradas via Vitest

### Variáveis Principais

```bash
# API Keys (client-side)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# Base URLs
OLLAMA_BASE_URL=http://127.0.0.1:11434
LMSTUDIO_BASE_URL=http://127.0.0.1:1234

# Feature flags
VITE_ENABLE_ANALYTICS=false
```

---

## Resumo da Organização

### Princípios

1. **Feature-based Organization**: Componentes agrupados por feature
2. **Separation of Concerns**: Lógica separada de apresentação
3. **Co-location**: Código relacionado próximo
4. **Consistency**: Convenções claras e consistentes
5. **Scalability**: Estrutura que escala com o projeto

### Benefícios

- ✅ Fácil de navegar e encontrar código
- ✅ Código relacionado agrupado
- ✅ Reduz acoplamento entre features
- ✅ Facilita testes e manutenção
- ✅ Onboarding mais rápido para novos desenvolvedores

### Decisões Arquiteturais

- **Remix app directory**: Usa convenção moderna do Remix
- **Feature components**: Componentes organizados por feature
- **Barrel files**: Para exports públicos de módulos
- **Co-location**: Testes próximos ao código
- **Type safety**: TypeScript em todo o projeto

---

## Checklist para Criar uma Nova Feature

### 1. Planejamento

- [ ] Definir nome da feature (kebab-case)
- [ ] Identificar componentes necessários
- [ ] Identificar hooks customizados
- [ ] Identificar rotas Remix necessárias
- [ ] Identificar stores de estado (se necessário)
- [ ] Identificar tipos TypeScript

### 2. Estrutura de Pastas

- [ ] Criar pasta em `components/feature-name/`
- [ ] Criar componentes principais
- [ ] Criar hooks em `lib/hooks/useFeatureName.ts` (se compartilhado)
- [ ] Criar tipos em `types/feature-name.ts` (se necessário)
- [ ] Criar rotas em `routes/` (se necessário)

### 3. Código

- [ ] Criar componentes com TypeScript
- [ ] Implementar hooks customizados
- [ ] Criar stores (se necessário)
- [ ] Implementar rotas Remix (loaders/actions)
- [ ] Adicionar validação (Zod schemas)
- [ ] Adicionar tratamento de erros

### 4. Estilos

- [ ] Adicionar estilos (UnoCSS ou SCSS)
- [ ] Garantir responsividade
- [ ] Testar temas (dark/light)

### 5. Testes

- [ ] Criar testes unitários
- [ ] Criar testes de componente (se aplicável)
- [ ] Testar integração

### 6. Documentação

- [ ] Adicionar JSDoc em funções públicas
- [ ] Atualizar documentação se necessário
- [ ] Adicionar exemplos de uso

### 7. Integração

- [ ] Integrar com rotas existentes
- [ ] Adicionar navegação (se necessário)
- [ ] Testar fluxo completo

---

## Exemplo Completo de uma Feature

### Feature: "Deploy"

#### Estrutura de Pastas

```
components/
└── deploy/
    ├── DeployButton.tsx
    ├── DeployAlert.tsx
    ├── NetlifyDeploy.client.tsx
    ├── VercelDeploy.client.tsx
    └── GitHubDeploy.client.tsx

lib/
├── api/
│   ├── netlify.ts
│   ├── vercel.ts
│   └── github.ts
├── stores/
│   └── deploy.ts (se necessário)
└── services/
    └── deployService.ts

routes/
├── api.netlify-deploy.ts
├── api.vercel-deploy.ts
└── api.github-deploy.ts

types/
└── deploy.ts
```

#### Componente Principal

```typescript
// components/deploy/DeployButton.tsx
import { DeployAlert } from '~/types/deploy';

interface DeployButtonProps {
  provider: 'netlify' | 'vercel' | 'github';
  onDeploy: () => Promise<void>;
}

export const DeployButton: React.FC<DeployButtonProps> = ({
  provider,
  onDeploy
}) => {
  const [isDeploying, setIsDeploying] = useState(false);

  const handleClick = async () => {
    setIsDeploying(true);
    try {
      await onDeploy();
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isDeploying}
      className="deploy-button"
    >
      {isDeploying ? 'Deploying...' : `Deploy to ${provider}`}
    </button>
  );
};
```

#### Store (se necessário)

```typescript
// lib/stores/deploy.ts
import { create } from 'zustand';

interface DeployStore {
  isDeploying: boolean;
  lastDeploy?: DeployResult;
  setDeploying: (deploying: boolean) => void;
  setLastDeploy: (result: DeployResult) => void;
}

export const useDeployStore = create<DeployStore>((set) => ({
  isDeploying: false,
  setDeploying: (deploying) => set({ isDeploying: deploying }),
  setLastDeploy: (result) => set({ lastDeploy: result })
}));
```

#### Rota Remix

```typescript
// routes/api.netlify-deploy.ts
import { type ActionFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { siteName } = await request.json();
    
    // Validar
    if (!siteName) {
      return json({ error: 'Site name required' }, { status: 400 });
    }

    // Deploy
    const result = await deployToNetlify(siteName);
    
    return json({ success: true, result });
  } catch (error) {
    return json(
      { error: 'Deployment failed', details: error.message },
      { status: 500 }
    );
  }
}
```

#### Tipos

```typescript
// types/deploy.ts
export interface DeployResult {
  url: string;
  status: 'success' | 'failed';
  deploymentId: string;
}

export interface DeployAlert {
  type: 'netlify' | 'vercel' | 'github';
  message: string;
  actionUrl?: string;
}
```

---

*Para mais detalhes sobre padrões de código, veja [ARCHITECTURE.md](./ARCHITECTURE.md)*

