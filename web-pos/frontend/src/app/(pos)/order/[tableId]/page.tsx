'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, ShoppingCart, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { menuApi, orderApi } from '@/lib/api';
import { MenuItemStatus } from '@/lib/types';
import type { MenuItem, ModifierOption } from '@/lib/types';
import { useOrderStore } from '@/store/useOrderStore';
import MenuItemCard from '@/components/menu/MenuItemCard';
import CategoryTab from '@/components/menu/CategoryTab';
import CartItem from '@/components/order/CartItem';
import ModifierModal from '@/components/order/ModifierModal';

export default function OrderPage() {
  const { tableId } = useParams<{ tableId: string }>();
  const router = useRouter();
  const { tableName, items, addItem, removeItem, updateQuantity, clearOrder, getTotal, setOrderId } = useOrderStore();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [modifierTarget, setModifierTarget] = useState<MenuItem | null>(null);

  // Fetch categories and items
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: menuApi.getCategories });
  const { data: menuItems = [] } = useQuery({
    queryKey: ['menu-items', selectedCategoryId],
    queryFn: () => menuApi.getItems(selectedCategoryId ?? undefined),
  });

  const activeItems = menuItems.filter((i) => i.status !== MenuItemStatus.INACTIVE);

  const submitOrder = useMutation({
    mutationFn: () =>
      orderApi.createOrder({
        tableId,
        guestCount: 1,
        items: items.map((ci) => ({
          menuItemId: ci.menuItem.id,
          quantity: ci.quantity,
          note: ci.note,
          mods: ci.modifiers.map((m) => ({
            modifierId: m.modifierId,
            modifierName: m.modifierId, // will be resolved by backend
            optionId: m.id,
            optionName: m.name,
            priceAdjustment: m.priceAdjustment,
          })),
        })),
      }),
    onSuccess: (order) => {
      setOrderId(order.id);
      toast.success('Order sent to kitchen!');
      router.push(`/pos/checkout/${order.id}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleMenuItemClick = (item: MenuItem) => {
    if (item.status === MenuItemStatus.SOLD_OUT) {
      toast.error(`${item.name} is sold out`);
      return;
    }
    if (item.modifiers && item.modifiers.length > 0) {
      setModifierTarget(item);
    } else {
      addItem(item, 1, [], '');
      toast.success(`Added ${item.name}`);
    }
  };

  const handleModifierConfirm = (mods: ModifierOption[], note: string) => {
    if (!modifierTarget) return;
    addItem(modifierTarget, 1, mods, note);
    toast.success(`Added ${modifierTarget.name}`);
    setModifierTarget(null);
  };

  const total = getTotal();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200 shrink-0">
        <button
          onClick={() => { clearOrder(); router.back(); }}
          className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-bold text-slate-800">Table {tableName ?? tableId}</h1>
          <p className="text-xs text-slate-500">{items.length} item types · {items.reduce((s, i) => s + i.quantity, 0)} pieces</p>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Left: category tabs + menu items */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Category tabs */}
          <div className="flex gap-2 px-3 py-2 bg-white border-b border-slate-100 overflow-x-auto shrink-0">
            <CategoryTab
              label="All"
              isActive={selectedCategoryId === null}
              onClick={() => setSelectedCategoryId(null)}
            />
            {categories.map((cat) => (
              <CategoryTab
                key={cat.id}
                label={cat.name}
                isActive={selectedCategoryId === cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
              />
            ))}
          </div>

          {/* Menu item grid */}
          <div className="flex-1 overflow-y-auto p-3">
            <div className="pos-grid">
              {activeItems.map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  onClick={() => handleMenuItemClick(item)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right: cart panel */}
        <aside className="w-72 shrink-0 bg-white border-l border-slate-200 flex flex-col">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 shrink-0">
            <ShoppingCart className="w-4 h-4 text-primary-600" />
            <h2 className="font-semibold text-slate-700 text-sm">Order</h2>
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                <ShoppingCart className="w-8 h-8" />
                <p className="text-sm">Tap items to add</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {items.map((item, idx) => (
                  <CartItem
                    key={idx}
                    item={item}
                    onRemove={() => removeItem(idx)}
                    onQuantityChange={(q) => updateQuantity(idx, q)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer: total + submit */}
          <div className="p-4 border-t border-slate-200 shrink-0 space-y-3">
            <div className="flex justify-between font-semibold text-slate-800">
              <span>Total</span>
              <span>NT${(total / 100).toFixed(0)}</span>
            </div>
            <button
              onClick={() => submitOrder.mutate()}
              disabled={items.length === 0 || submitOrder.isPending}
              className="w-full flex items-center justify-center gap-2 h-11 bg-primary-500 hover:bg-primary-600
                text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {submitOrder.isPending ? 'Sending…' : 'Send to Kitchen'}
            </button>
          </div>
        </aside>
      </div>

      {/* Modifier Modal */}
      {modifierTarget && (
        <ModifierModal
          item={modifierTarget}
          onConfirm={handleModifierConfirm}
          onClose={() => setModifierTarget(null)}
        />
      )}
    </div>
  );
}
