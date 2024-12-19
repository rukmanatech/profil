'use client';

import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { FiHome, FiSettings, FiLogOut } from 'react-icons/fi';
import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';
import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white h-screen shadow-lg fixed">
          <div className="flex flex-col h-full">
            <div className="p-4">
              <h2 className="text-2xl font-bold text-gray-800">Admin Panel</h2>
            </div>
            <nav className="flex-1 p-4">
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/admin"
                    className="flex items-center space-x-2 text-gray-700 hover:bg-gray-100 p-2 rounded-md"
                  >
                    <FiHome className="w-5 h-5" />
                    <span>Dashboard</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/settings"
                    className="flex items-center space-x-2 text-gray-700 hover:bg-gray-100 p-2 rounded-md"
                  >
                    <FiSettings className="w-5 h-5" />
                    <span>Settings</span>
                  </Link>
                </li>
              </ul>
            </nav>
            <div className="p-4 border-t">
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-red-600 hover:bg-red-50 p-2 rounded-md w-full"
              >
                <FiLogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 ml-64">
          <header className="bg-white shadow">
            <div className="px-4 py-6">
              <h1 className="text-xl font-semibold text-gray-900">
                Welcome, {user.email}
              </h1>
            </div>
          </header>
          <main className="p-6">{children}</main>
        </div>
      </div>
    </div>
  );
} 