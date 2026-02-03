import { json, redirect, type LoaderFunctionArgs, type MetaFunction } from '@remix-run/cloudflare';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from '@remix-run/react';
import { Card } from '~/components/ui/Card';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { Label } from '~/components/ui/Label';
import { getSessionFromRequest } from '~/lib/auth/session';
import { supabase } from '~/lib/auth/supabase-client';
import { validatePassword } from '~/lib/auth/session';
import { classNames } from '~/utils/classNames';

export const meta: MetaFunction = () => [
  { title: 'Nova senha - Programe Studio' },
  { name: 'description', content: 'Defina uma nova senha para sua conta do Programe Studio.' },
];

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  // Obter variáveis de ambiente do Cloudflare
  const env = context?.cloudflare?.env as unknown as Record<string, string> | undefined;
  
  const session = await getSessionFromRequest(request, env);
  if (session) return redirect('/');

  return json({});
};

function parseHashParams(hash: string): Record<string, string> {
  if (!hash || !hash.startsWith('#')) return {};
  const parts = hash.slice(1).split('&');
  const params: Record<string, string> = {};
  for (const part of parts) {
    const [key, value] = part.split('=');
    if (key && value) params[key] = decodeURIComponent(value);
  }
  return params;
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hash = window.location.hash;
    const params = parseHashParams(hash);
    const type = params.type;
    const accessToken = params.access_token;
    const refreshToken = params.refresh_token;

    if (type === 'recovery' && accessToken && supabase) {
      supabase.auth
        .setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        })
        .then(() => {
          setHasRecoverySession(true);
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        })
        .catch(() => setHasRecoverySession(false))
        .finally(() => setReady(true));
    } else {
      setReady(true);
      setHasRecoverySession(false);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setMessage('');

    if (!validatePassword(password)) {
      setPasswordError('Senha deve ter no mínimo 6 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError('As senhas não coincidem');
      return;
    }

    setStatus('loading');

    if (!supabase) {
      setStatus('error');
      setMessage('Supabase não configurado.');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setStatus('error');
        setMessage(error.message);
        return;
      }

      setStatus('success');
      setMessage('Senha alterada com sucesso. Redirecionando para o login...');
      void supabase.auth.signOut();
      setTimeout(() => {
        navigate('/login?resetSuccess=true');
      }, 1500);
    } catch {
      setStatus('error');
      setMessage('Erro ao alterar a senha. Tente novamente.');
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-bolt-elements-background-depth-1 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <span className="i-ph:spinner-gap text-4xl text-accent animate-spin" />
          <p className="text-sm text-bolt-elements-textSecondary">Verificando link...</p>
        </div>
      </div>
    );
  }

  if (!hasRecoverySession) {
    return (
      <div className="min-h-screen bg-bolt-elements-background-depth-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Card className="p-8 rounded-2xl text-center">
            <span className="i-ph:link-break text-5xl text-amber-500 mb-4 block" />
            <h1 className="text-xl font-bold text-bolt-elements-textPrimary mb-2">
              Link inválido ou expirado
            </h1>
            <p className="text-sm text-bolt-elements-textSecondary mb-6">
              O link de redefinição de senha não é válido ou já foi usado. Solicite um novo em &quot;Esqueceu a senha?&quot; na tela de login.
            </p>
            <Link to="/forgot-password" className="text-accent-500 hover:underline font-medium">
              Solicitar novo link
            </Link>
            <span className="mx-2 text-bolt-elements-textTertiary">|</span>
            <Link to="/login" className="text-accent-500 hover:underline font-medium">
              Voltar ao login
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bolt-elements-background-depth-1 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Card className="p-8 rounded-2xl">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6">
              <span className="i-ph:rocket text-xl text-accent" />
              <span className="text-xl font-semibold text-bolt-elements-textPrimary">Programe Studio</span>
            </div>
            <h1 className="text-2xl font-bold text-bolt-elements-textPrimary mb-2">
              Definir nova senha
            </h1>
            <p className="text-sm text-bolt-elements-textSecondary">
              Escolha uma senha segura com pelo menos 6 caracteres.
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
                <Label htmlFor="password" className="text-sm text-bolt-elements-textPrimary">
                  Nova senha
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-bolt-elements-textTertiary pointer-events-none i-ph:lock w-4 h-4" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={classNames(
                      'pl-10 rounded-xl bg-bolt-elements-background-depth-1 border-bolt-elements-borderColor',
                      passwordError && 'border-red-500'
                    )}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    disabled={status === 'loading'}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="confirmPassword" className="text-sm text-bolt-elements-textPrimary">
                  Confirmar nova senha
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-bolt-elements-textTertiary pointer-events-none i-ph:lock w-4 h-4" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={classNames(
                      'pl-10 rounded-xl bg-bolt-elements-background-depth-1 border-bolt-elements-borderColor',
                      passwordError && 'border-red-500'
                    )}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    disabled={status === 'loading'}
                  />
                </div>
                {passwordError && (
                  <p className="text-xs text-red-500 mt-1">{passwordError}</p>
                )}
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
                    Salvando...
                  </>
                ) : (
                  'Salvar nova senha'
                )}
              </Button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-bolt-elements-borderColor text-center">
            <Link to="/login" className="text-sm text-accent-500 hover:underline font-medium">
              Voltar para o login
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
