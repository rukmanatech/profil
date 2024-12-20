'use client';

import { useState, useEffect } from 'react';
import { db } from '@/app/config/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { FiPlus, FiTrash2, FiEdit2, FiArrowLeft, FiBook, FiCalendar } from 'react-icons/fi';
import toast, { Toaster } from 'react-hot-toast';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import AnimatedBackground from '@/app/components/AnimatedBackground';
import LoadingOverlay from '@/app/components/LoadingOverlay';

const QuillWrapper = dynamic(() => import('@/app/components/QuillWrapper'), {
  ssr: false,
  loading: () => (
    <div className="bg-white rounded-lg h-64 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
    </div>
  ),
});

interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  slug: string;
  tags: string[];
  published: boolean;
  createdAt: any;
  updatedAt: any;
}

export default function BlogPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [newPost, setNewPost] = useState<Partial<BlogPost>>({
    title: '',
    content: '',
    excerpt: '',
    slug: '',
    tags: [],
    published: false
  });
  const [newTag, setNewTag] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    fetchPosts();
  }, [user, authLoading, router]);

  const fetchPosts = async () => {
    try {
      const postsSnapshot = await getDocs(collection(db, 'blog'));
      const postsData = postsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as BlogPost[];
      setPosts(postsData.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis()));
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Error loading posts');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  const handleAddPost = async () => {
    setSaving(true);
    try {
      if (!newPost.title || !newPost.content) {
        toast.error('Please fill in all required fields');
        return;
      }

      const postData = {
        ...newPost,
        slug: newPost.slug || generateSlug(newPost.title),
        excerpt: newPost.excerpt || newPost.content.substring(0, 150) + '...',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await addDoc(collection(db, 'blog'), postData);
      toast.success('Post added successfully');
      setShowAddModal(false);
      setNewPost({
        title: '',
        content: '',
        excerpt: '',
        slug: '',
        tags: [],
        published: false
      });
      fetchPosts();
    } catch (error) {
      console.error('Error adding post:', error);
      toast.error('Error adding post');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePost = async () => {
    if (!editingPost?.id) return;
    setSaving(true);
    try {
      const postData = {
        ...editingPost,
        updatedAt: new Date(),
        slug: editingPost.slug || generateSlug(editingPost.title)
      };

      await updateDoc(doc(db, 'blog', editingPost.id), postData);
      toast.success('Post updated successfully');
      setEditingPost(null);
      fetchPosts();
    } catch (error) {
      console.error('Error updating post:', error);
      toast.error('Error updating post');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    setSaving(true);
    try {
      await deleteDoc(doc(db, 'blog', postId));
      toast.success('Post deleted successfully');
      fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Error deleting post');
    } finally {
      setSaving(false);
    }
  };

  const handleAddTag = (isEditing: boolean) => {
    if (!newTag.trim()) return;

    if (isEditing && editingPost) {
      setEditingPost({
        ...editingPost,
        tags: [...(editingPost.tags || []), newTag.trim()]
      });
    } else {
      setNewPost({
        ...newPost,
        tags: [...(newPost.tags || []), newTag.trim()]
      });
    }
    setNewTag('');
  };

  const handleRemoveTag = (tag: string, isEditing: boolean) => {
    if (isEditing && editingPost) {
      setEditingPost({
        ...editingPost,
        tags: editingPost.tags.filter(t => t !== tag)
      });
    } else {
      setNewPost({
        ...newPost,
        tags: (newPost.tags || []).filter(t => t !== tag)
      });
    }
  };

  if (loading) {
    return (
      <AnimatedBackground>
        <div className="min-h-screen">
          <LoadingOverlay message="Loading blog posts..." />
        </div>
      </AnimatedBackground>
    );
  }

  return (
    <AnimatedBackground>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <Toaster position="top-center" />
        {saving && <LoadingOverlay message="Saving changes..." />}

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link 
              href="/admin"
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <FiArrowLeft size={24} />
            </Link>
            <h1 className="text-2xl sm:text-3xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              Blog Posts
            </h1>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="text-sm px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md flex items-center gap-2"
          >
            <FiPlus size={16} />
            <span>Add Post</span>
          </button>
        </div>

        {/* Blog Posts List */}
        {posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-gradient-to-r from-white/80 to-purple-50/30 backdrop-blur-sm rounded-2xl p-6 shadow-md border border-white/60"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {post.title}
                      </h3>
                      {!post.published && (
                        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                          Draft
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <FiCalendar size={14} />
                        <span>
                          {new Date(post.createdAt?.toMillis()).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FiBook size={14} />
                        <span>
                          {post.content.length > 500 ? 
                            Math.ceil(post.content.length / 500) + ' min read' : 
                            '1 min read'}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {post.excerpt}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {post.tags?.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2.5 py-1 text-xs bg-gradient-to-r from-indigo-50 to-purple-50 text-gray-600 rounded-full border border-white/60"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <button
                      onClick={() => setEditingPost(post)}
                      className="p-1.5 text-gray-600 hover:text-indigo-600 transition-colors"
                    >
                      <FiEdit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="p-1.5 text-gray-600 hover:text-red-500 transition-colors"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="bg-gradient-to-r from-white/80 to-purple-50/30 backdrop-blur-sm rounded-3xl p-8 text-center max-w-md w-full border border-white/60 shadow-md">
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FiBook className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                No Blog Posts Yet
              </h3>
              <p className="text-gray-600 mb-6">
                Start sharing your thoughts and experiences by creating your first blog post.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md text-sm"
              >
                <FiPlus size={16} />
                <span>Write Your First Post</span>
              </button>
            </div>
          </div>
        )}

        {/* Add/Edit Modal */}
        {(showAddModal || editingPost) && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-white/90 to-blue-50/80 backdrop-blur-sm rounded-3xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4 shadow-lg border border-white/50">
              <h3 className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-4">
                {editingPost ? 'Edit Post' : 'Add New Post'}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={editingPost ? editingPost.title : newPost.title}
                    onChange={(e) => {
                      const title = e.target.value;
                      const slug = generateSlug(title);
                      if (editingPost) {
                        setEditingPost({ ...editingPost, title, slug });
                      } else {
                        setNewPost({ ...newPost, title, slug });
                      }
                    }}
                    className="w-full text-sm text-gray-900 border-0 bg-white/50 rounded-lg px-4 py-2.5 focus:ring-0 focus:outline-none"
                    placeholder="Post title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content
                  </label>
                  <div className="prose max-w-none">
                    <QuillWrapper
                      value={editingPost ? editingPost.content : newPost.content}
                      onChange={(content) => {
                        if (editingPost) {
                          setEditingPost({ ...editingPost, content });
                        } else {
                          setNewPost({ ...newPost, content });
                        }
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Excerpt (optional)
                  </label>
                  <textarea
                    value={editingPost ? editingPost.excerpt : newPost.excerpt}
                    onChange={(e) => {
                      if (editingPost) {
                        setEditingPost({ ...editingPost, excerpt: e.target.value });
                      } else {
                        setNewPost({ ...newPost, excerpt: e.target.value });
                      }
                    }}
                    rows={3}
                    className="w-full text-sm text-gray-900 border-0 bg-white/50 rounded-lg px-4 py-2.5 focus:ring-0 focus:outline-none"
                    placeholder="Brief description of the post (will be auto-generated if left empty)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    value={editingPost ? editingPost.slug : newPost.slug}
                    onChange={(e) => {
                      if (editingPost) {
                        setEditingPost({ ...editingPost, slug: e.target.value });
                      } else {
                        setNewPost({ ...newPost, slug: e.target.value });
                      }
                    }}
                    className="w-full text-sm text-gray-900 border-0 bg-white/50 rounded-lg px-4 py-2.5 focus:ring-0 focus:outline-none"
                    placeholder="post-url-slug (will be auto-generated if left empty)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(editingPost ? editingPost.tags : newPost.tags)?.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-gradient-to-r from-indigo-50 to-purple-50 text-gray-700 border border-white/60"
                      >
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag, !!editingPost)}
                          className="ml-1.5 text-gray-400 hover:text-red-500"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag(!!editingPost);
                        }
                      }}
                      className="flex-1 text-sm text-gray-900 border-0 bg-white/50 rounded-lg px-4 py-2.5 focus:ring-0 focus:outline-none"
                      placeholder="Add tag..."
                    />
                    <button
                      onClick={() => handleAddTag(!!editingPost)}
                      className="px-4 py-2 text-sm bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    id="published"
                    checked={editingPost ? editingPost.published : newPost.published}
                    onChange={(e) => {
                      if (editingPost) {
                        setEditingPost({ ...editingPost, published: e.target.checked });
                      } else {
                        setNewPost({ ...newPost, published: e.target.checked });
                      }
                    }}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="published" className="text-sm text-gray-700">
                    Publish post
                  </label>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingPost(null);
                    setNewPost({
                      title: '',
                      content: '',
                      excerpt: '',
                      slug: '',
                      tags: [],
                      published: false
                    });
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  onClick={editingPost ? handleUpdatePost : handleAddPost}
                  className="text-sm px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md"
                >
                  {editingPost ? 'Update' : 'Publish'} Post
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AnimatedBackground>
  );
} 