'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  Calendar,
  Banknote,
  ClipboardList,
} from 'lucide-react';

interface SupplierOption {
  _id: string;
  companyName: string;
  phone?: string;
}

interface MedicineOption {
  _id: string;
  name: string;
  genericName: string;
  manufacturer?: string;
  defaultSellingPrice?: number;
}

interface PurchaseItemDraft {
  medicineId: string;
  medicineName: string;
  batchNumber: string;
  quantity: string;
  freeQuantity: string;
  purchasePrice: string;
  sellingPrice: string;
  mrp: string;
  expiryDate: string;
  alertThreshold: string;
}

export default function CreatePurchasePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supplierPrefill = searchParams?.get('supplierId') || '';

  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [supplierId, setSupplierId] = useState(supplierPrefill);
  const [supplierLoading, setSupplierLoading] = useState(false);

  const [items, setItems] = useState<PurchaseItemDraft[]>([]);
  const [itemDraft, setItemDraft] = useState<PurchaseItemDraft>({
    medicineId: '',
    medicineName: '',
    batchNumber: '',
    quantity: '',
    freeQuantity: '0',
    purchasePrice: '',
    sellingPrice: '',
    mrp: '',
    expiryDate: '',
    alertThreshold: '',
  });
  const [medicineResults, setMedicineResults] = useState<MedicineOption[]>([]);
  const [searchingMedicine, setSearchingMedicine] = useState(false);

  const [orderDate, setOrderDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState('');
  const [discount, setDiscount] = useState('0');
  const [tax, setTax] = useState('0');
  const [amountPaid, setAmountPaid] = useState('0');
  const [initialPaymentMethod, setInitialPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.purchasePrice) || 0;
      return sum + qty * price;
    }, 0);
  }, [items]);

  const discountValue = Number(discount) || 0;
  const taxValue = Number(tax) || 0;
  const grandTotal = Math.max(0, subtotal - discountValue + taxValue);
  const amountPaidValue = Number(amountPaid) || 0;
  const dueAmount = Math.max(0, grandTotal - amountPaidValue);

  const fetchSuppliers = async () => {
    try {
      setSupplierLoading(true);
      const response = await api.getSuppliers({ limit: 100, isActive: true });
      setSuppliers(response.data || []);
    } catch (err) {
      console.error('Failed to load suppliers', err);
    } finally {
      setSupplierLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleMedicineSearch = async (value: string) => {
    setItemDraft((prev) => ({ ...prev, medicineName: value }));
    if (value.trim().length < 2) {
      setMedicineResults([]);
      return;
    }

    try {
      setSearchingMedicine(true);
      const response = await api.searchMedicines(value.trim(), 10);
      setMedicineResults(response.data || []);
    } catch (err) {
      console.error('Failed to search medicines', err);
    } finally {
      setSearchingMedicine(false);
    }
  };

  const handleSelectMedicine = (medicine: MedicineOption) => {
    setItemDraft((prev) => ({
      ...prev,
      medicineId: medicine._id,
      medicineName: medicine.name,
      sellingPrice: medicine.defaultSellingPrice
        ? String(medicine.defaultSellingPrice)
        : prev.sellingPrice,
    }));
    setMedicineResults([]);
  };

  const resetItemDraft = () => {
    setItemDraft({
      medicineId: '',
      medicineName: '',
      batchNumber: '',
      quantity: '',
      freeQuantity: '0',
      purchasePrice: '',
      sellingPrice: '',
      mrp: '',
      expiryDate: '',
      alertThreshold: '',
    });
    setMedicineResults([]);
  };

  const handleAddItem = () => {
    const draftErrors: Record<string, string> = {};
    if (!itemDraft.medicineId) draftErrors.medicineId = 'Select a medicine';
    if (!itemDraft.batchNumber.trim()) draftErrors.batchNumber = 'Batch number required';
    if (!itemDraft.quantity || Number(itemDraft.quantity) <= 0) {
      draftErrors.quantity = 'Quantity must be greater than zero';
    }
    if (!itemDraft.purchasePrice || Number(itemDraft.purchasePrice) < 0) {
      draftErrors.purchasePrice = 'Purchase price is required';
    }
    if (!itemDraft.sellingPrice || Number(itemDraft.sellingPrice) < 0) {
      draftErrors.sellingPrice = 'Selling price is required';
    }
    if (!itemDraft.mrp || Number(itemDraft.mrp) < 0) {
      draftErrors.mrp = 'MRP is required';
    }
    if (!itemDraft.expiryDate) {
      draftErrors.expiryDate = 'Expiry date required';
    }

    if (Object.keys(draftErrors).length > 0) {
      setErrors(draftErrors);
      return;
    }

    setItems((prev) => [...prev, itemDraft]);
    resetItemDraft();
    setErrors({});
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!supplierId) {
      setErrors({ supplierId: 'Supplier is required' });
      return;
    }

    if (items.length === 0) {
      setErrors({ items: 'Add at least one medicine to the purchase order' });
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      await api.createPurchase({
        supplierId,
        supplierInvoiceNumber: supplierInvoiceNumber || undefined,
        orderDate,
        expectedDeliveryDate: expectedDeliveryDate || undefined,
        discount: Number(discount) || 0,
        tax: Number(tax) || 0,
        amountPaid: amountPaidValue,
        initialPaymentMethod: amountPaidValue > 0 ? initialPaymentMethod : undefined,
        notes: notes || undefined,
        items: items.map((item) => ({
          medicineId: item.medicineId,
          batchNumber: item.batchNumber.trim(),
          quantity: Number(item.quantity) || 0,
          freeQuantity: Number(item.freeQuantity) || 0,
          purchasePrice: Number(item.purchasePrice) || 0,
          sellingPrice: Number(item.sellingPrice) || 0,
          mrp: Number(item.mrp) || 0,
          expiryDate: item.expiryDate,
          alertThreshold: item.alertThreshold ? Number(item.alertThreshold) : undefined,
          notes: undefined,
        })),
      });

      router.push('/purchases');
    } catch (error: any) {
      if (error.response?.data?.error?.details) {
        setErrors(error.response.data.error.details);
      } else {
        setErrors({
          general:
            error.response?.data?.error?.message ||
            'Unable to create purchase order. Please review the inputs.',
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8 max-w-5xl mx-auto space-y-6">
        <div>
          <Link href="/purchases" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft size={20} />
            Back to Purchase Orders
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Create Purchase Order</h1>
          <p className="text-gray-600 mt-2">
            Capture supplier commitments, batch details, and payment terms to maintain reliable stock coverage.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {errors.general}
            </div>
          )}

          <div className="card space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <ClipboardList size={18} />
              Order Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="supplierId" className="block text-sm font-medium text-gray-700 mb-2">
                  Supplier *
                </label>
                <select
                  id="supplierId"
                  value={supplierId}
                  onChange={(e) => {
                    setSupplierId(e.target.value);
                    if (errors.supplierId) {
                      setErrors((prev) => ({ ...prev, supplierId: '' }));
                    }
                  }}
                  className={`input ${errors.supplierId ? 'border-red-500' : ''}`}
                  disabled={supplierLoading}
                >
                  <option value="">{supplierLoading ? 'Loading suppliers...' : 'Select supplier'}</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier._id} value={supplier._id}>
                      {supplier.companyName}
                      {supplier.phone ? ` (${supplier.phone})` : ''}
                    </option>
                  ))}
                </select>
                {errors.supplierId && <p className="mt-1 text-sm text-red-600">{errors.supplierId}</p>}
              </div>

              <div>
                <label htmlFor="supplierInvoiceNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Supplier Invoice (optional)
                </label>
                <input
                  id="supplierInvoiceNumber"
                  type="text"
                  value={supplierInvoiceNumber}
                  onChange={(e) => setSupplierInvoiceNumber(e.target.value)}
                  className="input"
                  placeholder="Reference number from supplier"
                />
              </div>

              <div>
                <label htmlFor="orderDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Order Date *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    id="orderDate"
                    type="date"
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    className="input pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="expectedDeliveryDate"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Expected Delivery (optional)
                </label>
                <input
                  id="expectedDeliveryDate"
                  type="date"
                  value={expectedDeliveryDate}
                  onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                  className="input"
                />
              </div>
            </div>
          </div>

          <div className="card space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Banknote size={18} />
              Line Items
            </h2>

            {errors.items && <p className="text-sm text-red-600">{errors.items}</p>}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Medicine *</label>
                <input
                  type="text"
                  value={itemDraft.medicineName}
                  onChange={(e) => handleMedicineSearch(e.target.value)}
                  placeholder="Search medicine name or barcode"
                  className={`input ${errors.medicineId ? 'border-red-500' : ''}`}
                />
                {errors.medicineId && <p className="mt-1 text-sm text-red-600">{errors.medicineId}</p>}
                {searchingMedicine && (
                  <p className="text-xs text-gray-500 mt-1">Searching medicines...</p>
                )}
                {medicineResults.length > 0 && (
                  <div className="mt-2 border border-gray-200 rounded-lg max-h-48 overflow-y-auto bg-white shadow-lg z-10">
                    {medicineResults.map((medicine) => (
                      <button
                        type="button"
                        key={medicine._id}
                        onClick={() => handleSelectMedicine(medicine)}
                        className="w-full text-left px-4 py-2 hover:bg-primary-50"
                      >
                        <p className="font-medium text-gray-900">{medicine.name}</p>
                        <p className="text-xs text-gray-500">
                          {medicine.genericName}
                          {medicine.manufacturer ? ` • ${medicine.manufacturer}` : ''}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Batch Number *</label>
                <input
                  type="text"
                  value={itemDraft.batchNumber}
                  onChange={(e) => setItemDraft((prev) => ({ ...prev, batchNumber: e.target.value }))}
                  className={`input ${errors.batchNumber ? 'border-red-500' : ''}`}
                />
                {errors.batchNumber && <p className="mt-1 text-sm text-red-600">{errors.batchNumber}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
                <input
                  type="number"
                  min="0"
                  value={itemDraft.quantity}
                  onChange={(e) => setItemDraft((prev) => ({ ...prev, quantity: e.target.value }))}
                  className={`input ${errors.quantity ? 'border-red-500' : ''}`}
                />
                {errors.quantity && <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Free Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={itemDraft.freeQuantity}
                  onChange={(e) => setItemDraft((prev) => ({ ...prev, freeQuantity: e.target.value }))}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Purchase Price *</label>
                <input
                  type="number"
                  min="0"
                  value={itemDraft.purchasePrice}
                  onChange={(e) =>
                    setItemDraft((prev) => ({ ...prev, purchasePrice: e.target.value }))
                  }
                  className={`input ${errors.purchasePrice ? 'border-red-500' : ''}`}
                />
                {errors.purchasePrice && (
                  <p className="mt-1 text-sm text-red-600">{errors.purchasePrice}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Selling Price *</label>
                <input
                  type="number"
                  min="0"
                  value={itemDraft.sellingPrice}
                  onChange={(e) =>
                    setItemDraft((prev) => ({ ...prev, sellingPrice: e.target.value }))
                  }
                  className={`input ${errors.sellingPrice ? 'border-red-500' : ''}`}
                />
                {errors.sellingPrice && (
                  <p className="mt-1 text-sm text-red-600">{errors.sellingPrice}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">MRP *</label>
                <input
                  type="number"
                  min="0"
                  value={itemDraft.mrp}
                  onChange={(e) => setItemDraft((prev) => ({ ...prev, mrp: e.target.value }))}
                  className={`input ${errors.mrp ? 'border-red-500' : ''}`}
                />
                {errors.mrp && <p className="mt-1 text-sm text-red-600">{errors.mrp}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date *</label>
                <input
                  type="date"
                  value={itemDraft.expiryDate}
                  onChange={(e) => setItemDraft((prev) => ({ ...prev, expiryDate: e.target.value }))}
                  className={`input ${errors.expiryDate ? 'border-red-500' : ''}`}
                />
                {errors.expiryDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.expiryDate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alert Threshold (optional)
                </label>
                <input
                  type="number"
                  min="0"
                  value={itemDraft.alertThreshold}
                  onChange={(e) =>
                    setItemDraft((prev) => ({ ...prev, alertThreshold: e.target.value }))
                  }
                  className="input"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleAddItem}
                className="btn btn-primary flex items-center gap-2"
              >
                <Plus size={18} />
                Add item
              </button>
              <button
                type="button"
                onClick={resetItemDraft}
                className="btn btn-secondary"
              >
                Clear
              </button>
            </div>

            {items.length > 0 && (
              <div className="mt-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Medicine</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Batch</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Qty</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Free</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Purchase Price</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">MRP</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Selling Price</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Expiry</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={`${item.medicineId}-${index}`} className="border-b border-gray-100">
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-900">{item.medicineName}</p>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{item.batchNumber}</td>
                        <td className="py-3 px-4 text-gray-600">{item.quantity}</td>
                        <td className="py-3 px-4 text-gray-600">{item.freeQuantity}</td>
                        <td className="py-3 px-4 text-gray-600">৳ {Number(item.purchasePrice).toFixed(2)}</td>
                        <td className="py-3 px-4 text-gray-600">৳ {Number(item.mrp).toFixed(2)}</td>
                        <td className="py-3 px-4 text-gray-600">
                          ৳ {Number(item.sellingPrice).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {new Date(item.expiryDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="text-red-600 hover:text-red-700 inline-flex items-center gap-1"
                          >
                            <Trash2 size={16} />
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Financial Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                <p className="text-sm font-medium text-primary-700">Subtotal</p>
                <p className="text-3xl font-bold text-primary-700 mt-1">
                  ৳ {subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-primary-600 mt-2">
                  Based on ordered quantity multiplied by purchase price.
                </p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm font-medium text-green-700">Grand Total</p>
                <p className="text-3xl font-bold text-green-800 mt-1">
                  ৳ {grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-green-700 mt-2">
                  Includes discount and tax adjustments for supplier settlement.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Discount (৳)</label>
                <input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tax (৳)</label>
                <input
                  type="number"
                  min="0"
                  value={tax}
                  onChange={(e) => setTax(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount Paid (৳)</label>
                <input
                  type="number"
                  min="0"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  className={`input ${amountPaidValue > grandTotal ? 'border-red-500' : ''}`}
                />
                {amountPaidValue > grandTotal && (
                  <p className="text-xs text-red-600 mt-1">
                    Amount paid cannot exceed the grand total.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                <select
                  value={initialPaymentMethod}
                  onChange={(e) => setInitialPaymentMethod(e.target.value)}
                  className="input"
                  disabled={amountPaidValue <= 0}
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="mobile_banking">Mobile Banking</option>
                  <option value="credit">Credit</option>
                </select>
                {amountPaidValue <= 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Select a payment method when recording an advance payment.
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  Outstanding after this order:{' '}
                  <span className="font-semibold text-yellow-900">
                    ৳ {dueAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </p>
                <p className="text-xs text-yellow-700 mt-2">
                  Due balances are reflected in supplier dashboards and payable reports.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Internal Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="input"
                  placeholder="Delivery instructions, negotiated terms, or follow-up reminders."
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-t border-gray-200 pt-6">
            <div className="text-sm text-gray-600">
              <p className="font-medium text-gray-900">Before you submit</p>
              <p>
                Double-check batch numbers, expiry dates, and negotiated prices. Accurate data keeps stock valuation and supplier payables trustworthy.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={submitting || amountPaidValue > grandTotal}
                className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <ClipboardList size={18} />
                    Create Purchase Order
                  </>
                )}
              </button>
              <Link href="/purchases" className="btn btn-secondary">
                Cancel
              </Link>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
