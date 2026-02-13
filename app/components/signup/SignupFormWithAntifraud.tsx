/**
 * Formulário de Signup com Proteção Antifraude
 * 
 * Integra:
 * - FingerprintJS para identificação do dispositivo
 * - Cloudflare Turnstile para proteção contra bots
 * - Validação antifraude antes de criar conta
 */

import { useState, useEffect } from 'react';
import { Form, useActionData, useLoaderData, useNavigation, Link, useSubmit } from '@remix-run/react';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { Label } from '~/components/ui/Label';
import { Logo } from '~/components/ui/Logo';
import { TurnstileWidget, TurnstilePlaceholder } from '~/components/ui/TurnstileWidget';
import { classNames } from '~/utils/classNames';
import { validateEmail, validatePassword, validatePasswordConfirmation } from '~/lib/auth/session';
import { useFingerprint } from '~/lib/hooks/useFingerprint';

// Site key do Turnstile (deve vir das variáveis de ambiente)
const TURNSTILE_SITE_KEY = typeof window !== 'undefined' 
  ? (window as any).ENV?.TURNSTILE_SITE_KEY || import.meta.env.VITE_TURNSTILE_SITE_KEY || ''
  : '';

export function SignupFormWithAntifraud() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [clientValidation, setClientValidation] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    name?: string;
  }>({});
  
  // Token do Turnstile
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileLoading, setTurnstileLoading] = useState(true);
  const [turnstileError, setTurnstileError] = useState<string | null>(null);
  
  // Fingerprint do dispositivo
  const fingerprint = useFingerprint();
  
  // Estado de validação antifraude
  const [antifraudChecked, setAntifraudChecked] = useState(false);
  const [antifraudError, setAntifraudError] = useState<string | null>(null);
  
  const actionData = useActionData<typeof import('~/routes/signup').action>();
  const loaderData = useLoaderData<typeof import('~/routes/signup').loader>();
  const navigation = useNavigation();
  const submit = useSubmit();
  const isSubmitting = navigation.state === 'submitting';

  const errorMessage = actionData?.error || loaderData?.error || antifraudError || null;
  const hasError = !!errorMessage;
  const fields = actionData?.fields as { email?: boolean; password?: boolean; confirmPassword?: boolean; name?: boolean } | undefined;
  const emailError = hasError && (fields?.email ?? false);
  const passwordError = hasError && (fields?.password ?? false);
  const confirmPasswordError = hasError && (fields?.confirmPassword ?? false);
  const nameError = hasError && (fields?.name ?? false);

  // Handlers de validação client-side
  const handleEmailChange = (value: string) => {
    if (value && !validateEmail(value)) {
      setClientValidation((prev) => ({ ...prev, email: 'E-mail inválido' }));
    } else {
      setClientValidation((prev) => {
        const { email, ...rest } = prev;
        return rest;
      });
    }
  };

  const handlePasswordChange = (value: string) => {
    if (value && !validatePassword(value)) {
      setClientValidation((prev) => ({
        ...prev,
        password: 'Senha deve ter no mínimo 6 caracteres',
      }));
    } else {
      setClientValidation((prev) => {
        const { password, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleConfirmPasswordChange = (password: string, confirmPassword: string) => {
    if (confirmPassword && password && !validatePasswordConfirmation(password, confirmPassword)) {
      setClientValidation((prev) => ({
        ...prev,
        confirmPassword: 'As senhas não coincidem',
      }));
    } else {
      setClientValidation((prev) => {
        const { confirmPassword, ...rest } = prev;
        return rest;
      });
    }
  };

  // Handler de submissão com validação antifraude
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    const formData = new FormData(event.currentTarget);
    const email = formData.get('email')?.toString() || '';
    const name = formData.get('name')?.toString() || '';
    
    // Verificar se Turnstile foi completado
    if (!turnstileToken) {
      setAntifraudError('Complete a verificação de segurança');
      return;
    }
    
    // Adicionar dados antifraude ao form
    formData.set('fingerprintId', fingerprint.fingerprintId || '');
    formData.set('fingerprintConfidence', fingerprint.fingerprintConfidence.toString());
    formData.set('turnstileToken', turnstileToken);
    formData.set('userAgent', fingerprint.userAgent);
    formData.set('screenResolution', fingerprint.screenResolution);
    formData.set('language', fingerprint.language);
    formData.set('timezone', fingerprint.timezone);
    
    // Validar antifraude antes de enviar
    try {
      setAntifraudChecked(false);
      setAntifraudError(null);
      
      const response = await fetch('/api/antifraud/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          name,
          fingerprintId: fingerprint.fingerprintId,
          fingerprintConfidence: fingerprint.fingerprintConfidence,
          turnstileToken,
          userAgent: fingerprint.userAgent,
          screenResolution: fingerprint.screenResolution,
          language: fingerprint.language,
          timezone: fingerprint.timezone,
        }),
      });
      
      const result = await response.json();
      
      if (!result.allowed) {
        setAntifraudError(result.reason || 'Não foi possível criar sua conta no momento. Tente novamente mais tarde.');
        return;
      }
      
      setAntifraudChecked(true);
      
      // Adicionar resultado da validação ao form
      formData.set('antifraudValidated', 'true');
      formData.set('initialCredits', result.initialCredits.toString());
      
      // Submeter form
      submit(formData, { method: 'post' });
      
    } catch (error) {
      console.error('Antifraud validation error:', error);
      // Em caso de erro na validação, permite prosseguir (fail-open)
      // mas com créditos reduzidos (tratado no backend)
      formData.set('antifraudValidated', 'false');
      submit(formData, { method: 'post' });
    }
  };

  // Verificar se pode submeter
  const canSubmit = 
    !isSubmitting &&
    !fingerprint.loading &&
    !turnstileLoading &&
    !!turnstileToken &&
    !clientValidation.email &&
    !clientValidation.password &&
    !clientValidation.confirmPassword;

  return (
    <>
      <div className="mb-8">
        <div className="flex items-center mb-6">
          <Logo width={190} />
        </div>
        <h1 className="text-3xl font-bold text-programe-elements-textPrimary mb-2">
          Criar conta grátis
        </h1>
        <p className="text-sm text-programe-elements-textSecondary">
          Comece a construir seus projetos com IA agora mesmo.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-3">
            <div className="i-ph:warning-circle text-xl text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-500 mb-1">Erro ao criar conta</p>
              <p className="text-sm text-red-400">{errorMessage}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Campo Nome */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="name" className="text-sm text-programe-elements-textPrimary">
            Nome
          </Label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-programe-elements-textTertiary pointer-events-none">
              <span className="i-ph:user w-4 h-4" />
            </div>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Seu nome"
              className={classNames(
                'pl-10 rounded-xl bg-programe-elements-background-depth-1 border-programe-elements-borderColor',
                'transition-colors',
                nameError && 'border-red-500 focus:border-red-500 focus:ring-red-500/50'
              )}
              required
              autoComplete="name"
              aria-invalid={nameError ? 'true' : 'false'}
              aria-describedby={nameError ? 'name-error' : undefined}
            />
          </div>
          {nameError && (
            <p id="name-error" className="text-xs text-red-500 mt-1">
              Verifique seu nome
            </p>
          )}
        </div>

        {/* Campo E-mail */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="email" className="text-sm text-programe-elements-textPrimary">
            E-mail
          </Label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-programe-elements-textTertiary pointer-events-none">
              <span className="i-ph:envelope w-4 h-4" />
            </div>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="seuemail@exemplo.com"
              className={classNames(
                'pl-10 rounded-xl bg-programe-elements-background-depth-1 border-programe-elements-borderColor',
                'transition-colors',
                (emailError || clientValidation.email) &&
                  'border-red-500 focus:border-red-500 focus:ring-red-500/50'
              )}
              required
              autoComplete="email"
              onChange={(e) => handleEmailChange(e.target.value)}
              aria-invalid={emailError || !!clientValidation.email ? 'true' : 'false'}
              aria-describedby={emailError || clientValidation.email ? 'email-error' : undefined}
            />
          </div>
          {(emailError || clientValidation.email) && (
            <p id="email-error" className="text-xs text-red-500 mt-1">
              {clientValidation.email || 'Verifique seu e-mail'}
            </p>
          )}
        </div>

        {/* Campo Senha */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="password" className="text-sm text-programe-elements-textPrimary">
            Senha
          </Label>
          <div className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-programe-elements-textTertiary pointer-events-none">
                <span className="i-ph:lock w-4 h-4" />
              </div>
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className={classNames(
                  'pl-10 pr-4 rounded-xl bg-programe-elements-background-depth-1 border-programe-elements-borderColor',
                  'transition-colors',
                  (passwordError || clientValidation.password) &&
                    'border-red-500 focus:border-red-500 focus:ring-red-500/50'
                )}
                required
                minLength={6}
                autoComplete="new-password"
                onChange={(e) => {
                  handlePasswordChange(e.target.value);
                  const confirmPassword = (document.getElementById('confirmPassword') as HTMLInputElement)?.value;
                  if (confirmPassword) {
                    handleConfirmPasswordChange(e.target.value, confirmPassword);
                  }
                }}
                aria-invalid={passwordError || !!clientValidation.password ? 'true' : 'false'}
                aria-describedby={
                  passwordError || clientValidation.password ? 'password-error' : undefined
                }
              />
            </div>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="flex-shrink-0 text-programe-elements-textTertiary hover:text-programe-elements-textSecondary transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500/50 rounded p-1 bg-programe-elements-background-depth-2 hover:bg-programe-elements-background-depth-3"
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showPassword ? (
                <span className="i-ph:eye-slash w-4 h-4 block text-programe-elements-textTertiary" />
              ) : (
                <span className="i-ph:eye w-4 h-4 block text-programe-elements-textTertiary" />
              )}
            </button>
          </div>
          {(passwordError || clientValidation.password) && (
            <p id="password-error" className="text-xs text-red-500 mt-1">
              {clientValidation.password || 'Verifique sua senha'}
            </p>
          )}
        </div>

        {/* Campo Confirmar Senha */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="confirmPassword" className="text-sm text-programe-elements-textPrimary">
            Confirmar senha
          </Label>
          <div className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-programe-elements-textTertiary pointer-events-none">
                <span className="i-ph:lock w-4 h-4" />
              </div>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className={classNames(
                  'pl-10 pr-4 rounded-xl bg-programe-elements-background-depth-1 border-programe-elements-borderColor',
                  'transition-colors',
                  (confirmPasswordError || clientValidation.confirmPassword) &&
                    'border-red-500 focus:border-red-500 focus:ring-red-500/50'
                )}
                required
                minLength={6}
                autoComplete="new-password"
                onChange={(e) => {
                  const password = (document.getElementById('password') as HTMLInputElement)?.value;
                  if (password) {
                    handleConfirmPasswordChange(password, e.target.value);
                  }
                }}
                aria-invalid={
                  confirmPasswordError || !!clientValidation.confirmPassword ? 'true' : 'false'
                }
                aria-describedby={
                  confirmPasswordError || clientValidation.confirmPassword
                    ? 'confirmPassword-error'
                    : undefined
                }
              />
            </div>
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="flex-shrink-0 text-programe-elements-textTertiary hover:text-programe-elements-textSecondary transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500/50 rounded p-1 bg-programe-elements-background-depth-2 hover:bg-programe-elements-background-depth-3"
              aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
              title={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showConfirmPassword ? (
                <span className="i-ph:eye-slash w-4 h-4 block text-programe-elements-textTertiary" />
              ) : (
                <span className="i-ph:eye w-4 h-4 block text-programe-elements-textTertiary" />
              )}
            </button>
          </div>
          {(confirmPasswordError || clientValidation.confirmPassword) && (
            <p id="confirmPassword-error" className="text-xs text-red-500 mt-1">
              {clientValidation.confirmPassword || 'As senhas não coincidem'}
            </p>
          )}
        </div>

        {/* Cloudflare Turnstile */}
        <div className="flex flex-col gap-2">
          <Label className="text-sm text-programe-elements-textSecondary">
            Verificação de segurança
          </Label>
          {TURNSTILE_SITE_KEY ? (
            <TurnstileWidget
              siteKey={TURNSTILE_SITE_KEY}
              onSuccess={(token) => {
                setTurnstileToken(token);
                setTurnstileError(null);
              }}
              onError={(error) => {
                setTurnstileError(error);
                setTurnstileToken(null);
              }}
              onExpired={() => {
                setTurnstileToken(null);
              }}
              onLoading={(loading) => setTurnstileLoading(loading)}
              action="signup"
              theme="auto"
            />
          ) : (
            <TurnstilePlaceholder />
          )}
          {turnstileError && (
            <p className="text-xs text-red-500 mt-1">{turnstileError}</p>
          )}
        </div>

        {/* Indicador de fingerprint (debug - pode ser removido em produção) */}
        {fingerprint.loading && (
          <div className="flex items-center gap-2 text-xs text-programe-elements-textSecondary">
            <span className="i-ph:spinner-gap animate-spin" />
            <span>Verificando dispositivo...</span>
          </div>
        )}

        {/* Botão de submissão */}
        <button
          type="submit"
          disabled={!canSubmit}
          className={classNames(
            'w-full px-6 py-2.5 flex items-center justify-center gap-2 rounded-2xl font-medium transition-colors',
            {
              'bg-accent-500 hover:bg-accent-400 text-black': canSubmit,
              'bg-programe-elements-background-depth-2 text-programe-elements-textSecondary cursor-not-allowed': !canSubmit,
            }
          )}
        >
          {isSubmitting ? (
            <>
              <span className="i-ph:spinner-gap text-lg animate-spin" />
              <span>Criando conta...</span>
            </>
          ) : fingerprint.loading || turnstileLoading ? (
            <>
              <span className="i-ph:spinner-gap text-lg animate-spin" />
              <span>Preparando...</span>
            </>
          ) : (
            <>
              <span>Criar conta</span>
              <span className="i-ph:arrow-right text-lg" />
            </>
          )}
        </button>

        <div className="text-center mt-4">
          <span className="text-sm text-programe-elements-textSecondary">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-accent-500 hover:underline font-medium">
              Entrar
            </Link>
          </span>
        </div>
      </form>
    </>
  );
}
