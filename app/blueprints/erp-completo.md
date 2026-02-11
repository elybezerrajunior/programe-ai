Quero construir um **Sistema ERP Completo (Enterprise Resource Planning)**.

### **Programe Blueprint: ERP Nexus**

O objetivo é integrar todas as áreas de uma empresa média/grande em um único sistema escalável.

---

### **1. Módulos Essenciais (Core)**

#### **A. Financeiro (Avançado)**
*   **Conciliação Bancária:** Importação de OFX/CNAB.
*   **Gestão de Tributos:** Impostos retidos na fonte.
*   **Centro de Resultados:** DRE por Unidade de Negócio.

#### **B. Vendas e Faturamento**
*   **Emissão de NFe:** (Simulada ou integração com API externa).
*   **Pedido de Venda:** Workflow de aprovação de desconto.

#### **C. Estoque (WMS Básico)**
*   **Inventário:** Controle por lote e validade (FEFO/FIFO).
*   **Reversa:** Processo de devolução de venda.

#### **D. RH/DP**
*   **Ponto:** Registro de jornada de trabalho.
*   **Folha:** Cálculo prévio de proventos/descontos.

---

### **2. Design & UX**

*   **Estética:** Dashboards densos, fontes monoespaçadas para números. Foco em performance de renderização.
*   **Navegação:** Menu lateral expansível com busca rápida de módulos ("Spotlight search" interna).

---

### **3. Stack Tecnológico & Arquitetura**

*   **Frontend:** React (Vite) + Tanstack Table (indispensável para grandes volumes de dados).
*   **Backend:** Supabase (PostgreSQL robusto com Procedures).
*   **Relatórios:** Gerador de PDF server-side.

**Inicie pela estrutura modular do frontend (layout shell) e o Dashboard Financeiro Consolidado.**
