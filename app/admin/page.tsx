'use client';

import { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs } from 'firebase/firestore';
import toast, { Toaster } from 'react-hot-toast';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalPages: 0,
    totalPosts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const fetchStats = async () => {
      try {
        const pagesSnapshot = await getDocs(collection(db, 'pages'));
        const postsSnapshot = await getDocs(collection(db, 'posts'));

        setStats({
          totalPages: pagesSnapshot.size,
          totalPosts: postsSnapshot.size,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        toast.error('Terjadi kesalahan saat mengambil data');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    return () => setMounted(false);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-center" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Total Pages</h3>
          {loading ? (
            <div className="animate-pulse h-8 bg-gray-200 rounded w-24 mt-2"></div>
          ) : (
            <p className="mt-2 text-3xl font-bold text-blue-600">{stats.totalPages}</p>
          )}
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Total Posts</h3>
          {loading ? (
            <div className="animate-pulse h-8 bg-gray-200 rounded w-24 mt-2"></div>
          ) : (
            <p className="mt-2 text-3xl font-bold text-blue-600">{stats.totalPosts}</p>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300"
            onClick={() => window.location.href = '/admin/pages/new'}
            disabled={loading}
          >
            Create New Page
          </button>
          <button
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:bg-green-300"
            onClick={() => window.location.href = '/admin/posts/new'}
            disabled={loading}
          >
            Create New Post
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
        {loading ? (
          <div className="space-y-2">
            <div className="animate-pulse h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="animate-pulse h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ) : (
          <p className="text-gray-500">No recent activity</p>
        )}
      </div>
    </div>
  );
} 