'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Order, UserRole } from '@/lib/types';
import useAuthStore from '@/store/useAuthStore';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';

interface DailyStats {
  totalRevenue: number;
  totalOrders: number;
  cashAmount: number;
  creditCardAmount: number;
  linePayAmount: number;
  jkoPayAmount: number;
  otherAmount: number;
  openTableCount: number;
}

export default function DailySummaryPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [openOrders, setOpenOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [settleLoading, setSettleLoading] = useState(false);
  const [settleConfirmOpen, setSettleConfirmOpen] = useState(false);

  const isManager = user?.role === UserRole.MANAGER || user?.role === UserRole.OWNER;

  useEffect(() => {
    Promise.all([
      api.get<DailyStats>('/reports/daily'),
      api.get<Order[]>('/orders/active'),
    ])
      .then(([s, o]) => { setStats(s); setOpenOrders(o); })
      .catch(() => toast.error('無法載入資料'))
      .finally(() => setLoading(false));
  }, []);

  const handleSettle = async () => {
    setSettleLoading(true);
    try {
      await api.post('/reports/daily/settle', {});
      toast.success('日結完成，報表已生成');
      setSettleConfirmOpen(false);
      window.print();
    } catch {
      toast.error('日結失敗');
    } finally {
      setSettleLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-teal-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">當日小節</h1>
        <p className="text-sm text-gray-500">{new Date().toLocaleDateString('zh-TW', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="今日營業額" value={`$${stats?.totalRevenue?.toLocaleString() ?? 0}`} color="teal" />
        <StatCard label="今日訂單數" value={String(stats?.totalOrders ?? 0)} color="blue" />
        <StatCard label="未結帳桌數" value={String(stats?.openTableCount ?? openOrders.length)} color="yellow" />
        <StatCard
          label="平均客單價"
          value={stats && stats.totalOrders > 0
            ? `$${Math.round((stats.totalRevenue ?? 0) / stats.totalOrders).toLocaleString()}`
            : '$0'
          }
          color="purple"
        />
      </div>

      {/* Payment breakdown */}
      <div className="bg-white rounded-xl border p-5">
        <h2 className="text-base font-semibold text-gray-700 mb-3">付款方式明細</h2>
        <div className="space-y-2">
          {[
            { label: '現金', value: stats?.cashAmount },
            { label: '信用卡', value: stats?.creditCardAmount },
            { label: 'Line Pay', value: stats?.linePayAmount },
            { label: '街口支付', value: stats?.jkoPayAmount },
            { label: '其他', value: stats?.otherAmount },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-gray-600">{label}</span>
              <span className="font-medium text-gray-800">${(value ?? 0).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Open orders */}
      {openOrders.length > 0 && (
        <div className="bg-white rounded-xl border p-5">
          <h2 className="text-base font-semibold text-gray-700 mb-3">未結帳桌位 ({openOrders.length})</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="text-left pb-2">桌號</th>
                <th className="text-left pb-2">開桌時間</th>
                <th className="text-right pb-2">人數</th>
                <th className="text-right pb-2">金額</th>
              </tr>
            </thead>
            <tbody>
              {openOrders.map((order) => (
                <tr key={order.id} className="border-b last:border-b-0">
                  <td className="py-2 font-medium text-gray-800">{order.tableNumber ?? order.table?.name ?? order.tableId}</td>
                  <td className="py-2 text-gray-600">
                    {new Date(order.createdAt).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-2 text-right text-gray-600">{order.paxCount ?? order.guestCount ?? '-'}</td>
                  <td className="py-2 text-right font-medium">${(order.subtotal ?? 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Settle button */}
      {isManager && (
        <div className="flex justify-end">
          <Button variant="primary" size="lg" onClick={() => setSettleConfirmOpen(true)}>
            執行日結
          </Button>
        </div>
      )}

      {/* Settle confirm modal */}
      <Modal
        isOpen={settleConfirmOpen}
        onClose={() => setSettleConfirmOpen(false)}
        title="確認日結"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setSettleConfirmOpen(false)}>取消</Button>
            <Button variant="primary" loading={settleLoading} onClick={handleSettle}>確認日結</Button>
          </>
        }
      >
        <p className="text-gray-600">
          執行日結後將結算今日所有帳務並產生報表，確認要繼續嗎？
        </p>
        {openOrders.length > 0 && (
          <p className="mt-2 text-sm text-yellow-600">
            ⚠️ 目前有 {openOrders.length} 桌尚未結帳
          </p>
        )}
      </Modal>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    teal: 'bg-teal-50 text-teal-700 border-teal-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  };
  return (
    <div className={`rounded-xl border p-4 ${colorMap[color] ?? colorMap.teal}`}>
      <p className="text-xs font-medium opacity-70 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
