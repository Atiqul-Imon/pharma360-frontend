'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import RoleGuard from '@/components/RoleGuard';
import { api } from '@/lib/api';

interface MedicineSummary {
  name: string;
  genericName?: string;
  strength?: string;
  manufacturer?: string;
  minStockLevel?: number;
}

interface BatchFormState {
  medicineId: string;
  batchNumber: string;
  expiryDate: string;
  purchaseDate: string;
  supplierId: string;
  purchasePrice: string;
  mrp: string;
  sellingPrice: string;
  quantity: string;
  alertThreshold: string;
}

function AddBatchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const medicineIdParam = searchParams.get('medicineId');

  const [loading, setLoading] = useState(false);
  const [loadingMedicine, setLoadingMedicine] = useState(Boolean(medicineIdParam));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [medicine, setMedicine] = useState<MedicineSummary | null>(null);
  const [formData, setFormData] = useState<BatchFormState>({
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
              : 'Failed to add batch'),
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (loadingMedicine) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600"></div>
          <p className="text-gray-600">Loading medicine details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-8">
      <div className="mb-8">
        <Link href="/inventory" className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft size={20} />
          Back to Inventory
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Add Stock Batch</h1>
        <p className="mt-2 text-gray-600">Add a new batch of medicine to your inventory</p>
      </div>

      {medicine && (
        <div className="card mb-6 border-primary-200 bg-primary-50">
          <h3 className="mb-2 font-semibold text-primary-900">Adding stock for:</h3>
          <p className="text-lg font-bold text-primary-900">{medicine.name}</p>
          <p className="text-sm text-primary-700">
            {medicine.genericName} | {medicine.strength} | {medicine.manufacturer}
          </p>
        </div>
      )}

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.general && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              {errors.general}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="batchNumber" className="mb-2 block text-sm font-medium text-gray-700">
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

            <div>
              <label htmlFor="quantity" className="mb-2 block text-sm font-medium text-gray-700">
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

            <div>
              <label htmlFor="expiryDate" className="mb-2 block text-sm font-medium text-gray-700">
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

            <div>
              <label htmlFor="purchaseDate" className="mb-2 block text-sm font-medium text-gray-700">
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

            <div>
              <label htmlFor="purchasePrice" className="mb-2 block text-sm font-medium text-gray-700">
                Purchase Price (per unit) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 transform text-gray-500">৳</span>
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

            <div>
              <label htmlFor="mrp" className="mb-2 block text-sm font-medium text-gray-700">
                MRP (Maximum Retail Price) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 transform text-gray-500">৳</span>
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

            <div>
              <label htmlFor="sellingPrice" className="mb-2 block text-sm font-medium text-gray-700">
                Selling Price (per unit) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 transform text-gray-500">৳</span>
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

            <div>
              <label htmlFor="alertThreshold" className="mb-2 block text-sm font-medium text-gray-700">
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
              <p className="mt-1 text-xs text-gray-500">
                Alert when this batch stock falls below this level
              </p>
            </div>
          </div>

          {formData.purchasePrice && formData.sellingPrice && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <h4 className="mb-2 font-semibold text-green-900">Profit Analysis</h4>
              <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
                <div>
                  <p className="text-green-700">Profit per unit:</p>
                  <p className="font-bold text-green-900">
                    ৳ {(Number(formData.sellingPrice) - Number(formData.purchasePrice)).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-green-700">Profit margin:</p>
                  <p className="font-bold text-green-900">
                    {(
                      ((Number(formData.sellingPrice) - Number(formData.purchasePrice)) /
                        Number(formData.purchasePrice || 1)) *
                      100
                    ).toFixed(1)}
                    %
                  </p>
                </div>
                <div>
                  <p className="text-green-700">Total profit (if all sold):</p>
                  <p className="font-bold text-green-900">
                    ৳{' '}
                    {(
                      (Number(formData.sellingPrice) - Number(formData.purchasePrice)) *
                      Number(formData.quantity || 0)
                    ).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4 border-t border-gray-200 pt-6">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-50"
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
  );
}

export default function AddBatchPage() {
  return (
    <DashboardLayout>
      <RoleGuard allowedRoles={['owner', 'admin']}>
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600"></div>
                <p className="text-gray-600">Preparing batch form...</p>
              </div>
            </div>
          }
        >
          <AddBatchPageContent />
        </Suspense>
      </RoleGuard>
    </DashboardLayout>
  );
}

