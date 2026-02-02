interface Env {
  RUNNING_IN_DOCKER: Settings;
  DEFAULT_NUM_CTX: Settings;
  ANTHROPIC_API_KEY: string;
  OPENAI_API_KEY: string;
  GROQ_API_KEY: string;
  HuggingFace_API_KEY: string;
  OPEN_ROUTER_API_KEY: string;
  OLLAMA_API_BASE_URL: string;
  OPENAI_LIKE_API_KEY: string;
  OPENAI_LIKE_API_BASE_URL: string;
  OPENAI_LIKE_API_MODELS: string;
  TOGETHER_API_KEY: string;
  TOGETHER_API_BASE_URL: string;
  DEEPSEEK_API_KEY: string;
  LMSTUDIO_API_BASE_URL: string;
  GOOGLE_GENERATIVE_AI_API_KEY: string;
  MISTRAL_API_KEY: string;
  XAI_API_KEY: string;
  PERPLEXITY_API_KEY: string;
  AWS_BEDROCK_CONFIG: string;
  // Auth / Supabase (build + runtime)
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  // ASAAS (pagamentos) – ver docs/ENV_PRODUCAO.md
  ASAAS_API_KEY?: string;
  ASAAS_API_URL?: string;
  ASAAS_WEBHOOK_TOKEN?: string;
  APP_URL?: string;
  VITE_APP_URL?: string;
  // Integrações opcionais
  GITHUB_ACCESS_TOKEN?: string;
  VITE_GITHUB_ACCESS_TOKEN?: string;
  NETLIFY_TOKEN?: string;
  VITE_NETLIFY_ACCESS_TOKEN?: string;
  VITE_VERCEL_ACCESS_TOKEN?: string;
  VITE_SUPABASE_ACCESS_TOKEN?: string;
  GITHUB_BUG_REPORT_TOKEN?: string;
  BUG_REPORT_REPO?: string;
}
