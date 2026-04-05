'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { UserRole } from '@/lib/types'

/**
 * Root redirect — sends the user to the correct entry point based on role.
 *   KITCHEN           → /pos/kitchen
 *   OWNER / MANAGER   → /pos/tables  (admin panel accessible from nav)
 *   STAFF             → /pos/tables
 *   Unauthenticated   → /login
 */
export default function RootPage() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.replace('/login')
      return
    }

    if (user.role === UserRole.KITCHEN) {
      router.replace('/pos/kitchen')
    } else {
      router.replace('/pos/tables')
    }
  }, [isAuthenticated, user, router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" />
    </div>
  )
}
