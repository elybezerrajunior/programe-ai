Quero construir um **Sistema de Orçamentos para Oficina Mecânica**.

### **Programe Blueprint: Mecânica Digital**

Foco em gerar orçamentos confiáveis e controlar o andamento do serviço.

---

### **1. Funcionalidades Essenciais**

#### **A. Orçamento e Diagnóstico**
*   **Cadastro de Veículo:** Placa, Modelo, Ano, Km.
*   **Peças e Mão de Obra:** Seleção de peças do estoque e valor da hora trabalhada.
*   **PDF:** Gerar PDF do orçamento para enviar ao cliente via Zap.

#### **B. Ordens de Serviço (OS)**
*   **Aprovação:** Cliente aprova o orçamento -> Vira OS.
*   **Status de Execução:** Aguardando Peça -> Em manutenção -> Finalizado.

#### **C. Histórico do Carro**
*   **Manutenções Anteriores:** Saber o que já foi feito naquele veículo.

---

### **2. Design & UX**

*   **Estética:** Sóbria, Cinza, Azul Escuro. "Graxa e Metal".
*   **Foco:** Clareza nos valores e transparência para o cliente.

---

### **3. Stack Tecnológico**
*   **Frontend:** React + lib para gerar PDF (jspdf ou react-pdf).
*   **DB:** Supabase.

**Comece criando o formulário de orçamento com cálculo automático de Peças + Mão de Obra.**
