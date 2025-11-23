'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  ClipboardList,
  Truck,
  Users,
  FileText,
  Settings,
  LogOut,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';

type UserRole = 'owner' | 'admin' | 'staff';

const menuItems: Array<{
  name: string;
  href: string;
  icon: LucideIcon;
  roles: UserRole[];
}> = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['owner', 'admin'] },
  { name: 'POS', href: '/pos', icon: ShoppingCart, roles: ['owner', 'admin', 'staff'] },
  { name: 'Inventory', href: '/inventory', icon: Package, roles: ['owner', 'admin'] },
  { name: 'Purchases', href: '/purchases', icon: ClipboardList, roles: ['owner', 'admin'] },
  { name: 'Suppliers', href: '/suppliers', icon: Truck, roles: ['owner', 'admin'] },
  { name: 'Customers', href: '/customers', icon: Users, roles: ['owner', 'admin', 'staff'] },
  { name: 'Reports', href: '/reports', icon: FileText, roles: ['owner', 'admin'] },
  { name: 'Settings', href: '/settings', icon: Settings, roles: ['owner', 'admin'] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-2xl font-bold">Pharma360</h1>
        <p className="text-sm text-gray-400 mt-1">{user?.pharmacyName}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems
          .filter((item) => (user ? item.roles.includes(user.role as UserRole) : false))
          .map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-gray-800">
        <div className="px-4 py-3 bg-gray-800 rounded-lg mb-2">
          <p className="text-sm font-medium">{user?.name}</p>
          <p className="text-xs text-gray-400">{user?.role}</p>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}

