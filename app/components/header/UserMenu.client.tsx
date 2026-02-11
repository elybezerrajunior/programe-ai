import { Form, useSubmit, useLocation } from '@remix-run/react';
import { useState } from 'react';
import { useAuth } from '~/lib/hooks';
import { Dropdown, DropdownItem, DropdownSeparator } from '~/components/ui/Dropdown';
import { classNames } from '~/utils/classNames';
import { ControlPanel } from '~/components/@settings/core/ControlPanel';
import type { TabType } from '~/components/@settings/core/types';

type TabFilterType = 'preferences' | 'integrations' | undefined;

export function UserMenu() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();
  const submit = useSubmit();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tabFilter, setTabFilter] = useState<TabFilterType>(undefined);
  const [initialTab, setInitialTab] = useState<TabType | undefined>(undefined);

  const handleLogout = () => {
    // Fazer logout via form submit para a rota /logout
    submit(null, { method: 'post', action: '/logout' });
  };

  const openSettings = (filter: TabFilterType) => {
    setTabFilter(filter);
    setInitialTab(undefined);
    setIsSettingsOpen(true);
  };

  const openSettingsTab = (tab: TabType) => {
    setTabFilter(undefined);
    setInitialTab(tab);
    setIsSettingsOpen(true);
  };

  const handleSettingsClose = () => {
    setIsSettingsOpen(false);
    setTabFilter(undefined);
    setInitialTab(undefined);
  };

  // Se ainda está carregando, mostrar ícone desabilitado
  if (isLoading) {
    return (
      <button
        type="button"
        className="p-2 text-programe-elements-textSecondary transition-colors bg-transparent rounded-md flex items-center justify-center"
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
        type="button"
        className="p-2 text-programe-elements-textSecondary hover:text-programe-elements-textPrimary transition-colors bg-transparent rounded-md hover:bg-programe-elements-background-depth-2 flex items-center justify-center"
        aria-label="Menu do usuário"
        disabled
      >
        <div className="i-ph:user text-xl" />
      </button>
    );
  }

  return (
    <>
      <Dropdown
        key={location.pathname}
        trigger={
          <button
            type="button"
            className="p-2 text-programe-elements-textSecondary hover:text-programe-elements-textPrimary transition-colors bg-transparent rounded-md hover:bg-programe-elements-background-depth-2 flex items-center justify-center"
            aria-label="Menu do usuário"
          >
            <div className="i-ph:user text-xl" />
          </button>
        }
        align="end"
      >
        {/* ===== CONTA ===== */}
        <div className="px-3 py-2 border-b border-programe-elements-borderColor">
          <p className="text-sm font-medium text-programe-elements-textPrimary truncate">
            {user.name || 'Usuário'}
          </p>
          <p className="text-xs text-programe-elements-textSecondary truncate">{user.email}</p>
        </div>

        {/* ===== PERFIL ===== */}
        <div className="px-3 py-1.5 mt-1">
          <p className="text-xs font-semibold text-programe-elements-textTertiary uppercase tracking-wider">
            Perfil
          </p>
        </div>

        <DropdownItem
          onSelect={() => openSettingsTab('profile')}
          className={classNames('text-programe-elements-textPrimary hover:bg-programe-elements-item-backgroundActive')}
        >
          <div className="i-ph:user-circle text-base" />
          <span>Editar Perfil</span>
        </DropdownItem>

        <DropdownItem
          onSelect={() => openSettingsTab('settings')}
          className={classNames('text-programe-elements-textPrimary hover:bg-programe-elements-item-backgroundActive')}
        >
          <div className="i-ph:gear-six text-base" />
          <span>Configurações</span>
        </DropdownItem>

        {/* ===== CONFIGURAÇÕES ===== */}
        <div className="px-3 py-1.5 mt-1 border-t border-programe-elements-borderColor">
          <p className="text-xs font-semibold text-programe-elements-textTertiary uppercase tracking-wider">
            Painel
          </p>
        </div>

        <DropdownItem
          onSelect={() => openSettings('preferences')}
          className={classNames('text-programe-elements-textPrimary hover:bg-programe-elements-item-backgroundActive')}
        >
          <div className="i-ph:gear text-base" />
          <span>Preferências Gerais</span>
        </DropdownItem>

        <DropdownItem
          onSelect={() => openSettings('integrations')}
          className={classNames('text-programe-elements-textPrimary hover:bg-programe-elements-item-backgroundActive')}
        >
          <div className="i-ph:plugs-connected text-base" />
          <span>Conectar Plataformas</span>
        </DropdownItem>

        {/* ===== SESSÃO ===== */}
        <div className="px-3 py-1.5 mt-1 border-t border-programe-elements-borderColor">
          <p className="text-xs font-semibold text-programe-elements-textTertiary uppercase tracking-wider">
            Sessão
          </p>
        </div>

        <DropdownItem
          onSelect={handleLogout}
          className={classNames('text-red-500 hover:text-red-600 hover:bg-red-500/10')}
        >
          <div className="i-ph:sign-out text-base" />
          <span>Sair da Conta</span>
        </DropdownItem>
      </Dropdown>

      {/* Settings Panel */}
      <ControlPanel
        open={isSettingsOpen}
        onClose={handleSettingsClose}
        tabFilter={tabFilter}
        initialTab={initialTab}
      />
    </>
  );
}
