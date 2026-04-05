'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import { clockApi } from '@/lib/api';
import Badge from '@/components/ui/Badge';

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

function formatCurrency(cents: number): string {
  return `NT$${(cents / 100).toFixed(0)}`;
}

export default function TimePage() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['clock-records', date],
    queryFn: () => clockApi.getRecords(date),
  });

  // Group records by user for salary summary
  const userSummary = records.reduce<Record<string, { name: string; totalMinutes: number; wageEarned: number }>>((acc, r) => {
    const uid = r.userId;
    if (!acc[uid]) {
      acc[uid] = { name: r.user?.name ?? uid, totalMinutes: 0, wageEarned: 0 };
    }
    if (r.clockOut) {
      const mins = differenceInMinutes(parseISO(r.clockOut), parseISO(r.clockIn));
      acc[uid].totalMinutes += mins;
      acc[uid].wageEarned += r.wageEarned ?? 0;
    }
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Time Clock Records</h1>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Summary cards */}
      {Object.keys(userSummary).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(userSummary).map(([uid, s]) => (
            <div key={uid} className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="font-semibold text-slate-800">{s.name}</p>
              <p className="text-sm text-slate-500 mt-1">{formatDuration(s.totalMinutes)} worked</p>
              <p className="text-primary-600 font-semibold mt-1">{formatCurrency(s.wageEarned)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Records table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-700">Clock Records</h2>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-slate-400">Loading…</div>
        ) : records.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No clock records for {date}</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-5 py-3 font-semibold text-slate-600">Staff</th>
                <th className="px-5 py-3 font-semibold text-slate-600">Clock In</th>
                <th className="px-5 py-3 font-semibold text-slate-600">Clock Out</th>
                <th className="px-5 py-3 font-semibold text-slate-600">Duration</th>
                <th className="px-5 py-3 font-semibold text-slate-600 text-right">Wage Earned</th>
                <th className="px-5 py-3 font-semibold text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((rec) => {
                const duration = rec.clockOut
                  ? differenceInMinutes(parseISO(rec.clockOut), parseISO(rec.clockIn))
                  : null;
                return (
                  <tr key={rec.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3.5 font-medium text-slate-800">
                      {rec.user?.name ?? rec.userId}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {format(parseISO(rec.clockIn), 'HH:mm')}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {rec.clockOut ? format(parseISO(rec.clockOut), 'HH:mm') : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {duration !== null ? formatDuration(duration) : <span className="text-amber-500">In progress</span>}
                    </td>
                    <td className="px-5 py-3.5 text-right font-medium text-slate-800">
                      {rec.wageEarned ? formatCurrency(rec.wageEarned) : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={rec.clockOut ? 'secondary' : 'success'}>
                        {rec.clockOut ? 'Completed' : 'Active'}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
