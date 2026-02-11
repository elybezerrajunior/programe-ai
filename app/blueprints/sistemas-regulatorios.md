Quero construir um **Sistema Regulatório (Compliance)**.

### **Programe Blueprint: Compliance Guard**

Foco em auditoria, rastreabilidade e segurança da informação.

---

### **1. Funcionalidades Críticas**

#### **A. Trilhas de Auditoria (Audit Logs)**
*   **Log Imutável:** "Quem fez o que, quando e de onde (IP)".
*   **Visualização:** Timeline de alterações em cada registro.

#### **B. Controle de Documentos**
*   **Versionamento:** V1, V2, V3 de políticas.
*   **Assinatura Digital:** Registro de "Li e Concordo".

#### **C. Gestão de Não-Conformidades**
*   **Workflow:** Reportar incidente -> Investigar -> Plano de Ação -> Resolver.

---

### **2. Design & UX**

*   **Estética:** Extremamente "chata" e corporativa. Ênfase em tabelas e logs textuais.
*   **Segurança:** A interface deve transmitir que nada pode ser deletado sem rastro.

---

### **3. Stack Tecnológico**
*   **Frontend:** React.
*   **DB:** Supabase (Tables com `soft delete` apenas, nada é deletado fisicamente).

**Inicie criando o sistema de Audit Log centralizado e a visualização de histórico de alterações.**
