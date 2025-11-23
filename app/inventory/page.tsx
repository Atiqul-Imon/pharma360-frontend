'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';
import { Search, Plus, Package, AlertTriangle, Filter } from 'lucide-react';
import Link from 'next/link';
import RoleGuard from '@/components/RoleGuard';

export default function InventoryPage() {
  const [medicines, setMedicines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchMedicines = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.getMedicines({
        page,
        limit,
        search: searchQuery || undefined,
        category: categoryFilter || undefined,
        isActive: true,
      }, true); // Use cache

      setMedicines(response.data);
      setTotal(response.pagination?.total || 0);
    } catch (error: any) {
      // Only log non-cancellation errors
      if (error?.message !== 'Request cancelled') {
        console.error('Error fetching medicines:', error);
      }
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, limit, page, searchQuery]);

  useEffect(() => {
    fetchMedicines();
  }, [fetchMedicines]);

  // Debounce search to reduce API calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery || categoryFilter) {
        setPage(1);
        // Call fetchMedicines directly to avoid dependency issues
        api.getMedicines({
          page: 1,
          limit,
          search: searchQuery || undefined,
          category: categoryFilter || undefined,
          isActive: true,
        }, true).then((response) => {
          setMedicines(response.data);
          setTotal(response.pagination?.total || 0);
        }).catch((error: any) => {
          if (error?.message !== 'Request cancelled') {
            console.error('Error fetching medicines:', error);
          }
        });
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery, categoryFilter, limit]);

  const categories = [
    'Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 
    'Ointment', 'Drop', 'Spray', 'Inhaler', 'Other'
  ];

  return (
    <DashboardLayout>
      <RoleGuard allowedRoles={['owner', 'admin']}>
        <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
            <p className="text-gray-600 mt-2">Manage your medicine catalog and stock levels</p>
          </div>
          <Link 
            href="/inventory/add-medicine"
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            Add Medicine
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center gap-3">
              <Package className="text-primary-600" size={24} />
              <div>
                <p className="text-sm text-gray-600">Total Medicines</p>
                <p className="text-2xl font-bold text-gray-900">{total}</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-orange-600" size={24} />
              <div>
                <p className="text-sm text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-orange-600">-</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-red-600" size={24} />
              <div>
                <p className="text-sm text-gray-600">Near Expiry</p>
                <p className="text-2xl font-bold text-red-600">-</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <Package className="text-green-600" size={24} />
              <div>
                <p className="text-sm text-gray-600">In Stock</p>
                <p className="text-2xl font-bold text-green-600">-</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by name, generic name, or barcode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </form>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <button
              onClick={() => {
                setPage(1);
                fetchMedicines();
              }}
              className="btn btn-primary flex items-center gap-2"
            >
              <Filter size={20} />
              Search
            </button>
          </div>
        </div>

        {/* Medicines Table */}
        <div className="card">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading medicines...</p>
            </div>
          ) : medicines.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Medicine</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Generic Name</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Category</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Strength</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Manufacturer</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Stock</th>
                      <th className="text-right py-4 px-4 text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {medicines.map((medicine) => (
                      <tr key={medicine._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{medicine.name}</p>
                            {medicine.barcode && (
                              <p className="text-xs text-gray-500">Barcode: {medicine.barcode}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">{medicine.genericName}</td>
                        <td className="py-4 px-4">
                          <span className="inline-block px-2 py-1 text-xs font-medium bg-primary-100 text-primary-700 rounded">
                            {medicine.category}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">{medicine.strength}</td>
                        <td className="py-4 px-4 text-sm text-gray-600">{medicine.manufacturer}</td>
                        <td className="py-4 px-4">
                          <Link
                            href={`/inventory/medicine/${medicine._id}`}
                            className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline"
                          >
                            View Stock
                          </Link>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/inventory/medicine/${medicine._id}`}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                              title="View Details"
                            >
                              <Package size={18} />
                            </Link>
                            <Link
                              href={`/inventory/add-batch?medicineId=${medicine._id}`}
                              className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg"
                              title="Add Stock"
                            >
                              <Plus size={18} />
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
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} medicines
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
              <Package className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No medicines found</h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || categoryFilter 
                  ? 'Try adjusting your search or filters' 
                  : 'Get started by adding your first medicine to the inventory'
                }
              </p>
              {!searchQuery && !categoryFilter && (
                <Link href="/inventory/add-medicine" className="btn btn-primary inline-flex items-center gap-2">
                  <Plus size={20} />
                  Add Your First Medicine
                </Link>
              )}
            </div>
          )}
        </div>
        </div>
      </RoleGuard>
    </DashboardLayout>
  );
}

