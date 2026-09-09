import { create } from 'zustand';

export const useAlertStore = create((set) => ({
  alerts: [],
  unreadCount: 0,

  setAlerts: (alerts) =>
    set({ alerts, unreadCount: alerts.filter(a => !a.acknowledged).length }),

  addAlert: (alert) =>
    set((state) => ({
      alerts: [alert, ...state.alerts],
      unreadCount: state.unreadCount + (alert.acknowledged ? 0 : 1),
    })),

  acknowledge: (id) =>
    set((state) => ({
      alerts: state.alerts.map(a => a.id === id ? { ...a, acknowledged: true } : a),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),

  clearAll: () => set({ alerts: [], unreadCount: 0 }),
}));
