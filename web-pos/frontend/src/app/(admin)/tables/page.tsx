'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { tableApi, type TableAreaRequest, type TableRequest } from '@/lib/api';
import type { TableArea, Table } from '@/lib/types';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import TableCard from '@/components/tables/TableCard';

export default function TablesPage() {
  const qc = useQueryClient();
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [areaModal, setAreaModal] = useState<{ open: boolean; editing?: TableArea }>({ open: false });
  const [tableModal, setTableModal] = useState<{ open: boolean; editing?: Table }>({ open: false });
  const [areaForm, setAreaForm] = useState({ name: '', sortOrder: 0 });
  const [tableForm, setTableForm] = useState<TableRequest>({ areaId: '', name: '', capacity: 4 });

  const { data: areas = [] } = useQuery({ queryKey: ['areas'], queryFn: tableApi.getAreas });
  const { data: tables = [] } = useQuery({ queryKey: ['tables'], queryFn: () => tableApi.getTables() });

  const filteredTables = selectedAreaId
    ? tables.filter((t) => t.areaId === selectedAreaId)
    : tables;

  const saveArea = useMutation({
    mutationFn: (d: TableAreaRequest) =>
      areaModal.editing ? tableApi.updateArea(areaModal.editing.id, d) : tableApi.createArea(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['areas'] }); setAreaModal({ open: false }); toast.success('Saved'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteArea = useMutation({
    mutationFn: tableApi.deleteArea,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['areas'] }); toast.success('Area deleted'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveTable = useMutation({
    mutationFn: (d: TableRequest) =>
      tableModal.editing ? tableApi.updateTable(tableModal.editing.id, d) : tableApi.createTable(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tables'] }); setTableModal({ open: false }); toast.success('Saved'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteTable = useMutation({
    mutationFn: tableApi.deleteTable,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tables'] }); toast.success('Table deleted'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const openAreaModal = (area?: TableArea) => {
    setAreaForm(area ? { name: area.name, sortOrder: area.sortOrder } : { name: '', sortOrder: areas.length });
    setAreaModal({ open: true, editing: area });
  };

  const openTableModal = (table?: Table) => {
    if (table) {
      setTableForm({ areaId: table.areaId, name: table.name, capacity: table.capacity });
    } else {
      setTableForm({ areaId: selectedAreaId ?? areas[0]?.id ?? '', name: '', capacity: 4 });
    }
    setTableModal({ open: true, editing: table });
  };

  return (
    <div className="p-6 h-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Table Management</h1>
        <Button onClick={() => openTableModal()} icon={<Plus className="w-4 h-4" />}>
          Add Table
        </Button>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Areas sidebar */}
        <aside className="w-48 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Areas</span>
            <button onClick={() => openAreaModal()} className="p-1 text-slate-400 hover:text-primary-600 rounded">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => setSelectedAreaId(null)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${
              !selectedAreaId ? 'bg-primary-100 text-primary-700 font-medium' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Areas
          </button>
          {areas.map((area) => (
            <div key={area.id} className="group flex items-center gap-1 mb-1">
              <button
                onClick={() => setSelectedAreaId(area.id)}
                className={`flex-1 text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedAreaId === area.id ? 'bg-primary-100 text-primary-700 font-medium' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {area.name}
              </button>
              <div className="hidden group-hover:flex gap-0.5">
                <button onClick={() => openAreaModal(area)} className="p-1 text-slate-400 hover:text-primary-600">
                  <Pencil className="w-3 h-3" />
                </button>
                <button
                  onClick={() => { if (confirm(`Delete area "${area.name}"?`)) deleteArea.mutate(area.id); }}
                  className="p-1 text-slate-400 hover:text-danger-600"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </aside>

        {/* Tables grid */}
        <div className="flex-1 overflow-y-auto">
          {filteredTables.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
              <p>No tables found</p>
              <Button variant="secondary" className="mt-3" onClick={() => openTableModal()}>Add First Table</Button>
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredTables.map((table) => (
                <div key={table.id} className="relative group">
                  <TableCard table={table} onClick={() => {}} />
                  <div className="absolute top-1 right-1 hidden group-hover:flex gap-1">
                    <button
                      onClick={() => openTableModal(table)}
                      className="p-1 bg-white rounded shadow text-slate-600 hover:text-primary-600"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => { if (confirm(`Delete table "${table.name}"?`)) deleteTable.mutate(table.id); }}
                      className="p-1 bg-white rounded shadow text-slate-600 hover:text-danger-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Area Modal */}
      <Modal isOpen={areaModal.open} onClose={() => setAreaModal({ open: false })} title={areaModal.editing ? 'Edit Area' : 'New Area'}>
        <div className="space-y-4">
          <Input label="Area Name" value={areaForm.name} onChange={(e) => setAreaForm({ ...areaForm, name: e.target.value })} placeholder="e.g. Indoor, Outdoor, VIP" />
          <Input label="Sort Order" type="number" value={String(areaForm.sortOrder)} onChange={(e) => setAreaForm({ ...areaForm, sortOrder: Number(e.target.value) })} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setAreaModal({ open: false })}>Cancel</Button>
            <Button onClick={() => saveArea.mutate(areaForm)} isLoading={saveArea.isPending}>{areaModal.editing ? 'Update' : 'Create'}</Button>
          </div>
        </div>
      </Modal>

      {/* Table Modal */}
      <Modal isOpen={tableModal.open} onClose={() => setTableModal({ open: false })} title={tableModal.editing ? 'Edit Table' : 'New Table'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Area</label>
            <select
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={tableForm.areaId}
              onChange={(e) => setTableForm({ ...tableForm, areaId: e.target.value })}
            >
              {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <Input label="Table Name" value={tableForm.name} onChange={(e) => setTableForm({ ...tableForm, name: e.target.value })} placeholder="e.g. A1, Window-2" />
          <Input label="Capacity (seats)" type="number" value={String(tableForm.capacity)} onChange={(e) => setTableForm({ ...tableForm, capacity: Number(e.target.value) })} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setTableModal({ open: false })}>Cancel</Button>
            <Button onClick={() => saveTable.mutate(tableForm)} isLoading={saveTable.isPending}>{tableModal.editing ? 'Update' : 'Create'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
