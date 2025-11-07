'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  ClipboardList,
  Truck,
  Ban,
  CheckCircle,
  Loader2,
  Calendar,
  AlertCircle,
} from 'lucide-react';

interface SupplierDetail {
  _id: string;
  name: string;
  companyName: string;
  phone: string;
  email?: string;
  address: string;
  licenseNumber?: string;
  creditLimit: number;
  currentDue: number;
  totalPurchases: number;
  lastPurchaseDate?: string;
  rating: number;
  isActive: boolean;
  createdAt: string;
}

interface PurchaseRecord {
  _id: string;
  purchaseOrderNumber: string;
  supplierInvoiceNumber?: string;
  status: string;
  paymentStatus: string;
  orderDate: string;
  grandTotal: number;
  dueAmount: number;
  receivedDate?: string;
}

interface SupplierSummary {
  currentDue: number;
  totalPurchases: number;
  purchaseCount: number;
  lastPurchaseDate?: string;
}

export default function SupplierDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const supplierId = params?.id as string;

  const [supplier, setSupplier] = useState<SupplierDetail | null>(null);
  const [summary, setSummary] = useState<SupplierSummary | null>(null);
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchSupplier = async () => {
    try {
      setLoading(true);
      const response = await api.getSupplierById(supplierId);
      setSupplier(response.data?.supplier);
      setSummary(response.data?.summary);
    } catch (err) {
      console.error('Failed to load supplier', err);
      setError('Unable to load supplier details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchases = async () => {
    try {
      setPurchaseLoading(true);
      const response = await api.getPurchases({ supplierId, limit: 10 });
      setPurchases(response.data || []);
    } catch (err) {
      console.error('Failed to load supplier purchases', err);
    } finally {
      setPurchaseLoading(false);
    }
  };

  useEffect(() => {
    if (supplierId) {
      fetchSupplier();
      fetchPurchases();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supplierId]);

  const handleToggleStatus = async () => {
    if (!supplier) return;
    setActionLoading(true);
    try {
      await api.toggleSupplierStatus(supplier._id, !supplier.isActive);
      setSupplier({ ...supplier, isActive: !supplier.isActive });
    } catch (err) {
      console.error('Failed to toggle supplier status', err);
      setError('Could not update supplier status. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading supplier details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !supplier) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="card border border-red-200 bg-red-50 text-red-700">
            <div className="flex items-center gap-3">
              <AlertCircle size={24} />
              <div>
                <h2 className="text-lg font-semibold">Supplier not available</h2>
                <p className="text-sm">
                  {error || 'The supplier you are looking for could not be found.'}
                </p>
                <Link href="/suppliers" className="btn btn-secondary mt-4 inline-flex items-center gap-2">
                  <ArrowLeft size={18} />
                  Back to Suppliers
                </Link>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/suppliers" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
              <ArrowLeft size={20} />
              Back to Suppliers
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">{supplier.companyName}</h1>
            <p className="text-gray-600 mt-2">Managed by {supplier.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/purchases/create?supplierId=${supplier._id}`}
              className="btn btn-primary flex items-center gap-2"
            >
              <ClipboardList size={18} />
              New Purchase Order
            </Link>
            <button
              onClick={handleToggleStatus}
              disabled={actionLoading}
              className="btn btn-secondary flex items-center gap-2"
            >
              {actionLoading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : supplier.isActive ? (
                <>
                  <Ban size={16} /> Deactivate
                </>
              ) : (
                <>
                  <CheckCircle size={16} /> Activate
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center gap-3">
              <Phone className="text-primary-600" size={20} />
              <div>
                <p className="text-sm text-gray-600">Primary Contact</p>
                <p className="font-semibold text-gray-900">{supplier.phone}</p>
                {supplier.email && (
                  <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                    <Mail size={14} className="text-gray-400" />
                    {supplier.email}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <CreditCard className="text-primary-600" size={20} />
              <div>
                <p className="text-sm text-gray-600">Credit Limit</p>
                <p className="text-2xl font-bold text-gray-900">
                  ৳ {supplier.creditLimit.toLocaleString('en-US')}
                </p>
                <p className="text-sm text-orange-600">
                  Outstanding: ৳ {supplier.currentDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <ClipboardList className="text-primary-600" size={20} />
              <div>
                <p className="text-sm text-gray-600">Total Purchases</p>
                <p className="text-2xl font-bold text-gray-900">
                  ৳ {(summary?.totalPurchases || 0).toLocaleString('en-US')}
                </p>
                <p className="text-sm text-gray-600">
                  Orders: {summary?.purchaseCount || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <Calendar className="text-primary-600" size={20} />
              <div>
                <p className="text-sm text-gray-600">Last Purchase</p>
                <p className="text-lg font-semibold text-gray-900">
                  {summary?.lastPurchaseDate
                    ? new Date(summary.lastPurchaseDate).toLocaleDateString()
                    : 'Not recorded'}
                </p>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded mt-2 ${
                    supplier.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {supplier.isActive ? <CheckCircle size={12} /> : <Ban size={12} />}
                  {supplier.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Business Details</h2>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-start gap-3">
                <Truck size={16} className="mt-1 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">Company</p>
                  <p>{supplier.companyName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin size={16} className="mt-1 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">Address</p>
                  <p>{supplier.address}</p>
                </div>
              </div>
              {supplier.licenseNumber && (
                <div className="flex items-start gap-3">
                  <ClipboardList size={16} className="mt-1 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">License / BIN</p>
                    <p>{supplier.licenseNumber}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Snapshot</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-xs uppercase text-purple-600 tracking-wide">Rating</p>
                <p className="text-2xl font-bold text-purple-800 mt-1">
                  {supplier.rating.toFixed(1)} / 5
                </p>
                <p className="text-xs text-purple-700 mt-2">
                  Evaluate on delivery timeliness, product authenticity, and credit discipline.
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-xs uppercase text-blue-600 tracking-wide">Account Age</p>
                <p className="text-2xl font-bold text-blue-800 mt-1">
                  {Math.max(
                    1,
                    Math.round(
                      (new Date().getTime() - new Date(supplier.createdAt).getTime()) /
                        (1000 * 60 * 60 * 24)
                    )
                  )}{' '}
                  days
                </p>
                <p className="text-xs text-blue-700 mt-2">
                  Created on {new Date(supplier.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Purchase Orders</h2>
            <Link
              href={`/purchases?supplierId=${supplier._id}`}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View all
            </Link>
          </div>
          {purchaseLoading ? (
            <div className="text-center py-10">
              <Loader2 className="animate-spin mx-auto text-primary-600" size={32} />
              <p className="text-gray-600 mt-2">Loading purchase history...</p>
            </div>
          ) : purchases.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-600">No purchase orders have been created for this supplier yet.</p>
              <Link
                href={`/purchases/create?supplierId=${supplier._id}`}
                className="btn btn-primary inline-flex items-center gap-2 mt-4"
              >
                <ClipboardList size={18} />
                Create first purchase order
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Order
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Order Date
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Total (৳)
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Due (৳)
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((purchase) => (
                    <tr key={purchase._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {purchase.purchaseOrderNumber}
                          </p>
                          {purchase.supplierInvoiceNumber && (
                            <p className="text-xs text-gray-500">
                              Supplier Invoice: {purchase.supplierInvoiceNumber}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(purchase.orderDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {purchase.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-orange-600">
                        {purchase.dueAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
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
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-primary-50 text-primary-700">
                            {purchase.paymentStatus.toUpperCase()}
                          </span>
                        </div>
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
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}


