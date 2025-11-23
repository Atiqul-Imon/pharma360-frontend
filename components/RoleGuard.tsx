'use client';

import { ReactNode } from 'react';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';

interface RoleGuardProps {
  allowedRoles: Array<'owner' | 'admin' | 'staff'>;
  fallback?: ReactNode;
  children: ReactNode;
}

export default function RoleGuard({ allowedRoles, fallback, children }: RoleGuardProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-primary-600" />
          <p className="text-sm text-gray-500">Checking permissions…</p>
        </div>
      </div>
    );
  }

  const hasAccess = user && allowedRoles.includes(user.role);

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <ShieldAlert className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900">Access Restricted</h2>
        <p className="mt-3 max-w-md text-sm text-gray-600">
          You do not have permission to view this section. Please contact an administrator if you
          believe this is an error.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}


