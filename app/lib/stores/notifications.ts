import { map, computed } from 'nanostores';

/**
 * Tipo de notificação
 */
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

/**
 * Interface de uma notificação
 */
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  link?: string | null;
  created_at: string;
}

/**
 * Estado da store de notificações
 */
export interface NotificationsState {
  notifications: Notification[];
  isLoading: boolean;
  error: string | null;
}

// Estado inicial
const initialState: NotificationsState = {
  notifications: [],
  isLoading: false,
  error: null,
};

// Store principal de notificações
export const notificationsStore = map<NotificationsState>(initialState);

// Computed: contagem de notificações não lidas
export const unreadCount = computed(notificationsStore, (state) =>
  state.notifications.filter((n) => !n.read).length
);

// Computed: notificações ordenadas (mais recentes primeiro)
export const sortedNotifications = computed(notificationsStore, (state) =>
  [...state.notifications].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
);

// Computed: apenas notificações não lidas
export const unreadNotifications = computed(notificationsStore, (state) =>
  state.notifications.filter((n) => !n.read).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
);

/**
 * Define todas as notificações (usado no carregamento inicial)
 */
export function setNotifications(notifications: Notification[]) {
  notificationsStore.setKey('notifications', notifications);
  notificationsStore.setKey('isLoading', false);
  notificationsStore.setKey('error', null);
}

/**
 * Adiciona uma nova notificação ou atualiza se já existir
 */
export function addNotification(notification: Notification) {
  const current = notificationsStore.get();
  const existingIndex = current.notifications.findIndex((n) => n.id === notification.id);

  if (existingIndex !== -1) {
    // Atualizar notificação existente
    const updated = [...current.notifications];
    updated[existingIndex] = notification;
    notificationsStore.setKey('notifications', updated);
  } else {
    // Adicionar nova notificação
    notificationsStore.setKey('notifications', [notification, ...current.notifications]);
  }
}

/**
 * Marca uma notificação como lida
 */
export function markAsRead(notificationId: string) {
  const current = notificationsStore.get();
  notificationsStore.setKey(
    'notifications',
    current.notifications.map((n) =>
      n.id === notificationId ? { ...n, read: true } : n
    )
  );
}

/**
 * Marca todas as notificações como lidas
 */
export function markAllAsRead() {
  const current = notificationsStore.get();
  notificationsStore.setKey(
    'notifications',
    current.notifications.map((n) => ({ ...n, read: true }))
  );
}

/**
 * Remove uma notificação
 */
export function removeNotification(notificationId: string) {
  const current = notificationsStore.get();
  notificationsStore.setKey(
    'notifications',
    current.notifications.filter((n) => n.id !== notificationId)
  );
}

/**
 * Define o estado de loading
 */
export function setNotificationsLoading(isLoading: boolean) {
  notificationsStore.setKey('isLoading', isLoading);
}

/**
 * Define um erro
 */
export function setNotificationsError(error: string | null) {
  notificationsStore.setKey('error', error);
  notificationsStore.setKey('isLoading', false);
}

/**
 * Limpa todas as notificações (usado no logout)
 */
export function clearNotifications() {
  notificationsStore.set(initialState);
}
