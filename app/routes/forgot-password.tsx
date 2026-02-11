import { json, redirect, type LoaderFunctionArgs, type MetaFunction } from '@remix-run/cloudflare';
import { useState } from 'react';
import { Link } from '@remix-run/react';
import { Card } from '~/components/ui/Card';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { Label } from '~/components/ui/Label';
import { getSessionFromRequest } from '~/lib/auth/session';
import { supabase } from '~/lib/auth/supabase-client';
import { classNames } from '~/utils/classNames';

export const meta: MetaFunction = () => [
  { title: 'Esqueci a senha - Programe Studio' },
  { name: 'description', content: 'Recupere o acesso à sua conta do Programe Studio.' },
];

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  const env = context?.cloudflare?.env as unknown as Record<string, string> | undefined;
  const session = await getSessionFromRequest(request, env);
  if (session) return redirect('/');
  return json({});
};

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('loading');
    setMessage('');

    if (!supabase) {
      setStatus('error');
      setMessage('Supabase não configurado.');
      return;
    }

    try {
      const redirectTo = typeof window !== 'undefined'
        ? `${window.location.origin}/reset-password`
        : '';
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo,
      });

      if (error) {
        setStatus('error');
        setMessage(error.message === 'User not found' ? 'E-mail não cadastrado.' : error.message);
        return;
      }

      setStatus('success');
      setMessage('Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha. Verifique também a pasta de spam.');
    } catch {
      setStatus('error');
      setMessage('Erro ao enviar o e-mail. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen bg-programe-elements-background-depth-1 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Card className="p-8 rounded-2xl">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6">
              <span className="i-ph:rocket text-xl text-accent" />
              <span className="text-xl font-semibold text-programe-elements-textPrimary">Programe Studio</span>
            </div>
            <h1 className="text-2xl font-bold text-programe-elements-textPrimary mb-2">
              Esqueceu a senha?
            </h1>
            <p className="text-sm text-programe-elements-textSecondary">
              Informe o e-mail da sua conta. Enviaremos um link para você redefinir a senha.
            </p>
          </div>

          {status === 'success' && (
            <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-start gap-3">
                <span className="i-ph:check-circle text-xl text-green-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-400">{message}</p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-start gap-3">
                <span className="i-ph:warning-circle text-xl text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{message}</p>
              </div>
            </div>
          )}

          {status !== 'success' && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email" className="text-sm text-programe-elements-textPrimary">
                  E-mail
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-programe-elements-textTertiary pointer-events-none i-ph:envelope w-4 h-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seuemail@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 rounded-xl bg-programe-elements-background-depth-1 border-programe-elements-borderColor"
                    required
                    autoComplete="email"
                    disabled={status === 'loading'}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={status === 'loading'}
                className={classNames(
                  'w-full rounded-2xl font-medium',
                  status === 'loading' && 'opacity-70 cursor-not-allowed'
                )}
              >
                {status === 'loading' ? (
                  <>
                    <span className="i-ph:spinner-gap text-lg animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar link para redefinir senha'
                )}
              </Button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-programe-elements-borderColor text-center">
            <Link
              to="/login"
              className="text-sm text-accent-500 hover:underline font-medium"
            >
              Voltar para o login
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
