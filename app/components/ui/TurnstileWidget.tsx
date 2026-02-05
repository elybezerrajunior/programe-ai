/**
 * Componente Widget do Cloudflare Turnstile
 * 
 * Uso:
 * <TurnstileWidget
 *   siteKey="0x4AAAAAAA..."
 *   onSuccess={(token) => setTurnstileToken(token)}
 *   onError={(error) => console.error(error)}
 * />
 */

import { useEffect, useId } from 'react';
import { useTurnstile } from '~/lib/hooks/useTurnstile';
import { classNames } from '~/utils/classNames';

export interface TurnstileWidgetProps {
  siteKey: string;
  onSuccess?: (token: string) => void;
  onError?: (error: string) => void;
  onExpired?: () => void;
  onLoading?: (loading: boolean) => void;
  action?: string;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
  className?: string;
}

export function TurnstileWidget({
  siteKey,
  onSuccess,
  onError,
  onExpired,
  onLoading,
  action = 'signup',
  theme = 'auto',
  size = 'normal',
  className,
}: TurnstileWidgetProps) {
  // Gerar ID único para o container
  const uniqueId = useId();
  const containerId = `turnstile-${uniqueId.replace(/:/g, '-')}`;
  
  const { token, isLoading, error, isExpired, isReady } = useTurnstile(containerId, {
    siteKey,
    action,
    theme,
    size,
    autoReset: true,
  });
  
  // Notificar callbacks
  useEffect(() => {
    if (token && onSuccess) {
      onSuccess(token);
    }
  }, [token, onSuccess]);
  
  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);
  
  useEffect(() => {
    if (isExpired && onExpired) {
      onExpired();
    }
  }, [isExpired, onExpired]);
  
  useEffect(() => {
    if (onLoading) {
      onLoading(isLoading);
    }
  }, [isLoading, onLoading]);
  
  return (
    <div className={classNames('turnstile-widget', className)}>
      {/* Container onde o widget será renderizado */}
      <div 
        id={containerId}
        className={classNames(
          'min-h-[65px] flex items-center justify-center',
          isLoading && 'opacity-50'
        )}
      />
      
      {/* Mensagem de erro */}
      {error && (
        <p className="text-xs text-red-500 mt-1 text-center">
          {error}
        </p>
      )}
      
      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-bolt-elements-background-depth-1/50">
          <div className="i-svg-spinners:90-ring-with-bg text-bolt-elements-loader-progress text-2xl" />
        </div>
      )}
    </div>
  );
}

/**
 * Versão compacta do widget para formulários menores
 */
export function TurnstileWidgetCompact(props: Omit<TurnstileWidgetProps, 'size'>) {
  return <TurnstileWidget {...props} size="compact" />;
}

/**
 * Placeholder para quando o site key não está configurado
 */
export function TurnstilePlaceholder({ className }: { className?: string }) {
  return (
    <div 
      className={classNames(
        'min-h-[65px] flex items-center justify-center',
        'border border-dashed border-bolt-elements-borderColor rounded-lg',
        'text-xs text-bolt-elements-textSecondary',
        className
      )}
    >
      <span>Turnstile não configurado</span>
    </div>
  );
}
