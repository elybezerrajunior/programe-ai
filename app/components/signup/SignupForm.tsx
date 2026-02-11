import { useState } from 'react';
import { Form, useActionData, useLoaderData, useNavigation, Link } from '@remix-run/react';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { Label } from '~/components/ui/Label';
import { classNames } from '~/utils/classNames';
import { validateEmail, validatePassword, validatePasswordConfirmation } from '~/lib/auth/session';

export function SignupForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [clientValidation, setClientValidation] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    name?: string;
  }>({});

  const actionData = useActionData<typeof import('~/routes/signup').action>();
  const loaderData = useLoaderData<typeof import('~/routes/signup').loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  const errorMessage = actionData?.error || loaderData?.error || null;
  const hasError = !!errorMessage;
  const fields = actionData?.fields as { email?: boolean; password?: boolean; confirmPassword?: boolean; name?: boolean } | undefined;
  const emailError = hasError && (fields?.email ?? false);
  const passwordError = hasError && (fields?.password ?? false);
  const confirmPasswordError = hasError && (fields?.confirmPassword ?? false);
  const nameError = hasError && (fields?.name ?? false);

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

  return (
    <>
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="i-ph:rocket text-xl text-accent" />
          <span className="text-xl font-semibold text-programe-elements-textPrimary">
            Programe Studio
          </span>
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

      <Form method="post" className="flex flex-col gap-6">
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

        <button
          type="submit"
          disabled={
            isSubmitting ||
            !!clientValidation.email ||
            !!clientValidation.password ||
            !!clientValidation.confirmPassword
          }
          className={classNames(
            'w-full px-6 py-2.5 flex items-center justify-center gap-2 rounded-2xl font-medium transition-colors',
            {
              'bg-accent-500 hover:bg-accent-400 text-black':
                !isSubmitting &&
                !clientValidation.email &&
                !clientValidation.password &&
                !clientValidation.confirmPassword,
              'bg-programe-elements-background-depth-2 text-programe-elements-textSecondary cursor-not-allowed':
                isSubmitting ||
                !!clientValidation.email ||
                !!clientValidation.password ||
                !!clientValidation.confirmPassword,
            }
          )}
        >
          {isSubmitting ? (
            <>
              <span className="i-ph:spinner-gap text-lg animate-spin" />
              <span>Criando conta...</span>
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
      </Form>
    </>
  );
}
