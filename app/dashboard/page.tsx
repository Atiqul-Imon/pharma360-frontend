'use client';

import { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';
import { useSocket } from '@/lib/hooks/useSocket';
import { AlertTriangle, Package, ShoppingCart, TrendingUp, Activity, ArrowUpRight } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
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

    // Only refetch specific data, not everything
    socket.on('sale-created', () => {
      // Only refetch sales data, not entire dashboard
      api.getTodaysSales().then((salesData) => {
        setTodaySales(salesData.data);
      }).catch(console.error);
    });

    socket.on('inventory-updated', () => {
      // Only refetch inventory summary, not entire dashboard
      api.getInventorySummary().then((inventoryData) => {
        setInventorySummary(inventoryData.data);
      }).catch(console.error);
      
      // Refetch alerts
      Promise.all([
        api.getLowStockAlerts(),
        api.getExpiryAlerts(30),
      ]).then(([lowStock, expiry]) => {
        setLowStockAlerts(lowStock.data.slice(0, 5));
        setExpiryAlerts(expiry.data.slice(0, 5));
      }).catch(console.error);
    });

    return () => {
      socket.off('sale-created');
      socket.off('inventory-updated');
    };
  }, [socket]);

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
        <div className="p-6 md:p-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="text-gray-600">
                    {format(new Date(), 'EEEE, MMMM d, yyyy')}
                  </p>
                  {connected && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm font-medium">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Live
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Today's Sales */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-blue-100">Today's Sales</h3>
                  <div className="bg-white bg-opacity-20 rounded-lg p-2">
                    <ShoppingCart className="text-white" size={20} />
                  </div>
                </div>
                <p className="text-3xl md:text-4xl font-bold mb-1">
                  ৳ {todaySales?.totalSales?.toLocaleString() || 0}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <Activity size={14} className="text-blue-100" />
                  <p className="text-sm text-blue-100">
                    {todaySales?.totalOrders || 0} orders
                  </p>
                </div>
              </div>
            </div>

            {/* Total Medicines */}
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-emerald-100">Total Medicines</h3>
                  <div className="bg-white bg-opacity-20 rounded-lg p-2">
                    <Package className="text-white" size={20} />
                  </div>
                </div>
                <p className="text-3xl md:text-4xl font-bold mb-1">
                  {inventorySummary?.totalMedicines || 0}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <TrendingUp size={14} className="text-emerald-100" />
                  <p className="text-sm text-emerald-100">
                    {inventorySummary?.totalBatches || 0} batches
                  </p>
                </div>
              </div>
            </div>

            {/* Low Stock Alerts */}
            <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-lg p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-amber-100">Low Stock</h3>
                  <div className="bg-white bg-opacity-20 rounded-lg p-2">
                    <AlertTriangle className="text-white" size={20} />
                  </div>
                </div>
                <p className="text-3xl md:text-4xl font-bold mb-1">
                  {inventorySummary?.lowStockCount || 0}
                </p>
                <p className="text-sm text-amber-100 mt-3">items need restock</p>
              </div>
            </div>

            {/* Expiry Alerts */}
            <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-xl shadow-lg p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-red-100">Near Expiry</h3>
                  <div className="bg-white bg-opacity-20 rounded-lg p-2">
                    <AlertTriangle className="text-white" size={20} />
                  </div>
                </div>
                <p className="text-3xl md:text-4xl font-bold mb-1">
                  {inventorySummary?.nearExpiryCount || 0}
                </p>
                <p className="text-sm text-red-100 mt-3">within 30 days</p>
              </div>
            </div>
          </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Low Stock Alerts Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-amber-100 rounded-lg p-2">
                  <AlertTriangle className="text-amber-600" size={20} />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Low Stock Alerts</h3>
              </div>
              {lowStockAlerts.length > 0 && (
                <Link 
                  href="/inventory" 
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                >
                  View All
                  <ArrowUpRight size={14} />
                </Link>
              )}
            </div>
            {lowStockAlerts.length > 0 ? (
              <div className="space-y-3">
                {lowStockAlerts.map((alert, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm">{alert.medicineName}</p>
                      <p className="text-xs text-gray-500 mt-1">Min: {alert.minStockLevel}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-amber-600">
                        {alert.currentStock}
                      </p>
                      <p className="text-xs text-gray-500">units</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="bg-green-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Package className="text-green-600" size={32} />
                </div>
                <p className="text-gray-500 font-medium">All items are well stocked</p>
                <p className="text-sm text-gray-400 mt-1">No low stock alerts</p>
              </div>
            )}
          </div>

          {/* Expiry Alerts Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-red-100 rounded-lg p-2">
                  <AlertTriangle className="text-red-600" size={20} />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Expiring Soon</h3>
              </div>
              {expiryAlerts.length > 0 && (
                <Link 
                  href="/inventory" 
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                >
                  View All
                  <ArrowUpRight size={14} />
                </Link>
              )}
            </div>
            {expiryAlerts.length > 0 ? (
              <div className="space-y-3">
                {expiryAlerts.map((alert, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm">{alert.medicineName}</p>
                      <p className="text-xs text-gray-500 mt-1">Batch: {alert.batchNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-600">
                        {alert.daysUntilExpiry}
                      </p>
                      <p className="text-xs text-gray-500">days left</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="bg-green-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Package className="text-green-600" size={32} />
                </div>
                <p className="text-gray-500 font-medium">No items expiring soon</p>
                <p className="text-sm text-gray-400 mt-1">All items are within safe expiry range</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link 
              href="/pos" 
              className="group flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
            >
              <ShoppingCart size={28} className="mb-3" />
              <span className="font-semibold text-sm">New Sale</span>
            </Link>
            <Link 
              href="/inventory/add-medicine" 
              className="group flex flex-col items-center justify-center p-6 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl text-white hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg"
            >
              <Package size={28} className="mb-3" />
              <span className="font-semibold text-sm">Add Medicine</span>
            </Link>
            <Link 
              href="/customers/add" 
              className="group flex flex-col items-center justify-center p-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl text-white hover:from-purple-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
            >
              <Activity size={28} className="mb-3" />
              <span className="font-semibold text-sm">Add Customer</span>
            </Link>
            <Link 
              href="/reports" 
              className="group flex flex-col items-center justify-center p-6 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl text-white hover:from-indigo-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
            >
              <TrendingUp size={28} className="mb-3" />
              <span className="font-semibold text-sm">View Reports</span>
            </Link>
          </div>
        </div>
        </div>
      </RoleGuard>
    </DashboardLayout>
  );
}

