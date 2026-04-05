'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { api } from '@/lib/api';
import { Order, PaymentMethod } from '@/lib/types';
import toast from 'react-hot-toast';

const PAYMENT_METHODS: { key: PaymentMethod; label: string }[] = [
  { key: PaymentMethod.CASH, label: '現金' },
  { key: PaymentMethod.CREDIT_CARD, label: '信用卡' },
  { key: PaymentMethod.LINE_PAY, label: 'Line Pay' },
  { key: PaymentMethod.JKOPAY, label: '街口支付' },
  { key: PaymentMethod.OTHER, label: '其他' },
];

export default function CheckoutPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [discountValue, setDiscountValue] = useState('');
  const [discountApplied, setDiscountApplied] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [cashReceived, setCashReceived] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  useEffect(() => {
    api.get<Order>(`/orders/${orderId}`)
      .then(setOrder)
      .catch(() => toast.error('無法載入訂單'))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-teal-600 border-t-transparent" />
      </div>
    );
  }
  if (!order) return <div className="p-8 text-center text-gray-500">訂單不存在</div>;

  const subtotal = order.subtotal ?? 0;
  const serviceCharge = Math.round(subtotal * 0.1);
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + serviceCharge + tax - discountApplied;
  const change = paymentMethod === PaymentMethod.CASH && cashReceived
    ? parseFloat(cashReceived) - total
    : 0;

  const applyDiscount = () => {
    const val = parseFloat(discountValue);
    if (isNaN(val) || val < 0) { toast.error('請輸入有效折扣'); return; }
    const amount = discountType === 'percent'
      ? Math.round(subtotal * val / 100)
      : val;
    setDiscountApplied(amount);
    toast.success(`已套用折扣 $${amount}`);
  };

  const handleCheckout = async () => {
    if (paymentMethod === PaymentMethod.CASH && parseFloat(cashReceived || '0') < total) {
      toast.error('收款金額不足');
      return;
    }
    setCheckoutLoading(true);
    try {
      const result = await api.post<Order>(`/orders/${orderId}/checkout`, {
        paymentMethod,
        cashReceived: paymentMethod === PaymentMethod.CASH ? parseFloat(cashReceived) : undefined,
        discountAmount: discountApplied,
        serviceCharge,
        taxAmount: tax,
        totalAmount: total,
      });
      setCompletedOrder(result);
      setReceiptOpen(true);
    } catch {
      toast.error('結帳失敗，請重試');
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="flex h-full gap-0">
      {/* Left: Bill summary */}
      <div className="flex-1 overflow-y-auto border-r bg-white p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">帳單明細</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-gray-500">
              <th className="text-left pb-2">品項</th>
              <th className="text-center pb-2">數量</th>
              <th className="text-right pb-2">單價</th>
              <th className="text-right pb-2">小計</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item) => (
              <tr key={item.id} className="border-b last:border-b-0">
                <td className="py-2 text-gray-700">{item.menuItemName ?? item.name}</td>
                <td className="py-2 text-center text-gray-600">{item.quantity}</td>
                <td className="py-2 text-right text-gray-600">${(item.unitPrice ?? item.price)?.toLocaleString()}</td>
                <td className="py-2 text-right font-medium">${item.subtotal?.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>小計</span><span>${subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>服務費 (10%)</span><span>${serviceCharge.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>稅 (5%)</span><span>${tax.toLocaleString()}</span>
          </div>
          {discountApplied > 0 && (
            <div className="flex justify-between text-green-600">
              <span>折扣</span><span>-${discountApplied.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-xl font-bold text-teal-600 border-t pt-2 mt-2">
            <span>總計</span><span>${total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Right: Payment */}
      <div className="w-80 flex flex-col bg-gray-50 p-6 gap-6">
        {/* Discount */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">折扣</h3>
          <div className="flex rounded-lg overflow-hidden border border-gray-300 mb-2">
            {(['percent', 'fixed'] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setDiscountType(t); setDiscountValue(''); }}
                className={`flex-1 py-1.5 text-sm font-medium transition-colors ${
                  discountType === t ? 'bg-teal-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t === 'percent' ? '百分比 %' : '固定金額 $'}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              placeholder={discountType === 'percent' ? '0-100' : '金額'}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <Button variant="outline" size="sm" onClick={applyDiscount}>套用</Button>
          </div>
        </div>

        {/* Payment method */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">付款方式</h3>
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_METHODS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setPaymentMethod(key)}
                className={[
                  'rounded-lg border py-3 text-sm font-medium transition-colors',
                  paymentMethod === key
                    ? 'bg-teal-600 border-teal-600 text-white'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-teal-400',
                ].join(' ')}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Cash change */}
        {paymentMethod === PaymentMethod.CASH && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">收款金額</h3>
            <input
              type="number"
              value={cashReceived}
              onChange={(e) => setCashReceived(e.target.value)}
              placeholder="輸入收款金額"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            {cashReceived && (
              <p className={`mt-1 text-sm font-medium ${change >= 0 ? 'text-teal-600' : 'text-red-500'}`}>
                找零：${change.toLocaleString()}
              </p>
            )}
          </div>
        )}

        <Button
          variant="primary"
          size="lg"
          className="mt-auto w-full"
          loading={checkoutLoading}
          onClick={handleCheckout}
        >
          完成結帳
        </Button>
      </div>

      {/* Receipt modal */}
      <Modal
        isOpen={receiptOpen}
        onClose={() => { setReceiptOpen(false); router.push('/pos/tables'); }}
        title="結帳完成"
        size="sm"
        footer={
          <Button variant="primary" onClick={() => { setReceiptOpen(false); router.push('/pos/tables'); }}>
            返回桌位
          </Button>
        }
      >
        <div className="text-center space-y-3">
          <div className="mx-auto h-16 w-16 rounded-full bg-teal-100 flex items-center justify-center">
            <svg className="h-8 w-8 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-gray-800">${total.toLocaleString()}</p>
          <p className="text-sm text-gray-500">
            {PAYMENT_METHODS.find((m) => m.key === paymentMethod)?.label}
            {paymentMethod === PaymentMethod.CASH && change >= 0 && ` · 找零 $${change.toLocaleString()}`}
          </p>
          <p className="text-xs text-gray-400">桌位已設為清理中</p>
        </div>
      </Modal>
    </div>
  );
}
