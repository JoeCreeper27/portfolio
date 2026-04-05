'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutGrid,
  UtensilsCrossed,
  Users,
  BarChart3,
  Clock,
  LogOut,
  Monitor,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { UserRole } from '@/lib/types';
import toast from 'react-hot-toast';

const navItems = [
  { href: '/admin/menu',    label: 'Menu',    icon: UtensilsCrossed },
  { href: '/admin/tables',  label: 'Tables',  icon: LayoutGrid },
  { href: '/admin/staff',   label: 'Staff',   icon: Users },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { href: '/admin/time',    label: 'Time',    icon: Clock },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, isAuthenticated, clearAuth } = useAuthStore();

  // Guard: only OWNER and MANAGER may access admin
  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
    } else if (role !== UserRole.OWNER && role !== UserRole.MANAGER) {
      router.replace('/pos/tables');
    }
  }, [isAuthenticated, role, router]);

  const handleLogout = () => {
    clearAuth();
    toast.success('Signed out');
    router.push('/login');
  };

  return (
    <div className="flex h-screen bg-surface-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 bg-surface-900 flex flex-col shrink-0">
        {/* Brand */}
        <div className="px-5 py-6 border-b border-surface-800">
          <h1 className="text-white text-lg font-bold">Web POS</h1>
          <p className="text-slate-400 text-xs mt-0.5">Admin Panel</p>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-primary-600 text-white'
                    : 'text-slate-400 hover:bg-surface-800 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="px-3 py-4 border-t border-surface-800 space-y-1">
          <Link
            href="/pos/tables"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
              text-slate-400 hover:bg-surface-800 hover:text-white transition-colors"
          >
            <Monitor className="w-4 h-4 shrink-0" />
            POS Terminal
          </Link>

          <div className="px-3 py-2 text-xs text-slate-500 truncate">
            {user?.name ?? 'Unknown'} &middot; {role}
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
              text-slate-400 hover:bg-danger-700 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
