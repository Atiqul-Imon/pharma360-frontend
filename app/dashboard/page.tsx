'use client';

import { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';
import { useSocket } from '@/lib/hooks/useSocket';
import { TrendingUp, AlertTriangle, Package, ShoppingCart } from 'lucide-react';
import { format } from 'date-fns';
import RoleGuard from '@/components/RoleGuard';

export default function DashboardPage() {
  const [todaySales, setTodaySales] = useState<any>(null);
  const [inventorySummary, setInventorySummary] = useState<any>(null);
  const [lowStockAlerts, setLowStockAlerts] = useState<any[]>([]);
  const [expiryAlerts, setExpiryAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { socket, connected } = useSocket();

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      const [salesData, inventoryData, lowStock, expiry] = await Promise.all([
        api.getTodaysSales(),
        api.getInventorySummary(),
        api.getLowStockAlerts(),
        api.getExpiryAlerts(30),
      ]);

      setTodaySales(salesData.data);
      setInventorySummary(inventoryData.data);
      setLowStockAlerts(lowStock.data.slice(0, 5)); // Top 5
      setExpiryAlerts(expiry.data.slice(0, 5)); // Top 5
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Real-time updates via Socket.IO
  useEffect(() => {
    if (!socket) return;

    socket.on('sale-created', () => {
      fetchDashboardData();
    });

    socket.on('inventory-updated', () => {
      fetchDashboardData();
    });

    return () => {
      socket.off('sale-created');
      socket.off('inventory-updated');
    };
  }, [fetchDashboardData, socket]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <RoleGuard allowedRoles={['owner', 'admin']}>
        <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
            {connected && <span className="ml-4 text-green-600">● Live</span>}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Today's Sales */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Today's Sales</h3>
              <ShoppingCart className="text-primary-600" size={20} />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              ৳ {todaySales?.totalSales?.toLocaleString() || 0}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {todaySales?.totalOrders || 0} orders
            </p>
          </div>

          {/* Total Medicines */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Total Medicines</h3>
              <Package className="text-green-600" size={20} />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {inventorySummary?.totalMedicines || 0}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {inventorySummary?.totalBatches || 0} batches
            </p>
          </div>

          {/* Low Stock Alerts */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Low Stock</h3>
              <AlertTriangle className="text-orange-600" size={20} />
            </div>
            <p className="text-3xl font-bold text-orange-600">
              {inventorySummary?.lowStockCount || 0}
            </p>
            <p className="text-sm text-gray-500 mt-2">items need restock</p>
          </div>

          {/* Expiry Alerts */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Near Expiry</h3>
              <AlertTriangle className="text-red-600" size={20} />
            </div>
            <p className="text-3xl font-bold text-red-600">
              {inventorySummary?.nearExpiryCount || 0}
            </p>
            <p className="text-sm text-gray-500 mt-2">within 30 days</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Low Stock Alerts Table */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Low Stock Alerts</h3>
            {lowStockAlerts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 text-sm font-medium text-gray-600">Medicine</th>
                      <th className="text-right py-3 text-sm font-medium text-gray-600">Stock</th>
                      <th className="text-right py-3 text-sm font-medium text-gray-600">Min Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockAlerts.map((alert, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-3 text-sm text-gray-900">{alert.medicineName}</td>
                        <td className="py-3 text-sm text-orange-600 text-right font-medium">
                          {alert.currentStock}
                        </td>
                        <td className="py-3 text-sm text-gray-500 text-right">
                          {alert.minStockLevel}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No low stock items</p>
            )}
          </div>

          {/* Expiry Alerts Table */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Expiring Soon (30 days)</h3>
            {expiryAlerts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 text-sm font-medium text-gray-600">Medicine</th>
                      <th className="text-right py-3 text-sm font-medium text-gray-600">Batch</th>
                      <th className="text-right py-3 text-sm font-medium text-gray-600">Days Left</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expiryAlerts.map((alert, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-3 text-sm text-gray-900">{alert.medicineName}</td>
                        <td className="py-3 text-sm text-gray-600 text-right">
                          {alert.batchNumber}
                        </td>
                        <td className="py-3 text-sm text-red-600 text-right font-medium">
                          {alert.daysUntilExpiry}d
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No items expiring soon</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 card">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a href="/pos" className="btn btn-primary text-center">New Sale</a>
            <a href="/inventory" className="btn btn-secondary text-center">Add Medicine</a>
            <a href="/customers" className="btn btn-secondary text-center">Add Customer</a>
            <a href="/reports" className="btn btn-secondary text-center">View Reports</a>
          </div>
        </div>
        </div>
      </RoleGuard>
    </DashboardLayout>
  );
}

