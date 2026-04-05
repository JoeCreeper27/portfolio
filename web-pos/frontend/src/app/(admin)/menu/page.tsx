'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { menuApi, type CategoryRequest, type MenuItemRequest } from '@/lib/api';
import type { Category, MenuItem } from '@/lib/types';
import { MenuItemStatus } from '@/lib/types';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import MenuItemCard from '@/components/menu/MenuItemCard';

export default function MenuPage() {
  const qc = useQueryClient();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [categoryModal, setCategoryModal] = useState<{ open: boolean; editing?: Category }>({ open: false });
  const [itemModal, setItemModal] = useState<{ open: boolean; editing?: MenuItem }>({ open: false });
  const [categoryForm, setCategoryForm] = useState({ name: '', sortOrder: 0 });
  const [itemForm, setItemForm] = useState<MenuItemRequest>({
    categoryId: '',
    name: '',
    description: '',
    price: 0,
    imageUrl: '',
    status: MenuItemStatus.ACTIVE,
    sortOrder: 0,
  });

  // ── Queries ──────────────────────────────────────────────────────────────────
  const { data: categories = [], isLoading: catsLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => menuApi.getCategories(),
  });

  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['menu-items', selectedCategoryId],
    queryFn: () => menuApi.getItems(selectedCategoryId ?? undefined),
  });

  // ── Category mutations ───────────────────────────────────────────────────────
  const saveCategory = useMutation({
    mutationFn: (data: CategoryRequest) =>
      categoryModal.editing
        ? menuApi.updateCategory(categoryModal.editing.id, data)
        : menuApi.createCategory(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      setCategoryModal({ open: false });
      toast.success(categoryModal.editing ? 'Category updated' : 'Category created');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteCategory = useMutation({
    mutationFn: (id: string) => menuApi.deleteCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      if (selectedCategoryId) setSelectedCategoryId(null);
      toast.success('Category deleted');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // ── Item mutations ───────────────────────────────────────────────────────────
  const saveItem = useMutation({
    mutationFn: (data: MenuItemRequest) =>
      itemModal.editing
        ? menuApi.updateItem(itemModal.editing.id, data)
        : menuApi.createItem(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['menu-items'] });
      setItemModal({ open: false });
      toast.success(itemModal.editing ? 'Item updated' : 'Item created');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteItem = useMutation({
    mutationFn: (id: string) => menuApi.deleteItem(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['menu-items'] });
      toast.success('Item deleted');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const openCategoryModal = (cat?: Category) => {
    setCategoryForm(cat ? { name: cat.name, sortOrder: cat.sortOrder } : { name: '', sortOrder: categories.length });
    setCategoryModal({ open: true, editing: cat });
  };

  const openItemModal = (item?: MenuItem) => {
    if (item) {
      setItemForm({
        categoryId: item.categoryId,
        name: item.name,
        description: item.description ?? '',
        price: item.price,
        imageUrl: item.imageUrl ?? '',
        status: item.status,
        sortOrder: item.sortOrder,
      });
    } else {
      setItemForm({
        categoryId: selectedCategoryId ?? categories[0]?.id ?? '',
        name: '',
        description: '',
        price: 0,
        imageUrl: '',
        status: MenuItemStatus.ACTIVE,
        sortOrder: items.length,
      });
    }
    setItemModal({ open: true, editing: item });
  };

  const statusBadgeVariant = (status: MenuItemStatus) => {
    if (status === MenuItemStatus.ACTIVE) return 'success';
    if (status === MenuItemStatus.SOLD_OUT) return 'warning';
    return 'secondary';
  };

  return (
    <div className="p-6 h-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Menu Management</h1>
        <Button onClick={() => openItemModal()} icon={<Plus className="w-4 h-4" />}>
          Add Item
        </Button>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Categories panel */}
        <aside className="w-56 shrink-0 flex flex-col gap-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Categories</span>
            <button
              onClick={() => openCategoryModal()}
              className="p-1 text-slate-400 hover:text-primary-600 rounded transition-colors"
              title="Add category"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {catsLoading && (
            <div className="text-sm text-slate-400 py-2">Loading…</div>
          )}

          <button
            onClick={() => setSelectedCategoryId(null)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategoryId === null
                ? 'bg-primary-100 text-primary-700'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Items
          </button>

          {categories.map((cat) => (
            <div
              key={cat.id}
              className={`group flex items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                selectedCategoryId === cat.id
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <button
                className="flex-1 text-left text-sm font-medium"
                onClick={() => setSelectedCategoryId(cat.id)}
              >
                {cat.name}
              </button>
              <span className="text-xs text-slate-400 group-hover:hidden">{cat.isVisible ? '' : '(hidden)'}</span>
              <div className="hidden group-hover:flex gap-1">
                <button onClick={() => openCategoryModal(cat)} className="p-0.5 text-slate-400 hover:text-primary-600">
                  <Pencil className="w-3 h-3" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete category "${cat.name}"?`)) deleteCategory.mutate(cat.id);
                  }}
                  className="p-0.5 text-slate-400 hover:text-danger-600"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </aside>

        {/* Items grid */}
        <div className="flex-1 overflow-y-auto">
          {itemsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl h-52 animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <UtensilsCrossedPlaceholder />
              <p className="mt-2">No items in this category</p>
              <Button variant="secondary" className="mt-4" onClick={() => openItemModal()}>
                Add First Item
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map((item) => (
                <div key={item.id} className="relative group">
                  <MenuItemCard item={item} onClick={() => {}} />
                  {/* Overlay actions */}
                  <div className="absolute top-2 right-2 hidden group-hover:flex gap-1">
                    <button
                      onClick={() => openItemModal(item)}
                      className="p-1.5 bg-white rounded-lg shadow text-slate-600 hover:text-primary-600"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${item.name}"?`)) deleteItem.mutate(item.id);
                      }}
                      className="p-1.5 bg-white rounded-lg shadow text-slate-600 hover:text-danger-600"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <Badge
                    variant={statusBadgeVariant(item.status)}
                    className="absolute top-2 left-2 text-xs"
                  >
                    {item.status === MenuItemStatus.ACTIVE ? 'Active' :
                     item.status === MenuItemStatus.SOLD_OUT ? 'Sold Out' : 'Hidden'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Category Modal */}
      <Modal
        isOpen={categoryModal.open}
        onClose={() => setCategoryModal({ open: false })}
        title={categoryModal.editing ? 'Edit Category' : 'New Category'}
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={categoryForm.name}
            onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
            placeholder="e.g. Main Course"
          />
          <Input
            label="Sort Order"
            type="number"
            value={String(categoryForm.sortOrder)}
            onChange={(e) => setCategoryForm({ ...categoryForm, sortOrder: Number(e.target.value) })}
          />
          <div className="flex gap-3 pt-2 justify-end">
            <Button variant="secondary" onClick={() => setCategoryModal({ open: false })}>
              Cancel
            </Button>
            <Button
              onClick={() => saveCategory.mutate(categoryForm)}
              isLoading={saveCategory.isPending}
            >
              {categoryModal.editing ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Item Modal */}
      <Modal
        isOpen={itemModal.open}
        onClose={() => setItemModal({ open: false })}
        title={itemModal.editing ? 'Edit Menu Item' : 'New Menu Item'}
        size="lg"
      >
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Name"
            value={itemForm.name}
            onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
            placeholder="e.g. Grilled Salmon"
            className="col-span-2"
          />
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
            <textarea
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              rows={2}
              value={itemForm.description}
              onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
              placeholder="Optional description…"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
            <select
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={itemForm.categoryId}
              onChange={(e) => setItemForm({ ...itemForm, categoryId: e.target.value })}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <Input
            label="Price (cents)"
            type="number"
            value={String(itemForm.price)}
            onChange={(e) => setItemForm({ ...itemForm, price: Number(e.target.value) })}
            helpText="Store value in cents, e.g. 38000 = TWD 380"
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
            <select
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={itemForm.status}
              onChange={(e) => setItemForm({ ...itemForm, status: e.target.value })}
            >
              <option value={MenuItemStatus.ACTIVE}>Active</option>
              <option value={MenuItemStatus.INACTIVE}>Inactive (hidden)</option>
              <option value={MenuItemStatus.SOLD_OUT}>Sold Out</option>
            </select>
          </div>
          <Input
            label="Image URL"
            value={itemForm.imageUrl ?? ''}
            onChange={(e) => setItemForm({ ...itemForm, imageUrl: e.target.value })}
            placeholder="https://…"
            className="col-span-2"
          />
        </div>
        <div className="flex gap-3 pt-4 justify-end">
          <Button variant="secondary" onClick={() => setItemModal({ open: false })}>
            Cancel
          </Button>
          <Button
            onClick={() => saveItem.mutate(itemForm)}
            isLoading={saveItem.isPending}
            disabled={!itemForm.name || !itemForm.categoryId}
          >
            {itemModal.editing ? 'Update' : 'Create'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function UtensilsCrossedPlaceholder() {
  return (
    <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
  );
}
