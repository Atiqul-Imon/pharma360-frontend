'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';
import { ArrowLeft, Plus, Package, AlertTriangle, Calendar } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import RoleGuard from '@/components/RoleGuard';

export default function MedicineDetailsPage() {
  const params = useParams();
  const medicineId = params.id as string;

  const [medicine, setMedicine] = useState<any>(null);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [medicineData, batchesData] = await Promise.all([
        api.getMedicineById(medicineId),
        api.getBatchesByMedicine(medicineId),
      ]);

      setMedicine(medicineData.data);
      setBatches(batchesData.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [medicineId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalStock = batches.reduce((sum, batch) => sum + batch.quantity, 0);
  const totalValue = batches.reduce((sum, batch) => sum + (batch.quantity * batch.purchasePrice), 0);

  return (
    <DashboardLayout>
      <RoleGuard allowedRoles={['owner', 'admin']}>
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600"></div>
              <p className="text-gray-600">Loading medicine details...</p>
            </div>
          </div>
        ) : !medicine ? (
          <div className="p-8">
            <div className="py-12 text-center">
              <Package className="mb-4 mx-auto text-gray-400" size={48} />
              <h3 className="mb-2 text-lg font-semibold text-gray-900">Medicine not found</h3>
              <Link href="/inventory" className="btn btn-primary mt-4">
                Back to Inventory
              </Link>
            </div>
          </div>
        ) : (
          <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/inventory" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft size={20} />
            Back to Inventory
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{medicine.name}</h1>
              <p className="text-gray-600 mt-2">{medicine.genericName}</p>
            </div>
            <Link
              href={`/inventory/add-batch?medicineId=${medicineId}`}
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus size={20} />
              Add Stock
            </Link>
          </div>
        </div>

        {/* Medicine Details Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 card">
            <h3 className="text-lg font-semibold mb-4">Medicine Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Medicine Name</p>
                <p className="font-medium text-gray-900">{medicine.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Generic Name</p>
                <p className="font-medium text-gray-900">{medicine.genericName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Manufacturer</p>
                <p className="font-medium text-gray-900">{medicine.manufacturer}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Category</p>
                <span className="inline-block px-2 py-1 text-xs font-medium bg-primary-100 text-primary-700 rounded">
                  {medicine.category}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Strength</p>
                <p className="font-medium text-gray-900">{medicine.strength}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Unit</p>
                <p className="font-medium text-gray-900">{medicine.unit}</p>
              </div>
              {medicine.barcode && (
                <div>
                  <p className="text-sm text-gray-600">Barcode</p>
                  <p className="font-medium text-gray-900 font-mono">{medicine.barcode}</p>
                </div>
              )}
              {medicine.shelf && (
                <div>
                  <p className="text-sm text-gray-600">Shelf Location</p>
                  <p className="font-medium text-gray-900">{medicine.shelf}</p>
                </div>
              )}
              {medicine.schedule && (
                <div>
                  <p className="text-sm text-gray-600">Schedule</p>
                  <span className="inline-block px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded">
                    {medicine.schedule}
                  </span>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600">Min Stock Level</p>
                <p className="font-medium text-gray-900">{medicine.minStockLevel}</p>
              </div>
            </div>
          </div>

          {/* Stock Summary */}
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Total Stock</h3>
              <p className="text-3xl font-bold text-gray-900">{totalStock}</p>
              <p className="text-sm text-gray-500 mt-1">{batches.length} batches</p>
            </div>

            <div className="card">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Total Value</h3>
              <p className="text-3xl font-bold text-gray-900">৳ {totalValue.toFixed(2)}</p>
              <p className="text-sm text-gray-500 mt-1">Purchase value</p>
            </div>

            {totalStock < medicine.minStockLevel && (
              <div className="card bg-orange-50 border-orange-200">
                <div className="flex items-center gap-2 text-orange-600 mb-2">
                  <AlertTriangle size={20} />
                  <h3 className="font-semibold">Low Stock Alert</h3>
                </div>
                <p className="text-sm text-orange-700">
                  Stock is below minimum level of {medicine.minStockLevel}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Batches Table */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Stock Batches</h3>
            <Link
              href={`/inventory/add-batch?medicineId=${medicineId}`}
              className="btn btn-secondary flex items-center gap-2 text-sm"
            >
              <Plus size={16} />
              Add New Batch
            </Link>
          </div>

          {batches.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Batch Number</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Expiry Date</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Quantity</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Purchase Price</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Selling Price</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">MRP</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map((batch) => {
                    const isExpiringSoon = new Date(batch.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                    const isExpired = new Date(batch.expiryDate) < new Date();
                    const isLowStock = batch.quantity <= batch.alertThreshold;

                    return (
                      <tr key={batch._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-900">{batch.batchNumber}</p>
                          <p className="text-xs text-gray-500">
                            Added: {format(new Date(batch.purchaseDate), 'MMM d, yyyy')}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className={isExpired ? 'text-red-600' : isExpiringSoon ? 'text-orange-600' : 'text-gray-400'} />
                            <span className={`text-sm ${isExpired ? 'text-red-600 font-medium' : isExpiringSoon ? 'text-orange-600' : 'text-gray-600'}`}>
                              {format(new Date(batch.expiryDate), 'MMM d, yyyy')}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={`font-medium ${isLowStock ? 'text-orange-600' : 'text-gray-900'}`}>
                            {batch.quantity}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-sm text-gray-600">
                          ৳ {batch.purchasePrice.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right text-sm font-medium text-gray-900">
                          ৳ {batch.sellingPrice.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right text-sm text-gray-600">
                          ৳ {batch.mrp.toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1">
                            {isExpired && (
                              <span className="inline-block px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded">
                                Expired
                              </span>
                            )}
                            {!isExpired && isExpiringSoon && (
                              <span className="inline-block px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded">
                                Expiring Soon
                              </span>
                            )}
                            {isLowStock && batch.quantity > 0 && (
                              <span className="inline-block px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded">
                                Low Stock
                              </span>
                            )}
                            {batch.quantity === 0 && (
                              <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                                Out of Stock
                              </span>
                            )}
                            {!isExpired && !isExpiringSoon && !isLowStock && batch.quantity > 0 && (
                              <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">
                                Active
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No stock batches yet</h3>
              <p className="text-gray-600 mb-6">
                Add your first stock batch to start selling this medicine
              </p>
              <Link
                href={`/inventory/add-batch?medicineId=${medicineId}`}
                className="btn btn-primary inline-flex items-center gap-2"
              >
                <Plus size={20} />
                Add First Batch
              </Link>
            </div>
          )}
        </div>
          </div>
        )}
      </RoleGuard>
    </DashboardLayout>
  );
}

