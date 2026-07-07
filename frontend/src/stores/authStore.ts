import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Role, User } from '../types/auth'

const USER_ID_KEY = 'userId'

interface AuthState {
  user: User | null
  role: Role | null
  setAuth: (user: User, role: Role) => void
  clearAuth: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      role: null,
      setAuth: (user, role) => {
        localStorage.setItem(USER_ID_KEY, user.user_id)
        set({ user, role })
      },
      clearAuth: () => {
        localStorage.removeItem(USER_ID_KEY)
        set({ user: null, role: null })
      },
      isAuthenticated: () => get().user !== null,
    }),
    {
      name: 'premadefood-auth',
      partialize: (state) => ({ user: state.user, role: state.role }),
      onRehydrateStorage: () => (state) => {
        if (state?.user?.user_id) {
          localStorage.setItem(USER_ID_KEY, state.user.user_id)
        }
      },
    },
  ),
)

export function getStoredUserId(): string | null {
  return localStorage.getItem(USER_ID_KEY)
}
