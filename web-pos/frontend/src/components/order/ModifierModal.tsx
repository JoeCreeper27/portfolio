'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { MenuItem, Modifier, ModifierOption } from '@/lib/types';

interface ModifierModalProps {
  isOpen: boolean;
  item: MenuItem | null;
  modifiers: Modifier[];
  onConfirm: (selections: ModifierOption[], quantity: number, note: string) => void;
  onCancel: () => void;
}

export default function ModifierModal({ isOpen, item, modifiers, onConfirm, onCancel }: ModifierModalProps) {
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setSelections({});
      setQuantity(1);
      setNote('');
      setErrors({});
    }
  }, [isOpen, item]);

  if (!item) return null;

  const toggleOption = (modifier: Modifier, optionId: string) => {
    setSelections((prev) => {
      const current = prev[modifier.id] ?? [];
      if (modifier.multiSelect || modifier.isMultiple) {
        return {
          ...prev,
          [modifier.id]: current.includes(optionId)
            ? current.filter((id) => id !== optionId)
            : [...current, optionId],
        };
      }
      return { ...prev, [modifier.id]: [optionId] };
    });
    setErrors((prev) => ({ ...prev, [modifier.id]: '' }));
  };

  const handleConfirm = () => {
    const newErrors: Record<string, string> = {};
    modifiers.forEach((mod) => {
      if ((mod.required || mod.isRequired) && (!selections[mod.id] || selections[mod.id].length === 0)) {
        newErrors[mod.id] = `請選擇${mod.name}`;
      }
    });
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const selectedOptions: ModifierOption[] = [];
    modifiers.forEach((mod) => {
      const selectedIds = selections[mod.id] ?? [];
      selectedIds.forEach((optId) => {
        const opt = mod.options?.find((o) => o.id === optId);
        if (opt) selectedOptions.push(opt);
      });
    });

    onConfirm(selectedOptions, quantity, note);
  };

  const extraCost = Object.entries(selections).reduce((total, [modId, optIds]) => {
    const mod = modifiers.find((m) => m.id === modId);
    if (!mod) return total;
    return total + optIds.reduce((sum, optId) => {
      const opt = mod.options?.find((o) => o.id === optId);
      return sum + (opt?.additionalPrice ?? opt?.priceAdjustment ?? 0);
    }, 0);
  }, 0);

  const unitPrice = item.price + extraCost;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={item.name}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>取消</Button>
          <Button variant="primary" onClick={handleConfirm}>
            加入購物車 — ${(unitPrice * quantity).toLocaleString()}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {modifiers.map((mod) => (
          <div key={mod.id}>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium text-gray-800">{mod.name}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${(mod.required || mod.isRequired) ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                {(mod.required || mod.isRequired) ? '必選' : '選填'}
              </span>
              {(mod.multiSelect || mod.isMultiple) && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600">多選</span>
              )}
            </div>
            {errors[mod.id] && (
              <p className="text-xs text-red-500 mb-1">{errors[mod.id]}</p>
            )}
            <div className="space-y-1.5">
              {mod.options?.map((opt) => {
                const isSelected = (selections[mod.id] ?? []).includes(opt.id);
                return (
                  <label
                    key={opt.id}
                    className={[
                      'flex items-center justify-between gap-3 rounded-lg border px-3 py-2 cursor-pointer',
                      'transition-colors duration-100',
                      isSelected ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300',
                    ].join(' ')}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type={mod.isMultiple ? 'checkbox' : 'radio'}
                        name={mod.id}
                        checked={isSelected}
                        onChange={() => toggleOption(mod, opt.id)}
                        className="accent-teal-600"
                      />
                      <span className="text-sm text-gray-700">{opt.name}</span>
                    </div>
                    {(opt.additionalPrice ?? opt.priceAdjustment ?? 0) > 0 && (
                      <span className="text-sm text-teal-600 font-medium">+${opt.additionalPrice ?? opt.priceAdjustment}</span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        ))}

        {/* Note */}
        <div>
          <label className="text-sm font-medium text-gray-700">備註</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="特殊需求、過敏等"
            rows={2}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
          />
        </div>

        {/* Quantity */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">數量</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="h-8 w-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors"
            >
              −
            </button>
            <span className="w-8 text-center font-semibold">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => Math.min(99, q + 1))}
              className="h-8 w-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
