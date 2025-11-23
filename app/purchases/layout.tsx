import DashboardLayout from '@/components/DashboardLayout';
import RoleGuard from '@/components/RoleGuard';
import type { ReactNode } from 'react';

export default function PurchasesLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardLayout>
      <RoleGuard allowedRoles={['owner', 'admin']}>{children}</RoleGuard>
    </DashboardLayout>
  );
}
