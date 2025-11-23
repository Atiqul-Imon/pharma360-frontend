'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Calendar, TrendingUp, Download, DollarSign, ShoppingCart, Package } from 'lucide-react';
import { subDays } from 'date-fns';
import RoleGuard from '@/components/RoleGuard';

export default function ReportsPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyReport, setDailyReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.getDailySalesReport(selectedDate);
      setDailyReport(response.data);
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const paymentMethodData = dailyReport ? [
    { name: 'Cash', value: dailyReport.cashSales, color: '#10b981' },
    { name: 'Card', value: dailyReport.cardSales, color: '#3b82f6' },
    { name: 'Mobile Banking', value: dailyReport.mobileBankingSales, color: '#8b5cf6' },
    { name: 'Credit', value: dailyReport.creditSales, color: '#f59e0b' },
  ].filter(item => item.value > 0) : [];

  return (
    <DashboardLayout>
      <RoleGuard allowedRoles={['owner', 'admin']}>
        <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600 mt-2">Track sales performance and business insights</p>
          </div>
          <button className="btn btn-secondary flex items-center gap-2">
            <Download size={20} />
            Export Report
          </button>
        </div>

        {/* Date Selector */}
        <div className="card mb-8">
          <div className="flex items-center gap-4">
            <Calendar className="text-gray-600" size={20} />
            <label className="text-sm font-medium text-gray-700">Select Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="input max-w-xs"
            />
            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                className="btn btn-secondary text-sm"
              >
                Today
              </button>
              <button
                onClick={() => setSelectedDate(subDays(new Date(), 1).toISOString().split('T')[0])}
                className="btn btn-secondary text-sm"
              >
                Yesterday
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading report...</p>
          </div>
        ) : dailyReport ? (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="card">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="text-green-600" size={24} />
                  <h3 className="text-sm font-medium text-gray-600">Total Sales</h3>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  ৳ {dailyReport.totalSales?.toLocaleString() || 0}
                </p>
                <p className="text-sm text-gray-500 mt-1">{dailyReport.totalOrders || 0} orders</p>
              </div>

              <div className="card">
                <div className="flex items-center gap-3 mb-2">
                  <ShoppingCart className="text-primary-600" size={24} />
                  <h3 className="text-sm font-medium text-gray-600">Average Order</h3>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  ৳ {dailyReport.averageOrderValue?.toFixed(2) || 0}
                </p>
              </div>

              <div className="card">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="text-blue-600" size={24} />
                  <h3 className="text-sm font-medium text-gray-600">Cash Sales</h3>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  ৳ {dailyReport.cashSales?.toLocaleString() || 0}
                </p>
              </div>

              <div className="card">
                <div className="flex items-center gap-3 mb-2">
                  <Package className="text-purple-600" size={24} />
                  <h3 className="text-sm font-medium text-gray-600">Credit Sales</h3>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  ৳ {dailyReport.creditSales?.toLocaleString() || 0}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Payment Methods Chart */}
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Sales by Payment Method</h3>
                {paymentMethodData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={paymentMethodData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {paymentMethodData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `৳ ${value.toFixed(2)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-500 text-center py-12">No sales data for selected date</p>
                )}
              </div>

              {/* Top Selling Medicines */}
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Top Selling Medicines</h3>
                {dailyReport.topSellingMedicines?.length > 0 ? (
                  <div className="space-y-3">
                    {dailyReport.topSellingMedicines.slice(0, 5).map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{item.medicineName}</p>
                          <p className="text-sm text-gray-600">Qty: {item.quantitySold}</p>
                        </div>
                        <p className="font-bold text-primary-600">৳ {item.revenue.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-12">No sales data for selected date</p>
                )}
              </div>
            </div>

            {/* Payment Breakdown */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Payment Method Breakdown</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700 mb-1">Cash</p>
                  <p className="text-2xl font-bold text-green-900">৳ {dailyReport.cashSales?.toLocaleString() || 0}</p>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700 mb-1">Card</p>
                  <p className="text-2xl font-bold text-blue-900">৳ {dailyReport.cardSales?.toLocaleString() || 0}</p>
                </div>
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-sm text-purple-700 mb-1">Mobile Banking</p>
                  <p className="text-2xl font-bold text-purple-900">৳ {dailyReport.mobileBankingSales?.toLocaleString() || 0}</p>
                </div>
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-700 mb-1">Credit</p>
                  <p className="text-2xl font-bold text-orange-900">৳ {dailyReport.creditSales?.toLocaleString() || 0}</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="card text-center py-12">
            <p className="text-gray-600">No data available for selected date</p>
          </div>
        )}
        </div>
      </RoleGuard>
    </DashboardLayout>
  );
}

