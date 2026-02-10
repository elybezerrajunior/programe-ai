# Mapeamento de Referências a "Bolt"

Este documento lista as ocorrências do termo "bolt" encontradas no código do projeto, categorizadas por tipo de uso.

## 1. Definições de Código (Classes, Interfaces, Tipos, Funções)

Estas são as definições de código que contêm explicitamente "Bolt" no nome:

- **Classes:**
  - `ProgrameShell` em `app/utils/shell.ts`

- **Interfaces:**
  - `ProgrameArtifactData` em `app/types/artifact.ts`

- **Tipos (Types):**
  - `ProgrameAction` em `app/types/actions.ts`
  - `ProgrameActionData` em `app/types/actions.ts`

- **Funções:**
  - `useProgrameHistoryDB` em `app/components/home/ProjectsSection.tsx` e `app/components/@settings/tabs/data/DataTab.tsx`
  - `newProgrameShellProcess` em `app/utils/shell.ts`
  - `escapeProgrameArtifactTags` em `app/utils/projectCommands.ts`
  - `escapeProgrameActionTags` em `app/utils/projectCommands.ts`
  - `escapeProgrameTags` em `app/utils/projectCommands.ts`

## 2. Configuração do Projeto e Metadados

- **package.json**: O nome do projeto está definido como `"name": "bolt"`.
- **Scripts**: Vários scripts npm referenciam `programe-ai` (ex: `docker run ... programe-ai`).

## 3. Identificadores em Strings e Configurações

O termo é amplamente utilizado como identificador em strings, especialmente para User-Agent e prompts de IA.

- **User-Agent**: `'User-Agent': 'programe.ai-app'` ou `'User-Agent': 'Programe.ai'` é usado em várias chamadas de API (GitHub, GitLab, Supabase).
  - Arquivos: `app/routes/api.supabase-user.ts`, `app/lib/hooks/useGitHubConnection.ts`, etc.
- **Prompts de IA**: O sistema define a IA com o nome "Bolt" nos prompts do sistema.
  - Exemplo: `"You are Programe, an expert AI assistant..."` em `app/lib/common/prompts/prompts.ts` e outros arquivos de prompt.
- **Mensagens de Commit**: Templates de commit usam `"Initial commit from Programe.ai"`.

## 4. Classes CSS e Temas

A ocorrência mais frequente (milhares de vezes) é em nomes de classes CSS, indicando um sistema de design ou tema prefixado com `programe-elements-`.

- **Padrão**: `programe-elements-*`
- **Exemplos**:
  - `programe-elements-textPrimary`
  - `programe-elements-background-depth-1`
  - `programe-elements-borderColor`
- **Arquivos**: Praticamente todos os componentes de UI (`Menu.client.tsx`, `ControlPanel.tsx`, etc.) utilizam essas classes para estilização.

## 5. Variáveis

Não foram encontradas variáveis declaradas explicitamente apenas como `const bolt = ...` ou `let bolt = ...` no escopo global ou local dos arquivos analisados. O uso é predominantemente como parte de nomes compostos (CamelCase ou kebab-case) ou em strings.
