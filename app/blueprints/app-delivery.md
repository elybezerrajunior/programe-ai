Quero construir um **App de Delivery (Estilo iFood/UberEats)**.

### **Programe Blueprint: Delivery Now**

Sistema de pedidos para restaurantes com app do cliente, do restaurante e do entregador (simulado).

---

### **1. Funcionalidades Essenciais**

#### **A. Cliente (PWA/App)**
*   **Cardápio Digital:** Categorias, adicionais (ex: "Sem cebola", "Borda recheada").
*   **Carrinho:** Válido apenas para um restaurante por vez.
*   **Rastreio:** Status do pedido em tempo real (Socket/Polling).

#### **B. Restaurante (Gestor de Pedidos)**
*   **Campainha:** Som ao chegar novo pedido.
*   **Aceite:** Aceitar Pedido -> Em Preparo -> Saiu para Entrega.

#### **C. Entregador (Simplificado)**
*   **Rota:** Ver endereço de retirada e entrega.

---

### **2. Design & UX**

*   **Estética:** Vermelho/Amarelo (Fome). Fotos de comida de alta qualidade.
*   **Mobile First:** Essencial para o cliente final.

---

### **3. Stack Tecnológico**
*   **Frontend:** React (PWA).
*   **Realtime:** Supabase Realtime para atualizar status do pedido sem refresh.

**Inicie pelo Cardápio Digital (Seleção de itens e adicionais) e o fluxo de Carrinho.**
