Quero construir uma **Plataforma de Cursos Online (LMS)**.

### **Programe Blueprint: Academy LMS**

Área de membros para produtores de conteúdo venderem seus cursos.

---

### **1. Funcionalidades Essenciais**

#### **A. Área do Aluno (Player)**
*   **Estrutura de Curso:** Módulos e Aulas.
*   **Progresso:** Barra de progresso geral e marcação de aula concluída ("Mark as done").
*   **Player de Vídeo:** Integração (Youtube/Vimeo/BunnyCDN).
*   **Materiais de Apoio:** Download de PDFs.

#### **B. Área do Instrutor (Admin)**
*   **Criador de Curso:** Upload de capas, descrição e estruturação da grade curricular.
*   **Gestão de Alunos:** Ver quem comprou e o progresso de cada um.

#### **C. Gamificação Básica**
*   **Certificado:** Gerar PDF simples ao completar 100%.

---

### **2. Design & UX**

*   **Estética:** Imersiva (Dark Mode para vídeo é ótimo). Foco no conteúdo.
*   **UX:** Navegação lateral fluida entre as aulas do módulo.

---

### **3. Stack Tecnológico**
*   **Frontend:** React (Remix para proteger rotas pagas).
*   **DB:** Supabase.
*   **Vídeo:** Usaremos iframes simulados ou integração real com Youtube (Unlisted).

**Inicie construindo o Layout da Sala de Aula (Player de Vídeo + Lista de Aulas na lateral).**
