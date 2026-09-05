import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';

interface AuthState {
  user:     User | null;
  token:    string | null;
  isAuth:   boolean;
  setAuth:  (user: User, token: string) => void;
  logout:   () => void;
  updateUser: (user: Partial<User>) => void;
}

/**
 * Store Zustand para gerenciamento de autenticação.
 * Persiste user e token no localStorage automaticamente.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:   null,
      token:  null,
      isAuth: false,

      setAuth: (user, token) => {
        localStorage.setItem('pbl_token', token);
        set({ user, token, isAuth: true });
      },

      logout: () => {
        localStorage.removeItem('pbl_token');
        localStorage.removeItem('pbl_user');
        set({ user: null, token: null, isAuth: false });
      },

      updateUser: (partial) => {
        const current = get().user;
        if (current) set({ user: { ...current, ...partial } });
      },
    }),
    {
      name: 'pbl_auth',
      partialize: (state) => ({ user: state.user, token: state.token, isAuth: state.isAuth }),
    }
  )
);
