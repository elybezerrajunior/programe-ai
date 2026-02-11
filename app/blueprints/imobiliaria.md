Quero construir um **Sistema para Imobiliária**.

### **Programe Blueprint: Imob Gestão**

Gestão de carteira de imóveis e contratos de aluguel/venda.

---

### **1. Funcionalidades Essenciais**

#### **A. Gestão de Imóveis**
*   **Ficha do Imóvel:** Endereço, características (quartos, vagas), proprietário.
*   **Galeria de Fotos:** Upload múltiplo de imagens do imóvel.
*   **Status:** Disponível, Alugado, Vendido, Em Manutenção.

#### **B. Contratos e Financeiro**
*   **Contratos de Aluguel:** Data de início, fim, índice de reajuste (IGPM/IPCA).
*   **Repasse:** Controle do quanto deve ser repassado ao proprietário (menos taxa de adm).

#### **C. Portal do Site (Publico)**
*   **Busca:** Filtros por bairro, valor, tipo.

---

### **2. Design & UX**

*   **Estética:** Elegante, limpo. Foco nas fotos dos imóveis.
*   **Gallery:** Componente de carrossel de imagens robusto.

---

### **3. Stack Tecnológico**
*   **Frontend:** React.
*   **DB:** Supabase (PostGIS se quisermos mapas mapa, por enquanto apenas texto).
*   **Storage:** Supabase Storage para muitas fotos.

**Comece criando o cadastro detalhado de imóvel com upload de múltiplas fotos.**
