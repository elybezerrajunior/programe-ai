import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs, type MetaFunction } from '@remix-run/cloudflare';
import { useNavigation } from '@remix-run/react';
import { LoginForm } from '~/components/login/LoginForm';
import { LoginFeatures } from '~/components/login/LoginFeatures';
import { LoginLightEffect } from '~/components/login/LoginLightEffect';
import { Card } from '~/components/ui/Card';
import { getSessionFromRequest, validateEmail, validatePassword, createSessionCookies, createSessionHeaders } from '~/lib/auth/session';
import { createSupabaseClient, getSupabaseProjectRef } from '~/lib/auth/supabase-client';
import { signInWithPassword, AuthenticationError } from '~/lib/auth/supabase-auth';

function getSupabaseProjectRefFromUrl(url: string): string {
  const match = url.match(/https?:\/\/([^.]+)\.supabase\.co/);
  return match ? match[1] : '';
}

export const meta: MetaFunction = () => {
  return [
    { title: 'Login - Programe Studio' },
    { name: 'description', content: 'Entre no Modo Construção do Programe Studio' },
  ];
};

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  const env = (context?.cloudflare?.env as unknown as Record<string, string> | undefined) ?? undefined;
  const session = await getSessionFromRequest(request, env ?? undefined);
  if (session) {
    // Verificar se há redirectTo na query string
    const url = new URL(request.url);
    const redirectTo = url.searchParams.get('redirectTo') || '/';
    return redirect(redirectTo);
  }

  const url = new URL(request.url);
  const error = url.searchParams.get('error');
  const signupSuccess = url.searchParams.get('signupSuccess');
  const resetSuccess = url.searchParams.get('resetSuccess');

  // URL base da aplicação - usada pelo OAuth para garantir callback correto em produção
  const appUrl = (env?.APP_URL || env?.VITE_APP_URL || url.origin).replace(/\/$/, '');

  return json({
    error: error || null,
    signupSuccess: signupSuccess === 'true',
    resetSuccess: resetSuccess === 'true',
    appUrl,
  });
};

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const email = formData.get('email')?.toString() || '';
  const password = formData.get('password')?.toString() || '';

  // Validação básica
  if (!email || !password) {
    return json(
      { error: 'E-mail e senha são obrigatórios', fields: { email: !email, password: !password } },
      { status: 400 },
    );
  }

  if (!validateEmail(email)) {
    return json({ error: 'E-mail inválido', fields: { email: true } }, { status: 400 });
  }

  if (!validatePassword(password)) {
    return json({ error: 'Senha deve ter no mínimo 6 caracteres', fields: { password: true } }, { status: 400 });
  }

  const env = (context?.cloudflare?.env as unknown as Record<string, string> | undefined) ?? process.env;
  const supabaseUrl = env?.VITE_SUPABASE_URL;
  const supabaseAnonKey = env?.VITE_SUPABASE_ANON_KEY;
  const supabaseClient =
    supabaseUrl && supabaseAnonKey ? createSupabaseClient(supabaseUrl, supabaseAnonKey) : null;
  const projectRef = supabaseUrl ? getSupabaseProjectRefFromUrl(supabaseUrl) : getSupabaseProjectRef();

  try {
    // Autenticar com Supabase
    const { user, session } = await signInWithPassword(email, password, supabaseClient ?? undefined);

    if (!session) {
      return json({ error: 'Não foi possível criar uma sessão', fields: { email: true, password: true } }, { status: 401 });
    }

    // Obter redirectTo da query string; padrão é a home (/)
    const url = new URL(request.url);
    let redirectTo = url.searchParams.get('redirectTo')?.trim() || '/';
    if (!redirectTo.startsWith('/')) redirectTo = '/';

    // Garantir que o redirect seja apenas para a mesma origem (evitar open redirect)
    try {
      const testRedirectUrl = new URL(redirectTo, url.origin);
      if (testRedirectUrl.origin !== url.origin) redirectTo = '/';
    } catch {
      redirectTo = '/';
    }

    // Criar cookies de sessão
    const cookies = createSessionCookies(
      session.access_token,
      session.refresh_token || '',
      projectRef || undefined
    );

    // Adicionar tokens na URL temporariamente para sincronização no cliente
    // (serão removidos pelo componente AuthSync após sincronização)
    const redirectUrl = new URL(redirectTo, url.origin);
    redirectUrl.searchParams.set('access_token', session.access_token);
    if (session.refresh_token) {
      redirectUrl.searchParams.set('refresh_token', session.refresh_token);
    }

    // Redirecionar para a home (/) ou para redirectTo quando vindo de rota protegida
    return redirect(redirectUrl.toString(), {
      headers: createSessionHeaders(cookies),
    });
  } catch (error) {
    // Tratar erros de autenticação
    if (error instanceof AuthenticationError) {
      const status = error.isRateLimit ? 429 : 401;
      if (error.isRateLimit) {
        console.warn('[Login] Rate limit do Supabase:', error.originalError?.message ?? error.message);
      }
      return json(
        {
          error: error.message,
          fields: { email: true, password: true },
        },
        { status },
      );
    }

    // Erro genérico
    console.error('Login error:', error);
    return json(
      {
        error: 'Erro ao fazer login. Tente novamente',
        fields: { email: true, password: true },
      },
      { status: 500 },
    );
  }
};

export default function Login() {
  const navigation = useNavigation();
  const showLoading =
    navigation.state === 'submitting' || navigation.state === 'loading';

  return (
    <div className="min-h-screen bg-bolt-elements-background-depth-1 flex items-center justify-center p-6">
      <div className="w-full max-w-5xl">
        <div className="relative">
          <Card className="p-8 rounded-[2rem] relative z-10 overflow-hidden">
            <LoginLightEffect />
            {showLoading ? (
              <div className="flex flex-col items-center justify-center py-16 px-8 min-h-[400px]">
                <div className="flex flex-col items-center gap-6">
                  <div className="i-svg-spinners:90-ring-with-bg text-bolt-elements-loader-progress text-6xl animate-spin" />
                  <div className="text-center">
                    <h2 className="text-xl font-semibold text-bolt-elements-textPrimary mb-2">
                      {navigation.state === 'submitting'
                        ? 'Entrando...'
                        : 'Redirecionando...'}
                    </h2>
                    <p className="text-sm text-bolt-elements-textSecondary">
                      {navigation.state === 'submitting'
                        ? 'Aguarde enquanto processamos seu login'
                        : 'Em instantes você estará na home'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              // Conteúdo normal do login
              <div className="flex flex-col relative z-10">
                <div className="flex flex-col lg:flex-row gap-8 items-center">
                  <div className="flex-1 w-full">
                    <LoginForm />
                  </div>
                  <div className="lg:border-l border-bolt-elements-borderColor lg:pl-8 flex-1 w-full">
                    <LoginFeatures />
                  </div>
                </div>
                <div className="text-center mt-8 pt-6 border-t border-bolt-elements-borderColor">
                  <span className="text-sm text-bolt-elements-textSecondary">
                    Novo por aqui?{' '}
                    <a
                      href="/signup"
                      className="text-accent-500 hover:underline font-medium"
                    >
                      Criar conta grátis
                    </a>
                  </span>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
