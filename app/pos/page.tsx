'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/context/AuthContext';
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
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<any>(null);
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerSearchResults, setCustomerSearchResults] = useState<any[]>([]);
  const [customerSearchLoading, setCustomerSearchLoading] = useState(false);
  const [showCustomerResults, setShowCustomerResults] = useState(false);
  const customerSearchRef = useRef<HTMLDivElement>(null);
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
  const [showCreateCustomerModal, setShowCreateCustomerModal] = useState(false);
  const [createCustomerLoading, setCreateCustomerLoading] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });
  const [createCustomerErrors, setCreateCustomerErrors] = useState<Record<string, string>>({});

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

  // Debounced search to reduce API calls
  useEffect(() => {
    if (!hasActiveCounters) {
      setSearchResults([]);
      return;
    }

    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const controller = new AbortController();
        const response = await api.searchMedicines(searchQuery, 10, controller.signal);
        setSearchResults(response.data);
      } catch (error: any) {
        // Only log non-abort errors
        if (error?.name !== 'AbortError' && error?.message !== 'Request cancelled') {
          console.error('Error searching medicines:', error);
        }
      }
    }, 300); // 300ms debounce for search

    return () => clearTimeout(timeoutId);
  }, [searchQuery, hasActiveCounters]);

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

  // Debounced customer search
  useEffect(() => {
    if (!customerPhone || customerPhone.length < 2) {
      setCustomerSearchResults([]);
      setShowCustomerResults(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setCustomerSearchLoading(true);
        const response = await api.getCustomers({
          search: customerPhone,
          limit: 10,
        });
        setCustomerSearchResults(response.data || []);
        setShowCustomerResults(true);
      } catch (error: any) {
        if (error?.name !== 'AbortError' && error?.message !== 'Request cancelled') {
          console.error('Error searching customers:', error);
        }
        setCustomerSearchResults([]);
      } finally {
        setCustomerSearchLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [customerPhone]);

  // Close customer search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (customerSearchRef.current && !customerSearchRef.current.contains(event.target as Node)) {
        setShowCustomerResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Select customer from search results
  const selectCustomer = (selectedCustomer: any) => {
    setCustomer(selectedCustomer);
    setCustomerPhone(selectedCustomer.phone);
    setShowCustomerResults(false);
    setCustomerSearchResults([]);
  };

  // Search customer by phone (fallback for Enter key)
  const searchCustomer = async () => {
    if (!customerPhone) return;

    try {
      // Try exact phone match first
      const response = await api.getCustomerByPhone(customerPhone);
      setCustomer(response.data);
      setShowCustomerResults(false);
      setCustomerSearchResults([]);
    } catch {
      // If exact match fails, try search
      try {
        const searchResponse = await api.getCustomers({
          search: customerPhone,
          limit: 1,
        });
        if (searchResponse.data && searchResponse.data.length > 0) {
          selectCustomer(searchResponse.data[0]);
        } else {
          setCustomer(null);
          // Open create customer modal with pre-filled phone
          setNewCustomerData({
            name: '',
            phone: customerPhone,
            email: '',
            address: '',
          });
          setCreateCustomerErrors({});
          setShowCreateCustomerModal(true);
        }
      } catch {
        setCustomer(null);
        // Open create customer modal with pre-filled phone
        setNewCustomerData({
          name: '',
          phone: customerPhone,
          email: '',
          address: '',
        });
        setCreateCustomerErrors({});
        setShowCreateCustomerModal(true);
      }
    }
  };

  // Create new customer from POS
  const createCustomer = async () => {
    if (!newCustomerData.name.trim() || !newCustomerData.phone.trim()) {
      setCreateCustomerErrors({
        general: 'Name and phone number are required',
      });
      return;
    }

    setCreateCustomerLoading(true);
    setCreateCustomerErrors({});

    try {
      const response = await api.createCustomer({
        name: newCustomerData.name.trim(),
        phone: newCustomerData.phone.trim(),
        email: newCustomerData.email.trim() || undefined,
        address: newCustomerData.address.trim() || undefined,
      });

      // Select the newly created customer
      const newCustomer = response.data;
      selectCustomer(newCustomer);
      
      // Close modal and reset form
      setShowCreateCustomerModal(false);
      setNewCustomerData({
        name: '',
        phone: '',
        email: '',
        address: '',
      });
    } catch (error: any) {
      if (error.response?.data?.error?.details) {
        setCreateCustomerErrors(error.response.data.error.details);
      } else {
        setCreateCustomerErrors({
          general: error.response?.data?.error?.message || 'Failed to create customer',
        });
      }
    } finally {
      setCreateCustomerLoading(false);
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
    const pharmacyName = user?.pharmacyName || 'Pharmacy';
    const saleDate = new Date(lastInvoice.saleDate);
    // Customer info might be in lastInvoice.customerId (if populated) or we use the customer state
    const customerInfo = (lastInvoice.customerId && typeof lastInvoice.customerId === 'object') 
      ? lastInvoice.customerId 
      : (lastInvoice.customerId ? { _id: lastInvoice.customerId } : null) || customer;

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Print Styles */}
        <style jsx global>{`
          @media print {
            body {
              margin: 0;
              padding: 0;
              background: white;
            }
            .no-print {
              display: none !important;
            }
            .print-only {
              display: block !important;
            }
            #invoice-container {
              margin: 0;
              padding: 0;
              max-width: 100%;
              box-shadow: none;
            }
            #invoice {
              border: none;
              padding: 20px;
              margin: 0;
            }
          }
          @media screen {
            .print-only {
              display: none !important;
            }
          }
        `}</style>

        {/* Screen View - with controls */}
        <div className="no-print fixed top-0 left-0 right-0 bg-white border-b border-gray-200 shadow-sm z-50 p-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-green-600">Sale Completed! ✓</h2>
              <p className="text-sm text-gray-600">Invoice generated successfully</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => window.print()} 
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
              >
                Print Invoice
              </button>
              <button 
                onClick={newSale} 
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                New Sale
              </button>
            </div>
          </div>
        </div>

        {/* Invoice Container */}
        <div className="pt-20 pb-8 px-4 print:pt-0 print:pb-0 print:px-0">
          <div id="invoice-container" className="max-w-3xl mx-auto bg-white shadow-lg print:shadow-none print:max-w-full">
            {/* Professional Invoice */}
            <div id="invoice" className="bg-white p-8 md:p-12 print:p-8">

              {/* Header Section */}
              <div className="border-b-2 border-gray-900 pb-6 mb-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  {/* Pharmacy Info */}
                  <div className="flex-1">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 tracking-tight">{pharmacyName}</h1>
                    <p className="text-xl font-bold text-gray-800 mb-1 uppercase tracking-wider">TAX INVOICE</p>
                    <p className="text-sm text-gray-600">Retail Pharmacy</p>
                  </div>
                  
                  {/* Invoice Details */}
                  <div className="text-right">
                    <div className="mb-4">
                      <p className="text-xs text-gray-600 uppercase tracking-wider mb-1 font-semibold">Invoice No.</p>
                      <p className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">{lastInvoice.invoiceNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 uppercase tracking-wider mb-1 font-semibold">Date & Time</p>
                      <p className="text-base font-bold text-gray-900">
                        {format(saleDate, 'dd MMM yyyy')}
                      </p>
                      <p className="text-sm font-medium text-gray-700">
                        {format(saleDate, 'h:mm a')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer & Counter Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 pb-6 border-b border-gray-300">
                {/* Customer Info */}
                <div>
                  <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Bill To</h3>
                  {customerInfo ? (
                    <div className="text-sm">
                      <p className="font-semibold text-gray-900">{customerInfo.name || 'N/A'}</p>
                      <p className="text-gray-700">{customerInfo.phone || ''}</p>
                      {customerInfo.email && (
                        <p className="text-gray-600">{customerInfo.email}</p>
                      )}
                      {customerInfo.address && (
                        <p className="text-gray-600 mt-1">{customerInfo.address}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 italic">Walk-in Customer</p>
                  )}
                </div>

                {/* Counter Info */}
                {selectedCounter && (
                  <div>
                    <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Counter</h3>
                    <p className="text-sm font-semibold text-gray-900">{selectedCounter.name}</p>
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div className="mb-6">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-900 text-white">
                      <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider">Item Description</th>
                      <th className="text-center py-3 px-4 text-xs font-bold uppercase tracking-wider">Batch</th>
                      <th className="text-right py-3 px-4 text-xs font-bold uppercase tracking-wider">Qty</th>
                      <th className="text-right py-3 px-4 text-xs font-bold uppercase tracking-wider">Unit Price</th>
                      <th className="text-right py-3 px-4 text-xs font-bold uppercase tracking-wider">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lastInvoice.items.map((item: any, index: number) => (
                      <tr key={index} className="border-b border-gray-200 print:border-gray-300">
                        <td className="py-3 px-4">
                          <p className="font-semibold text-gray-900 text-sm">{item.medicineName}</p>
                          {item.batchNumber && (
                            <p className="text-xs text-gray-500 mt-0.5">Batch: {item.batchNumber}</p>
                          )}
                        </td>
                        <td className="text-center py-3 px-4 text-sm text-gray-700">
                          {item.batchNumber || '-'}
                        </td>
                        <td className="text-right py-3 px-4 text-sm font-semibold text-gray-900">{item.quantity}</td>
                        <td className="text-right py-3 px-4 text-sm text-gray-700">৳ {item.sellingPrice.toFixed(2)}</td>
                        <td className="text-right py-3 px-4 text-sm font-bold text-gray-900">৳ {item.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Section */}
              <div className="flex justify-end mb-6">
                <div className="w-full md:w-80 space-y-2">
                  {lastInvoice.totalDiscount > 0 && (
                    <div className="flex justify-between text-sm py-1">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium text-gray-900">৳ {lastInvoice.subtotal.toFixed(2)}</span>
                    </div>
                  )}
                  {lastInvoice.totalDiscount > 0 && (
                    <div className="flex justify-between text-sm py-1">
                      <span className="text-gray-600">Discount:</span>
                      <span className="font-medium text-red-600">-৳ {lastInvoice.totalDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  {lastInvoice.tax > 0 && (
                    <div className="flex justify-between text-sm py-1">
                      <span className="text-gray-600">Tax:</span>
                      <span className="font-medium text-gray-900">৳ {lastInvoice.tax.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold py-4 border-t-2 border-b-2 border-gray-900 bg-gray-50 px-4 -mx-4">
                    <span className="uppercase tracking-wider text-gray-900">Total Amount</span>
                    <span className="text-2xl md:text-3xl text-gray-900">৳ {lastInvoice.grandTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm py-2 bg-gray-50 px-3 rounded">
                    <span className="text-gray-700 font-medium">Payment Method:</span>
                    <span className="font-bold text-gray-900 uppercase">
                      {lastInvoice.paymentMethod === 'mobile_banking' ? 'bKash/Nagad' : 
                       lastInvoice.paymentMethod === 'credit' ? 'Credit' :
                       lastInvoice.paymentMethod === 'card' ? 'Card' : 'Cash'}
                    </span>
                  </div>
                  {lastInvoice.paymentMethod !== 'credit' && (
                    <>
                      <div className="flex justify-between text-sm py-1">
                        <span className="text-gray-600">Amount Paid:</span>
                        <span className="font-medium text-gray-900">৳ {lastInvoice.amountPaid.toFixed(2)}</span>
                      </div>
                      {lastInvoice.changeReturned > 0 && (
                        <div className="flex justify-between text-sm py-1 font-semibold">
                          <span className="text-gray-700">Change Returned:</span>
                          <span className="text-green-600">৳ {lastInvoice.changeReturned.toFixed(2)}</span>
                        </div>
                      )}
                    </>
                  )}
                  {lastInvoice.paymentMethod === 'credit' && (
                    <div className="flex justify-between text-sm py-1 font-semibold">
                      <span className="text-gray-700">Due Amount:</span>
                      <span className="text-red-600">৳ {lastInvoice.grandTotal.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t-2 border-gray-900 pt-6 mt-8">
                <div className="text-center space-y-2">
                  <p className="text-base font-bold text-gray-900">Thank you for your business!</p>
                  <p className="text-xs text-gray-600">Please keep this invoice for your records</p>
                  {lastInvoice.paymentMethod === 'credit' && (
                    <p className="text-xs text-red-700 font-bold mt-3 bg-red-50 py-2 px-4 rounded border border-red-200">
                      ⚠️ Credit Sale - Payment pending
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
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
                    onChange={(e) => setSearchQuery(e.target.value)}
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
              <div className="mb-6" ref={customerSearchRef}>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Customer (Optional)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setNewCustomerData({
                        name: '',
                        phone: customerPhone || '',
                        email: '',
                        address: '',
                      });
                      setCreateCustomerErrors({});
                      setShowCreateCustomerModal(true);
                    }}
                    className="flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    <Plus size={14} />
                    <span>Add New Customer</span>
                  </button>
                </div>
                <div className="relative">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        placeholder="Search by name or phone..."
                        value={customerPhone}
                        onChange={(e) => {
                          setCustomerPhone(e.target.value);
                          setCustomer(null); // Clear selected customer when typing
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            searchCustomer();
                          }
                        }}
                        onFocus={() => {
                          if (customerSearchResults.length > 0) {
                            setShowCustomerResults(true);
                          }
                        }}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <button
                      onClick={searchCustomer}
                      className="btn btn-secondary"
                      type="button"
                    >
                      <Search size={18} />
                    </button>
                  </div>

                  {/* Customer Search Results Dropdown */}
                  {showCustomerResults && customerSearchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {customerSearchLoading && (
                        <div className="p-3 text-center text-gray-500 text-sm">
                          Searching...
                        </div>
                      )}
                      {!customerSearchLoading && customerSearchResults.map((result) => (
                        <button
                          key={result._id}
                          type="button"
                          onClick={() => selectCustomer(result)}
                          className="w-full p-3 text-left hover:bg-primary-50 border-b border-gray-100 last:border-0 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">{result.name}</p>
                              <p className="text-sm text-gray-600">{result.phone}</p>
                              {result.email && (
                                <p className="text-xs text-gray-500">{result.email}</p>
                              )}
                            </div>
                            {result.loyaltyPoints > 0 && (
                              <div className="text-right">
                                <p className="text-xs text-gray-500">Points</p>
                                <p className="text-sm font-semibold text-primary-600">{result.loyaltyPoints}</p>
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                      {/* Add New Customer Option */}
                      {!customerSearchLoading && customerPhone.length >= 2 && (
                        <button
                          type="button"
                          onClick={() => {
                            setNewCustomerData({
                              name: '',
                              phone: customerPhone,
                              email: '',
                              address: '',
                            });
                            setCreateCustomerErrors({});
                            setShowCreateCustomerModal(true);
                            setShowCustomerResults(false);
                          }}
                          className="w-full p-3 text-left hover:bg-primary-50 border-t-2 border-gray-200 transition-colors flex items-center gap-2 text-primary-600 font-medium"
                        >
                          <Plus size={18} />
                          <span>Add New Customer: {customerPhone}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Selected Customer Display */}
                {customer && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-green-900">{customer.name}</p>
                        <p className="text-sm text-green-700">
                          {customer.phone}
                          {customer.loyaltyPoints > 0 && ` · Points: ${customer.loyaltyPoints}`}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setCustomer(null);
                          setCustomerPhone('');
                          setShowCustomerResults(false);
                        }}
                        className="text-green-600 hover:text-green-700"
                        type="button"
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

      {/* Create Customer Modal */}
      {showCreateCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Add New Customer</h3>
                <p className="text-sm text-gray-500">
                  Create a new customer to continue with checkout
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowCreateCustomerModal(false);
                  setCreateCustomerErrors({});
                }}
                className="text-gray-500 transition hover:text-gray-700"
              >
                <X size={18} />
              </button>
            </div>

            {createCustomerErrors.general && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {createCustomerErrors.general}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={newCustomerData.name}
                  onChange={(e) => {
                    setNewCustomerData({ ...newCustomerData, name: e.target.value });
                    if (createCustomerErrors.name) {
                      setCreateCustomerErrors({ ...createCustomerErrors, name: '' });
                    }
                  }}
                  className={`input w-full ${createCustomerErrors.name ? 'border-red-500' : ''}`}
                  placeholder="Enter customer name"
                  autoFocus
                />
                {createCustomerErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{createCustomerErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={newCustomerData.phone}
                  onChange={(e) => {
                    setNewCustomerData({ ...newCustomerData, phone: e.target.value });
                    if (createCustomerErrors.phone) {
                      setCreateCustomerErrors({ ...createCustomerErrors, phone: '' });
                    }
                  }}
                  className={`input w-full ${createCustomerErrors.phone ? 'border-red-500' : ''}`}
                  placeholder="01712345678"
                />
                {createCustomerErrors.phone && (
                  <p className="mt-1 text-sm text-red-600">{createCustomerErrors.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email (optional)
                </label>
                <input
                  type="email"
                  value={newCustomerData.email}
                  onChange={(e) => setNewCustomerData({ ...newCustomerData, email: e.target.value })}
                  className="input w-full"
                  placeholder="customer@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address (optional)
                </label>
                <textarea
                  value={newCustomerData.address}
                  onChange={(e) => setNewCustomerData({ ...newCustomerData, address: e.target.value })}
                  className="input w-full"
                  rows={2}
                  placeholder="Enter address"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={createCustomer}
                disabled={createCustomerLoading || !newCustomerData.name.trim() || !newCustomerData.phone.trim()}
                className="btn btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createCustomerLoading ? 'Creating...' : 'Create & Continue'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateCustomerModal(false);
                  setCreateCustomerErrors({});
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

