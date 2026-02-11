Quero construir um **SaaS White-Label (Rebrandable)**.

### **Programe Blueprint: WhiteLabel Engine**

Sistema onde o cliente pode colocar o logo e as cores dele e revender.

---

### **1. Funcionalidades Essenciais**

#### **A. Customização de Marca (Theming)**
*   **Editor de Tema:** Cliente escolhe Cor Primária, Logo, Favicon e Nome do Sistema.
*   **CSS Dinâmico:** Injeção de variáveis CSS (`:root`) baseadas no banco de dados.
*   **Domínio Personalizado:** (Simulação de CNAME) `cliente.sistema.com`.

#### **B. Gestão de Revenda**
*   **Revendedor:** Cria contas para seus clientes finais.
*   **Pricing:** O revendedor define quanto cobra do cliente dele.

---

### **2. Design & UX**

*   **Estética:** "Camaleão". O sistema deve ser neutro por padrão mas aceitar qualquer cor sem quebrar o contraste.
*   **Acessibilidade:** Verificar contraste automático das cores escolhidas.

---

### **3. Stack Tecnológico**
*   **Frontend:** React (Context API para Theme Provider dinâmico).
*   **DB:** Supabase.

**Comece criando o "Theme Editor" onde o admin visualiza em tempo real as mudanças de cor na interface.**
