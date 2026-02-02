import { useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import { toast } from 'react-toastify';
import { supabase } from '~/lib/auth/supabase-client';
import { authStore } from '~/lib/stores/auth';
import {
  setNotifications,
  addNotification,
  setNotificationsLoading,
  setNotificationsError,
  clearNotifications,
  type Notification,
} from '~/lib/stores/notifications';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Componente que escuta notificações em tempo real do Supabase
 * Deve ser montado dentro de <ClientOnly> no root.tsx
 */
export function NotificationListener() {
  const auth = useStore(authStore);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const initialLoadRef = useRef(false);

  useEffect(() => {
    // Só conectar se houver usuário autenticado e supabase disponível
    if (!auth.isAuthenticated || !auth.user?.id || !supabase) {
      // Limpar notificações se usuário deslogou
      if (!auth.isAuthenticated && initialLoadRef.current) {
        clearNotifications();
        initialLoadRef.current = false;
      }
      return;
    }

    const userId = auth.user.id;

    // Carregar notificações iniciais
    async function loadInitialNotifications() {
      if (!supabase) return;
      
      setNotificationsLoading(true);

      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) {
          console.error('[NotificationListener] Error loading notifications:', error);
          setNotificationsError(error.message);
          return;
        }

        setNotifications(data || []);
        initialLoadRef.current = true;
      } catch (error) {
        console.error('[NotificationListener] Unexpected error:', error);
        setNotificationsError('Erro ao carregar notificações');
      }
    }

    // Configurar listener realtime
    function setupRealtimeSubscription() {
      if (!supabase) return;

      // Cancelar subscription anterior se existir
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }

      const channel = supabase
        .channel(`notifications:${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const notification = payload.new as Notification;
            
            // Adicionar à store
            addNotification(notification);

            // Mostrar toast com feedback visual
            const toastOptions = {
              autoClose: 5000,
              closeOnClick: true,
            };

            switch (notification.type) {
              case 'success':
                toast.success(notification.title, toastOptions);
                break;
              case 'warning':
                toast.warning(notification.title, toastOptions);
                break;
              case 'error':
                toast.error(notification.title, toastOptions);
                break;
              default:
                toast.info(notification.title, toastOptions);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            // Atualizar notificação na store (ex: marcada como lida em outro dispositivo)
            const notification = payload.new as Notification;
            addNotification(notification); // addNotification também atualiza se já existir
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('[NotificationListener] Connected to realtime');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('[NotificationListener] Channel error');
          }
        });

      channelRef.current = channel;
    }

    // Executar
    loadInitialNotifications();
    setupRealtimeSubscription();

    // Cleanup
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [auth.isAuthenticated, auth.user?.id]);

  // Este componente não renderiza nada visualmente
  return null;
}
