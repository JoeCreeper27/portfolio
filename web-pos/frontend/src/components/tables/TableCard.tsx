'use client';

import React from 'react';
import { Table, TableStatus } from '@/lib/types';
import { TableStatusBadge } from '@/components/ui/Badge';

interface TableCardProps {
  table: Table;
  areaName?: string;
  onSelect: (table: Table) => void;
  elapsedMinutes?: number;
}

const statusStyle: Record<TableStatus, { border: string; bg: string }> = {
  EMPTY: { border: 'border-green-400', bg: 'bg-green-50 hover:bg-green-100 cursor-pointer' },
  OCCUPIED: { border: 'border-red-400', bg: 'bg-red-50 hover:bg-red-100 cursor-pointer' },
  CLEANING: { border: 'border-yellow-400', bg: 'bg-yellow-50 cursor-not-allowed' },
};

function formatElapsed(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}` : `${m}m`;
}

export default function TableCard({ table, areaName, onSelect, elapsedMinutes }: TableCardProps) {
  const style = statusStyle[table.status];
  const isClickable = table.status !== TableStatus.CLEANING;

  return (
    <button
      onClick={() => isClickable && onSelect(table)}
      disabled={!isClickable}
      className={[
        'flex flex-col items-center justify-between rounded-xl border-2 p-4 transition-all duration-150',
        'w-full aspect-square shadow-sm select-none',
        style.border,
        style.bg,
      ].join(' ')}
    >
      {/* Table number */}
      <div className="flex-1 flex items-center justify-center">
        <span className="text-3xl font-bold text-gray-700">{table.name}</span>
      </div>

      {/* Status + elapsed */}
      <div className="w-full flex flex-col items-center gap-1">
        <TableStatusBadge status={table.status} />
        {table.status === TableStatus.OCCUPIED && elapsedMinutes !== undefined && (
          <span className="text-xs text-gray-500">{formatElapsed(elapsedMinutes)}</span>
        )}
      </div>

      {/* Capacity */}
      <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
        </svg>
        <span>{table.capacity}</span>
      </div>
    </button>
  );
}
