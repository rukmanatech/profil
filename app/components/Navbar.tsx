'use client';

import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useRouter } from 'next/navigation';
import { FiLogOut } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const router = useRouter();
  const { user } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (!user) return null;

  return (
    <nav className="fixed top-0 right-0 p-4 z-50">
      <button
        onClick={handleLogout}
        className="flex items-center space-x-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white/90 transition-colors"
      >
        <FiLogOut className="w-4 h-4 text-gray-600" />
        <span className="text-sm text-gray-600">Logout</span>
      </button>
    </nav>
  );
} 