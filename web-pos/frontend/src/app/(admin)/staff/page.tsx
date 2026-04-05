'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, UserX, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { staffApi, type StaffRequest } from '@/lib/api';
import type { UserProfile } from '@/lib/types';
import { UserRole } from '@/lib/types';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';

const ROLE_OPTIONS = [
  { value: UserRole.OWNER, label: 'Owner' },
  { value: UserRole.MANAGER, label: 'Manager' },
  { value: UserRole.STAFF, label: 'Staff' },
  { value: UserRole.KITCHEN, label: 'Kitchen' },
];

const ROLE_BADGE: Record<UserRole, 'primary' | 'success' | 'secondary' | 'warning'> = {
  [UserRole.OWNER]: 'primary',
  [UserRole.MANAGER]: 'warning',
  [UserRole.STAFF]: 'success',
  [UserRole.KITCHEN]: 'secondary',
};

const defaultForm = (): StaffRequest => ({
  email: '',
  name: '',
  role: UserRole.STAFF,
  pin: '',
  hourlyWage: 0,
  password: '',
});

export default function StaffPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean; editing?: UserProfile }>({ open: false });
  const [form, setForm] = useState<StaffRequest>(defaultForm());

  const { data: staff = [], isLoading } = useQuery({
    queryKey: ['staff'],
    queryFn: staffApi.getAll,
  });

  const save = useMutation({
    mutationFn: (d: StaffRequest) =>
      modal.editing ? staffApi.update(modal.editing.id, d) : staffApi.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff'] });
      setModal({ open: false });
      toast.success(modal.editing ? 'Staff member updated' : 'Staff member created');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deactivate = useMutation({
    mutationFn: staffApi.deactivate,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['staff'] }); toast.success('Staff deactivated'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const openModal = (member?: UserProfile) => {
    if (member) {
      setForm({
        email: member.email,
        name: member.name,
        role: member.role,
        pin: member.pin ?? '',
        hourlyWage: member.hourlyWage ?? 0,
        password: '',
      });
    } else {
      setForm(defaultForm());
    }
    setModal({ open: true, editing: member });
  };

  const formatWage = (cents?: number) =>
    cents ? `$${(cents / 100).toFixed(0)}/hr` : '—';

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Staff Management</h1>
        <Button onClick={() => openModal()} icon={<Plus className="w-4 h-4" />}>
          Add Staff
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="bg-white rounded-xl h-16 animate-pulse" />)}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3 text-left font-semibold text-slate-600">Name</th>
                <th className="px-5 py-3 text-left font-semibold text-slate-600">Email</th>
                <th className="px-5 py-3 text-left font-semibold text-slate-600">Role</th>
                <th className="px-5 py-3 text-left font-semibold text-slate-600">Wage</th>
                <th className="px-5 py-3 text-left font-semibold text-slate-600">Status</th>
                <th className="px-5 py-3 text-right font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staff.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-slate-800">{member.name}</td>
                  <td className="px-5 py-3.5 text-slate-500">{member.email}</td>
                  <td className="px-5 py-3.5">
                    <Badge variant={ROLE_BADGE[member.role]}>{member.role}</Badge>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">{formatWage(member.hourlyWage)}</td>
                  <td className="px-5 py-3.5">
                    <Badge variant={member.isActive ? 'success' : 'secondary'}>
                      {member.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openModal(member)}
                        className="p-1.5 text-slate-400 hover:text-primary-600 rounded transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          const action = member.isActive ? 'deactivate' : 'reactivate';
                          if (confirm(`${action} ${member.name}?`)) deactivate.mutate(member.id);
                        }}
                        className={`p-1.5 rounded transition-colors ${
                          member.isActive
                            ? 'text-slate-400 hover:text-danger-600'
                            : 'text-slate-400 hover:text-success-600'
                        }`}
                        title={member.isActive ? 'Deactivate' : 'Reactivate'}
                      >
                        {member.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {staff.length === 0 && (
            <div className="py-12 text-center text-slate-400">No staff members yet</div>
          )}
        </div>
      )}

      <Modal
        isOpen={modal.open}
        onClose={() => setModal({ open: false })}
        title={modal.editing ? 'Edit Staff Member' : 'New Staff Member'}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Jane Smith"
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="jane@restaurant.com"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Role</label>
              <select
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <Input
              label="PIN (4–6 digits)"
              value={form.pin ?? ''}
              onChange={(e) => setForm({ ...form, pin: e.target.value })}
              placeholder="1234"
              maxLength={6}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Hourly Wage (cents)"
              type="number"
              value={String(form.hourlyWage ?? 0)}
              onChange={(e) => setForm({ ...form, hourlyWage: Number(e.target.value) })}
              helpText="e.g. 18000 = $180/hr"
            />
            {!modal.editing && (
              <Input
                label="Initial Password"
                type="password"
                value={form.password ?? ''}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Min 8 characters"
              />
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModal({ open: false })}>Cancel</Button>
            <Button
              onClick={() => save.mutate(form)}
              isLoading={save.isPending}
              disabled={!form.name || !form.email}
            >
              {modal.editing ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
