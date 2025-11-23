'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import {
  Plus,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  Truck,
  AlertCircle,
} from 'lucide-react';

interface PurchaseRecord {
  _id: string;
  purchaseOrderNumber: string;
  supplierId: {
    _id: string;
    companyName: string;
    phone?: string;
  };
  supplierInvoiceNumber?: string;
  status: string;
  paymentStatus: string;
  orderDate: string;
  grandTotal: number;
  dueAmount: number;
  receivedDate?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function PurchaseListPage() {
  const searchParams = useSearchParams();
  const initialSupplierId = searchParams?.get('supplierId') || '';

  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [paymentFilter, setPaymentFilter] = useState<string>('');
  const [supplierFilter, setSupplierFilter] = useState<string>(initialSupplierId);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);

  const limit = 20;

  const fetchPurchases = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.getPurchases({
        page,
        limit,
        search: search || undefined,
        status: statusFilter || undefined,
        paymentStatus: paymentFilter || undefined,
        supplierId: supplierFilter || undefined,
        startDate: dateFrom || undefined,
        endDate: dateTo || undefined,
      });

      setPurchases(response.data || []);
      if (response.pagination) {
        setPagination(response.pagination);
      } else {
        setPagination({
          page,
          limit,
          total: response.data?.length || 0,
          totalPages: 1,
        });
      }
    } catch (err) {
      console.error('Failed to load purchases', err);
      setError('Unable to fetch purchase orders at the moment.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dateFrom, dateTo, limit, page, paymentFilter, search, statusFilter, supplierFilter]);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPurchases();
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPurchases();
  };

  return (
    <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Purchase Orders</h1>
            <p className="text-gray-600 mt-2">
              Track purchase orders, goods received notes, and supplier payments in real time.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="btn btn-secondary flex items-center gap-2"
              disabled={refreshing}
            >
              {refreshing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              Refresh
            </button>
            <Link
              href="/purchases/create"
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus size={18} />
              Create Purchase
            </Link>
          </div>
        </div>

        <div className="card">
          <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by PO number or supplier invoice"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Statuses</option>
              <option value="ordered">Ordered</option>
              <option value="received">Received</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={paymentFilter}
              onChange={(e) => {
                setPaymentFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Payment States</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
            </select>
            <input
              type="text"
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              placeholder="Supplier ID (optional)"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary flex items-center gap-2 md:justify-center"
            >
              <Filter size={16} />
              Apply
            </button>
          </form>
        </div>

        {error && (
          <div className="card border border-red-200 bg-red-50 text-red-700">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          </div>
        )}

        <div className="card">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading purchase orders...</p>
            </div>
          ) : purchases.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto mb-4 w-14 h-14 flex items-center justify-center rounded-full bg-primary-50 text-primary-600">
                <Truck size={28} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No purchase orders yet</h3>
              <p className="text-gray-600 mb-4">
                Create a purchase order to receive stock directly into your inventory and maintain supplier balances.
              </p>
              <Link href="/purchases/create" className="btn btn-primary inline-flex items-center gap-2">
                <Plus size={18} />
                Create Purchase
              </Link>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">PO Number</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Supplier</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Order Date</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Total (৳)</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Due (৳)</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Payment</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.map((purchase) => (
                      <tr key={purchase._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-semibold text-gray-900">{purchase.purchaseOrderNumber}</p>
                            {purchase.supplierInvoiceNumber && (
                              <p className="text-xs text-gray-500">
                                Supplier Invoice: {purchase.supplierInvoiceNumber}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">
                              {purchase.supplierId?.companyName || 'Supplier removed'}
                            </span>
                            {purchase.supplierId?.phone && (
                              <span className="text-xs text-gray-500">{purchase.supplierId.phone}</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {new Date(purchase.orderDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {purchase.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-sm font-semibold text-orange-600">
                          {purchase.dueAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded ${
                              purchase.status === 'completed'
                                ? 'bg-green-100 text-green-700'
                                : purchase.status === 'received'
                                ? 'bg-blue-100 text-blue-700'
                                : purchase.status === 'cancelled'
                                ? 'bg-gray-200 text-gray-600'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {purchase.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded ${
                              purchase.paymentStatus === 'paid'
                                ? 'bg-green-100 text-green-700'
                                : purchase.paymentStatus === 'partial'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-orange-100 text-orange-700'
                            }`}
                          >
                            {purchase.paymentStatus.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            href={`/purchases/${purchase._id}`}
                            className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Showing page {pagination.page} of {pagination.totalPages}
                  </p>
                  <div className="inline-flex items-center gap-2">
                    <button
                      disabled={pagination.page === 1}
                      onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                      className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      disabled={pagination.page === pagination.totalPages}
                      onClick={() => setPage((prev) =>
                        pagination ? Math.min(pagination.totalPages, prev + 1) : prev + 1
                      )}
                      className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
  );
}


