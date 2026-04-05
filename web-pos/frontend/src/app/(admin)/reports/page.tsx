'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import { Download, TrendingUp, ShoppingBag, DollarSign, Users } from 'lucide-react';
import { reportApi } from '@/lib/api';
import Button from '@/components/ui/Button';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ title, value, subtitle, icon, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
          {subtitle && <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        <div className={`p-2.5 rounded-xl ${color}`}>{icon}</div>
      </div>
    </div>
  );
}

function formatCurrency(cents: number): string {
  return `NT$${(cents / 100).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

export default function ReportsPage() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data: report, isLoading: reportLoading } = useQuery({
    queryKey: ['daily-report', date],
    queryFn: () => reportApi.getDaily(date),
    enabled: !!date,
  });

  const { data: itemSales = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['item-sales', date],
    queryFn: () => reportApi.getItemSales(date),
    enabled: !!date,
  });

  const handleExport = async () => {
    const res = await reportApi.exportCsv(date);
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const quickDates = [
    { label: 'Today', value: format(new Date(), 'yyyy-MM-dd') },
    { label: 'Yesterday', value: format(subDays(new Date(), 1), 'yyyy-MM-dd') },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-800">Daily Reports</h1>
        <div className="flex items-center gap-3">
          {quickDates.map((d) => (
            <button
              key={d.value}
              onClick={() => setDate(d.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                date === d.value
                  ? 'bg-primary-500 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {d.label}
            </button>
          ))}
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <Button variant="secondary" onClick={handleExport} icon={<Download className="w-4 h-4" />}>
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      {reportLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="bg-white rounded-xl h-28 animate-pulse border border-slate-200" />)}
        </div>
      ) : report ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Revenue"
            value={formatCurrency(report.totalRevenue)}
            subtitle={`Tax: ${formatCurrency(report.totalTax)}`}
            icon={<DollarSign className="w-5 h-5 text-primary-600" />}
            color="bg-primary-50"
          />
          <StatCard
            title="Orders"
            value={String(report.totalOrders)}
            subtitle={`Avg: ${formatCurrency(report.averageOrderValue)}`}
            icon={<ShoppingBag className="w-5 h-5 text-blue-600" />}
            color="bg-blue-50"
          />
          <StatCard
            title="Cash"
            value={formatCurrency(report.cashRevenue)}
            icon={<TrendingUp className="w-5 h-5 text-green-600" />}
            color="bg-green-50"
          />
          <StatCard
            title="Card / E-Wallet"
            value={formatCurrency(report.cardRevenue + report.otherRevenue)}
            icon={<Users className="w-5 h-5 text-purple-600" />}
            color="bg-purple-50"
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
          No report found for {date}
        </div>
      )}

      {/* Item sales breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-700">Item Sales Breakdown</h2>
        </div>
        {itemsLoading ? (
          <div className="p-8 text-center text-slate-400">Loading…</div>
        ) : itemSales.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No sales data for this date</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-5 py-3 font-semibold text-slate-600">Item</th>
                <th className="px-5 py-3 font-semibold text-slate-600 text-right">Qty Sold</th>
                <th className="px-5 py-3 font-semibold text-slate-600 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {itemSales
                .sort((a, b) => b.totalRevenue - a.totalRevenue)
                .map((item) => (
                  <tr key={item.menuItemId} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-800">{item.name}</td>
                    <td className="px-5 py-3 text-right text-slate-500">{item.quantitySold}</td>
                    <td className="px-5 py-3 text-right text-slate-800 font-medium">
                      {formatCurrency(item.totalRevenue)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
