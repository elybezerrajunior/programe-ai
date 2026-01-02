import { useStore } from '@nanostores/react';
import { ClientOnly } from 'remix-utils/client-only';
import { Link, useLocation } from '@remix-run/react';
import { chatStore } from '~/lib/stores/chat';
import { profileStore } from '~/lib/stores/profile';
import { classNames } from '~/utils/classNames';
import { HeaderActionButtons } from './HeaderActionButtons.client';
import { ChatDescription } from '~/lib/persistence/ChatDescription.client';

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
        <div className="flex items-center gap-2 z-logo text-bolt-elements-textPrimary flex-1">
          <div className="i-ph:rocket text-xl text-accent" />
          <a href="/" className="text-xl font-semibold text-bolt-elements-textPrimary flex items-center">
            Programe Studio
          </a>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
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

        {/* Right side: Notifications and Profile */}
        <div className="flex items-center gap-4">
          <button
            className="relative p-2 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary transition-colors bg-transparent"
            aria-label="Notificações"
          >
            <div className="i-ph:bell text-xl" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          <ClientOnly>
            {() => (
              <button
                className="w-10 h-10 rounded-full overflow-hidden bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor"
                aria-label="Perfil"
              >
                {profile?.avatar ? (
                  <img src={profile.avatar} alt={profile?.username || 'User'} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-bolt-elements-textSecondary">
                    <div className="i-ph:user text-lg" />
                  </div>
                )}
              </button>
            )}
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
              <div className="">
                <HeaderActionButtons chatStarted={chat.started} />
              </div>
            )}
          </ClientOnly>
        </>
      )}
    </header>
  );
}
