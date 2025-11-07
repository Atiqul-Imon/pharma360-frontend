'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';
import {
  ArrowLeft,
  ClipboardList,
  Truck,
  Calendar,
  CheckCircle,
  AlertTriangle,
  FileText,
  Loader2,
  CircleDollarSign,
  CreditCard,
  DollarSign,
  XCircle,
} from 'lucide-react';

interface PurchaseDetail {
  _id: string;
  purchaseOrderNumber: string;
  supplierInvoiceNumber?: string;
  supplierId: {
    _id: string;
    companyName: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  orderDate: string;
  expectedDeliveryDate?: string;
  receivedDate?: string;
  subtotal: number;
  discount: number;
  tax: number;
  grandTotal: number;
  amountPaid: number;
  dueAmount: number;
  status: string;
  paymentStatus: string;
  notes?: string;
  payments: Array<{
    amount: number;
    paymentMethod: string;
    paidAt: string;
    reference?: string;
    note?: string;
  }>;
  items: Array<{
    medicineId: string;
    medicineName: string;
    batchNumber: string;
    quantity: number;
    receivedQuantity: number;
    freeQuantity: number;
    receivedFreeQuantity: number;
    purchasePrice: number;
    sellingPrice: number;
    mrp: number;
    expiryDate: string;
    total: number;
  }>;
}

export default function PurchaseDetailsPage() {
  const params = useParams();
  const purchaseId = params?.id as string;

  const [purchase, setPurchase] = useState<PurchaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [receiveFormOpen, setReceiveFormOpen] = useState(false);
  const [receiveDate, setReceiveDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [receiveNotes, setReceiveNotes] = useState('');
  const [receiveLoading, setReceiveLoading] = useState(false);

  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);

  const [cancelLoading, setCancelLoading] = useState(false);

  const loadPurchase = async () => {
    try {
      setLoading(true);
      const response = await api.getPurchaseById(purchaseId);
      setPurchase(response.data);
      setError(null);
    } catch (err) {
      console.error('Failed to load purchase', err);
      setError('Unable to load purchase order. It may have been removed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (purchaseId) {
      loadPurchase();
    }
  }, [purchaseId]);

  const handleReceivePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setReceiveLoading(true);
    try {
      await api.receivePurchase(purchaseId, {
        receivedDate: receiveDate,
        notes: receiveNotes || undefined,
      });
      await loadPurchase();
      setReceiveFormOpen(false);
      setReceiveNotes('');
    } catch (err: any) {
      console.error('Failed to receive purchase', err);
      alert(
        err.response?.data?.error?.message ||
          'Unable to mark purchase as received. Please try again.'
      );
    } finally {
      setReceiveLoading(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) {
      alert('Enter a valid payment amount.');
      return;
    }
    setPaymentLoading(true);
    try {
      await api.recordPurchasePayment(purchaseId, {
        amount,
        paymentMethod,
        reference: paymentReference || undefined,
        note: paymentNote || undefined,
      });
      await loadPurchase();
      setPaymentAmount('');
      setPaymentReference('');
      setPaymentNote('');
    } catch (err: any) {
      console.error('Failed to record payment', err);
      alert(
        err.response?.data?.error?.message ||
          'Unable to record payment. Please check the amount and try again.'
      );
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleCancelPurchase = async () => {
    if (!window.confirm('Cancel this purchase order? This action cannot be undone.')) {
      return;
    }
    setCancelLoading(true);
    try {
      await api.cancelPurchase(purchaseId, { reason: 'Cancelled from dashboard' });
      await loadPurchase();
    } catch (err: any) {
      console.error('Failed to cancel purchase', err);
      alert(
        err.response?.data?.error?.message ||
          'Unable to cancel purchase order. Orders that are already received cannot be cancelled.'
      );
    } finally {
      setCancelLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading purchase order...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !purchase) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="card border border-red-200 bg-red-50 text-red-700">
            <div className="flex items-center gap-3">
              <XCircle size={24} />
              <div>
                <h2 className="text-lg font-semibold">Purchase not available</h2>
                <p className="text-sm">{error}</p>
                <Link href="/purchases" className="btn btn-secondary mt-4 inline-flex items-center gap-2">
                  <ArrowLeft size={18} />
                  Back to purchases
                </Link>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const canReceive = purchase.status === 'ordered';
  const canRecordPayment = purchase.paymentStatus !== 'paid' && purchase.dueAmount > 0;
  const canCancel = purchase.status === 'ordered';

  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/purchases" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
              <ArrowLeft size={20} />
              Back to purchase orders
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">{purchase.purchaseOrderNumber}</h1>
            <p className="text-gray-600 mt-2">
              {purchase.supplierInvoiceNumber
                ? `Supplier invoice: ${purchase.supplierInvoiceNumber}`
                : 'Awaiting supplier invoice'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {canCancel && (
              <button
                onClick={handleCancelPurchase}
                disabled={cancelLoading}
                className="btn btn-secondary flex items-center gap-2 text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelLoading ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                Cancel Order
              </button>
            )}
            {canReceive && (
              <button
                onClick={() => setReceiveFormOpen((prev) => !prev)}
                className="btn btn-primary flex items-center gap-2"
              >
                <CheckCircle size={18} />
                Mark as Received
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center gap-3">
              <Truck className="text-primary-600" size={20} />
              <div>
                <p className="text-sm text-gray-600">Supplier</p>
                <p className="font-semibold text-gray-900">{purchase.supplierId?.companyName}</p>
                {purchase.supplierId?.phone && (
                  <p className="text-sm text-gray-600">{purchase.supplierId.phone}</p>
                )}
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <Calendar className="text-primary-600" size={20} />
              <div>
                <p className="text-sm text-gray-600">Order Date</p>
                <p className="font-semibold text-gray-900">
                  {new Date(purchase.orderDate).toLocaleDateString()}
                </p>
                <p className="text-xs text-gray-500">
                  {purchase.expectedDeliveryDate
                    ? `Expected: ${new Date(purchase.expectedDeliveryDate).toLocaleDateString()}`
                    : 'Expected date not set'}
                </p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <DollarSign className="text-green-600" size={20} />
              <div>
                <p className="text-sm text-gray-600">Grand Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  ৳ {purchase.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500">
                  Subtotal ৳ {purchase.subtotal.toLocaleString('en-US')} • Discount ৳{' '}
                  {purchase.discount.toLocaleString('en-US')} • Tax ৳{' '}
                  {purchase.tax.toLocaleString('en-US')}
                </p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <CircleDollarSign className="text-orange-600" size={20} />
              <div>
                <p className="text-sm text-gray-600">Outstanding Due</p>
                <p className="text-2xl font-bold text-orange-600">
                  ৳ {purchase.dueAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500">
                  Payment status: {purchase.paymentStatus.toUpperCase()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {receiveFormOpen && canReceive && (
          <div className="card border border-green-200 bg-green-50">
            <form onSubmit={handleReceivePurchase} className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="text-green-600" size={20} />
                <h2 className="text-lg font-semibold text-green-800">Receive Purchase Order</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Received Date</label>
                  <input
                    type="date"
                    value={receiveDate}
                    onChange={(e) => setReceiveDate(e.target.value)}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes (optional)</label>
                  <input
                    type="text"
                    value={receiveNotes}
                    onChange={(e) => setReceiveNotes(e.target.value)}
                    className="input"
                    placeholder="Reference GRN number or remarks"
                  />
                </div>
              </div>
              <p className="text-sm text-green-800">
                Stock quantities and supplier ledger will update immediately after confirming receipt.
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={receiveLoading}
                  className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {receiveLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      Confirm Receipt
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setReceiveFormOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Line Items</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Medicine</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Batch</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Ordered Qty</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Received Qty</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Purchase Price</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">MRP</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Selling Price</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Expiry</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Total</th>
                </tr>
              </thead>
              <tbody>
                {purchase.items.map((item, index) => (
                  <tr key={`${item.medicineId}-${item.batchNumber}-${index}`} className="border-b border-gray-100">
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-900">{item.medicineName}</p>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{item.batchNumber}</td>
                    <td className="py-3 px-4 text-gray-600">
                      {item.quantity} (+{item.freeQuantity} free)
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {item.receivedQuantity} (+{item.receivedFreeQuantity} free)
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      ৳ {item.purchasePrice.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      ৳ {item.mrp.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      ৳ {item.sellingPrice.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {new Date(item.expiryDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      ৳ {item.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Payments</h2>
            {canRecordPayment && (
              <p className="text-sm text-gray-600">
                Outstanding: ৳ {purchase.dueAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            )}
          </div>

          <div className="space-y-6">
            {purchase.payments && purchase.payments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Paid At</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Method</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Reference</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchase.payments.map((payment, idx) => (
                      <tr key={`${payment.amount}-${payment.paidAt}-${idx}`} className="border-b border-gray-100">
                        <td className="py-3 px-4 text-gray-600">
                          {new Date(payment.paidAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          ৳ {payment.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-gray-600">{payment.paymentMethod.toUpperCase()}</td>
                        <td className="py-3 px-4 text-gray-600">{payment.reference || '-'}</td>
                        <td className="py-3 px-4 text-gray-600">{payment.note || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg text-center text-gray-600">
                No payments recorded yet.
              </div>
            )}

            {canRecordPayment && (
              <form
                onSubmit={handleRecordPayment}
                className="p-4 border border-primary-200 rounded-lg bg-primary-50 space-y-4"
              >
                <div className="flex items-center gap-3">
                  <CreditCard size={18} className="text-primary-600" />
                  <h3 className="text-sm font-semibold text-primary-700">
                    Record supplier payment
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Amount *</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Method *</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="input"
                    >
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="mobile_banking">Mobile Banking</option>
                      <option value="credit">Credit</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reference (optional)
                    </label>
                    <input
                      type="text"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Note (optional)
                    </label>
                    <input
                      type="text"
                      value={paymentNote}
                      onChange={(e) => setPaymentNote(e.target.value)}
                      className="input"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={paymentLoading}
                    className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {paymentLoading ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        Recording...
                      </>
                    ) : (
                      <>
                        <DollarSign size={18} />
                        Record Payment
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Audit Trail</h2>
          <div className="text-sm text-gray-700 space-y-2">
            <div className="flex items-start gap-3">
              <FileText size={16} className="mt-1 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">Status Timeline</p>
                <p>
                  Current status:{' '}
                  <span className="font-semibold">{purchase.status.toUpperCase()}</span> • Payment status:{' '}
                  <span className="font-semibold">{purchase.paymentStatus.toUpperCase()}</span>
                </p>
                {purchase.receivedDate && (
                  <p>Goods received on {new Date(purchase.receivedDate).toLocaleString()}</p>
                )}
              </div>
            </div>
            {purchase.notes && (
              <div className="flex items-start gap-3">
                <AlertTriangle size={16} className="mt-1 text-orange-500" />
                <div>
                  <p className="font-medium text-gray-900">Internal Notes</p>
                  <p>{purchase.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}


