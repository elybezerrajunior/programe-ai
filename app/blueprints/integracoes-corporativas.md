Quero construir uma **Plataforma de Integrações Corporativas**.

### **Programe Blueprint: Integration Hub**

Middleware para conectar sistemas legados com novos.

---

### **1. Funcionalidades Essenciais**

#### **A. Conectores (Connectors)**
*   **Catálogo:** "Conectar com SAP", "Conectar com Salesforce", "Conectar com Banco X" (Simulados).
*   **Configuração:** Input de API Keys e Webhooks.

#### **B. Fluxos de Dados (ETL)**
*   **Designer Visual:** "Quando chegar dado X -> Transforma em Y -> Envia para Z".
*   **Mapeamento (De/Para):** Mapear campos JSON.

#### **C. Logs e Monitoramento**
*   **Health Check:** Ver se as APIs conectadas estão online.
*   **Retries:** Configurar tentativas de reenvio em caso de falha.

---

### **2. Design & UX**

*   **Estética:** Técnica. Dark mode com código colorido (Syntax highlighting).
*   **Editor:** Canvas visual baseada em nós (Node-based editor).

---

### **3. Stack Tecnológico**
*   **Frontend:** React + React Flow (para o editor visual).
*   **DB:** Supabase.

**Comece criando o Editor Visual de Fluxos com React Flow.**
