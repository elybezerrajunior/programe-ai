import { useState, useRef, useEffect } from 'react';
import { useStore } from '@nanostores/react';

import { supabase } from '~/lib/auth/supabase-client';
import {
  notificationsStore,
  unreadCount,
  sortedNotifications,
  markAsRead,
  markAllAsRead,
  removeNotification,
  type Notification,
} from '~/lib/stores/notifications';
import { authStore } from '~/lib/stores/auth';
import { classNames } from '~/utils/classNames';

/**
 * Ícone de tipo de notificação
 */
function NotificationIcon({ type }: { type: Notification['type'] }) {
  const iconClasses = {
    info: 'i-ph:info text-blue-400',
    success: 'i-ph:check-circle text-green-400',
    warning: 'i-ph:warning text-yellow-400',
    error: 'i-ph:x-circle text-red-400',
  };

  return <div className={classNames('text-lg flex-shrink-0', iconClasses[type])} />;
}

/**
 * Formata a data para exibição relativa
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'Agora';
  if (diffMinutes < 60) return `${diffMinutes}min atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  if (diffDays < 7) return `${diffDays}d atrás`;

  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

/**
 * Item de notificação individual
 */
function NotificationItem({
  notification,
  onClose,
  onMarkAsRead,
  onRemove,
}: {
  notification: Notification;
  onClose: () => void;
  onMarkAsRead: (id: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {

  const [isRemoving, setIsRemoving] = useState(false);

  const handleClick = async () => {
    // Marcar como lida se não estiver
    if (!notification.read) {
      await onMarkAsRead(notification.id);
    }


  };

  const handleMarkAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!notification.read) {
      await onMarkAsRead(notification.id);
    }
  };

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRemoving(true);
    await onRemove(notification.id);
  };

  return (
    <div
      className={classNames(
        'relative w-full text-left px-4 py-3 flex items-start gap-3 transition-colors cursor-pointer',
        'hover:bg-programe-elements-background-depth-2',
        {
          'bg-programe-elements-background-depth-1': !notification.read,
          'bg-programe-elements-background-depth-3/50': notification.read,
        }
      )}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
    >
      <NotificationIcon type={notification.type} />
      <div className="flex-1 min-w-0">
        <p
          className={classNames('text-sm', {
            'font-medium text-programe-elements-textPrimary': !notification.read,
            'text-programe-elements-textSecondary': notification.read,
          })}
        >
          {notification.title}
        </p>
        <p className="text-xs text-programe-elements-textTertiary line-clamp-2 mt-0.5">
          {notification.message}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-xs text-programe-elements-textTertiary">
            {formatRelativeTime(notification.created_at)}
          </span>

          {/* Botão marcar como lida - só aparece se não lida */}
          {!notification.read && (
            <>
              <span className="text-programe-elements-textTertiary">·</span>
              <button
                onClick={handleMarkAsRead}
                className="bg-transparent border-none p-0 shadow-none text-xs text-programe-elements-textTertiary hover:text-programe-elements-textSecondary"
                title="Marcar como lida"
              >
                Marcar como lida
              </button>
            </>
          )}
        </div>
      </div>

      {/* Indicador de não lida OU botão de remover */}
      <div className="flex-shrink-0 flex items-center">
        {!notification.read ? (
          <div className="w-2 h-2 bg-accent rounded-full" title="Não lida" />
        ) : (
          <button
            onClick={handleRemove}
            disabled={isRemoving}
            className={classNames(
              'p-1 rounded transition-colors',
              'text-programe-elements-textTertiary hover:text-red-400 hover:bg-red-500/10',
              { 'opacity-50 cursor-not-allowed': isRemoving }
            )}
            title="Remover notificação"
            aria-label="Remover notificação"
          >
            {isRemoving ? (
              <div className="i-svg-spinners:90-ring-with-bg text-sm" />
            ) : (
              <div className="i-ph:x text-sm" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Dropdown de notificações
 */
export function NotificationsDropdown() {
  const auth = useStore(authStore);
  const notifications = useStore(sortedNotifications);
  const unread = useStore(unreadCount);
  const { isLoading } = useStore(notificationsStore);

  const [isOpen, setIsOpen] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Fechar com ESC
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  // Marcar uma notificação como lida
  const handleMarkAsRead = async (notificationId: string) => {
    if (!supabase) return;

    try {
      // Atualizar no Supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('[Notifications] Error marking as read:', error);
        return;
      }

      // Atualizar na store
      markAsRead(notificationId);
    } catch (err) {
      console.error('[Notifications] Unexpected error:', err);
    }
  };

  // Marcar todas como lidas
  const handleMarkAllAsRead = async () => {
    if (!auth.user?.id || !supabase || isMarkingAll) return;

    setIsMarkingAll(true);

    try {
      // Atualizar no Supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('notifications')
        .update({ read: true })
        .eq('user_id', auth.user.id)
        .eq('read', false);

      if (error) {
        console.error('[Notifications] Error marking all as read:', error);
        return;
      }

      // Atualizar na store
      markAllAsRead();
    } catch (err) {
      console.error('[Notifications] Unexpected error:', err);
    } finally {
      setIsMarkingAll(false);
    }
  };

  // Remover notificação (apenas lidas)
  const handleRemove = async (notificationId: string) => {
    if (!supabase) return;

    try {
      // Excluir do Supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        console.error('[Notifications] Error removing notification:', error);
        return;
      }

      // Remover da store
      removeNotification(notificationId);
    } catch (err) {
      console.error('[Notifications] Unexpected error:', err);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botão do sino */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-programe-elements-textSecondary hover:text-programe-elements-textPrimary transition-colors bg-transparent"
        aria-label="Notificações"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="i-ph:bell text-xl" />
        {unread > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full px-1">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-[70vh] bg-programe-elements-background-depth-1 border border-programe-elements-borderColor rounded-lg shadow-xl overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-programe-elements-borderColor bg-programe-elements-background-depth-2">
            <h3 className="font-semibold text-programe-elements-textPrimary text-sm">
              Notificações
              {notifications.length > 0 && (
                <span className="ml-2 text-xs font-normal text-programe-elements-textTertiary">
                  ({notifications.length})
                </span>
              )}
            </h3>
            {unread > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={isMarkingAll}
                className={classNames(
                  'text-xs px-2 py-1 rounded transition-all',
                  'bg-transparent text-accent hover:text-accent/80',
                  { 'opacity-50 cursor-not-allowed': isMarkingAll }
                )}
              >
                {isMarkingAll ? (
                  <span className="flex items-center gap-1">
                    <span className="i-svg-spinners:90-ring-with-bg text-xs" />
                    Marcando...
                  </span>
                ) : (
                  'Marcar todas como lidas'
                )}
              </button>
            )}
          </div>

          {/* Lista de notificações */}
          <div className="overflow-y-auto max-h-[calc(70vh-60px)]">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="i-svg-spinners:90-ring-with-bg text-xl text-programe-elements-textSecondary" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-programe-elements-textSecondary">
                <div className="i-ph:bell-slash text-4xl mb-2 opacity-50" />
                <p className="text-sm">Nenhuma notificação</p>
              </div>
            ) : (
              <div className="divide-y divide-programe-elements-borderColor">
                {notifications.slice(0, 20).map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClose={() => setIsOpen(false)}
                    onMarkAsRead={handleMarkAsRead}
                    onRemove={handleRemove}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer - ver todas */}
          {notifications.length > 20 && (
            <div className="border-t border-programe-elements-borderColor px-4 py-2 bg-programe-elements-background-depth-2">
              <button
                onClick={() => {
                  setIsOpen(false);
                  // Navegar para página de notificações se existir
                }}
                className="w-full text-center text-xs text-accent hover:underline py-1"
              >
                Ver todas as notificações ({notifications.length})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
