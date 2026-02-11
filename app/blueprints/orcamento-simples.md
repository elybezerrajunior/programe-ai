Quero construir um **Gerador de Orçamentos Simples**.

### **Programe Blueprint: Orçamento Express**

Ferramenta para prestadores de serviço (encanadores, eletricistas, freelancers) gerarem propostas rápidas.

---

### **1. Funcionalidades Essenciais**

#### **A. Criador de Proposta**
*   **Dados do Cliente:** Nome e Contato.
*   **Itens:** Descrição do serviço, quantidade, valor unitário.
*   **Observações:** Prazos e condições de pagamento.

#### **B. Exportação**
*   **Gerar Imagem/PDF:** Criar um layout bonito para ser enviado no WhatsApp.
*   **Histórico:** Salvar orçamentos enviados para consulta futura.

---

### **2. Design & UX**

*   **Estética:** Simples e direta. Foco em formulários fáceis de preencher no celular.

---

### **3. Stack Tecnológico**
*   **Frontend:** React + `html2canvas` (para gerar imagem do orçamento).
*   **DB:** Supabase (opcional, pode ser local storage no início, mas vamos fazer com banco).

**Crie o formulário de entrada de itens e a pré-visualização do "papel" do orçamento em tempo real.**
