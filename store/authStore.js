import { create } from 'zustand';
import { tokenStorage, authApi } from '../lib/api';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email, password) => {
    const { data } = await authApi.login(email, password);
    const { user, accessToken, refreshToken } = data.data;
    await tokenStorage.setAccess(accessToken);
    await tokenStorage.setRefresh(refreshToken);
    set({ user, isAuthenticated: true });
  },

  logout: async () => {
    try {
      const rt = await tokenStorage.getRefresh();
      if (rt) await authApi.logout(rt);
    } catch (_) {}
    await tokenStorage.clear();
    set({ user: null, isAuthenticated: false });
  },

  loadUser: async () => {
    try {
      const token = await tokenStorage.getAccess();
      if (!token) return set({ isLoading: false });
      const { data } = await authApi.me();
      set({ user: data.data, isAuthenticated: true, isLoading: false });
    } catch {
      await tokenStorage.clear();
      set({ isLoading: false });
    }
  },

  setUser: (user) => set({ user }),
}));
