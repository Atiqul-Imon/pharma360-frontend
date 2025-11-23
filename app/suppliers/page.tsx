'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';
import {
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Loader2,
  RefreshCw,
  Eye,
  Ban,
  CheckCircle,
  Trash2,
  Truck,
} from 'lucide-react';
import RoleGuard from '@/components/RoleGuard';

interface Supplier {
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

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const limit = 10;

  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.getSuppliers({
        page,
        limit,
        search: search || undefined,
        isActive:
          statusFilter === 'all'
            ? undefined
            : statusFilter === 'active'
            ? true
            : false,
      });

      setSuppliers(response.data || []);
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
      console.error('Failed to load suppliers', err);
      setError('Could not load suppliers. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [limit, page, search, statusFilter]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchSuppliers();
  };

  const handleToggleStatus = async (supplierId: string, isActive: boolean) => {
    try {
      await api.toggleSupplierStatus(supplierId, !isActive);
      setSuppliers((prev) =>
        prev.map((supplier) =>
          supplier._id === supplierId ? { ...supplier, isActive: !isActive } : supplier
        )
      );
    } catch (err) {
      console.error('Failed to update supplier status', err);
      setError('Unable to update supplier status right now.');
    }
  };

  const handleDelete = async (supplierId: string) => {
    const confirmDelete = window.confirm(
      'Deleting a supplier is permanent. Are you sure you want to continue?'
    );
    if (!confirmDelete) return;

    try {
      await api.deleteSupplier(supplierId);
      setSuppliers((prev) => prev.filter((supplier) => supplier._id !== supplierId));
    } catch (err: any) {
      console.error('Failed to delete supplier', err);
      const message =
        err?.response?.data?.error?.message ||
        'Unable to delete supplier. Ensure there are no outstanding dues or purchase history.';
      setError(message);
    }
  };

  const totalDue = useMemo(
    () => suppliers.reduce((sum, supplier) => sum + (supplier.currentDue || 0), 0),
    [suppliers]
  );

  const totalSuppliers = pagination?.total || suppliers.length;

  return (
    <DashboardLayout>
      <RoleGuard allowedRoles={['owner', 'admin']}>
        <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Supplier Management</h1>
            <p className="text-gray-600 mt-2">
              Maintain healthy relationships with your distributors and keep credit under control.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setRefreshing(true);
                fetchSuppliers();
              }}
              className="btn btn-secondary flex items-center gap-2"
              disabled={refreshing}
            >
              {refreshing ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
              Refresh
            </button>
            <Link href="/suppliers/add" className="btn btn-primary flex items-center gap-2">
              <Plus size={20} />
              Add Supplier
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <p className="text-sm text-gray-600">Total Suppliers</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{totalSuppliers}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600">Active Suppliers</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {suppliers.filter((supplier) => supplier.isActive).length}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600">Outstanding Payables (৳)</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">
              {totalDue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search suppliers by name, company, or phone"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as 'all' | 'active' | 'inactive');
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <button type="submit" className="btn btn-primary flex items-center gap-2">
              <Search size={18} />
              Search
            </button>
          </form>
        </div>

        {error && (
          <div className="card border border-red-200 bg-red-50 text-red-700 mb-6">
            <p>{error}</p>
          </div>
        )}

        <div className="card">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading suppliers...</p>
            </div>
          ) : suppliers.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto mb-4 w-14 h-14 flex items-center justify-center rounded-full bg-primary-50 text-primary-600">
                <Truck size={28} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No suppliers yet</h3>
              <p className="text-gray-600 mb-4">
                Add your first supplier to start tracking purchase orders, payables, and delivery performance.
              </p>
              <Link href="/suppliers/add" className="btn btn-primary inline-flex items-center gap-2">
                <Plus size={18} />
                Add Supplier
              </Link>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Supplier</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Contact</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Credit Limit</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Outstanding Due</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Last Purchase</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suppliers.map((supplier) => (
                      <tr key={supplier._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-semibold text-gray-900">{supplier.companyName}</p>
                            <p className="text-sm text-gray-600">Contact: {supplier.name}</p>
                            {supplier.licenseNumber && (
                              <p className="text-xs text-gray-500 mt-1">
                                License: {supplier.licenseNumber}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex items-center gap-2">
                              <Phone size={14} className="text-gray-400" />
                              {supplier.phone}
                            </span>
                            {supplier.email && (
                              <span className="inline-flex items-center gap-2">
                                <Mail size={14} className="text-gray-400" />
                                {supplier.email}
                              </span>
                            )}
                            <span className="inline-flex items-start gap-2">
                              <MapPin size={14} className="text-gray-400 mt-1" />
                              <span>{supplier.address}</span>
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">
                          ৳ {supplier.creditLimit.toLocaleString('en-US')}
                        </td>
                        <td className="py-4 px-4 text-sm font-semibold text-orange-600">
                          ৳ {supplier.currentDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">
                          {supplier.lastPurchaseDate
                            ? new Date(supplier.lastPurchaseDate).toLocaleDateString()
                            : 'Not yet'}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded ${
                              supplier.isActive
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-200 text-gray-600'
                            }`}
                          >
                            {supplier.isActive ? <CheckCircle size={12} /> : <Ban size={12} />}
                            {supplier.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/suppliers/${supplier._id}`}
                              className="btn btn-link flex items-center gap-1 text-primary-600"
                            >
                              <Eye size={16} />
                              View
                            </Link>
                            <button
                              onClick={() => handleToggleStatus(supplier._id, supplier.isActive)}
                              className="btn btn-secondary flex items-center gap-1"
                            >
                              {supplier.isActive ? <Ban size={16} /> : <CheckCircle size={16} />}
                              {supplier.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleDelete(supplier._id)}
                              className="btn btn-secondary flex items-center gap-1 border border-red-200 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 size={16} />
                              Delete
                            </button>
                          </div>
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
                      onClick={() =>
                        setPage((prev) =>
                          pagination ? Math.min(pagination.totalPages, prev + 1) : prev + 1
                        )
                      }
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
      </RoleGuard>
    </DashboardLayout>
  );
}


