Quero construir um **Sistema de Gestão para Clínica Simples** focado em organização e eficiência para pequenos consultórios.

### **Programe Blueprint: Clínica Simples**

Este sistema deve ser **profissional, minimalista e confiável**, ideal para clínicas médicas, odontológicas ou de estética que buscam sair do papel/planilha.

---

### **1. Funcionalidades Essenciais (MVP)**

#### **A. Gestão de Agendamentos (Core)**
*   **Calendário Interativo:** Visualização diária, semanal e mensal.
*   **Status de Agendamento:** Agendado, Confirmado, Em Atendimento, Finalizado, Cancelado.
*   **Bloqueio de Horários:** Intervalos de almoço, feriados ou indisponibilidade do profissional.
*   **Lembretes:** (Simulação) Interface para envio de lembretes via WhatsApp/Email.

#### **B. Prontuário Eletrônico Simplificado (PEP)**
*   **Histórico do Paciente:** Visualização cronológica de todos os atendimentos.
*   **Anotações Clínicas:** Campo de texto rico para evolução do tratamento.
*   **Anexos:** Capacidade de upload ou link para exames e fotos (Antes/Depois).

#### **C. Gestão Administrativa & Financeira Básica**
*   **Cadastro de Pacientes:** Dados completos (Nome, CPF, Contato, Endereço, Data Nascimento).
*   **Controle de Caixa:** Registro de entradas (consultas) e saídas (despesas).
*   **Dashboard Financeiro:** Resumo diário e mensal de faturamento.

#### **D. Controle de Acesso (RBAC)**
*   **Administrador:** Acesso total ao sistema.
*   **Recepcionista:** Acesso à agenda e cadastro de pacientes.
*   **Profissional de Saúde:** Acesso apenas à sua própria agenda e prontuários dos seus pacientes.

---

### **2. Design System & UI/UX**

*   **Estética:** Clean, "Medical Clean". Tons de **Azul (#0ea5e9)**, **Verde Saúde (#10b981)** e muito espaço em branco para facilitar a leitura.
*   **Tipografia:** Inter ou Lato (foco em legibilidade).
*   **Responsividade:** O sistema deve funcionar perfeitamente em Desktops (Recepção) e Tablets (Profissionais na sala de atendimento).
*   **Componentes:** Cards de resumo, Tabelas limpas, Botões de ação claros (Agendar, Iniciar Atendimento).

---

### **3. Fluxos de Usuário (User Journey)**

1.  **Recepcionista:**
    *   Login -> Dashboard (Agenda do Dia) -> Novo Agendamento -> Cadastro Rápido de Paciente (se novo) -> Confirmação.
2.  **Profissional:**
    *   Login -> Visualiza Próximos Pacientes -> Abre Prontuário -> Registra Evolução -> Finaliza Atendimento.
3.  **Administrador:**
    *   Acessa Relatórios -> Visualiza Faturamento do Mês -> Cadastra novo Profissional.

---

### **4. Stack Tecnológico & Requisitos Técnicos**

*   **Frontend:** React (Remix ou Vite) com TypeScript.
*   **Estilização:** Tailwind CSS (Uso de classes utilitárias para rapidez e consistência).
*   **Banco de Dados:** Supabase (PostgreSQL). Tabelas sugeridas: `users`, `profiles`, `appointments`, `patients`, `medical_records`, `transactions`.
*   **Auth:** Supabase Auth (Gerenciamento de roles via Metadata ou Tabela `profiles`).

**Por favor, inicie gerando a estrutura do projeto, configurando o tema base (cores e tipografia) e criando o layout principal com a barra de navegação lateral (Sidebar).**
