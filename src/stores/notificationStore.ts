import { create } from 'zustand';

export interface NotificationItem {
  id: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  snippet: string;
  timestamp: string;
  read: boolean;
  emailId: string;
}

interface NotificationState {
  notifications: NotificationItem[];
  addNotification: (email: { id: string; from: string; subject: string; snippet: string; date: string }) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],

  addNotification: (email) => {
    // Parse sender
    let name = 'Unknown';
    let address = '';
    const fromStr = email.from || '';
    const match = fromStr.match(/^(.*?)\s*<(.*?)>$/);
    if (match) {
      name = match[1].replace(/['"]/g, '').trim() || match[2];
      address = match[2];
    } else {
      name = fromStr;
      address = fromStr;
    }

    const newNotification: NotificationItem = {
      id: `notif-${Date.now()}-${email.id}`,
      senderName: name,
      senderEmail: address,
      subject: email.subject || '(No Subject)',
      snippet: email.snippet || '',
      timestamp: email.date || new Date().toISOString(),
      read: false,
      emailId: email.id,
    };

    set((state) => {
      // Avoid duplicate notifications for the same email ID
      if (state.notifications.some((n) => n.emailId === email.id)) {
        return state;
      }
      return {
        notifications: [newNotification, ...state.notifications],
      };
    });
  },

  markAsRead: (id) => set((state) => ({
    notifications: state.notifications.map((n) => n.id === id ? { ...n, read: true } : n)
  })),

  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map((n) => ({ ...n, read: true }))
  })),

  clearNotifications: () => set({ notifications: [] }),
}));
