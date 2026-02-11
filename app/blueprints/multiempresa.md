Quero construir um **Sistema Multiempresa (Holdings/Franquias)**.

### **Programe Blueprint: Enterprise Hub**

Gestão centralizada de múltiplas operações independentes.

---

### **1. Arquitetura Multi-Nível**

#### **A. Estrutura Hierárquica**
*   **Holding (Matriz):** Visão de todas as filiais.
*   **Filial:** Visão apenas dos seus dados.
*   **Franqueado:** Visão da sua unidade com limitações.

#### **B. Consolidação de Dados**
*   **Financeiro Global:** Somar caixa de todas as filiais em tempo real.
*   **Estoque Inter-Filial:** Transferência de produtos entre unidades.

#### **C. Gestão de Padrões**
*   **Catálogo Mestre:** A matriz define os produtos e preços (ou preço sugerido).

---

### **2. Design & UX**

*   **Estética:** Cores institucionais sóbrias (Azul marinho, Cinza).
*   **Switch de Contexto:** Seletor de "Em qual empresa estou operando agora?" no topo.

---

### **3. Stack Tecnológico**
*   **Frontend:** React.
*   **DB:** Supabase (RLS muito complexo com policies de hierarchy).

**Inicie configurando a modelagem de dados para suportar Matriz -> Filiais e o seletor de contexto.**
