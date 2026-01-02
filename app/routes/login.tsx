import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs, type MetaFunction } from '@remix-run/cloudflare';
import { LoginForm } from '~/components/login/LoginForm';
import { LoginFeatures } from '~/components/login/LoginFeatures';
import { LoginLightEffect } from '~/components/login/LoginLightEffect';
import { Card } from '~/components/ui/Card';
import { getSessionFromRequest, createSessionCookie, validateEmail, validatePassword } from '~/lib/auth/session';
import { authenticateUser } from '~/lib/auth/users';

export const meta: MetaFunction = () => {
  return [
    { title: 'Login - Programe Studio' },
    { name: 'description', content: 'Entre no Modo Construção do Programe Studio' },
  ];
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Se o usuário já estiver logado, redirecionar para a home
  const session = getSessionFromRequest(request);
  if (session) {
    return redirect('/');
  }

  return json({});
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const email = formData.get('email')?.toString() || '';
  const password = formData.get('password')?.toString() || '';
  const rememberMe = formData.get('rememberMe') === 'on';

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

  // Autenticar usuário
  const user = await authenticateUser(email, password);

  if (!user) {
    return json({ error: 'E-mail ou senha inválidos', fields: { email: true, password: true } }, { status: 401 });
  }

  // Criar sessão
  const sessionCookie = createSessionCookie(user);

  // Redirecionar para a home
  return redirect('/', {
    headers: {
      'Set-Cookie': sessionCookie,
    },
  });
};

export default function Login() {
  return (
    <div className="min-h-screen bg-bolt-elements-background-depth-1 flex items-center justify-center p-6">
      <div className="w-full max-w-5xl">
        <div className="relative">
          <Card className="p-8 rounded-[2rem] relative z-10 overflow-hidden">
            <LoginLightEffect />
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
                    href="#"
                    className="text-accent-500 hover:underline font-medium"
                  >
                    Criar conta grátis
                  </a>
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

