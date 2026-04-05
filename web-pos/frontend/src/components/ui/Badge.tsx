'use client';

import React from 'react';
import { TableStatus, MenuItemStatus, UserRole } from '@/lib/types';

interface BadgeProps {
  variant: 'success' | 'error' | 'warning' | 'info' | 'default';
  children: React.ReactNode;
  size?: 'sm' | 'md';
}

const variantClasses: Record<BadgeProps['variant'], string> = {
  success: 'bg-green-100 text-green-700',
  error: 'bg-red-100 text-red-700',
  warning: 'bg-yellow-100 text-yellow-700',
  info: 'bg-blue-100 text-blue-700',
  default: 'bg-gray-100 text-gray-700',
};

export default function Badge({ variant, children, size = 'sm' }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        variantClasses[variant],
      ].join(' ')}
    >
      {children}
    </span>
  );
}

const tableStatusMap: Record<TableStatus, { label: string; variant: BadgeProps['variant'] }> = {
  EMPTY: { label: '空桌', variant: 'success' },
  OCCUPIED: { label: '使用中', variant: 'error' },
  CLEANING: { label: '清理中', variant: 'warning' },
};

export function TableStatusBadge({ status }: { status: TableStatus }) {
  const { label, variant } = tableStatusMap[status];
  return <Badge variant={variant}>{label}</Badge>;
}

const itemStatusMap: Record<MenuItemStatus, { label: string; variant: BadgeProps['variant'] }> = {
  ACTIVE: { label: '上架', variant: 'success' },
  INACTIVE: { label: '下架', variant: 'default' },
  SOLD_OUT: { label: '售完', variant: 'warning' },
};

export function MenuItemStatusBadge({ status }: { status: MenuItemStatus }) {
  const { label, variant } = itemStatusMap[status];
  return <Badge variant={variant}>{label}</Badge>;
}

const roleMap: Record<UserRole, { label: string; variant: BadgeProps['variant'] }> = {
  OWNER: { label: '店主', variant: 'error' },
  MANAGER: { label: '店長', variant: 'info' },
  STAFF: { label: '員工', variant: 'default' },
  KITCHEN: { label: '廚房', variant: 'warning' },
};

export function UserRoleBadge({ role }: { role: UserRole }) {
  const { label, variant } = roleMap[role];
  return <Badge variant={variant}>{label}</Badge>;
}
