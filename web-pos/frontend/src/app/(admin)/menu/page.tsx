'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { menuApi, type CategoryRequest, type MenuItemRequest } from '@/lib/api'
import type { Category, MenuItem } from '@/lib/types'
import { MenuItemStatus } from '@/lib/types'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import MenuItemCard from '@/components/menu/MenuItemCard'

const STATUS_LABELS: Record<MenuItemStatus, string> = {
  [MenuItemStatus.ACTIVE]:   '上架',
  [MenuItemStatus.INACTIVE]: '下架',
  [MenuItemStatus.SOLD_OUT]: '售完',
}

const STATUS_BADGE: Record<MenuItemStatus, 'success' | 'secondary' | 'warning'> = {
  [MenuItemStatus.ACTIVE]:   'success',
  [MenuItemStatus.INACTIVE]: 'secondary',
  [MenuItemStatus.SOLD_OUT]: 'warning',
}

const EMPTY_ITEM: MenuItemRequest = {
  categoryId: '',
  name: '',
  description: '',
  price: 0,
  cost: 0,
  imageUrl: '',
  status: MenuItemStatus.ACTIVE,
  sortOrder: 0,
}

export default function MenuPage() {
  const qc = useQueryClient()
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [categoryModal, setCategoryModal] = useState<{ open: boolean; editing?: Category }>({ open: false })
  const [itemModal, setItemModal] = useState<{ open: boolean; editing?: MenuItem }>({ open: false })
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; item?: MenuItem }>({ open: false })
  const [categoryForm, setCategoryForm] = useState({ name: '', sortOrder: 0 })
  const [itemForm, setItemForm] = useState<MenuItemRequest>(EMPTY_ITEM)

  // ── Queries ──────────────────────────────────────────────────────────────────
  const { data: categories = [], isLoading: catsLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => menuApi.getCategories(),
  })

  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['menu-items', selectedCategoryId],
    queryFn: () => menuApi.getItems(selectedCategoryId ?? undefined),
  })

  // ── Category mutations ───────────────────────────────────────────────────────
  const saveCategory = useMutation({
    mutationFn: (data: CategoryRequest) =>
      categoryModal.editing
        ? menuApi.updateCategory(categoryModal.editing.id, data)
        : menuApi.createCategory(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      setCategoryModal({ open: false })
      toast.success(categoryModal.editing ? '類別已更新' : '類別已新增')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const deleteCategory = useMutation({
    mutationFn: menuApi.deleteCategory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      setSelectedCategoryId(null)
      toast.success('類別已刪除')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  // ── Item mutations ───────────────────────────────────────────────────────────
  const saveItem = useMutation({
    mutationFn: (data: MenuItemRequest) =>
      itemModal.editing
        ? menuApi.updateItem(itemModal.editing.id, data)
        : menuApi.createItem(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['menu-items'] })
      setItemModal({ open: false })
      toast.success(itemModal.editing ? '品項已更新' : '品項已新增')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const deleteItem = useMutation({
    mutationFn: menuApi.deleteItem,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['menu-items'] })
      setDeleteConfirm({ open: false })
      toast.success('品項已刪除')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const openCategoryModal = (cat?: Category) => {
    setCategoryForm(cat ? { name: cat.name, sortOrder: cat.sortOrder } : { name: '', sortOrder: categories.length })
    setCategoryModal({ open: true, editing: cat })
  }

  const openItemModal = (item?: MenuItem) => {
    if (item) {
      setItemForm({
        categoryId: item.categoryId,
        name: item.name,
        description: item.description ?? '',
        price: item.price,
        cost: 0,
        imageUrl: item.imageUrl ?? '',
        status: item.status,
        sortOrder: item.sortOrder,
      })
    } else {
      setItemForm({
        ...EMPTY_ITEM,
        categoryId: selectedCategoryId ?? categories[0]?.id ?? '',
        sortOrder: items.length,
      })
    }
    setItemModal({ open: true, editing: item })
  }

  return (
    <div className="p-6 h-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">菜單管理</h1>
        <Button onClick={() => openItemModal()}>+ 新增品項</Button>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Categories panel */}
        <aside className="w-52 shrink-0 flex flex-col gap-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">類別</span>
            <button
              onClick={() => openCategoryModal()}
              className="w-6 h-6 flex items-center justify-center rounded text-slate-400
                         hover:text-teal-600 hover:bg-teal-50 transition-colors"
              title="新增類別"
            >
              <span className="text-lg leading-none">+</span>
            </button>
          </div>

          {catsLoading && <div className="text-sm text-slate-400 py-2">載入中…</div>}

          {/* All */}
          <button
            onClick={() => setSelectedCategoryId(null)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategoryId === null
                ? 'bg-teal-100 text-teal-700'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            全部品項
          </button>

          {categories.map((cat) => (
            <div
              key={cat.id}
              className={`group flex items-center gap-1 px-3 py-2 rounded-lg cursor-pointer
                          transition-colors ${
                            selectedCategoryId === cat.id
                              ? 'bg-teal-100 text-teal-700'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
              onClick={() => setSelectedCategoryId(cat.id)}
            >
              <span className="flex-1 text-sm font-medium truncate">{cat.name}</span>
              <div className="hidden group-hover:flex gap-0.5">
                <button
                  onClick={(e) => { e.stopPropagation(); openCategoryModal(cat) }}
                  className="p-1 rounded text-slate-400 hover:text-teal-600"
                  title="編輯"
                >
                  <EditIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm(`確定刪除「${cat.name}」類別？`)) deleteCategory.mutate(cat.id)
                  }}
                  className="p-1 rounded text-slate-400 hover:text-red-600"
                  title="刪除"
                >
                  <TrashIcon className="w-3.5 h-3.5" />
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
              <p className="mt-2 text-lg">此類別尚無品項</p>
              <Button variant="secondary" className="mt-4" onClick={() => openItemModal()}>
                新增第一個品項
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map((item) => (
                <div key={item.id} className="relative group">
                  <MenuItemCard item={item} onClick={() => {}} />
                  {/* Hover actions */}
                  <div className="absolute top-2 right-2 hidden group-hover:flex gap-1">
                    <button
                      onClick={() => openItemModal(item)}
                      className="p-1.5 bg-white rounded-lg shadow text-slate-600 hover:text-teal-600"
                      title="編輯"
                    >
                      <EditIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm({ open: true, item })}
                      className="p-1.5 bg-white rounded-lg shadow text-slate-600 hover:text-red-600"
                      title="刪除"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {/* Status badge */}
                  <div className="absolute top-2 left-2">
                    <Badge variant={STATUS_BADGE[item.status]}>
                      {STATUS_LABELS[item.status]}
                    </Badge>
                  </div>
                  {/* Modifier count */}
                  {(item.modifiers?.length ?? 0) > 0 && (
                    <div className="absolute bottom-2 right-2 bg-slate-700 text-white text-xs
                                    rounded-full px-2 py-0.5">
                      {item.modifiers!.length} 加購
                    </div>
                  )}
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
        title={categoryModal.editing ? '編輯類別' : '新增類別'}
      >
        <div className="space-y-4">
          <Input
            label="類別名稱"
            value={categoryForm.name}
            onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
            placeholder="例：主餐、飲料"
          />
          <Input
            label="排序"
            type="number"
            value={String(categoryForm.sortOrder)}
            onChange={(e) => setCategoryForm({ ...categoryForm, sortOrder: Number(e.target.value) })}
          />
          <div className="flex gap-3 pt-2 justify-end">
            <Button variant="secondary" onClick={() => setCategoryModal({ open: false })}>取消</Button>
            <Button
              onClick={() => saveCategory.mutate(categoryForm)}
              isLoading={saveCategory.isPending}
              disabled={!categoryForm.name}
            >
              {categoryModal.editing ? '更新' : '新增'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Item Modal */}
      <Modal
        isOpen={itemModal.open}
        onClose={() => setItemModal({ open: false })}
        title={itemModal.editing ? '編輯品項' : '新增品項'}
        size="lg"
      >
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="品項名稱"
            value={itemForm.name}
            onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
            placeholder="例：招牌牛肉麵"
            className="col-span-2"
          />
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">描述</label>
            <textarea
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              rows={2}
              value={itemForm.description}
              onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
              placeholder="選填說明文字"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">類別</label>
            <select
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-teal-500"
              value={itemForm.categoryId}
              onChange={(e) => setItemForm({ ...itemForm, categoryId: e.target.value })}
            >
              <option value="">選擇類別</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">狀態</label>
            <select
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-teal-500"
              value={itemForm.status}
              onChange={(e) => setItemForm({ ...itemForm, status: e.target.value as MenuItemStatus })}
            >
              <option value={MenuItemStatus.ACTIVE}>上架</option>
              <option value={MenuItemStatus.INACTIVE}>下架</option>
              <option value={MenuItemStatus.SOLD_OUT}>售完</option>
            </select>
          </div>
          <Input
            label="售價（元）"
            type="number"
            value={String(itemForm.price)}
            onChange={(e) => setItemForm({ ...itemForm, price: Number(e.target.value) })}
          />
          <Input
            label="成本（元）"
            type="number"
            value={String(itemForm.cost ?? 0)}
            onChange={(e) => setItemForm({ ...itemForm, cost: Number(e.target.value) })}
          />
          <Input
            label="圖片網址"
            value={itemForm.imageUrl ?? ''}
            onChange={(e) => setItemForm({ ...itemForm, imageUrl: e.target.value })}
            placeholder="https://…"
            className="col-span-2"
          />
        </div>
        <div className="flex gap-3 pt-4 justify-end">
          <Button variant="secondary" onClick={() => setItemModal({ open: false })}>取消</Button>
          <Button
            onClick={() => saveItem.mutate(itemForm)}
            isLoading={saveItem.isPending}
            disabled={!itemForm.name || !itemForm.categoryId}
          >
            {itemModal.editing ? '更新' : '新增'}
          </Button>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false })}
        title="確認刪除"
      >
        <p className="text-slate-600 mb-6">
          確定要刪除「<strong>{deleteConfirm.item?.name}</strong>」嗎？此操作無法復原。
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setDeleteConfirm({ open: false })}>取消</Button>
          <Button
            variant="danger"
            onClick={() => deleteConfirm.item && deleteItem.mutate(deleteConfirm.item.id)}
            isLoading={deleteItem.isPending}
          >
            刪除
          </Button>
        </div>
      </Modal>
    </div>
  )
}

function EditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2
           2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  )
}
function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5
           7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  )
}
