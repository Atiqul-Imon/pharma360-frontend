import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary-50 to-blue-100">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-primary-900 mb-4">
          Pharma360
        </h1>
        <p className="text-xl text-gray-700 mb-8 max-w-2xl">
          Complete Pharmacy Management System for Bangladesh
        </p>
        <p className="text-lg text-gray-600 mb-12">
          Manage inventory, sales, customers, and analytics - all in one powerful platform
        </p>
        
        <div className="flex gap-4 justify-center">
          <Link 
            href="/auth/login" 
            className="btn btn-primary text-lg px-8 py-3"
          >
            Login
          </Link>
          <Link 
            href="/auth/register" 
            className="btn btn-secondary text-lg px-8 py-3"
          >
            Register Pharmacy
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl">
          <div className="card">
            <h3 className="text-xl font-semibold mb-2">Inventory Management</h3>
            <p className="text-gray-600">
              Track medicines, batches, expiry dates, and stock levels with ease
            </p>
          </div>
          
          <div className="card">
            <h3 className="text-xl font-semibold mb-2">POS System</h3>
            <p className="text-gray-600">
              Fast billing, multiple payment methods, and real-time inventory updates
            </p>
          </div>
          
          <div className="card">
            <h3 className="text-xl font-semibold mb-2">Customer CRM</h3>
            <p className="text-gray-600">
              Manage customers, loyalty points, and credit accounts effortlessly
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

