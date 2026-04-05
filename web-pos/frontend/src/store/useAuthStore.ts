import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserProfile, UserRole } from '@/lib/types'

interface AuthState {
  user: UserProfile | null
  token: string | null
  isAuthenticated: boolean

  // Actions
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  setUser: (user: UserProfile, token: string) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        // Dynamic import avoids circular dependency (api imports this store)
        const { authApi } = await import('@/lib/api')
        const response = await authApi.login(email, password)
        set({
          user: response.user,
          token: response.token,
          isAuthenticated: true,
        })
      },

      logout: () => {
        // Fire-and-forget backend logout; ignore errors
        import('@/lib/api')
          .then(({ authApi }) => authApi.logout())
          .catch(() => {})
        set({ user: null, token: null, isAuthenticated: false })
      },

      setUser: (user: UserProfile, token: string) =>
        set({ user, token, isAuthenticated: true }),
    }),
    {
      name: 'webpos-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)

// Convenience selector hooks
export const useUser = () => useAuthStore((s) => s.user)
export const useToken = () => useAuthStore((s) => s.token)
export const useRole = (): UserRole | null => useAuthStore((s) => s.user?.role ?? null)
export const useIsAuthenticated = () => useAuthStore((s) => s.isAuthenticated)
