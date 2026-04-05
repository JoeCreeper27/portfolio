import { create } from 'zustand'
import type { MenuItem, ModifierOption } from '@/lib/types'

export interface CartItem {
  menuItem: MenuItem
  quantity: number
  modifiers: ModifierOption[]
  note: string
}

interface OrderState {
  tableId: string | null
  tableName: string | null
  orderId: string | null
  items: CartItem[]

  // Actions
  setTable: (tableId: string, tableName: string) => void
  setOrderId: (orderId: string) => void
  addItem: (item: MenuItem, quantity: number, modifiers: ModifierOption[], note: string) => void
  removeItem: (index: number) => void
  updateQuantity: (index: number, quantity: number) => void
  clearOrder: () => void

  // Computed
  getTotal: () => number
}

/** Calculate the price for one CartItem line (base price + modifiers) * quantity */
function lineTotal(item: CartItem): number {
  const modAdj = item.modifiers.reduce((sum, m) => sum + m.priceAdjustment, 0)
  return (item.menuItem.price + modAdj) * item.quantity
}

/** Key used to detect duplicate cart entries */
function itemKey(menuItemId: string, modifiers: ModifierOption[], note: string): string {
  const modIds = modifiers
    .map((m) => m.id)
    .sort()
    .join(',')
  return `${menuItemId}::${modIds}::${note}`
}

export const useOrderStore = create<OrderState>()((set, get) => ({
  tableId: null,
  tableName: null,
  orderId: null,
  items: [],

  setTable: (tableId, tableName) => set({ tableId, tableName }),

  setOrderId: (orderId) => set({ orderId }),

  addItem: (menuItem, quantity, modifiers, note) => {
    const key = itemKey(menuItem.id, modifiers, note)
    set((state) => {
      const existingIdx = state.items.findIndex(
        (i) => itemKey(i.menuItem.id, i.modifiers, i.note) === key,
      )
      if (existingIdx >= 0) {
        const updated = [...state.items]
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: updated[existingIdx].quantity + quantity,
        }
        return { items: updated }
      }
      return { items: [...state.items, { menuItem, quantity, modifiers, note }] }
    })
  },

  removeItem: (index) =>
    set((state) => ({ items: state.items.filter((_, i) => i !== index) })),

  updateQuantity: (index, quantity) => {
    if (quantity <= 0) {
      get().removeItem(index)
      return
    }
    set((state) => {
      const updated = [...state.items]
      updated[index] = { ...updated[index], quantity }
      return { items: updated }
    })
  },

  clearOrder: () =>
    set({ tableId: null, tableName: null, orderId: null, items: [] }),

  getTotal: () => get().items.reduce((sum, item) => sum + lineTotal(item), 0),
}))
