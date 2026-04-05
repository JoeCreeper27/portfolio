'use client';

import React, { useState, useEffect, useRef } from 'react';
import OrderCard from '@/components/kitchen/OrderCard';
import { api } from '@/lib/api';
import { Order } from '@/lib/types';
import toast from 'react-hot-toast';

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const prevCountRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchOrders = async () => {
    try {
      const data = await api.get<Order[]>('/orders/kitchen');
      setOrders(data);
      // Play alert on new orders
      if (data.length > prevCountRef.current && prevCountRef.current > 0) {
        audioRef.current?.play().catch(() => {});
      }
      prevCountRef.current = data.length;
    } catch {
      // silently retry
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 20000);
    return () => clearInterval(interval);
  }, []);

  const handleItemComplete = async (orderId: string, itemId: string) => {
    try {
      await api.patch(`/orders/${orderId}/items/${itemId}/complete`, {});
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, items: o.items?.map((i) => i.id === itemId ? { ...i, isCompleted: true } : i) }
            : o
        )
      );
    } catch {
      toast.error('操作失敗');
    }
  };

  const handleOrderComplete = async (orderId: string) => {
    try {
      await api.patch(`/orders/${orderId}/complete`, {});
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      toast.success('訂單完成');
    } catch {
      toast.error('操作失敗');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      {/* Hidden audio for alerts */}
      <audio ref={audioRef} src="/notification.mp3" preload="auto" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">廚房出單</h1>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-teal-600 px-3 py-1 text-sm font-semibold text-white">
            {orders.length} 張訂單
          </span>
          <button
            onClick={fetchOrders}
            className="rounded-lg bg-gray-700 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-600 transition-colors"
          >
            重新整理
          </button>
          <ClockDisplay />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center pt-20">
          <div className="animate-spin h-10 w-10 rounded-full border-4 border-teal-500 border-t-transparent" />
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center pt-20 text-gray-500">
          <span className="text-6xl mb-4">✅</span>
          <p className="text-xl">目前沒有待處理訂單</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onItemComplete={handleItemComplete}
              onOrderComplete={handleOrderComplete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ClockDisplay() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const update = () => setTime(new Date().toLocaleTimeString('zh-TW'));
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);
  return <span className="text-gray-300 font-mono text-sm">{time}</span>;
}
