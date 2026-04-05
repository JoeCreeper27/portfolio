'use client';

import React from 'react';
import { Category } from '@/lib/types';

interface CategoryTabProps {
  category: Category;
  isActive: boolean;
  onClick: () => void;
  itemCount?: number;
}

export default function CategoryTab({ category, isActive, onClick, itemCount }: CategoryTabProps) {
  return (
    <button
      onClick={onClick}
      className={[
        'w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left',
        'transition-colors duration-150 font-medium text-sm',
        isActive
          ? 'bg-teal-600 text-white shadow-sm'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
      ].join(' ')}
    >
      <span className="truncate">{category.name}</span>
      {itemCount !== undefined && (
        <span
          className={[
            'flex-shrink-0 rounded-full px-1.5 py-0.5 text-xs font-semibold min-w-[20px] text-center',
            isActive ? 'bg-teal-500 text-white' : 'bg-gray-300 text-gray-600',
          ].join(' ')}
        >
          {itemCount}
        </span>
      )}
    </button>
  );
}
