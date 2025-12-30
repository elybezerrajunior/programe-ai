# bolt.diy - Documentação

## Índice

- [Visão Geral](#visão-geral)
- [Funcionalidades Principais](#funcionalidades-principais)
- [Especificações Técnicas](#especificações-técnicas)
- [Setup e Instalação](#setup-e-instalação)
- [Build e Deploy](#build-e-deploy)
- [Casos de Uso Principais](#casos-de-uso-principais)
- [Fluxo de Funcionamento](#fluxo-de-funcionamento)
- [Interface do Usuário](#interface-do-usuário)
- [Configuração de Provedores de IA](#configuração-de-provedores-de-ia)
- [Templates de Projetos](#templates-de-projetos)
- [Recursos e Ajuda](#recursos-e-ajuda)

---

## Visão Geral

**bolt.diy** é uma plataforma open-source de desenvolvimento web full-stack alimentada por IA que permite criar e desenvolver aplicações web diretamente no navegador. O projeto é a versão open-source oficial do Bolt.new, oferecendo a flexibilidade de escolher qual modelo de linguagem (LLM) usar para cada prompt.

A aplicação utiliza o **WebContainer API** da StackBlitz para fornecer um ambiente de desenvolvimento Node.js completo no navegador, permitindo executar projetos, instalar dependências, executar servidores de desenvolvimento e visualizar aplicações em tempo real, tudo sem sair do navegador.

O projeto é construído com **React**, **TypeScript**, **Remix** e **Vite**, seguindo princípios de Clean Architecture adaptados para desenvolvimento web. A aplicação suporta múltiplos provedores de IA (19+), integração com serviços como GitHub, GitLab, Netlify, Vercel e Supabase, além de oferecer uma experiência desktop através do Electron.

---

## Funcionalidades Principais

### 🤖 Integração com Múltiplos Provedores de IA

- **19+ Provedores Suportados**: OpenAI, Anthropic, Google (Gemini), Groq, xAI, DeepSeek, Mistral, Cohere, Together, Perplexity, HuggingFace, Ollama, LM Studio, OpenRouter, Moonshot (Kimi), Hyperbolic, GitHub Models, Amazon Bedrock, e provedores OpenAI-compatíveis
- **Seleção Dinâmica de Modelos**: Escolha o modelo ideal para cada tarefa
- **Configuração Intuitiva**: Interface moderna para gerenciar chaves de API e configurações de provedores

### 💻 Ambiente de Desenvolvimento Integrado

- **WebContainer API**: Execução de código Node.js diretamente no navegador
- **Editor de Código**: Editor integrado com suporte a múltiplas linguagens via CodeMirror
- **Terminal Integrado**: Terminal funcional para executar comandos e ver saídas
- **Preview em Tempo Real**: Visualização instantânea das aplicações desenvolvidas

### 📁 Gerenciamento de Projetos

- **Criação de Projetos**: Crie projetos do zero ou a partir de templates
- **Importação de Código**: Importe projetos existentes via Git (GitHub, GitLab)
- **Download de Projetos**: Exporte projetos completos como arquivos ZIP
- **Sistema de Snapshots**: Restauração automática de projetos ao recarregar

### 🎨 Editor e Interface

- **Editor com Syntax Highlighting**: Suporte a múltiplas linguagens de programação
- **Diff View**: Visualização de diferenças entre versões de código
- **File Locking**: Sistema para evitar conflitos durante geração de código pela IA
- **Interface Responsiva**: Design moderno e adaptável para diferentes tamanhos de tela

### 🚀 Deploy e Integrações

- **Deploy para Netlify**: Publicação direta de projetos
- **Deploy para Vercel**: Integração com Vercel para deployment
- **Deploy para GitHub Pages**: Publicação em GitHub Pages
- **Integração Supabase**: Gerenciamento de bancos de dados e queries
- **Integração Git**: Clone, import e sincronização com repositórios Git

### 📊 Funcionalidades Avançadas

- **MCP (Model Context Protocol)**: Suporte para ferramentas e integrações avançadas de IA
- **Visualização de Dados**: Gráficos e análises de dados integrados
- **Chat com Histórico**: Sistema de chat persistente com histórico de conversações
- **Modo Discussão vs Construção**: Dois modos distintos de interação com a IA
- **Reconhecimento de Voz**: Entrada de comandos via voz (Speech Recognition)

### 🖥️ Desktop App (Electron)

- **Aplicação Desktop Nativa**: Versão desktop completa via Electron
- **Funcionalidade Completa**: Todas as features da versão web disponíveis no desktop
- **Multi-plataforma**: Suporte para Windows, macOS e Linux

---

## Especificações Técnicas

### Stack Tecnológico Principal

- **Framework Frontend**: React 18.3.1
- **Framework Web**: Remix 2.15.2 (Cloudflare Pages)
- **Linguagem**: TypeScript 5.7.2
- **Build Tool**: Vite 5.4.11
- **Gerenciamento de Estado**: 
  - Zustand 5.0.3 (estado global)
  - Nanostores 0.10.3 (estado reativo)
  - Context API (comunicação de componentes)
- **Estilização**: 
  - UnoCSS 0.61.9 (utility-first CSS)
  - SCSS (estilos customizados)
  - CSS Variables (tema dinâmico)
- **Validação**: Zod 3.24.1

### Arquitetura

A aplicação segue uma **Clean Architecture adaptada para Remix**, organizando o código em camadas:

- **Domain Layer**: Lógica de negócio, entidades e casos de uso
- **Data Layer**: Implementações de repositórios, APIs e serviços externos
- **Presentation Layer**: Componentes React, páginas Remix e hooks customizados

### Principais Bibliotecas e Ferramentas

- **WebContainer API**: Ambiente Node.js no navegador
- **CodeMirror**: Editor de código avançado
- **Radix UI**: Componentes de UI acessíveis
- **Vercel AI SDK**: Integração com múltiplos provedores de IA
- **Electron**: Aplicação desktop
- **xterm.js**: Terminal no navegador
- **React Markdown**: Renderização de markdown
- **Framer Motion**: Animações e transições

### Ambiente de Execução

- **Runtime**: Cloudflare Workers/Pages (produção)
- **Desenvolvimento**: Vite Dev Server com HMR
- **Container**: Docker support com Docker Compose
- **Desktop**: Electron (Windows, macOS, Linux)

---

## Setup e Instalação

### Requisitos Prévios

1. **Node.js**: Versão 18.18.0 ou superior ([Download Node.js](https://nodejs.org/en/download/))
   - Recomendado: Versão LTS (Long Term Support)
   - Após instalação, verifique se está no PATH:
     - **Windows**: `sysdm.cpl` → Advanced → Environment Variables → Verificar Path
     - **Mac/Linux**: `echo $PATH` deve mostrar `/usr/local/bin`

2. **pnpm**: Gerenciador de pacotes (será instalado se necessário)
   ```bash
   npm install -g pnpm
   ```

3. **Git** (Opcional, para desenvolvimento): [Download Git](https://git-scm.com/downloads)

4. **Docker** (Opcional, para uso com containers): [Download Docker](https://www.docker.com/)

---

### Opção 1: Instalação Rápida (Desktop App)

A forma mais simples de começar é baixar a aplicação desktop pré-compilada:

[![Download Latest Release](https://img.shields.io/github/v/release/stackblitz-labs/bolt.diy?label=Download%20Bolt&sort=semver)](https://github.com/stackblitz-labs/bolt.diy/releases/latest)

1. **Download**: Acesse a [página de releases](https://github.com/stackblitz-labs/bolt.diy/releases/latest)
2. **Instalação**:
   - **macOS**: Extraia o `.dmg` e arraste para Applications
     - Se aparecer "app is damaged", execute: `xattr -cr /path/to/Bolt.app`
   - **Windows**: Execute o `.exe` installer
   - **Linux**: Extraia e execute o AppImage ou instale o `.deb`

A aplicação desktop oferece todas as funcionalidades da versão web com recursos nativos adicionais.

---

### Opção 2: Instalação Manual (Desenvolvimento Local)

#### Passo 1: Clonar o Repositório

```bash
# Versão estável (recomendado)
git clone -b stable https://github.com/stackblitz-labs/bolt.diy.git

# OU versão main (últimas features, pode ter bugs)
git clone https://github.com/stackblitz-labs/bolt.diy.git

cd bolt.diy
```

#### Passo 2: Instalar Dependências

```bash
pnpm install
```

#### Passo 3: Configurar Variáveis de Ambiente

Crie os arquivos de ambiente a partir do exemplo:

```bash
cp .env.example .env
cp .env.example .env.local
```

Edite `.env.local` e adicione suas chaves de API:

```bash
# API Keys (adicione suas chaves aqui)
OPENAI_API_KEY=sua_chave_aqui
ANTHROPIC_API_KEY=sua_chave_aqui
GROQ_API_KEY=sua_chave_aqui

# URLs de provedores locais (opcional)
OLLAMA_BASE_URL=http://127.0.0.1:11434
LMSTUDIO_BASE_URL=http://127.0.0.1:1234
```

**Importante**: 
- Nunca commite arquivos `.env` ou `.env.local` no Git
- Estes arquivos já estão no `.gitignore`

#### Passo 4: Iniciar o Servidor de Desenvolvimento

```bash
pnpm run dev
```

O servidor estará disponível em `http://localhost:5173`

> **Nota**: Para desenvolvimento local, recomenda-se usar **Google Chrome Canary** para melhor compatibilidade com WebContainer.

---

### Opção 3: Instalação com Docker

Docker é ideal para ambientes isolados ou para espelhar a imagem de produção.

#### Passo 1: Preparar Variáveis de Ambiente

```bash
cp .env.example .env
cp .env.example .env.local

# Adicione suas chaves de API nos arquivos .env e .env.local
```

#### Passo 2: Build da Imagem Docker

**Desenvolvimento** (com hot reload):
```bash
pnpm run dockerbuild
# Ou diretamente:
docker build -t bolt-ai:development -t bolt-ai:latest --target development .
```

**Produção** (otimizada):
```bash
pnpm run dockerbuild:prod
# Ou diretamente:
docker build -t bolt-ai:production -t bolt-ai:latest --target bolt-ai-production .
```

#### Passo 3: Executar Container

**Desenvolvimento** (com bind-mount para hot reload):
```bash
docker compose --profile development up
```

**Produção**:
```bash
docker compose --profile production up

# Ou container one-off:
docker run --rm -p 5173:5173 --env-file .env.local bolt-ai:latest
```

O container de desenvolvimento monta o código local, permitindo hot reload. O container de produção executa a versão otimizada.

---

### Opção 4: Build da Aplicação Desktop (Electron)

Para criar a aplicação desktop a partir do código fonte:

```bash
# Instalar dependências
pnpm install

# Build para todas as plataformas
pnpm electron:build:dist

# OU build específico por plataforma:
pnpm electron:build:mac   # macOS
pnpm electron:build:win   # Windows
pnpm electron:build:linux # Linux
```

Os binários serão gerados em `dist/`.

---

### Atualizando a Versão Local

Para manter sua instalação atualizada com as últimas mudanças:

```bash
# 1. Salvar mudanças locais (se houver)
git stash

# 2. Buscar atualizações
git pull origin stable  # ou 'main' se usar branch main

# 3. Atualizar dependências
pnpm install

# 4. Restaurar mudanças locais (se necessário)
git stash pop

# 5. Rebuild (se usando Docker)
docker compose --profile development up --build
```

---

### Troubleshooting do Setup

#### Problemas Comuns

**Node.js não encontrado**:
- Verifique instalação: `node --version`
- Adicione ao PATH do sistema

**Erros de permissão (pnpm)**:
- Linux/Mac: Use `sudo npm install -g pnpm`
- Windows: Execute como Administrador

**Dependências não instalam**:
```bash
# Limpar cache e reinstalar
rm -rf node_modules pnpm-lock.yaml
pnpm store prune
pnpm install
```

**Erros com Docker**:
- Verifique se Docker está rodando: `docker ps`
- Verifique se portas não estão em uso: `lsof -i :5173`

**Chrome Canary necessário**:
- Para desenvolvimento local, WebContainer funciona melhor com Chrome Canary
- Download: [Chrome Canary](https://www.google.com/chrome/canary/)

---

## Build e Deploy

### Build do Projeto

#### Build para Produção

```bash
# Build completo (client + server)
pnpm run build
```

Este comando:
- Compila TypeScript
- Processa estilos (UnoCSS, SCSS)
- Otimiza e minifica código
- Gera bundle do Remix
- Output em `build/client` e `build/server`

#### Build e Preview Local

Testar build de produção localmente:

```bash
pnpm run preview
# Ou manualmente:
pnpm run build
pnpm run start
```

O servidor de produção local estará em `http://localhost:5173`.

---

### Deploy para Cloudflare Pages

#### Método 1: Deploy via CLI

```bash
# Build e deploy direto
pnpm run deploy
```

Este comando:
1. Executa `pnpm run build`
2. Faz deploy via `wrangler pages deploy`

#### Pré-requisitos

1. **Instalar Wrangler CLI**:
   ```bash
   npm install -g wrangler
   ```

2. **Autenticar**:
   ```bash
   wrangler login
   ```

3. **Configurar projeto**:
   - O arquivo `wrangler.toml` já está configurado
   - Ajuste `name` e outras configurações se necessário

#### Método 2: Deploy via GitHub Actions

O projeto inclui workflows GitHub Actions para deploy automático:
- `.github/workflows/preview.yaml`: Deploy de preview
- `.github/workflows/ci.yaml`: CI/CD pipeline

Configure secrets no GitHub:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

---

### Build Docker para Produção

#### Build da Imagem de Produção

```bash
pnpm run dockerbuild:prod
```

Ou manualmente:

```bash
docker build \
  -t bolt-ai:production \
  -t bolt-ai:latest \
  --target bolt-ai-production \
  .
```

#### Executar Container de Produção

```bash
docker run -d \
  --name bolt-ai \
  -p 5173:5173 \
  --env-file .env.local \
  bolt-ai:production
```

#### Docker Compose (Produção)

```bash
docker compose --profile production up -d
```

---

### Deploy de Projetos Criados no bolt.diy

O bolt.diy permite fazer deploy dos projetos criados para várias plataformas:

#### Deploy para Netlify

1. **Conectar conta Netlify**:
   - Settings → Connections → Netlify
   - Autenticar via OAuth

2. **Fazer Deploy**:
   - Clique no botão "Deploy to Netlify" no projeto
   - O sistema automaticamente:
     - Executa `npm run build`
     - Detecta diretório de output (`dist`, `build`, `out`, etc.)
     - Faz upload para Netlify
     - Retorna URL do deploy

#### Deploy para Vercel

1. **Conectar conta Vercel**:
   - Settings → Connections → Vercel
   - Autenticar via OAuth

2. **Fazer Deploy**:
   - Clique no botão "Deploy to Vercel"
   - Similar ao Netlify, com suporte a configuração via `vercel.json`

#### Deploy para GitHub Pages

1. **Conectar conta GitHub**:
   - Settings → Connections → GitHub
   - Autenticar via OAuth

2. **Push do Projeto**:
   - O sistema cria um repositório GitHub
   - Faz push do código completo
   - Configura GitHub Pages no repositório

#### Deploy para GitLab

Similar ao GitHub, com suporte a repositórios GitLab.

---

### Scripts Disponíveis

#### Scripts de Desenvolvimento

```bash
pnpm run dev              # Inicia servidor de desenvolvimento
pnpm run build            # Build para produção
pnpm run start            # Roda build localmente
pnpm run preview          # Build + start (teste produção)
pnpm test                 # Roda testes
pnpm run test:watch       # Testes em modo watch
pnpm run lint             # Verifica código com ESLint
pnpm run lint:fix         # Corrige problemas de lint automaticamente
pnpm run typecheck        # Verifica tipos TypeScript
pnpm run typegen          # Gera tipos Wrangler
pnpm run clean            # Limpa artifacts de build
```

#### Scripts Docker

```bash
pnpm run dockerbuild         # Build imagem desenvolvimento
pnpm run dockerbuild:prod    # Build imagem produção
pnpm run dockerstart         # Inicia container com bindings
pnpm run dockerrun           # Executa container one-off
```

#### Scripts Electron

```bash
pnpm electron:dev            # Desenvolvimento Electron
pnpm electron:build:main     # Build main process
pnpm electron:build:preload  # Build preload scripts
pnpm electron:build:renderer # Build renderer
pnpm electron:build:deps     # Build todas dependências Electron
pnpm electron:build:mac      # Build macOS
pnpm electron:build:win      # Build Windows
pnpm electron:build:linux    # Build Linux
pnpm electron:build:dist     # Build todas plataformas
pnpm electron:build:unpack   # Build unpacked (teste)
```

#### Scripts de Deploy

```bash
pnpm run deploy             # Deploy para Cloudflare Pages
```

---

### Otimizações de Build

O projeto utiliza várias otimizações:

- **Code Splitting**: Separação automática de chunks
- **Tree Shaking**: Remoção de código não utilizado
- **Minificação**: Uso de esbuild para minificação rápida
- **Asset Optimization**: Imagens e fonts otimizadas
- **CSS Optimization**: UnoCSS purga classes não utilizadas

---

## Casos de Uso Principais

### 1. Desenvolvimento de Aplicação Web do Zero

Um desenvolvedor quer criar uma nova aplicação web React do zero. Ele:

1. Acessa bolt.diy e inicia uma nova conversa
2. Descreve a aplicação desejada (ex: "Crie uma aplicação de lista de tarefas com React e TypeScript")
3. A IA gera o código completo, criando arquivos, configurando dependências
4. O projeto é executado automaticamente no WebContainer
5. O preview é exibido em tempo real no painel lateral
6. O desenvolvedor pode fazer ajustes através de comandos de texto
7. Pode exportar o projeto como ZIP ou fazer deploy diretamente

### 2. Melhoria de Projeto Existente

Um desenvolvedor tem um projeto existente e precisa melhorá-lo:

1. Importa o projeto via Git (GitHub/GitLab) ou faz upload de arquivos
2. Descreve as melhorias desejadas (ex: "Adicione autenticação de usuários")
3. A IA analisa o código existente e implementa as mudanças
4. O diff view mostra exatamente o que foi alterado
5. O desenvolvedor pode revisar e aceitar/rejeitar mudanças
6. Testa as alterações no preview em tempo real

### 3. Consulta Técnica e Discussão

Um desenvolvedor precisa de ajuda técnica:

1. Alterna para o modo "Discuss" na interface
2. Faz perguntas técnicas sobre arquitetura, padrões, ou soluções
3. Recebe orientações detalhadas sem implementação automática
4. Pode pedir planos de implementação quando necessário
5. Mantém histórico da conversa para referência futura

---

## Fluxo de Funcionamento

### Fluxo Principal de Criação de Projeto

1. **Inicialização**
   - Usuário acessa a aplicação (web ou desktop)
   - Interface de chat é carregada
   - Sistema verifica provedores de IA configurados

2. **Interação com IA**
   - Usuário descreve o que deseja criar/melhorar
   - Sistema valida e processa o prompt
   - Opcionalmente, melhora o prompt (prompt enhancement)
   - Envia requisição para o provedor de IA selecionado

3. **Processamento e Geração**
   - IA gera resposta estruturada com artifacts (arquivos, comandos)
   - Sistema processa artifacts e cria/modifica arquivos no WebContainer
   - Executa comandos necessários (npm install, npm run dev, etc.)
   - Atualiza a interface do editor com os novos arquivos

4. **Visualização e Feedback**
   - Preview é atualizado automaticamente
   - Usuário vê resultados em tempo real
   - Pode continuar a conversa para refinamentos
   - Histórico é salvo automaticamente

5. **Exportação/Deploy**
   - Usuário pode baixar projeto como ZIP
   - Pode fazer deploy para Netlify, Vercel ou GitHub Pages
   - Pode exportar chat com histórico completo

### Fluxo de Persistência

- **Chat History**: Salvo em IndexedDB do navegador
- **Projetos**: Mantidos em memória no WebContainer durante a sessão
- **Configurações**: API keys e preferências salvas em cookies/localStorage
- **Snapshots**: Estado do projeto salvo para restauração ao recarregar

---

## Interface do Usuário

### Páginas Principais

#### 1. Página Principal (Index Route)

- **Rota**: `/`
- **Componente**: `_index.tsx`
- **Conteúdo**:
  - Header com ações (novo chat, histórico, configurações)
  - Área de chat central
  - Sidebar com histórico de conversas
  - Workbench lateral (editor, preview, terminal)

#### 2. Página de Chat Específico

- **Rota**: `/chat/:id`
- **Componente**: `chat.$id.tsx`
- **Conteúdo**:
  - Carrega chat específico pelo ID
  - Exibe histórico completo da conversa
  - Permite continuar conversa existente

#### 3. Página de Importação Git

- **Rota**: `/git`
- **Componente**: `git.tsx`
- **Conteúdo**:
  - Interface para importar repositórios Git
  - Suporte para GitHub e GitLab
  - Seleção de branch e importação de arquivos

### Componentes Principais

#### Workbench
Painel lateral que contém:
- **Editor de Código**: Visualização e edição de arquivos
- **Preview**: Visualização da aplicação em desenvolvimento
- **Terminal**: Execução de comandos e visualização de saídas
- **Diff View**: Comparação de versões de arquivos

#### Chat Interface
- **Messages**: Exibição de mensagens do usuário e da IA
- **ChatBox**: Área de input com suporte a texto, imagens e arquivos
- **Model Selector**: Seletor de modelo e provedor de IA
- **Action Alerts**: Alertas para ações sugeridas (Supabase, deploy, etc.)

#### Settings Panel
- **Provider Configuration**: Configuração de provedores de IA e API keys
- **Theme Settings**: Configuração de tema (dark/light)
- **Advanced Settings**: Configurações avançadas e preferências

#### Sidebar
- **Chat History**: Lista de conversas anteriores
- **Menu Navigation**: Navegação entre diferentes seções
- **Quick Actions**: Ações rápidas (novo chat, exportar, etc.)

### Tema e Personalização

- **Dark/Light Mode**: Alternância entre temas
- **CSS Variables**: Sistema de cores dinâmico baseado em variáveis CSS
- **Responsive Design**: Adaptação para mobile, tablet e desktop
- **Acessibilidade**: Suporte a ARIA labels, navegação por teclado, leitores de tela

---

## Configuração de Provedores de IA

Bolt.diy oferece uma interface moderna e intuitiva para gerenciar provedores de IA e chaves de API.

### Acessando Configurações de Provedores

1. **Abrir Settings**: Clique no ícone de configurações (⚙️) na sidebar
2. **Navegar para Providers**: Selecione a aba "Providers" no menu
3. **Escolher Tipo**: Alterne entre "Cloud Providers" e "Local Providers"

### Provedores Cloud

A aba Cloud Providers exibe todos os serviços de IA baseados em nuvem:

#### Adicionando API Keys

1. **Selecionar Provedor**: Navegue pela grade de provedores disponíveis
2. **Habilitar Provedor**: Use o switch para habilitar/desabilitar
3. **Configurar API Key**:
   - Clique no card do provedor para expandir
   - Clique no campo "API Key" para entrar em modo edição
   - Cole sua chave e pressione Enter para salvar
   - Interface mostra validação em tempo real com checkmarks verdes

#### Funcionalidades Avançadas

- **Bulk Toggle**: Use "Enable All Cloud" para habilitar/desabilitar todos de uma vez
- **Status Visual**: Checkmarks verdes indicam provedores configurados corretamente
- **Ícones de Provedores**: Cada provedor tem ícone distintivo
- **Descrições**: Descrições úteis explicam capacidades de cada provedor

### Provedores Locais

A aba Local Providers gerencia instalações locais de IA:

#### Configuração Ollama

1. **Habilitar Ollama**: Use o switch do provedor Ollama
2. **Configurar Endpoint**: Defina o endpoint da API (padrão: `http://127.0.0.1:11434`)
3. **Gerenciar Modelos**:
   - Visualizar todos os modelos instalados com tamanho e parâmetros
   - Atualizar modelos para versões mais recentes
   - Deletar modelos não utilizados
   - Instalar novos modelos inserindo nomes

#### Outros Provedores Locais

- **LM Studio**: Configure URLs base customizadas
- **OpenAI-like**: Conecte a qualquer endpoint compatível com OpenAI
- **Auto-detecção**: Sistema detecta automaticamente variáveis de ambiente

### Variáveis de Ambiente vs UI

Bolt.diy suporta ambos os métodos:

#### Variáveis de Ambiente (Recomendado para Produção)

Configure no arquivo `.env.local`:
```bash
OPENAI_API_KEY=sua_chave_aqui
ANTHROPIC_API_KEY=sua_chave_aqui
OLLAMA_BASE_URL=http://127.0.0.1:11434
```

#### Configuração via UI

- **Atualizações em Tempo Real**: Mudanças têm efeito imediato
- **Armazenamento Seguro**: API keys armazenadas em cookies criptografados
- **Feedback Visual**: Indicadores claros de status de configuração

### Features Especiais por Provedor

#### OpenRouter
- **Filtro de Modelos Gratuitos**: Mostra apenas modelos gratuitos
- **Informações de Preço**: Exibe custos de input/output
- **Busca de Modelos**: Busca fuzzy através de todos os modelos

#### Ollama
- **Instalador de Modelos**: Interface para instalar novos modelos
- **Rastreamento de Progresso**: Progresso de download em tempo real
- **Detalhes de Modelos**: Tamanho, parâmetros e níveis de quantização
- **Auto-refresh**: Detecta automaticamente modelos recém-instalados

### Troubleshooting

#### Problemas Comuns

- **API Key Não Reconhecida**: Verifique formato correto para cada provedor
- **Problemas com Base URL**: Verifique se URL está correta e acessível
- **Modelo Não Carrega**: Verifique se provedor está habilitado e configurado
- **Variáveis de Ambiente Não Funcionam**: Reinicie aplicação após adicionar variáveis

#### Indicadores de Status

- 🟢 **Checkmark Verde**: Provedor configurado e pronto
- 🔴 **X Vermelho**: Configuração faltando ou inválida
- 🟡 **Indicador Amarelo**: Provedor habilitado mas pode precisar setup adicional
- 🔵 **Lápis Azul**: Clique para editar configuração

---

## Templates de Projetos

Bolt.diy vem com uma coleção abrangente de templates para iniciar projetos rapidamente:

### Frameworks Frontend

- **React + Vite**: Setup moderno React com TypeScript
- **Vue.js**: Framework JavaScript progressivo
- **Angular**: Framework enterprise-ready
- **Svelte**: Framework baseado em compiler
- **SolidJS**: Framework reativo com atualizações granulares

### Frameworks Full-Stack

- **Next.js com shadcn/ui**: Framework React com componentes UI
- **Astro**: Gerador de sites estáticos
- **Qwik**: Framework resumable para carregamento instantâneo
- **Remix**: Framework React full-stack
- **Nuxt**: Meta-framework Vue.js

### Mobile & Cross-Platform

- **Expo App**: React Native com Expo
- **React Native**: Desenvolvimento mobile cross-platform

### Apresentação & Conteúdo

- **Slidev**: Apresentações amigáveis para desenvolvedores
- **Astro Basic**: Sites estáticos leves

### JavaScript Vanilla

- **Vanilla Vite**: Setup JavaScript minimal
- **Vite TypeScript**: TypeScript sem framework

### Usando Templates

1. Inicie novo projeto no bolt.diy
2. Navegue pelos templates disponíveis
3. Selecione sua stack preferida
4. A IA fará scaffold do projeto com melhores práticas
5. Comece desenvolvimento imediatamente com preview ao vivo

Todos os templates vêm pré-configurados com tooling moderno, linting e processos de build.

---

## Recursos e Ajuda

### Ícone de Ajuda na Sidebar

Bolt.diy inclui um ícone de ajuda (?) na sidebar que fornece acesso rápido à documentação completa. Clique no ícone para abrir a documentação em nova aba.

A documentação inclui:
- **Guias de setup completos** para todos os provedores
- **Explicações de features** para capacidades avançadas
- **Guias de troubleshooting** para problemas comuns
- **Melhores práticas** para uso otimizado
- **Seção FAQ** com respostas detalhadas

### Comunidade

- **GitHub Issues**: Reporte bugs e solicite features
- **Fórum da Comunidade**: Junte-se às discussões em [thinktank.ottomator.ai](https://thinktank.ottomator.ai)
- **Guia de Contribuição**: Aprenda como contribuir para o projeto

### Dicas e Truques

- **Seja específico sobre sua stack**: Mencione frameworks específicos (Astro, Tailwind, ShadCN, etc.) no prompt inicial
- **Use o ícone de enhance prompt**: Clique no ícone 'enhance' para refinar seu prompt antes de enviar
- **Scaffold o básico primeiro**: Certifique-se de ter estrutura básica antes de adicionar features avançadas
- **Agrupe instruções simples**: Combine múltiplas instruções simples em uma mensagem
- **Acesse documentação rapidamente**: Use o ícone de ajuda (?) na sidebar

---

## Links Rápidos

- 📚 [Documentação de Features](./features.md) - Especificações funcionais detalhadas
- 🏗️ [Arquitetura Técnica](./ARCHITECTURE.md) - Padrões e decisões arquiteturais
- 📁 [Estrutura do Projeto](./STRUCTURE.md) - Organização de pastas e arquivos
- 🚀 [README Principal](../README.md) - Instruções de instalação e setup
- 📋 [Guia de Contribuição](../CONTRIBUTING.md) - Como contribuir para o projeto

---

*Última atualização: Baseado na versão atual do projeto*
