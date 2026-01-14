import { Form, useSubmit } from '@remix-run/react';
import { useAuth } from '~/lib/hooks';
import { Dropdown, DropdownItem, DropdownSeparator } from '~/components/ui/Dropdown';
import { classNames } from '~/utils/classNames';

export function UserMenu() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const submit = useSubmit();


  const handleLogout = () => {
    // Fazer logout via form submit para a rota /logout
    submit(null, { method: 'post', action: '/logout' });
  };

  // Se ainda está carregando, mostrar ícone desabilitado
  if (isLoading) {
    return (
      <button
        className="p-2 text-bolt-elements-textSecondary transition-colors bg-transparent rounded-md flex items-center justify-center"
        aria-label="Menu do usuário"
        disabled
      >
        <div className="i-ph:user text-xl" />
      </button>
    );
  }

  // Se não tiver usuário autenticado, mostrar apenas o ícone sem dropdown
  if (!isAuthenticated || !user) {
    return (
      <button
        className="p-2 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary transition-colors bg-transparent rounded-md hover:bg-bolt-elements-background-depth-2 flex items-center justify-center"
        aria-label="Menu do usuário"
        disabled
      >
        <div className="i-ph:user text-xl" />
      </button>
    );
  }

  return (
    <Dropdown
      trigger={
        <button
          className="p-2 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary transition-colors bg-transparent rounded-md hover:bg-bolt-elements-background-depth-2 flex items-center justify-center"
          aria-label="Menu do usuário"
        >
          <div className="i-ph:user text-xl" />
        </button>
      }
      align="end"
    >
      {/* Informações do usuário */}
      <div className="px-3 py-2 border-b border-bolt-elements-borderColor">
        <p className="text-sm font-medium text-bolt-elements-textPrimary truncate">
          {user.name || 'Usuário'}
        </p>
        <p className="text-xs text-bolt-elements-textSecondary truncate">{user.email}</p>
      </div>

      <DropdownSeparator />

      {/* Menu items */}
      <DropdownItem
        onSelect={handleLogout}
        className={classNames('text-red-500 hover:text-red-600 hover:bg-red-500/10')}
      >
        <div className="i-ph:sign-out text-base" />
        <span>Sair</span>
      </DropdownItem>
    </Dropdown>
  );
}

