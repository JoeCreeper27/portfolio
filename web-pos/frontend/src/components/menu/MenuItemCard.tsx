'use client';

import React from 'react';
import { MenuItem, MenuItemStatus } from '@/lib/types';

interface MenuItemCardProps {
  item: MenuItem;
  onClick: (item: MenuItem) => void;
}

export default function MenuItemCard({ item, onClick }: MenuItemCardProps) {
  const isDisabled = item.status !== MenuItemStatus.ACTIVE;
  const isSoldOut = item.status === MenuItemStatus.SOLD_OUT;

  return (
    <button
      onClick={() => !isDisabled && onClick(item)}
      disabled={isDisabled}
      className={[
        'relative flex flex-col rounded-xl overflow-hidden border text-left',
        'transition-all duration-150',
        isDisabled
          ? 'cursor-not-allowed opacity-50'
          : 'cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.98]',
        'bg-white border-gray-200',
      ].join(' ')}
    >
      {/* Image */}
      <div className="relative aspect-square w-full bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center text-4xl">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span>🍽️</span>
        )}
        {/* Sold out overlay */}
        {isSoldOut && (
          <div className="absolute inset-0 bg-gray-900/60 flex items-center justify-center">
            <span className="text-white font-bold text-lg">售完</span>
          </div>
        )}
      </div>
      {/* Info */}
      <div className="flex flex-col gap-1 p-2">
        <p className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug">{item.name}</p>
        <p className="text-sm font-bold text-teal-600 mt-auto">
          ${item.price.toLocaleString()}
        </p>
      </div>
    </button>
  );
}
