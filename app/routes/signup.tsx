import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs, type MetaFunction } from '@remix-run/cloudflare';
import { useNavigation } from '@remix-run/react';
import { SignupForm } from '~/components/signup/SignupForm';
import { SignupFeatures } from '~/components/signup/SignupFeatures';
import { SignupLightEffect } from '~/components/signup/SignupLightEffect';
import { Card } from '~/components/ui/Card';
import {
  getSessionFromRequest,
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
  createSessionCookies,
  createSessionHeaders,
} from '~/lib/auth/session';
import { createSupabaseClient, getSupabaseProjectRef } from '~/lib/auth/supabase-client';
import { signUpWithPassword, AuthenticationError } from '~/lib/auth/supabase-auth';

export const meta: MetaFunction = () => {
  return [
    { title: 'Criar Conta - Programe Studio' },
    { name: 'description', content: 'Crie sua conta no Programe Studio e comece a construir com IA' },
  ];
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const session = await getSessionFromRequest(request);
  if (session) {
    const url = new URL(request.url);
    const redirectTo = url.searchParams.get('redirectTo') || '/';
    return redirect(redirectTo);
  }

  const url = new URL(request.url);
  const error = url.searchParams.get('error');

  return json({
    error: error || null,
  });
};

function getSupabaseProjectRefFromUrl(url: string): string {
  const match = url.match(/https?:\/\/([^.]+)\.supabase\.co/);
  return match ? match[1] : '';
}

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const email = formData.get('email')?.toString() || '';
  const password = formData.get('password')?.toString() || '';
  const confirmPassword = formData.get('confirmPassword')?.toString() || '';
  const name = formData.get('name')?.toString() || '';

  if (!email || !password || !confirmPassword || !name) {
    return json(
      {
        error: 'Nome, e-mail, senha e confirmação de senha são obrigatórios',
        fields: { email: !email, password: !password, confirmPassword: !confirmPassword, name: !name },
      },
      { status: 400 }
    );
  }

  if (name.trim().length === 0) {
    return json({ error: 'Nome é obrigatório', fields: { name: true } }, { status: 400 });
  }

  if (name.length > 100) {
    return json({ error: 'Nome muito longo (máximo 100 caracteres)', fields: { name: true } }, { status: 400 });
  }

  if (!validateEmail(email)) {
    return json({ error: 'E-mail inválido', fields: { email: true } }, { status: 400 });
  }

  if (!validatePassword(password)) {
    return json(
      { error: 'Senha deve ter no mínimo 6 caracteres', fields: { password: true } },
      { status: 400 }
    );
  }

  if (!validatePasswordConfirmation(password, confirmPassword)) {
    return json(
      { error: 'As senhas não coincidem', fields: { password: true, confirmPassword: true } },
      { status: 400 }
    );
  }

  const env = (context?.cloudflare?.env as unknown as Record<string, string> | undefined) ?? process.env;
  const supabaseUrl = env?.VITE_SUPABASE_URL;
  const supabaseAnonKey = env?.VITE_SUPABASE_ANON_KEY;
  const supabaseClient =
    supabaseUrl && supabaseAnonKey ? createSupabaseClient(supabaseUrl, supabaseAnonKey) : null;
  const projectRef = supabaseUrl ? getSupabaseProjectRefFromUrl(supabaseUrl) : getSupabaseProjectRef();

  const requestUrl = new URL(request.url);
  const baseUrl = env?.APP_URL || env?.VITE_APP_URL || requestUrl.origin;
  const emailRedirectTo = `${baseUrl.replace(/\/$/, '')}/login`;

  try {
    const { user, session, requiresEmailConfirmation } = await signUpWithPassword(email, password, {
      name: name.trim(),
      client: supabaseClient,
      emailRedirectTo,
    });

    if (!user) {
      return json(
        { error: 'Não foi possível criar a conta', fields: { email: true, password: true } },
        { status: 500 }
      );
    }

  const url = new URL(request.url);
  const redirectTo = url.searchParams.get('redirectTo') || '/';

    if (session) {
      const cookies = createSessionCookies(
        session.access_token,
        session.refresh_token || '',
        projectRef || undefined
      );

      const redirectUrl = new URL(redirectTo, url.origin);
      redirectUrl.searchParams.set('access_token', session.access_token);
      if (session.refresh_token) {
        redirectUrl.searchParams.set('refresh_token', session.refresh_token);
      }

      return redirect(redirectUrl.toString(), {
        headers: createSessionHeaders(cookies),
      });
    }

    if (requiresEmailConfirmation) {
      const redirectUrl = new URL('/login', url.origin);
      redirectUrl.searchParams.set('signupSuccess', 'true');
      return redirect(redirectUrl.toString());
    }

    return redirect(redirectTo);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      const status = error.isRateLimit ? 429 : 400;
      if (error.isRateLimit) {
        console.warn('[Signup] Rate limit do Supabase:', error.originalError?.message ?? error.message);
      }
      return json(
        {
          error: error.message,
          fields: { email: true, password: true },
        },
        { status }
      );
    }

    console.error('Signup error:', error);
    return json(
      {
        error: 'Erro ao criar conta. Tente novamente',
        fields: { email: true, password: true },
      },
      { status: 500 }
    );
  }
};

export default function Signup() {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <div className="min-h-screen bg-bolt-elements-background-depth-1 flex items-center justify-center p-6">
      <div className="w-full max-w-5xl">
        <div className="relative">
          <Card className="p-8 rounded-[2rem] relative z-10 overflow-hidden">
            <SignupLightEffect />
            {isSubmitting ? (
              <div className="flex flex-col items-center justify-center py-16 px-8 min-h-[400px]">
                <div className="flex flex-col items-center gap-6">
                  <div className="i-svg-spinners:90-ring-with-bg text-bolt-elements-loader-progress text-6xl animate-spin" />
                  <div className="text-center">
                    <h2 className="text-xl font-semibold text-bolt-elements-textPrimary mb-2">
                      Criando conta...
                    </h2>
                    <p className="text-sm text-bolt-elements-textSecondary">
                      Aguarde enquanto processamos seu cadastro
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col relative z-10">
                <div className="flex flex-col lg:flex-row gap-8 items-center">
                  <div className="flex-1 w-full">
                    <SignupForm />
                  </div>
                  <div className="lg:border-l border-bolt-elements-borderColor lg:pl-8 flex-1 w-full">
                    <SignupFeatures />
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
