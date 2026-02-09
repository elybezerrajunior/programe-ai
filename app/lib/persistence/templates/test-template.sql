-- Inserir um Template de Teste (Landing Page React + Tailwind)
INSERT INTO templates (
  title,
  description,
  category,
  tags,
  technologies,
  is_public,
  gradient,
  content_snapshot
) VALUES (
  'Landing Page SaaS - Startup Pro',
  'Template moderno e responsivo para startups, com hero section, features e rodapé. Configurado com React, Vite e TailwindCSS.',
  'landing',
  ARRAY['Free', 'Responsive', 'Modern'],
  ARRAY['React', 'TailwindCSS', 'Vite', 'Lucide React'],
  true,
  'from-indigo-500 to-purple-600',
  '{
    "package.json": {
      "file": {
        "contents": "{\n  \"name\": \"startup-pro-landing\",\n  \"private\": true,\n  \"version\": \"0.0.0\",\n  \"type\": \"module\",\n  \"scripts\": {\n    \"dev\": \"vite\",\n    \"build\": \"vite build\",\n    \"preview\": \"vite preview\"\n  },\n  \"dependencies\": {\n    \"react\": \"^18.2.0\",\n    \"react-dom\": \"^18.2.0\",\n    \"lucide-react\": \"^0.344.0\"\n  },\n  \"devDependencies\": {\n    \"@types/react\": \"^18.2.66\",\n    \"@types/react-dom\": \"^18.2.22\",\n    \"@vitejs/plugin-react\": \"^4.2.1\",\n    \"autoprefixer\": \"^10.4.18\",\n    \"postcss\": \"^8.4.35\",\n    \"tailwindcss\": \"^3.4.1\",\n    \"typescript\": \"^5.2.2\",\n    \"vite\": \"^5.2.0\"\n  }\n}"
      }
    },
    "index.html": {
      "file": {
        "contents": "<!doctype html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <link rel=\"icon\" type=\"image/svg+xml\" href=\"/vite.svg\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n    <title>Startup Pro - Modern SaaS Template</title>\n  </head>\n  <body>\n    <div id=\"root\"></div>\n    <script type=\"module\" src=\"/src/main.tsx\"></script>\n  </body>\n</html>"
      }
    },
    "vite.config.ts": {
      "file": {
        "contents": "import { defineConfig } from \"vite\";\nimport react from \"@vitejs/plugin-react\";\n\n// https://vitejs.dev/config/\nexport default defineConfig({\n  plugins: [react()],\n});"
      }
    },
    "tailwind.config.js": {
      "file": {
        "contents": "/** @type {import(\"tailwindcss\").Config} */\nexport default {\n  content: [\n    \"./index.html\",\n    \"./src/**/*.{js,ts,jsx,tsx}\",\n  ],\n  theme: {\n    extend: {},\n  },\n  plugins: [],\n}"
      }
    },
    "postcss.config.js": {
      "file": {
        "contents": "export default {\n  plugins: {\n    tailwindcss: {},\n    autoprefixer: {},\n  },\n}"
      }
    },
    "src": {
      "directory": {
        "main.tsx": {
          "file": {
            "contents": "import React from \"react\";\nimport ReactDOM from \"react-dom/client\";\nimport App from \"./App.tsx\";\nimport \"./index.css\";\n\nReactDOM.createRoot(document.getElementById(\"root\")!).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>,\n);"
          }
        },
        "index.css": {
          "file": {
            "contents": "@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\nbody {\n  @apply bg-slate-50 text-slate-900;\n}"
          }
        },
        "App.tsx": {
          "file": {
            "contents": "import React from \"react\";\nimport { Rocket, CheckCircle2, ArrowRight, Zap, Shield, BarChart } from \"lucide-react\";\n\nfunction App() {\n  return (\n    <div className=\"min-h-screen\">\n      {/* Navbar */}\n      <nav className=\"px-6 py-4 flex items-center justify-between max-w-7xl mx-auto\">\n        <div className=\"flex items-center gap-2 font-bold text-xl text-indigo-600\">\n          <Rocket className=\"w-6 h-6\" />\n          <span>StartupPro</span>\n        </div>\n        <div className=\"hidden md:flex gap-8 text-sm font-medium text-slate-600\">\n          <a href=\"#features\" className=\"hover:text-indigo-600 transition-colors\">Recursos</a>\n          <a href=\"#pricing\" className=\"hover:text-indigo-600 transition-colors\">Preços</a>\n          <a href=\"#about\" className=\"hover:text-indigo-600 transition-colors\">Sobre</a>\n        </div>\n        <button className=\"bg-indigo-600 text-white px-5 py-2 rounded-full font-medium hover:bg-indigo-700 transition-colors\">\n          Começar Agora\n        </button>\n      </nav>\n\n      {/* Hero Section */}\n      <header className=\"px-6 py-20 md:py-32 max-w-7xl mx-auto text-center\">\n        <h1 className=\"text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-6\">\n          Lance sua ideia <span className=\"text-indigo-600\">na velocidade da luz</span>\n        </h1>\n        <p className=\"text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto\">\n          O template perfeito para validar seu SaaS. Componentes prontos,\n          design limpo e alta performance para converter visitantes em usuários.\n        </p>\n        <div className=\"flex flex-col sm:flex-row gap-4 justify-center\">\n          <button className=\"flex items-center justify-center gap-2 bg-indigo-600 text-white px-8 py-3.5 rounded-full font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200\">\n            Criar Conta Grátis <ArrowRight className=\"w-5 h-5\" />\n          </button>\n          <button className=\"flex items-center justify-center gap-2 bg-white text-slate-700 border border-slate-200 px-8 py-3.5 rounded-full font-semibold hover:bg-slate-50 transition-all\">\n            Ver Demonstração\n          </button>\n        </div>\n      </header>\n\n      {/* Features Grid */}\n      <section id=\"features\" className=\"bg-white py-20 px-6\">\n        <div className=\"max-w-7xl mx-auto\">\n          <div className=\"text-center mb-16\">\n            <h2 className=\"text-3xl font-bold mb-4\">Tudo o que você precisa</h2>\n            <p className=\"text-slate-600\">Ferramentas poderosas para escalar seu negócio.</p>\n          </div>\n          \n          <div className=\"grid md:grid-cols-3 gap-8\">\n            {[ \n              { icon: Zap, title: \"Performance Extrema\", desc: \"Carregamento instantâneo para melhor experiência do usuário e SEO.\" },\n              { icon: Shield, title: \"Segurança Total\", desc: \"Proteção de dados nível empresarial com criptografia de ponta a ponta.\" },\n              { icon: BarChart, title: \"Analytics em Tempo Real\", desc: \"Acompanhe suas métricas de crescimento diretamente no dashboard.\" }\n            ].map((feature, i) => (\n              <div key={i} className=\"p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-xl transition-shadow\">\n                <div className=\"w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4\">\n                  <feature.icon className=\"w-6 h-6\" />\n                </div>\n                <h3 className=\"text-xl font-bold mb-2\">{feature.title}</h3>\n                <p className=\"text-slate-600\">{feature.desc}</p>\n              </div>\n            ))}\n          </div>\n        </div>\n      </section>\n\n      {/* Footer */}\n      <footer className=\"bg-slate-900 text-slate-400 py-12 px-6\">\n        <div className=\"max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6\">\n          <div className=\"flex items-center gap-2 font-bold text-xl text-white\">\n            <Rocket className=\"w-5 h-5\" />\n            <span>StartupPro</span>\n          </div>\n          <div className=\"text-sm\">\n            © 2024 StartupPro Inc. Todos os direitos reservados.\n          </div>\n        </div>\n      </footer>\n    </div>\n  );\n}\n\nexport default App;"
          }
        }
      }
    }
  }'::jsonb
);
