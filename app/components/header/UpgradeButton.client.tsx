import { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { Link } from '@remix-run/react';
import { subscriptionStore, loadSubscription } from '~/lib/stores/subscription';
import { Badge } from '~/components/ui/Badge';

interface UpgradeButtonProps {
  size?: 'sm' | 'md';
}

export function UpgradeButton({ size = 'md' }: UpgradeButtonProps) {
  const subscription = useStore(subscriptionStore);

  useEffect(() => {
    if (!subscription.isLoaded) {
      loadSubscription();
    }
  }, [subscription.isLoaded]);

  // Não mostrar se ainda está carregando
  if (!subscription.isLoaded) {
    return null;
  }

  // Se já tem plano pago, mostrar badge do plano ao invés de botão de upgrade
  if (subscription.planType !== 'free') {
    return (
      <Link to="/plans" className="flex items-center">
        <Badge 
          variant="primary" 
          size={size === 'sm' ? 'sm' : 'md'}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          <span className="i-ph:crown-simple-fill mr-1" />
          {subscription.planType.charAt(0).toUpperCase() + subscription.planType.slice(1)}
        </Badge>
      </Link>
    );
  }

  // Plano free - mostrar botão de upgrade
  const sizeClasses = size === 'sm' 
    ? 'px-3 py-1.5 text-sm'
    : 'px-4 py-2 text-sm';

  return (
    <Link
      to="/plans"
      className={`flex items-center gap-2 ${sizeClasses} font-medium text-white 
        bg-[#0a352b] hover:bg-[#06241e] 
        rounded-lg transition-colors`}
    >
      <div className={size === 'sm' ? 'i-ph:rocket-launch text-base' : 'i-ph:rocket-launch text-lg'} />
      Upgrade to Pro
    </Link>
  );
}
