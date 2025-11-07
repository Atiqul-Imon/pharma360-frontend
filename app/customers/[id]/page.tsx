'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';
import { ArrowLeft, Phone, Mail, MapPin, Calendar, Award, CreditCard, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function CustomerDetailsPage() {
  const params = useParams();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<any>(null);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  useEffect(() => {
    fetchData();
  }, [customerId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [customerData, purchasesData] = await Promise.all([
        api.getCustomerById(customerId),
        api.getCustomerPurchases(customerId, { page: 1, limit: 10 }),
      ]);

      setCustomer(customerData.data);
      setPurchases(purchasesData.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayDue = async () => {
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      alert('Please enter valid payment amount');
      return;
    }

    try {
      await api.recordDuePayment(customerId, {
        amount: Number(paymentAmount),
        paymentMethod,
      });

      setPaymentAmount('');
      fetchData();
      alert('Payment recorded successfully');
    } catch (error: any) {
      alert(error.response?.data?.error?.message || 'Failed to record payment');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading customer details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!customer) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="text-center py-12">
            <p className="text-gray-600">Customer not found</p>
            <Link href="/customers" className="btn btn-primary mt-4">
              Back to Customers
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/customers" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft size={20} />
            Back to Customers
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{customer.name}</h1>
          <p className="text-gray-600 mt-2">Customer Profile & Purchase History</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Customer Info */}
          <div className="lg:col-span-2 card">
            <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Phone size={16} />
                  <span className="text-sm">Phone Number</span>
                </div>
                <p className="font-medium text-gray-900">{customer.phone}</p>
              </div>

              {customer.email && (
                <div>
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Mail size={16} />
                    <span className="text-sm">Email</span>
                  </div>
                  <p className="font-medium text-gray-900">{customer.email}</p>
                </div>
              )}

              {customer.address && (
                <div className="col-span-2">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <MapPin size={16} />
                    <span className="text-sm">Address</span>
                  </div>
                  <p className="font-medium text-gray-900">{customer.address}</p>
                </div>
              )}

              {customer.dateOfBirth && (
                <div>
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Calendar size={16} />
                    <span className="text-sm">Date of Birth</span>
                  </div>
                  <p className="font-medium text-gray-900">
                    {format(new Date(customer.dateOfBirth), 'MMM d, yyyy')}
                  </p>
                </div>
              )}

              {customer.gender && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Gender</p>
                  <p className="font-medium text-gray-900 capitalize">{customer.gender}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-600 mb-1">Member Since</p>
                <p className="font-medium text-gray-900">
                  {format(new Date(customer.createdAt), 'MMM d, yyyy')}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Status</p>
                <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                  customer.status === 'vip' 
                    ? 'bg-yellow-100 text-yellow-700'
                    : customer.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {customer.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-6">
            <div className="card">
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <ShoppingBag size={20} />
                <h3 className="text-sm font-medium">Total Purchases</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">৳ {customer.totalPurchases?.toFixed(2) || '0.00'}</p>
            </div>

            <div className="card">
              <div className="flex items-center gap-2 text-yellow-600 mb-2">
                <Award size={20} />
                <h3 className="text-sm font-medium">Loyalty Points</h3>
              </div>
              <p className="text-3xl font-bold text-yellow-600">{customer.loyaltyPoints || 0}</p>
              <p className="text-xs text-gray-500 mt-1">1 point = ৳1 discount</p>
            </div>

            {customer.dueAmount > 0 && (
              <div className="card bg-orange-50 border-orange-200">
                <div className="flex items-center gap-2 text-orange-600 mb-2">
                  <CreditCard size={20} />
                  <h3 className="text-sm font-medium">Outstanding Due</h3>
                </div>
                <p className="text-3xl font-bold text-orange-600">৳ {customer.dueAmount.toFixed(2)}</p>
                
                {/* Record Payment */}
                <div className="mt-4 pt-4 border-t border-orange-200">
                  <label className="block text-sm font-medium text-orange-900 mb-2">
                    Record Payment
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="input mb-2"
                    placeholder="Amount"
                  />
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="input mb-2"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="mobile_banking">Mobile Banking</option>
                  </select>
                  <button
                    onClick={handlePayDue}
                    className="w-full btn btn-primary text-sm"
                  >
                    Record Payment
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Purchase History */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Purchase History</h3>
          
          {purchases.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Invoice</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Items</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Payment</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((sale) => (
                    <tr key={sale._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-900">{sale.invoiceNumber}</p>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {format(new Date(sale.saleDate), 'MMM d, yyyy h:mm a')}
                      </td>
                      <td className="py-3 px-4 text-right text-sm text-gray-600">
                        {sale.items?.length || 0}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900">
                        ৳ {sale.grandTotal?.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded uppercase">
                          {sale.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                          sale.status === 'completed' 
                            ? 'bg-green-100 text-green-700'
                            : sale.status === 'returned'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {sale.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <ShoppingBag className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600">No purchase history yet</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
