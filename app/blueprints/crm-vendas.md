Quero construir um **CRM de Vendas (Pipeline)**.

### **Programe Blueprint: Vendas Flow**

Um sistema focado em times comerciais para gerenciar oportunidades e fechar negócios.

---

### **1. Funcionalidades Essenciais**

#### **A. Pipeline de Vendas (Kanban)**
*   **Etapas:** Prospecção -> Qualificação -> Proposta Enviada -> Negociação -> Fechado Ganho (ou Perdido).
*   **Drag & Drop:** Mover cards de clientes entre as etapas.
*   **Valor do Pipeline:** Somatório automático dos valores em cada coluna.

#### **B. Gestão de Contatos e Empresas**
*   **B2B:** Vincular múltiplos contatos a uma empresa.
*   **Histórico Completo:** Emails trocados, reuniões agendadas, notas.

#### **C. Automações Simples (Simulação)**
*   **Gatilhos:** "Se mover para 'Proposta Enviada', criar tarefa de follow-up para 3 dias depois".

---

### **2. Design & UX**

*   **Estética:** Profissional, limpo (estilo Salesforce/Pipedrive, mas simplificado).
*   **Foco:** Visualização rápida do funil e das tarefas do dia.

---

### **3. Stack Tecnológico**
*   **Frontend:** React + dnd-kit.
*   **DB:** Supabase.
*   **Charts:** Recharts para gráficos de "Vendas no Mês".

**Inicie criando o componente visual do Funil de Vendas (Kanban Board) interativo.**
