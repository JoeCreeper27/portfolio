'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Clock, LayoutGrid, LogOut, Settings } from 'lucide-react';
import { tableApi } from '@/lib/api';
import { TableStatus, UserRole } from '@/lib/types';
import { useAuthStore } from '@/store/useAuthStore';
import { useOrderStore } from '@/store/useOrderStore';
import TableCard from '@/components/tables/TableCard';
import type { Table, TableArea } from '@/lib/types';

export default function TablesPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { setTable } = useOrderStore();
  const [selectedAreaId, setSelectedAreaId] = useState<string | 'all'>('all');

  const { data: areas = [] } = useQuery({ queryKey: ['areas'], queryFn: tableApi.getAreas });
  const { data: tables = [], isLoading } = useQuery({
    queryKey: ['tables'],
    queryFn: () => tableApi.getTables(),
    refetchInterval: 15_000, // Poll every 15s for status updates
  });

  const filteredTables = selectedAreaId === 'all'
    ? tables
    : tables.filter((t) => t.areaId === selectedAreaId);

  const handleTableClick = (table: Table) => {
    if (table.status === TableStatus.CLEANING) {
      alert(`Table ${table.name} is being cleaned. Please select another.`);
      return;
    }
    setTable(table.id, table.name);
    router.push(`/pos/order/${table.id}`);
  };

  const stats = {
    total: tables.length,
    occupied: tables.filter((t) => t.status === TableStatus.OCCUPIED).length,
    empty: tables.filter((t) => t.status === TableStatus.EMPTY).length,
    cleaning: tables.filter((t) => t.status === TableStatus.CLEANING).length,
  };

  const isManager = user?.role === UserRole.OWNER || user?.role === UserRole.MANAGER;

  return (
    <div className="flex flex-col h-full">
      {/* Header bar */}
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-5 h-5 text-primary-600" />
          <h1 className="font-bold text-slate-800 text-lg">Tables</h1>
        </div>

        {/* Status legend */}
        <div className="hidden md:flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-green-400" />
            <span className="text-slate-600">Empty ({stats.empty})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-400" />
            <span className="text-slate-600">Occupied ({stats.occupied})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-yellow-400" />
            <span className="text-slate-600">Cleaning ({stats.cleaning})</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/pos/clock')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">Clock</span>
          </button>
          {isManager && (
            <button
              onClick={() => router.push('/admin/menu')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Admin</span>
            </button>
          )}
          <button
            onClick={() => { logout(); router.replace('/login'); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Area tabs */}
      {areas.length > 0 && (
        <div className="flex gap-1 px-4 py-2 bg-white border-b border-slate-100 shrink-0 overflow-x-auto">
          <button
            onClick={() => setSelectedAreaId('all')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedAreaId === 'all'
                ? 'bg-primary-500 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All
          </button>
          {areas.map((area: TableArea) => (
            <button
              key={area.id}
              onClick={() => setSelectedAreaId(area.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedAreaId === area.id
                  ? 'bg-primary-500 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {area.name}
            </button>
          ))}
        </div>
      )}

      {/* Table grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="pos-grid">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl h-28 animate-pulse" />
            ))}
          </div>
        ) : filteredTables.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-slate-400">
            No tables found
          </div>
        ) : (
          <div className="pos-grid">
            {filteredTables.map((table) => (
              <TableCard
                key={table.id}
                table={table}
                onClick={() => handleTableClick(table)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom bar: user info + quick stats */}
      <footer className="px-4 py-2 bg-white border-t border-slate-200 flex items-center justify-between text-sm text-slate-500 shrink-0">
        <span>{user?.name} &middot; {user?.role}</span>
        <span>{stats.occupied} / {stats.total} occupied</span>
      </footer>
    </div>
  );
}
