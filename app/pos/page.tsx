'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';
import { Search, Plus, Minus, Trash2, User, CreditCard, Smartphone, Banknote, X, Store } from 'lucide-react';
import { format } from 'date-fns';

interface CartItem {
  medicineId: string;
  medicineName: string;
  batchId: string;
  batchNumber: string;
  quantity: number;
  availableStock: number;
  sellingPrice: number;
  mrp: number;
  total: number;
}

export default function POSPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<any>(null);
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile_banking' | 'credit'>('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [loading, setLoading] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [counters, setCounters] = useState<any[]>([]);
  const [selectedCounterId, setSelectedCounterId] = useState<string | null>(null);
  const [counterModalOpen, setCounterModalOpen] = useState(false);
  const [counterLoading, setCounterLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const fetchCounters = useCallback(async () => {
    setCounterLoading(true);
    try {
      const response = await api.getCounters();
      const payload = response?.data ?? response;
      const list = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
      setCounters(list);

      const active = list.filter((counter: any) => counter.status === 'active');
      let defaultCounter = active.find((counter: any) => counter.isDefault);
      if (!defaultCounter && active.length > 0) {
        defaultCounter = active[0];
      }

      if (defaultCounter) {
        setSelectedCounterId(defaultCounter._id);
        setErrorMessage(null);
      } else {
        setSelectedCounterId(null);
      }
    } catch (error) {
      console.error('Failed to load counters', error);
    } finally {
      setCounterLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCounters();
  }, [fetchCounters]);

  const selectedCounter = counters.find((counter: any) => counter._id === selectedCounterId);
  const activeCounters = counters.filter((counter: any) => counter.status === 'active');
  const hasActiveCounters = activeCounters.length > 0;

  const handleCounterSelect = (counterId: string) => {
    setSelectedCounterId(counterId);
    setCounterModalOpen(false);
    setErrorMessage(null);
  };

  const openCounterModal = () => {
    setCounterModalOpen(true);
  };

  const handleRefreshCounters = async () => {
    await fetchCounters();
  };

  const formatCounterTimestamp = useCallback((value?: string) => {
    if (!value) return 'Never used';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Never used';
    return date.toLocaleString();
  }, []);

  // Auto-focus search input
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Search medicines
  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (!hasActiveCounters) {
      setSearchResults([]);
      return;
    }
    
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await api.searchMedicines(query, 10);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching medicines:', error);
    }
  };

  // Add medicine to cart
  const addToCart = (medicine: any, batch: any) => {
    const existingItem = cart.find(item => item.batchId === batch._id);

    if (existingItem) {
      updateQuantity(existingItem.batchId, existingItem.quantity + 1);
    } else {
      const newItem: CartItem = {
        medicineId: medicine._id,
        medicineName: medicine.name,
        batchId: batch._id,
        batchNumber: batch.batchNumber,
        quantity: 1,
        availableStock: batch.quantity,
        sellingPrice: batch.sellingPrice,
        mrp: batch.mrp,
        total: batch.sellingPrice,
      };
      setCart([...cart, newItem]);
    }

    setSearchQuery('');
    setSearchResults([]);
    searchInputRef.current?.focus();
  };

  // Update item quantity
  const updateQuantity = (batchId: string, newQuantity: number) => {
    setCart(cart.map(item => {
      if (item.batchId === batchId) {
        const qty = Math.max(1, Math.min(newQuantity, item.availableStock));
        return { ...item, quantity: qty, total: qty * item.sellingPrice };
      }
      return item;
    }));
  };

  // Remove item from cart
  const removeFromCart = (batchId: string) => {
    setCart(cart.filter(item => item.batchId !== batchId));
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const grandTotal = subtotal;
  const change = paymentMethod === 'credit' ? 0 : Math.max(0, Number(amountPaid) - grandTotal);

  // Search customer by phone
  const searchCustomer = async () => {
    if (!customerPhone) return;

    try {
      const response = await api.getCustomerByPhone(customerPhone);
      setCustomer(response.data);
    } catch (error) {
      setCustomer(null);
      alert('Customer not found. Create customer from Customers page first.');
    }
  };

  // Complete sale
  const completeSale = async () => {
    if (cart.length === 0) {
      alert('Please add items to cart');
      return;
    }

    if (paymentMethod !== 'credit' && Number(amountPaid) < grandTotal) {
      alert('Insufficient payment amount');
      return;
    }

    if (!selectedCounterId) {
      setErrorMessage('Select an active counter before completing a sale.');
      setCounterModalOpen(true);
      return;
    }

    setErrorMessage(null);
    setLoading(true);

    try {
      const saleData = {
        customerId: customer?._id,
        items: cart.map(item => ({
          medicineId: item.medicineId,
          batchId: item.batchId,
          quantity: item.quantity,
          sellingPrice: item.sellingPrice,
        })),
        paymentMethod,
        amountPaid: Number(amountPaid) || grandTotal,
        saleType: 'retail',
        counterId: selectedCounterId,
      };

      const response = await api.createSale(saleData);
      setLastInvoice(response.data);
      setShowInvoice(true);
      setErrorMessage(null);

      // Reset form
      setCart([]);
      setCustomer(null);
      setCustomerPhone('');
      setAmountPaid('');
      setPaymentMethod('cash');
      await fetchCounters();
    } catch (error: any) {
      const details = error?.response?.data?.error?.details;
      const message =
        (typeof details === 'object' && details !== null && 'items' in details && details.items) ||
        error?.response?.data?.error?.message ||
        'Failed to complete sale. Please try again.';
      setErrorMessage(typeof message === 'string' ? message : 'Failed to complete sale. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Clear cart
  const clearCart = () => {
    if (confirm('Clear all items from cart?')) {
      setCart([]);
    }
  };

  // New sale (close invoice)
  const newSale = () => {
    setShowInvoice(false);
    setLastInvoice(null);
    setErrorMessage(null);
    searchInputRef.current?.focus();
  };

  // Invoice Modal
  if (showInvoice && lastInvoice) {
    return (
      <DashboardLayout>
        <div className="p-8 max-w-4xl mx-auto">
          <div className="card">
            <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-green-600">Sale Completed! ✓</h2>
                <p className="text-gray-600 mt-1">Invoice generated successfully</p>
              </div>
              <button onClick={newSale} className="btn btn-primary">
                New Sale
              </button>
            </div>

            {/* Invoice */}
            <div className="border border-gray-300 p-8" id="invoice">
              <div className="text-center mb-6">
                <h1 className="text-3xl font-bold">Pharma360</h1>
                <p className="text-gray-600 mt-2">Tax Invoice</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-200">
                <div>
                  <p className="text-sm text-gray-600">Invoice Number</p>
                  <p className="font-bold text-lg">{lastInvoice.invoiceNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-medium">{format(new Date(lastInvoice.saleDate), 'MMM d, yyyy h:mm a')}</p>
                </div>
              </div>

              {/* Items */}
              <table className="w-full mb-6">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="text-left py-2">Item</th>
                    <th className="text-right py-2">Qty</th>
                    <th className="text-right py-2">Price</th>
                    <th className="text-right py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {lastInvoice.items.map((item: any, index: number) => (
                    <tr key={index} className="border-b border-gray-200">
                      <td className="py-2">{item.medicineName}</td>
                      <td className="text-right py-2">{item.quantity}</td>
                      <td className="text-right py-2">৳ {item.sellingPrice.toFixed(2)}</td>
                      <td className="text-right py-2">৳ {item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">৳ {lastInvoice.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t-2 border-gray-300 pt-2">
                    <span>Grand Total:</span>
                    <span>৳ {lastInvoice.grandTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-medium uppercase">{lastInvoice.paymentMethod}</span>
                  </div>
                  {lastInvoice.changeReturned > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Change:</span>
                      <span className="font-medium">৳ {lastInvoice.changeReturned.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                <p className="text-sm text-gray-600">Thank you for your purchase!</p>
              </div>
            </div>

            <div className="mt-6 flex gap-4">
              <button onClick={() => window.print()} className="btn btn-primary flex-1">
                Print Invoice
              </button>
              <button onClick={newSale} className="btn btn-secondary flex-1">
                Close
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-120px)]">
          {/* Left: Products Search & Selection */}
          <div className="lg:col-span-2 flex flex-col">
            <div className="card flex-1 flex flex-col">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Store size={18} className="text-primary-500" />
                    <span className="font-medium">
                      {selectedCounter ? selectedCounter.name : 'No counter selected'}
                    </span>
                    {selectedCounter && selectedCounter.status !== 'active' && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                        Inactive
                      </span>
                    )}
                  </div>
                  <h2 className="mt-1 text-2xl font-bold text-gray-900">Point of Sale</h2>
                  <p className="text-sm text-gray-500">
                    {selectedCounter
                      ? `Sales will be recorded under counter "${selectedCounter.name}".`
                      : hasActiveCounters
                        ? 'Select an active counter before processing a sale.'
                        : 'No active counters found. Ask an admin to create one in Settings → Counters.'}
                  </p>
                </div>
                <div className="flex flex-col items-stretch gap-2 sm:items-end">
                  {errorMessage && (
                    <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      {errorMessage}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={openCounterModal}
                      className="whitespace-nowrap rounded-md border border-primary-200 px-3 py-2 text-sm font-medium text-primary-600 transition hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={counterLoading || !hasActiveCounters}
                    >
                      {selectedCounter ? 'Switch Counter' : 'Select Counter'}
                    </button>
                    <button
                      type="button"
                      onClick={handleRefreshCounters}
                      className="rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
                    >
                      Refresh
                    </button>
                  </div>
                  {counterLoading && (
                    <span className="text-xs text-gray-500">Refreshing counters...</span>
                  )}
                </div>
              </div>

              {/* Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder={
                      hasActiveCounters
                        ? 'Search medicine by name, generic name, or scan barcode...'
                        : 'No active counter selected. Please create or select a counter.'
                    }
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    disabled={!hasActiveCounters}
                    className="w-full pl-10 pr-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                    autoComplete="off"
                  />
                </div>

                {/* Search Results Dropdown */}
                {searchResults.length > 0 && (
                  <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
                    {searchResults.map((medicine) => (
                      <div key={medicine._id} className="p-4 border-b border-gray-100 last:border-0">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-semibold text-gray-900">{medicine.name}</p>
                            <p className="text-sm text-gray-600">{medicine.genericName} - {medicine.strength}</p>
                            <p className="text-xs text-gray-500">{medicine.manufacturer}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Stock: {medicine.totalStock || 0}</p>
                          </div>
                        </div>

                        {medicine.batches && medicine.batches.length > 0 ? (
                          <div className="space-y-1">
                            {medicine.batches.map((batch: any) => (
                              <button
                                key={batch._id}
                                onClick={() => addToCart(medicine, batch)}
                                disabled={batch.quantity === 0}
                                className="w-full flex items-center justify-between p-2 bg-gray-50 hover:bg-primary-50 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-600">Batch: {batch.batchNumber}</span>
                                  <span className="text-xs text-gray-500">
                                    Exp: {format(new Date(batch.expiryDate), 'MMM yyyy')}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-gray-600">Qty: {batch.quantity}</span>
                                  <span className="font-bold text-primary-600">৳ {batch.sellingPrice}</span>
                                  <Plus size={16} className="text-primary-600" />
                                </div>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-red-600">Out of stock</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto">
                {cart.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-gray-400">
                      <Search size={48} className="mx-auto mb-2" />
                      <p>Search and add medicines to cart</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {cart.map((item, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{item.medicineName}</p>
                            <p className="text-xs text-gray-500">Batch: {item.batchNumber}</p>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.batchId)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.batchId, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              className="p-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
                            >
                              <Minus size={16} />
                            </button>
                            <span className="w-12 text-center font-medium">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.batchId, item.quantity + 1)}
                              disabled={item.quantity >= item.availableStock}
                              className="p-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
                            >
                              <Plus size={16} />
                            </button>
                          </div>

                          <div className="text-right">
                            <p className="text-sm text-gray-600">৳ {item.sellingPrice} × {item.quantity}</p>
                            <p className="text-lg font-bold text-gray-900">৳ {item.total.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="mt-4 text-sm text-red-600 hover:text-red-700"
                >
                  Clear Cart
                </button>
              )}
            </div>
          </div>

          {/* Right: Checkout */}
          <div className="flex flex-col">
            <div className="card flex-1 flex flex-col">
              <h3 className="text-xl font-bold mb-4">Checkout</h3>

              {/* Customer */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer (Optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    placeholder="Customer phone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="flex-1 input"
                  />
                  <button
                    onClick={searchCustomer}
                    className="btn btn-secondary"
                  >
                    <Search size={18} />
                  </button>
                </div>
                {customer && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-green-900">{customer.name}</p>
                        <p className="text-sm text-green-700">Points: {customer.loyaltyPoints}</p>
                      </div>
                      <button
                        onClick={() => { setCustomer(null); setCustomerPhone(''); }}
                        className="text-green-600 hover:text-green-700"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`p-3 border-2 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                      paymentMethod === 'cash'
                        ? 'border-primary-600 bg-primary-50 text-primary-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <Banknote size={20} />
                    <span className="font-medium">Cash</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3 border-2 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                      paymentMethod === 'card'
                        ? 'border-primary-600 bg-primary-50 text-primary-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <CreditCard size={20} />
                    <span className="font-medium">Card</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('mobile_banking')}
                    className={`p-3 border-2 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                      paymentMethod === 'mobile_banking'
                        ? 'border-primary-600 bg-primary-50 text-primary-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <Smartphone size={20} />
                    <span className="font-medium">bKash/Nagad</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('credit')}
                    className={`p-3 border-2 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                      paymentMethod === 'credit'
                        ? 'border-primary-600 bg-primary-50 text-primary-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <User size={20} />
                    <span className="font-medium">Credit</span>
                  </button>
                </div>
              </div>

              {/* Amount Paid */}
              {paymentMethod !== 'credit' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount Paid
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">৳</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      className="input text-lg pl-8"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              )}

              {/* Totals Summary */}
              <div className="flex-1"></div>
              <div className="space-y-3 pt-6 border-t-2 border-gray-300">
                <div className="flex justify-between text-lg">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold">৳ {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-2xl font-bold">
                  <span>Total:</span>
                  <span className="text-primary-600">৳ {grandTotal.toFixed(2)}</span>
                </div>
                {paymentMethod !== 'credit' && Number(amountPaid) > 0 && (
                  <div className="flex justify-between text-lg">
                    <span className="text-gray-600">Change:</span>
                    <span className="font-semibold text-green-600">৳ {change.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Complete Sale Button */}
              <button
                onClick={completeSale}
        disabled={loading || cart.length === 0 || !selectedCounterId}
                className="mt-6 w-full btn btn-primary py-4 text-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : `Complete Sale - ৳ ${grandTotal.toFixed(2)}`}
              </button>
            </div>
          </div>
        </div>
      </div>

      {counterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Select Counter</h3>
                <p className="text-sm text-gray-500">
                  Choose the counter you are operating. Only active counters are selectable.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCounterModalOpen(false)}
                className="text-gray-500 transition hover:text-gray-700"
              >
                <X size={18} />
              </button>
            </div>

            {counters.length === 0 ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                No counters available. Ask an administrator to create one from Settings → Counters.
              </div>
            ) : (
              <div className="space-y-3">
                {counters.map((counter) => {
                  const isActive = counter.status === 'active';
                  const isSelected = counter._id === selectedCounterId;
                  return (
                    <button
                      key={counter._id}
                      type="button"
                      onClick={() => isActive && handleCounterSelect(counter._id)}
                      disabled={!isActive}
                      className={`w-full rounded-lg border px-4 py-3 text-left transition ${
                        isSelected ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-400'
                      } ${!isActive ? 'cursor-not-allowed opacity-60' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{counter.name}</p>
                          <p className="text-xs text-gray-500">
                            {counter.isDefault ? 'Default counter · ' : ''}
                            Status: {isActive ? 'Active' : 'Inactive'}
                            {counter.lastSessionAt
                              ? ` · Last session ${formatCounterTimestamp(counter.lastSessionAt)}`
                              : ''}
                          </p>
                        </div>
                        {isSelected && (
                          <span className="rounded-full bg-primary-500 px-2 py-1 text-xs font-semibold text-white">
                            Selected
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handleRefreshCounters}
                className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
              >
                Refresh Counters
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

