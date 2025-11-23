'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import RoleGuard from '@/components/RoleGuard';

export default function AddMedicinePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    manufacturer: '',
    category: 'Tablet',
    strength: '',
    unit: 'Piece',
    barcode: '',
    minStockLevel: 10,
    maxStockLevel: '',
    shelf: '',
    schedule: '',
  });

  const categories = [
    'Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 
    'Ointment', 'Drop', 'Spray', 'Inhaler', 'Other'
  ];

  const units = ['Piece', 'Strip', 'Box', 'Bottle', 'Tube', 'Vial', 'Sachet'];

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
      // Prepare data and clean up empty strings
      const submitData: any = {
        name: formData.name,
        genericName: formData.genericName,
        manufacturer: formData.manufacturer,
        category: formData.category,
        strength: formData.strength,
        unit: formData.unit,
        minStockLevel: Number(formData.minStockLevel),
      };

      // Only include barcode if it's not empty
      if (formData.barcode && formData.barcode.trim()) {
        submitData.barcode = formData.barcode.trim();
      }

      // Only include optional fields if they have values
      if (formData.maxStockLevel) {
        submitData.maxStockLevel = Number(formData.maxStockLevel);
      }
      if (formData.shelf && formData.shelf.trim()) {
        submitData.shelf = formData.shelf.trim();
      }
      if (formData.schedule && formData.schedule.trim()) {
        submitData.schedule = formData.schedule.trim();
      }

      await api.createMedicine(submitData);

      router.push('/inventory');
    } catch (error: any) {
      if (error.response?.data?.error?.details) {
        setErrors(error.response.data.error.details);
      } else {
        setErrors({ general: error.response?.data?.error?.message || 'Failed to add medicine' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <RoleGuard allowedRoles={['owner', 'admin']}>
        <div className="p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/inventory" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft size={20} />
            Back to Inventory
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Add New Medicine</h1>
          <p className="text-gray-600 mt-2">Add a new medicine to your inventory catalog</p>
        </div>

        {/* Form */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.general && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {errors.general}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Medicine Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Medicine Name *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className={`input ${errors.name ? 'border-red-500' : ''}`}
                  placeholder="e.g., Napa"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              {/* Generic Name */}
              <div>
                <label htmlFor="genericName" className="block text-sm font-medium text-gray-700 mb-2">
                  Generic Name *
                </label>
                <input
                  id="genericName"
                  name="genericName"
                  type="text"
                  required
                  value={formData.genericName}
                  onChange={handleChange}
                  className={`input ${errors.genericName ? 'border-red-500' : ''}`}
                  placeholder="e.g., Paracetamol"
                />
                {errors.genericName && <p className="mt-1 text-sm text-red-600">{errors.genericName}</p>}
              </div>

              {/* Manufacturer */}
              <div>
                <label htmlFor="manufacturer" className="block text-sm font-medium text-gray-700 mb-2">
                  Manufacturer *
                </label>
                <input
                  id="manufacturer"
                  name="manufacturer"
                  type="text"
                  required
                  value={formData.manufacturer}
                  onChange={handleChange}
                  className={`input ${errors.manufacturer ? 'border-red-500' : ''}`}
                  placeholder="e.g., Beximco Pharmaceuticals"
                />
                {errors.manufacturer && <p className="mt-1 text-sm text-red-600">{errors.manufacturer}</p>}
              </div>

              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleChange}
                  className="input"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Strength */}
              <div>
                <label htmlFor="strength" className="block text-sm font-medium text-gray-700 mb-2">
                  Strength *
                </label>
                <input
                  id="strength"
                  name="strength"
                  type="text"
                  required
                  value={formData.strength}
                  onChange={handleChange}
                  className={`input ${errors.strength ? 'border-red-500' : ''}`}
                  placeholder="e.g., 500mg"
                />
                {errors.strength && <p className="mt-1 text-sm text-red-600">{errors.strength}</p>}
              </div>

              {/* Unit */}
              <div>
                <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-2">
                  Unit *
                </label>
                <select
                  id="unit"
                  name="unit"
                  required
                  value={formData.unit}
                  onChange={handleChange}
                  className="input"
                >
                  {units.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>

              {/* Barcode */}
              <div>
                <label htmlFor="barcode" className="block text-sm font-medium text-gray-700 mb-2">
                  Barcode (optional)
                </label>
                <input
                  id="barcode"
                  name="barcode"
                  type="text"
                  value={formData.barcode}
                  onChange={handleChange}
                  className={`input ${errors.barcode ? 'border-red-500' : ''}`}
                  placeholder="e.g., 1234567890123"
                />
                {errors.barcode && <p className="mt-1 text-sm text-red-600">{errors.barcode}</p>}
              </div>

              {/* Schedule */}
              <div>
                <label htmlFor="schedule" className="block text-sm font-medium text-gray-700 mb-2">
                  Schedule (Bangladesh)
                </label>
                <select
                  id="schedule"
                  name="schedule"
                  value={formData.schedule}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="">None</option>
                  <option value="H">H - High Alert</option>
                  <option value="G">G - General</option>
                  <option value="X">X - Controlled Substance</option>
                </select>
              </div>

              {/* Min Stock Level */}
              <div>
                <label htmlFor="minStockLevel" className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Stock Level *
                </label>
                <input
                  id="minStockLevel"
                  name="minStockLevel"
                  type="number"
                  required
                  min="0"
                  value={formData.minStockLevel}
                  onChange={handleChange}
                  className="input"
                  placeholder="10"
                />
                <p className="mt-1 text-xs text-gray-500">Alert when stock falls below this level</p>
              </div>

              {/* Max Stock Level */}
              <div>
                <label htmlFor="maxStockLevel" className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Stock Level (optional)
                </label>
                <input
                  id="maxStockLevel"
                  name="maxStockLevel"
                  type="number"
                  min="0"
                  value={formData.maxStockLevel}
                  onChange={handleChange}
                  className="input"
                  placeholder="100"
                />
              </div>

              {/* Shelf Location */}
              <div className="md:col-span-2">
                <label htmlFor="shelf" className="block text-sm font-medium text-gray-700 mb-2">
                  Shelf Location (optional)
                </label>
                <input
                  id="shelf"
                  name="shelf"
                  type="text"
                  value={formData.shelf}
                  onChange={handleChange}
                  className="input"
                  placeholder="e.g., A-12, Rack 3, Shelf 2"
                />
                <p className="mt-1 text-xs text-gray-500">Physical location in your pharmacy</p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Adding Medicine...' : 'Add Medicine'}
              </button>
              <Link href="/inventory" className="btn btn-secondary">
                Cancel
              </Link>
            </div>
          </form>
        </div>

        {/* Next Steps */}
        <div className="mt-6 card bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">📦 Next Step: Add Stock</h3>
          <p className="text-sm text-blue-800">
            After adding the medicine, you'll need to add inventory batches with purchase details, 
            expiry dates, and quantities to start selling.
          </p>
        </div>
        </div>
      </RoleGuard>
    </DashboardLayout>
  );
}
