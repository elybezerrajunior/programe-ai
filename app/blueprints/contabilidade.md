Quero construir um **Sistema de Gestão para Contabilidade**.

### **Programe Blueprint: Contábil Hub**

Centralizar a comunicação e troca de documentos entre Contador e Empresas Clientes.

---

### **1. Funcionalidades Essenciais**

#### **A. Gestão de Obrigações Fiscais**
*   **Calendário Fiscal:** DAS, DARF, Folha de Pagamento.
*   **Status de Entrega:** Pendente, Enviado, Pago pelo Cliente.

#### **B. Portal do Cliente**
*   **Solicitações:** Cliente pede "Férias de funcionário" ou "Alteração contratual".
*   **Documentos:** Contador faz upload da guia de imposto -> Cliente recebe notificação e baixa.

#### **C. Gestão de Empresas**
*   **Dados Cadastrais:** CNPJ, Regime Tributário (Simples, Presumido, Real).

---

### **2. Design & UX**

*   **Estética:** Azul ou Verde, organizado.
*   **Painel:** Dashboard com visão geral de "Pendências da Semana".

---

### **3. Stack Tecnológico**
*   **Frontend:** React.
*   **DB:** Supabase (Storage pesado para PDFs).

**Inicie criando o Portal do Cliente onde ele visualiza as guias de impostos pendentes.**
