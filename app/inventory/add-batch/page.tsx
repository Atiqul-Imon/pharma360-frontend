'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AddBatchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const medicineIdParam = searchParams.get('medicineId');

  const [loading, setLoading] = useState(false);
  const [loadingMedicine, setLoadingMedicine] = useState(!!medicineIdParam);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [medicine, setMedicine] = useState<any>(null);
  const [formData, setFormData] = useState({
    medicineId: medicineIdParam || '',
    batchNumber: '',
    expiryDate: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    supplierId: '',
    purchasePrice: '',
    mrp: '',
    sellingPrice: '',
    quantity: '',
    alertThreshold: '10',
  });

  useEffect(() => {
    if (medicineIdParam) {
      fetchMedicine(medicineIdParam);
    }
  }, [medicineIdParam]);

  const fetchMedicine = async (id: string) => {
    try {
      const response = await api.getMedicineById(id);
      setMedicine(response.data);
      setFormData(prev => ({
        ...prev,
        medicineId: id,
        alertThreshold: String(response.data.minStockLevel || 10),
      }));
    } catch (error) {
      console.error('Error fetching medicine:', error);
    } finally {
      setLoadingMedicine(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      await api.addBatch({
        medicineId: formData.medicineId,
        batchNumber: formData.batchNumber,
        expiryDate: new Date(formData.expiryDate),
        purchaseDate: new Date(formData.purchaseDate),
        supplierId: formData.supplierId || undefined,
        purchasePrice: Number(formData.purchasePrice),
        mrp: Number(formData.mrp),
        sellingPrice: Number(formData.sellingPrice),
        quantity: Number(formData.quantity),
        alertThreshold: Number(formData.alertThreshold),
      });

      router.push('/inventory');
    } catch (error: any) {
      if (error.response?.data?.error?.details) {
        setErrors(error.response.data.error.details);
      } else {
        setErrors({ general: error.response?.data?.error?.message || 'Failed to add batch' });
      }
    } finally {
      setLoading(false);
    }
  };

  if (loadingMedicine) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading medicine details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/inventory" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft size={20} />
            Back to Inventory
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Add Stock Batch</h1>
          <p className="text-gray-600 mt-2">Add a new batch of medicine to your inventory</p>
        </div>

        {/* Medicine Info */}
        {medicine && (
          <div className="card mb-6 bg-primary-50 border-primary-200">
            <h3 className="font-semibold text-primary-900 mb-2">Adding stock for:</h3>
            <p className="text-lg font-bold text-primary-900">{medicine.name}</p>
            <p className="text-sm text-primary-700">
              {medicine.genericName} | {medicine.strength} | {medicine.manufacturer}
            </p>
          </div>
        )}

        {/* Form */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.general && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {errors.general}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Batch Number */}
              <div>
                <label htmlFor="batchNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Batch Number *
                </label>
                <input
                  id="batchNumber"
                  name="batchNumber"
                  type="text"
                  required
                  value={formData.batchNumber}
                  onChange={handleChange}
                  className={`input ${errors.batchNumber ? 'border-red-500' : ''}`}
                  placeholder="e.g., BATCH2024001"
                />
                {errors.batchNumber && <p className="mt-1 text-sm text-red-600">{errors.batchNumber}</p>}
              </div>

              {/* Quantity */}
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity *
                </label>
                <input
                  id="quantity"
                  name="quantity"
                  type="number"
                  required
                  min="1"
                  value={formData.quantity}
                  onChange={handleChange}
                  className={`input ${errors.quantity ? 'border-red-500' : ''}`}
                  placeholder="100"
                />
                {errors.quantity && <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>}
              </div>

              {/* Expiry Date */}
              <div>
                <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Expiry Date *
                </label>
                <input
                  id="expiryDate"
                  name="expiryDate"
                  type="date"
                  required
                  value={formData.expiryDate}
                  onChange={handleChange}
                  className={`input ${errors.expiryDate ? 'border-red-500' : ''}`}
                />
                {errors.expiryDate && <p className="mt-1 text-sm text-red-600">{errors.expiryDate}</p>}
              </div>

              {/* Purchase Date */}
              <div>
                <label htmlFor="purchaseDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Purchase Date *
                </label>
                <input
                  id="purchaseDate"
                  name="purchaseDate"
                  type="date"
                  required
                  value={formData.purchaseDate}
                  onChange={handleChange}
                  className="input"
                />
              </div>

              {/* Purchase Price */}
              <div>
                <label htmlFor="purchasePrice" className="block text-sm font-medium text-gray-700 mb-2">
                  Purchase Price (per unit) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">৳</span>
                  <input
                    id="purchasePrice"
                    name="purchasePrice"
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.purchasePrice}
                    onChange={handleChange}
                    className={`input pl-8 ${errors.purchasePrice ? 'border-red-500' : ''}`}
                    placeholder="10.00"
                  />
                </div>
                {errors.purchasePrice && <p className="mt-1 text-sm text-red-600">{errors.purchasePrice}</p>}
              </div>

              {/* MRP */}
              <div>
                <label htmlFor="mrp" className="block text-sm font-medium text-gray-700 mb-2">
                  MRP (Maximum Retail Price) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">৳</span>
                  <input
                    id="mrp"
                    name="mrp"
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.mrp}
                    onChange={handleChange}
                    className={`input pl-8 ${errors.mrp ? 'border-red-500' : ''}`}
                    placeholder="15.00"
                  />
                </div>
                {errors.mrp && <p className="mt-1 text-sm text-red-600">{errors.mrp}</p>}
              </div>

              {/* Selling Price */}
              <div>
                <label htmlFor="sellingPrice" className="block text-sm font-medium text-gray-700 mb-2">
                  Selling Price (per unit) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">৳</span>
                  <input
                    id="sellingPrice"
                    name="sellingPrice"
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.sellingPrice}
                    onChange={handleChange}
                    className={`input pl-8 ${errors.sellingPrice ? 'border-red-500' : ''}`}
                    placeholder="12.00"
                  />
                </div>
                {errors.sellingPrice && <p className="mt-1 text-sm text-red-600">{errors.sellingPrice}</p>}
              </div>

              {/* Alert Threshold */}
              <div>
                <label htmlFor="alertThreshold" className="block text-sm font-medium text-gray-700 mb-2">
                  Low Stock Alert Level *
                </label>
                <input
                  id="alertThreshold"
                  name="alertThreshold"
                  type="number"
                  required
                  min="0"
                  value={formData.alertThreshold}
                  onChange={handleChange}
                  className="input"
                  placeholder="10"
                />
                <p className="mt-1 text-xs text-gray-500">Alert when this batch stock falls below this level</p>
              </div>
            </div>

            {/* Profit Margin Calculation */}
            {formData.purchasePrice && formData.sellingPrice && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">Profit Analysis</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-green-700">Profit per unit:</p>
                    <p className="font-bold text-green-900">
                      ৳ {(Number(formData.sellingPrice) - Number(formData.purchasePrice)).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-green-700">Profit margin:</p>
                    <p className="font-bold text-green-900">
                      {(((Number(formData.sellingPrice) - Number(formData.purchasePrice)) / Number(formData.purchasePrice)) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-green-700">Total profit (if all sold):</p>
                    <p className="font-bold text-green-900">
                      ৳ {((Number(formData.sellingPrice) - Number(formData.purchasePrice)) * Number(formData.quantity || 0)).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Adding Batch...' : 'Add Batch'}
              </button>
              <Link href="/inventory" className="btn btn-secondary">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}

