Quero construir uma **Plataforma SaaS Multi-Tenant (Software as a Service)**.

### **Programe Blueprint: SaaS Starter Kit**

Base sólida para lançar produtos de assinatura recorrente.

---

### **1. Funcionalidades Essenciais**

#### **A. Gestão de Assinaturas (Stripe/Brasil)**
*   **Planos:** Free, Pro, Enterprise.
*   **Limites:** Controle de uso por plano (Ex: Free pode criar 5 projetos).
*   **Portal de Faturamento:** Cliente baixa notas e altera cartão.

#### **B. Multi-Tenancy (Isolamento)**
*   **Workspaces:** Usuário cria uma "Conta/Empresa" e convida membros.
*   **Roles:** Admin, Editor, Viewer dentro do workspace.

#### **C. Onboarding e Métricas**
*   **Tour:** Guia inicial.
*   **Admin Geral:** SuperAdmin vê MRR, Churn e usuários ativos.

---

### **2. Design & UX**

*   **Estética:** Padrão "Indie Hacker". Tailwind UI, Inter font, clean borders.
*   **UX:** Foco na redução do "Time to Value".

---

### **3. Stack Tecnológico**
*   **Frontend:** React.
*   **DB:** Supabase (RLS - Row Level Security é *CRÍTICO* aqui para isolar dados dos tenants).

**Inicie configurando o sistema de Workspaces e o controle de acesso (RLS) no Supabase.**
