Quero construir um **Marketplace Multivendedor (estilo Mercado Livre/Elo7)**.

### **Programe Blueprint: Market Hub**

Plataforma onde vendedores cadastram lojas e produtos, e compradores compram em carrinho único.

---

### **1. Funcionalidades Essenciais**

#### **A. Multi-Tenant (Lojas)**
*   **Painel do Vendedor:** Dashboard próprio, gestão de catálogo e pedidos "da loja".
*   **Onboarding:** Cadastro do vendedor (KYC básico).

#### **B. Catálogo Unificado**
*   **Busca Global:** Elastic Search (ou similar) para encontrar produtos de qualquer vendedor.
*   **Carrinho Misto:** Comprar produto da Loja A e Loja B no mesmo checkout (Split de pagamento no backend).

#### **C. Gestão de Pedidos**
*   **Logística:** Cálculo de frete separado por loja de origem.
*   **Comissões:** Plataforma retém X%, Vendedor recebe Y%.

---

### **2. Design & UX**

*   **Estética:** Varejo moderno. Branco, Laranja/Azul.
*   **Consumidor Final:** Foco total em conversão, upsell ("Quem viu isso comprou aquilo").

---

### **3. Stack Tecnológico**
*   **Frontend:** React (Next.js ideal).
*   **DB:** Supabase (Relacionamentos complexos: Orders -> OrderItems -> Products -> Stores).

**Comece desenvolvendo o fluxo de compra: Página de Produto -> Carrinho (com itens de lojas diferentes) -> Checkout.**
