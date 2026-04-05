'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * POS layout — full-screen, optimized for tablet use.
 * Minimal chrome; most navigation is inline within the POS flow.
 */
export default function PosLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="pos-screen bg-slate-100">
      {children}
    </div>
  );
}
