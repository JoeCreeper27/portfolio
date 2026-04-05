'use client';

import React from 'react';
import { CartItem as CartItemType } from '@/lib/types';

interface CartItemProps {
  item: CartItemType;
  index: number;
  onQuantityChange: (index: number, qty: number) => void;
  onRemove: (index: number) => void;
}

export default function CartItem({ item, index, onQuantityChange, onRemove }: CartItemProps) {
  const subtotal = item.subtotal;

  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-b-0">
      {/* Name + modifiers */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
        {item.selectedMods && item.selectedMods.length > 0 && (
          <p className="text-xs text-gray-500 mt-0.5">
            {item.selectedMods.map((m) => m.optionName).join('、')}
          </p>
        )}
        {item.note && (
          <p className="text-xs text-gray-400 italic mt-0.5">備註：{item.note}</p>
        )}
      </div>

      {/* Qty controls */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => onQuantityChange(index, item.quantity - 1)}
          disabled={item.quantity <= 1}
          className="h-7 w-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors"
        >
          <span className="text-base leading-none">−</span>
        </button>
        <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
        <button
          onClick={() => onQuantityChange(index, item.quantity + 1)}
          className="h-7 w-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <span className="text-base leading-none">+</span>
        </button>
      </div>

      {/* Price */}
      <span className="text-sm font-semibold text-gray-800 flex-shrink-0 w-16 text-right">
        ${subtotal.toLocaleString()}
      </span>

      {/* Delete */}
      <button
        onClick={() => onRemove(index)}
        className="flex-shrink-0 p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
        aria-label="移除品項"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}
