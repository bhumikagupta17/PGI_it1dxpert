import { create } from 'zustand';
import { tokenStorage, authApi } from '../lib/api';

// Mock users for development (no backend needed)
const MOCK_USERS = [
  { id: '1', name: 'Dr. Akshit Sukhija', email: 'doctor@pgi.edu.in', password: 'password123', role: 'doctor', hospitalId: 'PGI001' },
  { id: '2', name: 'Bhumika Gupta', email: 'patient@pgi.edu.in', password: 'password123', role: 'patient', hospitalId: 'PGI002', diabetesType: 'T1D', targetGlucoseLow: 70, targetGlucoseHigh: 180, doctorName: 'Dr. Akshit Sukhija' },
];

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email, password) => {
    const found = MOCK_USERS.find(u => u.email === email && u.password === password);
    if (!found) throw { response: { data: { message: 'Invalid email or password.' } } };
    const { password: _, ...user } = found;
    await tokenStorage.setAccess('mock-token-' + user.id);
    set({ user, isAuthenticated: true });
  },

  logout: async () => {
    await tokenStorage.clear();
    set({ user: null, isAuthenticated: false });
  },

  loadUser: async () => {
    try {
      const token = await tokenStorage.getAccess();
      if (!token) return set({ isLoading: false });
      const id = token.replace('mock-token-', '');
      const found = MOCK_USERS.find(u => u.id === id);
      if (found) {
        const { password: _, ...user } = found;
        set({ user, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      await tokenStorage.clear();
      set({ isLoading: false });
    }
  },

  setUser: (user) => set({ user }),
}));