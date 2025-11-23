'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';
import { Search, Plus, Users, Award, CreditCard, Phone, Mail } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.getCustomers({
        page,
        limit,
        search: searchQuery || undefined,
      });

      setCustomers(response.data);
      setTotal(response.pagination?.total || 0);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  }, [limit, page, searchQuery]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCustomers();
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Customer Management</h1>
            <p className="text-gray-600 mt-2">Manage your customer relationships and loyalty program</p>
          </div>
          <Link 
            href="/customers/add"
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            Add Customer
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center gap-3">
              <Users className="text-primary-600" size={24} />
              <div>
                <p className="text-sm text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">{total}</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <Award className="text-yellow-600" size={24} />
              <div>
                <p className="text-sm text-gray-600">VIP Customers</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {customers.filter(c => c.status === 'vip').length}
                </p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <CreditCard className="text-orange-600" size={24} />
              <div>
                <p className="text-sm text-gray-600">Outstanding Dues</p>
                <p className="text-2xl font-bold text-orange-600">
                  ৳ {customers.reduce((sum, c) => sum + (c.dueAmount || 0), 0).toFixed(0)}
                </p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <Users className="text-green-600" size={24} />
              <div>
                <p className="text-sm text-gray-600">Active Customers</p>
                <p className="text-2xl font-bold text-green-600">
                  {customers.filter(c => c.status === 'active').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="card mb-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name or phone number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Search
            </button>
          </form>
        </div>

        {/* Customers Table */}
        <div className="card">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading customers...</p>
            </div>
          ) : customers.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Customer</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Contact</th>
                      <th className="text-right py-4 px-4 text-sm font-semibold text-gray-700">Total Purchases</th>
                      <th className="text-right py-4 px-4 text-sm font-semibold text-gray-700">Loyalty Points</th>
                      <th className="text-right py-4 px-4 text-sm font-semibold text-gray-700">Due Amount</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Last Purchase</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Status</th>
                      <th className="text-right py-4 px-4 text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((customer) => (
                      <tr key={customer._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <p className="font-medium text-gray-900">{customer.name}</p>
                        </td>
                        <td className="py-4 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone size={14} />
                              {customer.phone}
                            </div>
                            {customer.email && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Mail size={14} />
                                {customer.email}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right text-sm font-medium text-gray-900">
                          ৳ {customer.totalPurchases?.toFixed(2) || '0.00'}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Award size={16} className="text-yellow-600" />
                            <span className="font-medium text-yellow-600">{customer.loyaltyPoints || 0}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          {customer.dueAmount > 0 ? (
                            <span className="font-medium text-orange-600">
                              ৳ {customer.dueAmount.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">
                          {customer.lastPurchaseDate 
                            ? format(new Date(customer.lastPurchaseDate), 'MMM d, yyyy')
                            : 'Never'
                          }
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                            customer.status === 'vip' 
                              ? 'bg-yellow-100 text-yellow-700'
                              : customer.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {customer.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/customers/${customer._id}`}
                              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                            >
                              View Details
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} customers
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={page * limit >= total}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Users className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No customers found</h3>
              <p className="text-gray-600 mb-6">
                {searchQuery 
                  ? 'Try adjusting your search query' 
                  : 'Start building customer relationships by adding your first customer'
                }
              </p>
              {!searchQuery && (
                <Link href="/customers/add" className="btn btn-primary inline-flex items-center gap-2">
                  <Plus size={20} />
                  Add Your First Customer
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

