'use client';

import { memo, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatCurrency, formatDate, parseNumberInput } from '@/lib/format';
import useDebouncedSearch from '@/lib/hooks/useDebouncedSearch';
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

interface PurchaseItem extends PurchaseItemDraft {
  lineTotal: number;
  formatted: {
    purchasePrice: string;
    sellingPrice: string;
    mrp: string;
    expiry: string;
  };
}

interface PurchaseFormState {
  supplierId: string;
  supplierInvoiceNumber: string;
  orderDate: string;
  expectedDeliveryDate: string;
  discount: string;
  tax: string;
  amountPaid: string;
  initialPaymentMethod: string;
  notes: string;
  itemDraft: PurchaseItemDraft;
  items: PurchaseItem[];
}

type PurchaseFormField =
  | 'supplierId'
  | 'supplierInvoiceNumber'
  | 'orderDate'
  | 'expectedDeliveryDate'
  | 'discount'
  | 'tax'
  | 'amountPaid'
  | 'initialPaymentMethod'
  | 'notes';

type PurchaseItemField = keyof PurchaseItemDraft;

type PurchaseFormAction =
  | { type: 'SET_FIELD'; field: PurchaseFormField; value: string }
  | { type: 'SET_ITEM_DRAFT_FIELD'; field: PurchaseItemField; value: string }
  | { type: 'RESET_ITEM_DRAFT' }
  | { type: 'ADD_ITEM'; payload: PurchaseItem }
  | { type: 'REMOVE_ITEM'; index: number };

const LINE_ITEM_ROW_HEIGHT = 64;
const MAX_VISIBLE_ROWS = 8;
const OVERSCAN_ROWS = 4;
const LINE_ITEM_GRID_TEMPLATE =
  '2.4fr 1.2fr 0.9fr 0.9fr 1.4fr 1.4fr 1.4fr 1.4fr 0.9fr';

const createItemDraft = (): PurchaseItemDraft => ({
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

const createInitialState = (supplierId: string): PurchaseFormState => ({
  supplierId,
  supplierInvoiceNumber: '',
  orderDate: new Date().toISOString().slice(0, 10),
  expectedDeliveryDate: '',
  discount: '0',
  tax: '0',
  amountPaid: '0',
  initialPaymentMethod: 'cash',
  notes: '',
  itemDraft: createItemDraft(),
  items: [],
});

const createPurchaseItem = (draft: PurchaseItemDraft): PurchaseItem => {
  const sanitized: PurchaseItemDraft = {
    ...draft,
    batchNumber: draft.batchNumber.trim(),
    medicineName: draft.medicineName.trim(),
  };

  const quantity = parseNumberInput(sanitized.quantity);
  const purchasePrice = parseNumberInput(sanitized.purchasePrice);
  const sellingPrice = parseNumberInput(sanitized.sellingPrice);
  const mrp = parseNumberInput(sanitized.mrp);

  return {
    ...sanitized,
    lineTotal: quantity * purchasePrice,
    formatted: {
      purchasePrice: formatCurrency(purchasePrice),
      sellingPrice: formatCurrency(sellingPrice),
      mrp: formatCurrency(mrp),
      expiry: formatDate(sanitized.expiryDate),
    },
  };
};

const purchaseFormReducer = (
  state: PurchaseFormState,
  action: PurchaseFormAction
): PurchaseFormState => {
  switch (action.type) {
    case 'SET_FIELD':
      return {
        ...state,
        [action.field]: action.value,
      };
    case 'SET_ITEM_DRAFT_FIELD':
      return {
        ...state,
        itemDraft: {
          ...state.itemDraft,
          [action.field]: action.value,
        },
      };
    case 'RESET_ITEM_DRAFT':
      return {
        ...state,
        itemDraft: createItemDraft(),
      };
    case 'ADD_ITEM':
      return {
        ...state,
        items: [...state.items, action.payload],
        itemDraft: createItemDraft(),
      };
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter((_, idx) => idx !== action.index),
      };
    default:
      return state;
  }
};

const selectTotals = ({
  items,
  discount,
  tax,
  amountPaid,
}: {
  items: PurchaseItem[];
  discount: string;
  tax: string;
  amountPaid: string;
}) => {
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const discountValue = Math.max(0, parseNumberInput(discount));
  const taxValue = Math.max(0, parseNumberInput(tax));
  const amountPaidValue = Math.max(0, parseNumberInput(amountPaid));
  const grandTotal = Math.max(0, subtotal - discountValue + taxValue);
  const dueAmount = Math.max(0, grandTotal - amountPaidValue);

  return {
    subtotal,
    discountValue,
    taxValue,
    amountPaidValue,
    grandTotal,
    dueAmount,
    formattedSubtotal: formatCurrency(subtotal),
    formattedGrandTotal: formatCurrency(grandTotal),
    formattedDueAmount: formatCurrency(dueAmount),
  };
};

interface PurchaseItemsListProps {
  items: PurchaseItem[];
  onRemove: (index: number) => void;
}

const PurchaseItemsList = memo(({ items, onRemove }: PurchaseItemsListProps) => {
  const shouldVirtualize = items.length > MAX_VISIBLE_ROWS;
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);

  useEffect(() => {
    if (shouldVirtualize) {
      return;
    }
    setScrollTop(0);
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [items, shouldVirtualize]);

  if (items.length === 0) {
    return null;
  }

  const listViewportHeight = shouldVirtualize
    ? MAX_VISIBLE_ROWS * LINE_ITEM_ROW_HEIGHT
    : items.length * LINE_ITEM_ROW_HEIGHT;

  const baseVisibleCount = shouldVirtualize
    ? Math.ceil(listViewportHeight / LINE_ITEM_ROW_HEIGHT)
    : items.length;

  const startIndex = shouldVirtualize
    ? Math.max(0, Math.floor(scrollTop / LINE_ITEM_ROW_HEIGHT) - OVERSCAN_ROWS)
    : 0;

  const endIndex = shouldVirtualize
    ? Math.min(items.length, startIndex + baseVisibleCount + OVERSCAN_ROWS * 2)
    : items.length;

  const visibleItems = items.slice(startIndex, endIndex);
  const offsetY = shouldVirtualize ? startIndex * LINE_ITEM_ROW_HEIGHT : 0;

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  };

  const renderRow = (item: PurchaseItem, index: number, style?: CSSProperties) => (
    <div
      key={`${item.medicineId}-${index}`}
      className="grid items-center border-b border-gray-100 px-4 text-sm text-gray-600 last:border-b-0"
      style={{
        gridTemplateColumns: LINE_ITEM_GRID_TEMPLATE,
        height: LINE_ITEM_ROW_HEIGHT,
        ...(style || {}),
      }}
    >
      <div className="font-medium text-gray-900 truncate pr-3">{item.medicineName}</div>
      <div className="truncate">{item.batchNumber}</div>
      <div>{item.quantity || '0'}</div>
      <div>{item.freeQuantity || '0'}</div>
      <div>{item.formatted.purchasePrice}</div>
      <div>{item.formatted.mrp}</div>
      <div>{item.formatted.sellingPrice}</div>
      <div>{item.formatted.expiry}</div>
      <div className="text-right">
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="text-red-600 hover:text-red-700 inline-flex items-center gap-1"
        >
          <Trash2 size={16} />
          Remove
        </button>
      </div>
    </div>
  );

  return (
    <div className="mt-6 border border-gray-200 rounded-lg overflow-hidden">
      <div
        className="hidden md:grid bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-600 px-4 py-3"
        style={{ gridTemplateColumns: LINE_ITEM_GRID_TEMPLATE }}
      >
        <div>Medicine</div>
        <div>Batch</div>
        <div>Qty</div>
        <div>Free</div>
        <div>Purchase Price</div>
        <div>MRP</div>
        <div>Selling Price</div>
        <div>Expiry</div>
        <div className="text-right">Actions</div>
      </div>
      <div
        ref={scrollRef}
        className="relative"
        style={{
          maxHeight: shouldVirtualize ? listViewportHeight : undefined,
          overflowY: shouldVirtualize ? 'auto' : 'visible',
        }}
        onScroll={shouldVirtualize ? handleScroll : undefined}
      >
        {shouldVirtualize ? (
          <div style={{ height: items.length * LINE_ITEM_ROW_HEIGHT, position: 'relative' }}>
            <div style={{ transform: `translateY(${offsetY}px)` }}>
              {visibleItems.map((item, idx) =>
                renderRow(item, startIndex + idx, {
                  height: LINE_ITEM_ROW_HEIGHT,
                })
              )}
            </div>
          </div>
        ) : (
          visibleItems.map((item, idx) =>
            renderRow(item, idx, {
              height: LINE_ITEM_ROW_HEIGHT,
            })
          )
        )}
      </div>
    </div>
  );
});
PurchaseItemsList.displayName = 'PurchaseItemsList';

export default function CreatePurchasePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supplierPrefill = searchParams?.get('supplierId') || '';

  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [supplierLoading, setSupplierLoading] = useState(false);

  const [formState, dispatch] = useReducer(
    purchaseFormReducer,
    supplierPrefill,
    createInitialState
  );

  const {
    supplierId,
    supplierInvoiceNumber,
    orderDate,
    expectedDeliveryDate,
    discount,
    tax,
    amountPaid,
    initialPaymentMethod,
    notes,
    items,
    itemDraft,
  } = formState;

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const totals = useMemo(
    () => selectTotals({ items, discount, tax, amountPaid }),
    [items, discount, tax, amountPaid]
  );
  const { amountPaidValue, grandTotal, formattedSubtotal, formattedGrandTotal, formattedDueAmount } =
    totals;

  const fetchSuppliers = useCallback(async () => {
    try {
      setSupplierLoading(true);
      const response = await api.getSuppliers({ limit: 100, isActive: true });
      setSuppliers(response.data || []);
    } catch (err) {
      console.error('Failed to load suppliers', err);
    } finally {
      setSupplierLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const {
    setQuery: triggerMedicineSearch,
    results: medicineSearchResults,
    isSearching: searchingMedicine,
    clear: clearMedicineResults,
  } = useDebouncedSearch<MedicineOption[]>({
    delay: 350,
    minLength: 2,
    search: async (value, signal) => {
      const response = await api.searchMedicines(value, 10, signal);
      return response.data || [];
    },
    onError: (error) => {
      console.error('Failed to search medicines', error);
    },
  });

  const medicineResults = medicineSearchResults || [];

  const setFieldValue = useCallback(
    (field: PurchaseFormField, value: string) => {
      dispatch({ type: 'SET_FIELD', field, value });
    },
    [dispatch]
  );

  const setItemDraftField = useCallback(
    (field: PurchaseItemField, value: string) => {
      dispatch({ type: 'SET_ITEM_DRAFT_FIELD', field, value });
    },
    [dispatch]
  );

  const handleMedicineInputChange = useCallback(
    (value: string) => {
      if (value.trim() !== itemDraft.medicineName.trim()) {
        setItemDraftField('medicineId', '');
      }
      setItemDraftField('medicineName', value);
      triggerMedicineSearch(value);
    },
    [itemDraft.medicineName, setItemDraftField, triggerMedicineSearch]
  );

  const handleSelectMedicine = (medicine: MedicineOption) => {
    setItemDraftField('medicineId', medicine._id);
    setItemDraftField('medicineName', medicine.name);
    if (medicine.defaultSellingPrice !== undefined) {
      setItemDraftField('sellingPrice', String(medicine.defaultSellingPrice));
    }
    clearMedicineResults();
  };

  const resetItemDraft = () => {
    dispatch({ type: 'RESET_ITEM_DRAFT' });
    clearMedicineResults();
  };

  const handleAddItem = useCallback(() => {
    const draftErrors: Record<string, string> = {};
    const quantityValue = parseNumberInput(itemDraft.quantity);
    const freeQuantityValue = parseNumberInput(itemDraft.freeQuantity);
    const purchasePriceValue = parseNumberInput(itemDraft.purchasePrice);
    const sellingPriceValue = parseNumberInput(itemDraft.sellingPrice);
    const mrpValue = parseNumberInput(itemDraft.mrp);
    const alertThresholdValue = parseNumberInput(itemDraft.alertThreshold);
    const hasAlertThreshold = itemDraft.alertThreshold.trim().length > 0;

    if (!itemDraft.medicineId) draftErrors.medicineId = 'Select a medicine';
    if (!itemDraft.batchNumber.trim()) draftErrors.batchNumber = 'Batch number required';
    if (!itemDraft.quantity.trim() || quantityValue <= 0) {
      draftErrors.quantity = 'Quantity must be greater than zero';
    }
    if (!itemDraft.purchasePrice.trim() || purchasePriceValue < 0) {
      draftErrors.purchasePrice = 'Purchase price is required';
    }
    if (!itemDraft.sellingPrice.trim() || sellingPriceValue < 0) {
      draftErrors.sellingPrice = 'Selling price is required';
    }
    if (!itemDraft.mrp.trim() || mrpValue < 0) {
      draftErrors.mrp = 'MRP is required';
    }
    if (!itemDraft.expiryDate) {
      draftErrors.expiryDate = 'Expiry date required';
    }
    const expiry = itemDraft.expiryDate ? new Date(itemDraft.expiryDate) : null;
    if (expiry && Number.isNaN(expiry.getTime())) {
      draftErrors.expiryDate = 'Invalid expiry date';
    }
    if (hasAlertThreshold && alertThresholdValue < 0) {
      draftErrors.alertThreshold = 'Alert threshold cannot be negative';
    }
    if (freeQuantityValue < 0) {
      draftErrors.freeQuantity = 'Free quantity cannot be negative';
    }

    if (Object.keys(draftErrors).length > 0) {
      setErrors(draftErrors);
      return;
    }

    const preparedItem = createPurchaseItem({
      ...itemDraft,
      freeQuantity: itemDraft.freeQuantity || '0',
      alertThreshold: hasAlertThreshold ? itemDraft.alertThreshold : '',
    });

    dispatch({ type: 'ADD_ITEM', payload: preparedItem });
    setErrors({});
    clearMedicineResults();
  }, [clearMedicineResults, dispatch, itemDraft]);

  const handleRemoveItem = useCallback(
    (index: number) => {
      dispatch({ type: 'REMOVE_ITEM', index });
    },
    [dispatch]
  );

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
          batchNumber: item.batchNumber,
          quantity: parseNumberInput(item.quantity),
          freeQuantity: parseNumberInput(item.freeQuantity),
          purchasePrice: parseNumberInput(item.purchasePrice),
          sellingPrice: parseNumberInput(item.sellingPrice),
          mrp: parseNumberInput(item.mrp),
          expiryDate: item.expiryDate,
          alertThreshold: item.alertThreshold ? parseNumberInput(item.alertThreshold) : undefined,
          notes: undefined,
        })),
      });

      router.push('/purchases');
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        (error as any).response?.data?.error?.details
      ) {
        setErrors((error as any).response.data.error.details);
      } else {
        setErrors({
          general:
            (typeof error === 'object' &&
            error !== null &&
            'response' in error &&
            (error as any).response?.data?.error?.message
              ? (error as any).response.data.error.message
              : 'Unable to create purchase order. Please review the inputs.'),
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
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
                    const value = e.target.value;
                    setFieldValue('supplierId', value);
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
                  onChange={(e) => setFieldValue('supplierInvoiceNumber', e.target.value)}
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
                    onChange={(e) => setFieldValue('orderDate', e.target.value)}
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
                  onChange={(e) => setFieldValue('expectedDeliveryDate', e.target.value)}
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
                  onChange={(e) => handleMedicineInputChange(e.target.value)}
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
                  onChange={(e) => setItemDraftField('batchNumber', e.target.value)}
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
                  onChange={(e) => setItemDraftField('quantity', e.target.value)}
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
                  onChange={(e) => setItemDraftField('freeQuantity', e.target.value)}
                  className="input"
                />
                {errors.freeQuantity && <p className="mt-1 text-sm text-red-600">{errors.freeQuantity}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Purchase Price *</label>
                <input
                  type="number"
                  min="0"
                  value={itemDraft.purchasePrice}
                  onChange={(e) => setItemDraftField('purchasePrice', e.target.value)}
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
                  onChange={(e) => setItemDraftField('sellingPrice', e.target.value)}
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
                  onChange={(e) => setItemDraftField('mrp', e.target.value)}
                  className={`input ${errors.mrp ? 'border-red-500' : ''}`}
                />
                {errors.mrp && <p className="mt-1 text-sm text-red-600">{errors.mrp}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date *</label>
                <input
                  type="date"
                  value={itemDraft.expiryDate}
                  onChange={(e) => setItemDraftField('expiryDate', e.target.value)}
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
                  onChange={(e) => setItemDraftField('alertThreshold', e.target.value)}
                  className="input"
                />
                {errors.alertThreshold && (
                  <p className="mt-1 text-sm text-red-600">{errors.alertThreshold}</p>
                )}
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
              <PurchaseItemsList items={items} onRemove={handleRemoveItem} />
            )}
          </div>

          <div className="card space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Financial Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                <p className="text-sm font-medium text-primary-700">Subtotal</p>
                <p className="text-3xl font-bold text-primary-700 mt-1">
                  {formattedSubtotal}
                </p>
                <p className="text-xs text-primary-600 mt-2">
                  Based on ordered quantity multiplied by purchase price.
                </p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm font-medium text-green-700">Grand Total</p>
                <p className="text-3xl font-bold text-green-800 mt-1">
                  {formattedGrandTotal}
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
                  onChange={(e) => setFieldValue('discount', e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tax (৳)</label>
                <input
                  type="number"
                  min="0"
                  value={tax}
                  onChange={(e) => setFieldValue('tax', e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount Paid (৳)</label>
                <input
                  type="number"
                  min="0"
                  value={amountPaid}
                  onChange={(e) => setFieldValue('amountPaid', e.target.value)}
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
                  onChange={(e) => setFieldValue('initialPaymentMethod', e.target.value)}
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
                    {formattedDueAmount}
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
                  onChange={(e) => setFieldValue('notes', e.target.value)}
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
  );
}
