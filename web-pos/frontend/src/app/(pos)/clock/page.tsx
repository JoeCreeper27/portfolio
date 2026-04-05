'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { clockApi } from '@/lib/api';
import { Delete, LogIn, LogOut, ArrowLeft } from 'lucide-react';

const PIN_LENGTH = 4;

export default function ClockPage() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [now, setNow] = useState(new Date());

  // Update clock every second
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const { data: status } = useQuery({
    queryKey: ['clock-status'],
    queryFn: clockApi.getCurrentStatus,
    refetchInterval: 10_000,
  });

  const clockIn = useMutation({
    mutationFn: (p: string) => clockApi.clockIn({ pin: p }),
    onSuccess: () => {
      toast.success('Clocked in!');
      setPin('');
    },
    onError: (e: Error) => {
      toast.error(e.message);
      setPin('');
    },
  });

  const clockOut = useMutation({
    mutationFn: (p: string) => clockApi.clockOut({ pin: p }),
    onSuccess: (rec) => {
      toast.success(`Clocked out. Worked ${rec.hoursWorked?.toFixed(1)} hrs`);
      setPin('');
    },
    onError: (e: Error) => {
      toast.error(e.message);
      setPin('');
    },
  });

  const handleDigit = (d: string) => {
    if (pin.length < PIN_LENGTH) setPin((p) => p + d);
  };

  const handleDelete = () => setPin((p) => p.slice(0, -1));

  const handleClockIn = () => {
    if (pin.length < PIN_LENGTH) return;
    clockIn.mutate(pin);
  };

  const handleClockOut = () => {
    if (pin.length < PIN_LENGTH) return;
    clockOut.mutate(pin);
  };

  const isPending = clockIn.isPending || clockOut.isPending;

  return (
    <div className="flex flex-col h-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 gap-8 p-4">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white rounded-lg transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      {/* Clock display */}
      <div className="text-center text-white">
        <div className="text-5xl font-mono font-bold">{format(now, 'HH:mm:ss')}</div>
        <div className="text-slate-400 mt-1">{format(now, 'EEEE, MMMM d, yyyy')}</div>
        {status?.isClockedIn && (
          <div className="mt-2 inline-flex items-center gap-1.5 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Currently clocked in
          </div>
        )}
      </div>

      {/* PIN card */}
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-xs">
        <p className="text-slate-700 font-semibold text-center mb-4">Enter PIN</p>

        {/* PIN dots */}
        <div className="flex justify-center gap-4 mb-6">
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-colors ${
                i < pin.length ? 'bg-primary-500' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((key) => (
            <button
              key={key}
              disabled={key === ''}
              onClick={() => key === '⌫' ? handleDelete() : handleDigit(key)}
              className={`h-14 rounded-xl text-xl font-semibold transition-colors touch-target
                ${key === '' ? 'invisible' : ''}
                ${key === '⌫'
                  ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  : 'bg-slate-50 text-slate-800 hover:bg-slate-100 active:bg-primary-100'
                }`}
            >
              {key === '⌫' ? <Delete className="w-5 h-5 mx-auto" /> : key}
            </button>
          ))}
        </div>

        {/* Clock In / Out buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleClockOut}
            disabled={pin.length < PIN_LENGTH || isPending}
            className="flex items-center justify-center gap-2 h-12 rounded-xl bg-slate-700 text-white
              font-semibold text-sm disabled:opacity-50 hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Clock Out
          </button>
          <button
            onClick={handleClockIn}
            disabled={pin.length < PIN_LENGTH || isPending}
            className="flex items-center justify-center gap-2 h-12 rounded-xl bg-primary-500 text-white
              font-semibold text-sm disabled:opacity-50 hover:bg-primary-600 transition-colors"
          >
            <LogIn className="w-4 h-4" />
            Clock In
          </button>
        </div>
      </div>
    </div>
  );
}
