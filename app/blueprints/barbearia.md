# Blueprint: Sistema de Gestão para Barbearia Moderna (BarberPro)

## 1. Visão Geral do Projeto
Desenvolver uma aplicação web progressiva (PWA) focada na gestão ágil de barbearias modernas. O sistema deve priorizar a velocidade de uso em dispositivos móveis para os barbeiros e uma experiência fluida de agendamento para os clientes.

**Estilo Visual:** "Industrial Dark Urban". Fundo escuro (Preto Carvão `#121212`, Cinza Concreto `#2C2C2C`) com acentos vibrantes em Laranja Queimado (`#FF5722`) ou Amarelo Neon (`#FFC107`). Tipografia forte e sans-serif (ex: Roboto, Inter ou Oswald).

---

## 2. Funcionalidades Detalhadas

### A. Módulo de Agendamento (Foco: Cliente & Barbeiro)
1.  **Painel do Barbeiro (Visão Diária):**
    *   Visualização em linha do tempo vertical para o dia atual.
    *   Indicadores visuais de status: *Confirmado* (Verde), *Pendente* (Amarelo), *Cancelado* (Vermelho), *Finalizado* (Cinza).
    *   Botão flutuante (FAB) para "Novo Agendamento Rápido" (inserção manual pelo barbeiro).
2.  **Agendamento Online (Cliente):**
    *   Interface pública limpa onde o cliente seleciona: Barbeiro -> Serviço(s) -> Data/Hora Disponível -> Confirmação.
    *   *Regra de Negócio:* Evitar conflitos de horário em tempo real.
    *   *Opcional:* Login social ou cadastro simplificado (Nome + WhatsApp).
3.  **Fila de Espera (Encaixe):**
    *   Lista visível de clientes aguardando desistências.
    *   Notificação visual quando um horário vaga.

### B. Módulo Financeiro & Caixa
1.  **Comanda Digital Inteligente:**
    *   Cada agendamento se torna uma "Comanda".
    *   Adição rápida de itens extras na comanda (bebidas, produtos, serviços adicionais).
    *   Cálculo automático do total.
2.  **Gestão de Comissões:**
    *   Cada serviço deve ter uma taxa de comissão associada ao barbeiro (ex: 50%).
    *   Ao finalizar a comanda, o sistema deve registrar: [Valor Total], [Parte da Barbearia], [Parte do Barbeiro].
3.  **Fechamento de Caixa:**
    *   Relatório diário simples: Total Bruto, Total por Método de Pagamento (Pix, Dinheiro, Cartão), Total de Comissões a Pagar.

### C. Gestão de Clientes (CRM Simplificado)
1.  **Histórico de Estilo:**
    *   Campo de anotações técnicas no perfil do cliente (ex: "Pente 2 na lateral, tesoura em cima, perfil baixo").
    *   Upload de foto do corte finalizado para referência futura.
2.  **Fidelidade (Gamificação Básica):**
    *   Contador automático de cortes.
    *   Visualização clara: "Faltam 3 cortes para o prêmio".

---

## 3. Diretrizes Técnicas

### Frontend
*   **Framework:** React (Remix ou Vite SPA).
*   **Estilização:** CSS Moderno (CSS Modules ou TailwindCSS se configurado) ou Styled Components. Foco em responsividade total (Mobile-First).
*   **Componentes UI:** Inputs grandes (touch-friendly), Modais para ações rápidas, Toasts para feedback de sucesso/erro.

### Backend & Dados (Supabase)
*   **Banco de Dados:** PostgreSQL.
*   **Instruções de SQL (Críticas):**
    1.  **Ordem Rigorosa:** O script DEVE seguir esta ordem:
        *   1º: Criação de `ENUMs` (com tratamento de duplicidade).
        *   2º: Criação de `TABLES` (usando `CREATE TABLE IF NOT EXISTS`).
        *   3º: `INSERTS` de dados iniciais.
    2.  **Tratamento de ENUMs:**
        ```sql
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
                CREATE TYPE user_role AS ENUM ('admin', 'barber', 'client');
            ELSE
                -- Tenta adicionar valores novos se o tipo já existir
                ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'client'; -- (Sintaxe hipotética, usar bloco exception para suporte real)
            END IF;
        END $$;
        ```
    3.  **Tabelas:** Certifique-se de criar a tabela `users` **antes** de qualquer inserção. Exemplo:
        ```sql
        CREATE TABLE IF NOT EXISTS public.users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            role user_role DEFAULT 'client',
            ...
        );
        ```
*   **Tabelas Sugeridas:**
    *   `users` (perfis de barbeiros e clientes).
    *   `services` (nome, preço, duração média, % comissão padrão).
    *   `appointments` (relaciona user, service, data_hora, status).
    *   `commands` (itens consumidos, valor total).
    *   `loyalty_cards` (controle de pontuação).

    4.  **Bypass de RLS para Seed:**
        *   Como a tabela `users` pode ter RLS (Row Level Security) ativado, o script de inicialização deve garantir a inserção.
        *   Use `ALTER TABLE users DISABLE ROW LEVEL SECURITY;` antes dos INSERTS e `ENABLE` depois, OU garanta que haja uma policy `INSERT` permissiva para o setup inicial.
        *   *Preferência:* Inserir dados via script SQL direto (Server-Side) contorna o RLS se executado com privilégios de `postgres` ou `service_role`. Certifique-se de que o script SQL gerado seja executado com permissões adequadas.

### Autenticação & Segurança
*   Uso de Supabase Auth.
*   Perfis de acesso: *Admin* (vê tudo), *Barbeiro* (vê sua agenda e comissões), *Cliente* (vê seus agendamentos).
*   **Políticas RLS:** Devem ser criadas APÓS a inserção dos dados iniciais. Exemplo:
    ```sql
    CREATE POLICY "Users can insert their own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);
    ```

---

## 4. Passo a Passo de Implementação Sugerido

1.  **Configuração Inicial:** Setup do projeto React/Remix e integração com Supabase Client.
2.  **Modelagem de Dados:** Criar tabelas no Supabase via SQL Editor.
3.  **UI Base:** Criar layout "Dark Theme" e componentes base (Botões, Cards, Inputs).
4.  **Feature 1 - Agenda:** Implementar visualização de horários e criação de agendamento.
5.  **Feature 2 - Comanda:** Implementar fluxo de finalizar serviço e atribuir valores.
6.  **Refinamento:** Ajustes de UX mobile e testes de fluxo.

