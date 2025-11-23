'use client';

import DashboardLayout from '@/components/DashboardLayout';
import RoleGuard from '@/components/RoleGuard';
import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <RoleGuard allowedRoles={['owner', 'admin']}>
        <div className="p-8 space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Settings size={28} className="text-primary-600" />
              Settings
            </h1>
            <p className="text-sm text-gray-600 mt-2">
              Manage your pharmacy settings and preferences.
            </p>
          </div>

          <div className="card">
            <p className="text-gray-600">
              Settings page content will be added here.
            </p>
          </div>
        </div>
      </RoleGuard>
    </DashboardLayout>
  );
}

