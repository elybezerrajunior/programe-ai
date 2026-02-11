Quero construir um **Sistema de Gestão para Pet Shop & Banho e Tosa**.

### **Programe Blueprint: Pet Shop Amigo**

Foco total no controle de agenda de banho/tosa e venda de balcão.

---

### **1. Funcionalidades Essenciais**

#### **A. Agenda de Banho e Tosa**
*   **Controle de Leva e Traz:** Marcar se precisa buscar o pet.
*   **Status do Banho:** Aguardando -> Em banho -> Em secagem -> Pronto.
*   **Observações:** Alergias, temperamento (ex: "Morde", "Assustado").

#### **B. Informações do Pet e Tutor**
*   **Cadastro Vinculado:** Um tutor pode ter vários pets.
*   **Ficha do Animal:** Raça, porte, vacinas em dia (alerta de vacina vencida).

#### **C. PDV (Ponto de Venda) Simples**
*   **Venda Rápida:** Leitura de código de barras (simulada) para rações e brinquedos.
*   **Serviços + Produtos:** Cobrar o banho junto com a ração na mesma conta.

---

### **2. Design & UX**

*   **Estética:** Colorido, amigável e divertido. Tons de Laranja, Azul e Patinhas.
*   **Usabilidade:** Botões grandes para facilitar o toque na tela touch do balcão.

---

### **3. Stack Tecnológico**
*   **Frontend:** React + Tailwind.
*   **DB:** Supabase (Tabelas: pets, owners, appointments, products).

**Comece criando o cadastro de Pets vinculado ao Tutor e a tela de agendamento.**
