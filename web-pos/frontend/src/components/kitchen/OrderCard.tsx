'use client';

import React from 'react';
import { Order } from '@/lib/types';
import Button from '@/components/ui/Button';

interface OrderCardProps {
  order: Order;
  onItemComplete: (orderId: string, itemId: string) => void;
  onOrderComplete: (orderId: string) => void;
}

function getUrgencyClass(minutes: number): string {
  if (minutes > 30) return 'border-red-500';
  if (minutes > 15) return 'border-amber-400';
  return 'border-gray-600';
}

function formatTime(date: string): string {
  return new Date(date).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
}

function elapsedMinutes(date: string): number {
  return Math.floor((Date.now() - new Date(date).getTime()) / 60000);
}

export default function OrderCard({ order, onItemComplete, onOrderComplete }: OrderCardProps) {
  const elapsed = elapsedMinutes(order.createdAt);
  const items = order.items ?? [];
  const completedCount = items.filter((i) => i.isCompleted === true).length;
  const allDone = completedCount === items.length;

  return (
    <div
      className={[
        'flex flex-col rounded-xl border-2 bg-gray-800 text-white overflow-hidden',
        getUrgencyClass(elapsed),
      ].join(' ')}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-700">
        <span className="text-xl font-bold">桌 {order.tableNumber ?? order.table?.name ?? order.tableId}</span>
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-xs text-gray-300">{formatTime(order.createdAt)}</span>
          <span className={`text-xs font-semibold ${elapsed > 30 ? 'text-red-400' : elapsed > 15 ? 'text-amber-400' : 'text-gray-400'}`}>
            {elapsed}分鐘前
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 px-4 py-3 space-y-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => !item.isCompleted && onItemComplete(order.id, item.id)}
            disabled={item.isCompleted}
            className={[
              'w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors',
              item.isCompleted
                ? 'bg-gray-700 opacity-50 cursor-default'
                : 'bg-gray-600 hover:bg-gray-500 cursor-pointer',
            ].join(' ')}
          >
            <div
              className={[
                'h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                item.isCompleted ? 'bg-teal-500 border-teal-500' : 'border-gray-400',
              ].join(' ')}
            >
              {item.isCompleted && (
                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span className={`text-sm font-medium ${item.isCompleted ? 'line-through text-gray-400' : 'text-white'}`}>
                {item.quantity}× {item.menuItemName ?? item.name}
              </span>
              {item.note && (
                <p className="text-xs text-gray-400 truncate mt-0.5">備：{item.note}</p>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-gray-700 flex items-center justify-between">
        <span className="text-sm text-gray-300">
          {completedCount}/{items.length} 完成
        </span>
        <Button
          variant="primary"
          size="sm"
          disabled={!allDone}
          onClick={() => onOrderComplete(order.id)}
        >
          整單完成
        </Button>
      </div>
    </div>
  );
}
