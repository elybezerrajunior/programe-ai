Quero construir um **Sistema Completo para Salão de Beleza e Estética**, focado em agilidade, visual mobile-first e regras de negócio inteligentes.

### **Programe Blueprint: Salão de Beleza & Estética Premium**

Este sistema exige uma arquitetura mais robusta para lidar com comissões, estoque e fidelização. O design deve ser vibrante e o uso predominante será em dispositivos móveis (PWA).

---

### **1. Funcionalidades Avançadas & Regras de Negócio**

#### **A. Agendamento Online & Autoatendimento**
*   **Link de Agendamento:** Interface pública para o cliente final agendar sem login (apenas telefone/nome).
*   **Catálogo de Serviços:** Seleção visual de serviços com preços e duração estimada.
*   **Seleção de Profissional:** O cliente escolhe o profissional de preferência (ou "Qualquer um").

#### **B. Gestão Financeira Complexa (Comissões)**
*   **Cálculo Automático:** Ao finalizar um serviço, o sistema deve calcular automaticamente a parte do salão e a parte do profissional.
*   **Regras de Comissão:** Diferentes porcentagens por serviço ou por profissional (Ex: Cabeleireiro 50%, Manicure 40%).
*   **Fechamento de Caixa:** Controle rigoroso de abertura, sangria (retirada), reforço e fechamento diário com conciliação de métodos de pagamento (Pix, Cartão, Dinheiro).

#### **C. Controle de Estoque Inteligente**
*   **Baixa Automática:** Vínculo de produtos aos serviços (Ex: "Hidratação" consome 30ml de "Máscara X"). Ao finalizar o serviço, o estoque é atualizado.
*   **Venda de Produtos:** PDV rápido para venda de produtos Home Care para clientes.
*   **Alertas:** Notificação visual de estoque mínimo.

#### **D. CRM & Fidelização**
*   **Programa de Pontos:** Regra configurável (Ex: R$ 1,00 = 1 ponto).
*   **Histórico Visual:** Galeria de fotos por cliente para registrar evolução (Cortes, Cores).
*   **Campanhas:** Filtro de clientes sumidos (sem visita há 30 dias).

---

### **2. Design System & UI/UX (Mobile First)**

*   **Estética:** **Vibrante e Moderna**. Tons de Roxo Profundo, Dourado, Rosa ou Gradientes elegantes. Modo Escuro (Dark Mode) é obrigatório.
*   **UX Mobile:** Menus inferiores (Bottom Navigation), botões grandes (Touch Friendly), Gestos (Swipe para ações).
*   **Feedback Visual:** Micro-animações ao confirmar agendamento ou ganhar pontos.
*   **Dashboard:** Visão rápida de "Faturamento Hoje", "Próximos Clientes" e "Comissão a Receber" (para o profissional).

---

### **3. Fluxos de Usuário Críticos**

1.  **Cliente (Externo):**
    *   Acessa Link -> Escolhe Serviço e Profissional -> Escolhe Horário -> Confirma com WhatsApp -> Recebe Lembrete.
2.  **Profissional/Parceiro:**
    *   Recebe Notificação Push -> Visualiza Agenda -> Realiza Serviço -> Adiciona Produtos Usados -> Solicita Fechamento.
3.  **Recepção/Caixa:**
    *   Visualiza "Comandas Abertas" -> Confirma Serviços -> Recebe Pagamento -> Sistema divide valores (Split) -> Emite recibo (digital).

---

### **4. Stack Tecnológico & Arquitetura**

*   **Frontend:** React (Remix) com foco em PWA (Progressive Web App).
*   **Estilização:** Tailwind CSS + Framer Motion (para animações de feedback).
*   **Banco de Dados:** Supabase (PostgreSQL).
    *   *Complexidade Extra:* Relacionamentos N:N (Profissionais_Servicos), Trigger para baixa de estoque, Tabela de Movimentações Financeiras com tipos (Comissão, Venda, Serviço).
*   **Storage:** Supabase Storage para galeria de fotos dos clientes.

**Por favor, inicie com a modelagem do banco de dados (esquema SQL) devido à complexidade das relações, e em seguida configure o ambiente frontend com foco Mobile First.**
