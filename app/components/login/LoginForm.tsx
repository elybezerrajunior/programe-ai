import { useState } from 'react';
import { Form, useActionData, useNavigation } from '@remix-run/react';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { Label } from '~/components/ui/Label';
import { Checkbox } from '~/components/ui/Checkbox';
import { classNames } from '~/utils/classNames';

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const actionData = useActionData<typeof import('~/routes/login').action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <>
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="i-ph:rocket text-xl text-accent" />
          <span className="text-xl font-semibold text-bolt-elements-textPrimary">
            Programe Studio
          </span>
        </div>
        <h1 className="text-3xl font-bold text-bolt-elements-textPrimary mb-2">
          Entrar no Modo Construção
        </h1>
        <p className="text-sm text-bolt-elements-textSecondary">
          Crie apps reais a partir de uma ideia — com guia passo a passo.
        </p>
      </div>

      {actionData?.error && (
        <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-sm text-red-500">{actionData.error}</p>
        </div>
      )}

      <Form method="post" className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email" className="text-sm text-bolt-elements-textPrimary">
            E-mail
          </Label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-bolt-elements-textTertiary pointer-events-none">
              <span className="i-ph:envelope w-4 h-4" />
            </div>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="seuemail@exemplo.com"
              className={classNames(
                'pl-10 rounded-xl bg-bolt-elements-background-depth-1 border-bolt-elements-borderColor',
                actionData?.fields?.email && 'border-red-500'
              )}
              required
              defaultValue={actionData?.fields?.email ? '' : undefined}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password" className="text-sm text-bolt-elements-textPrimary">
            Senha
          </Label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-bolt-elements-textTertiary pointer-events-none">
              <span className="i-ph:lock w-4 h-4" />
            </div>
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className={classNames(
                'pl-10 pr-10 rounded-xl bg-bolt-elements-background-depth-1 border-bolt-elements-borderColor',
                actionData?.fields?.password && 'border-red-500'
              )}
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-bolt-elements-textTertiary hover:text-bolt-elements-textSecondary transition-colors"
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              <span className={classNames('i-ph:eye w-4 h-4', showPassword && 'i-ph:eye-slash')} />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              id="remember-me"
              name="rememberMe"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked === true)}
            />
            <Label
              htmlFor="remember-me"
              className="text-sm text-bolt-elements-textSecondary cursor-pointer select-none"
            >
              Lembrar de mim
            </Label>
          </div>
          <a
            href="#"
            className="text-sm text-accent-500 hover:underline font-medium"
          >
            Esqueceu a senha?
          </a>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={classNames(
            'w-full px-6 py-2.5 flex items-center justify-center gap-2 rounded-2xl font-medium transition-colors',
            {
              'bg-accent-500 hover:bg-accent-400 text-black': !isSubmitting,
              'bg-bolt-elements-background-depth-2 text-bolt-elements-textSecondary cursor-not-allowed': isSubmitting,
            }
          )}
        >
          {isSubmitting ? (
            <>
              <span className="i-ph:spinner-gap text-lg animate-spin" />
              <span>Entrando...</span>
            </>
          ) : (
            <>
              <span>Continuar</span>
              <span className="i-ph:arrow-right text-lg" />
            </>
          )}
        </button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-bolt-elements-borderColor" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-bolt-elements-background-depth-1 text-bolt-elements-textSecondary text-xs">
              ou continue com
            </span>
          </div>
        </div>

        <div className="flex flex-row gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1 h-11 border-bolt-elements-borderColor hover:bg-bolt-elements-background-depth-2 flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span className="hidden sm:inline">Continuar com Google</span>
            <span className="sm:hidden">Google</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            className="flex-1 h-11 border-bolt-elements-borderColor hover:bg-bolt-elements-background-depth-2 flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            <span className="hidden sm:inline">Continuar com GitHub</span>
            <span className="sm:hidden">GitHub</span>
          </Button>
        </div>
      </Form>
    </>
  );
}

