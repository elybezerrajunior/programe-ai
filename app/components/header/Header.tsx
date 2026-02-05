import { useStore } from '@nanostores/react';
import { ClientOnly } from 'remix-utils/client-only';
import { Link, useLocation } from '@remix-run/react';
import { chatStore } from '~/lib/stores/chat';
import { profileStore } from '~/lib/stores/profile';
import { classNames } from '~/utils/classNames';
import { HeaderActionButtons } from './HeaderActionButtons.client';
import { ChatDescription } from '~/lib/persistence/ChatDescription.client';
import { UserMenu } from './UserMenu.client';
import { UpgradeButton } from './UpgradeButton.client';
import { NotificationsDropdown } from '~/components/notifications/NotificationsDropdown.client';

export function Header() {
  const chat = useStore(chatStore);
  const profile = useStore(profileStore);
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  // For home page, show new design. For chat pages, show original design
  if (isHomePage && !chat.started) {
    return (
      <header className="flex items-center justify-between px-6 border-b border-bolt-elements-borderColor h-[var(--header-height)] bg-bolt-elements-background-depth-1">
        {/* Logo */}
        <div className="flex items-center gap-2 text-bolt-elements-textPrimary">
          <div className="i-ph:rocket text-xl text-accent" />
          <a href="/" className="text-xl font-semibold text-bolt-elements-textPrimary flex items-center">
            Programe Studio
          </a>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-8 absolute left-1/2 -translate-x-1/2 z-max">
          <Link
            to="/"
            className={classNames('text-sm font-medium transition-colors', {
              'text-white border-b-2 border-accent pb-1': location.pathname === '/',
              'text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary': location.pathname !== '/',
            })}
          >
            Início
          </Link>
          <Link
            to="/explore"
            className={classNames('text-sm font-medium transition-colors', {
              'text-white border-b-2 border-accent pb-1': location.pathname === '/explore',
              'text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary': location.pathname !== '/explore',
            })}
          >
            Explorar
          </Link>
          <Link
            to="/docs"
            className={classNames('text-sm font-medium transition-colors', {
              'text-white border-b-2 border-accent pb-1': location.pathname === '/docs',
              'text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary': location.pathname !== '/docs',
            })}
          >
            Documentação
          </Link>
        </nav>

        {/* Right side: Upgrade, Notifications and Profile */}
        <div className="flex items-center gap-4">
          <ClientOnly fallback={null}>
            {() => <UpgradeButton size="md" />}
          </ClientOnly>

          <ClientOnly fallback={null}>
            {() => <NotificationsDropdown />}
          </ClientOnly>
          <ClientOnly fallback={
            <button
              className="p-2 text-bolt-elements-textSecondary transition-colors bg-transparent"
              aria-label="Perfil"
            >
              <div className="i-ph:user text-xl" />
            </button>
          }>
            {() => <UserMenu />}
          </ClientOnly>
        </div>
      </header>
    );
  }

  // Original header for chat pages
  return (
    <header
      className={classNames('flex items-center px-4 border-b h-[var(--header-height)]', {
        'border-transparent': !chat.started,
        'border-bolt-elements-borderColor': chat.started,
      })}
    >
      <div className="flex items-center gap-2 z-logo text-bolt-elements-textPrimary cursor-pointer">
        <div className="i-ph:sidebar-simple-duotone text-xl" />
        <a href="/" className="text-2xl font-semibold text-accent flex items-center">
          <img src="/logo-light-styled.png" alt="logo" className="w-[90px] inline-block dark:hidden" />
          <img src="/logo-dark-styled.png" alt="logo" className="w-[90px] inline-block hidden dark:block" />
        </a>
      </div>
      {chat.started && (
        <>
          <span className="flex-1 px-4 truncate text-center text-bolt-elements-textPrimary">
            <ClientOnly>{() => <ChatDescription />}</ClientOnly>
          </span>
          <ClientOnly>
            {() => (
              <div className="flex items-center gap-4">
                <HeaderActionButtons chatStarted={chat.started} />
                {/* Upgrade button - shows badge if paid, upgrade button if free */}
                <UpgradeButton size="sm" />
                {/* Notifications and Profile icons */}
                <NotificationsDropdown />
                <UserMenu />
              </div>
            )}
          </ClientOnly>
        </>
      )}
    </header>
  );
}
