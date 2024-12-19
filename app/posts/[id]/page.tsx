'use client';

import { useState, useEffect, use, Suspense } from 'react';
import { db } from '@/app/config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';

interface Post {
  title: string;
  content: string;
  createdAt: any;
}

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
}

function PostContent({ id }: { id: string }) {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const docRef = doc(db, 'posts', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setPost(docSnap.data() as Post);
        } else {
          console.log('No such document!');
        }
      } catch (error) {
        console.error('Error fetching post:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Post tidak ditemukan</h1>
        <Link
          href="/"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          Kembali ke halaman utama
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">{post.title}</h1>
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Kembali
            </Link>
          </div>
          <div className="mt-2 text-sm text-gray-500">
            {post.createdAt?.toDate().toLocaleDateString('id-ID', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <article
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{
                __html: post.content
              }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PostDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <PostContent id={resolvedParams.id} />
    </Suspense>
  );
} 