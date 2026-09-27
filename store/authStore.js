import { create } from 'zustand';

const MOCK_USERS = [
  {
    id: '1',
    name: 'Dr. Akshit Sukhija',
    email: 'doctor@pgi.edu.in',
    password: 'password123',
    role: 'doctor',
    hospitalId: 'PGI001',
  },
  {
    id: '2',
    name: 'Bhumika Gupta',
    email: 'patient@pgi.edu.in',
    password: 'password123',
    role: 'patient',
    hospitalId: 'PGI002',
    diabetesType: 'T1D',
    targetGlucoseLow: 70,
    targetGlucoseHigh: 180,
    doctorName: 'Dr. Akshit Sukhija',
  },
];

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (email, password) => {
    const found = MOCK_USERS.find(
      (u) => u.email === email && u.password === password
    );
    if (!found) throw new Error('Invalid email or password');
    const { password: _, ...user } = found;
    set({ user, isAuthenticated: true });
  },

  logout: async () => {
    set({ user: null, isAuthenticated: false });
  },

  loadUser: async () => {
    set({ isLoading: false });
  },

  setUser: (user) => set({ user }),
}));