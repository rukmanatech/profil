'use client';

import { useState, useEffect } from 'react';
import { db } from '@/app/config/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { FiPlus, FiTrash2, FiEdit2, FiArrowLeft, FiBook, FiCalendar, FiX, FiAlertCircle, FiCheck, FiInfo, FiCheckCircle } from 'react-icons/fi';
import toast, { Toaster, Toast as ToastType } from 'react-hot-toast';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import AnimatedBackground from '@/app/components/AnimatedBackground';
import LoadingOverlay from '@/app/components/LoadingOverlay';
import { generateBlogContent } from '@/app/utils/gemini';
import '@/app/styles/blog.css';

const Editor = dynamic(() => import('@/app/components/Editor'), {
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
  excerpt?: string;
  slug: string;
  tags?: string[];
  published: boolean;
  imageUrl?: string;
  createdAt: any;
  updatedAt: any;
}

interface NewBlogPost {
  title: string;
  content: string;
  excerpt?: string;
  slug?: string;
  tags?: string[];
  published: boolean;
  imageUrl?: string;
}

interface ToastParams {
  visible: boolean;
  id: string;
}

// Custom Toast Component
const CustomToast = ({ t, title, message, type }: { 
  t: ToastType & ToastParams; 
  title: string; 
  message: string; 
  type: 'success' | 'error' | 'info';
}) => {
  const colors = {
    success: 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200/50',
    error: 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200/50',
    info: 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200/50'
  } as const;

  const iconColors = {
    success: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white',
    error: 'bg-gradient-to-r from-red-500 to-rose-500 text-white',
    info: 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
  } as const;

  const Icon = type === 'success' ? FiCheck : type === 'error' ? FiX : FiInfo;

  return (
    <div
      className={`${t.visible ? 'animate-toast-enter' : 'animate-toast-leave'} ${colors[type]} border backdrop-blur-sm rounded-2xl px-4 py-3 shadow-lg shadow-black/5 max-w-md w-full pointer-events-auto flex items-start gap-3 relative overflow-hidden`}
    >
      {/* Background Animation */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/40 to-white/0 animate-shine" />
      
      {/* Icon */}
      <div className={`${iconColors[type]} flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center shadow-sm`}>
        <Icon className="w-4 h-4" />
      </div>

      {/* Content */}
      <div className="flex-1 relative">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <p className="mt-1 text-sm text-gray-600">{message}</p>
      </div>

      {/* Close Button */}
      <button
        onClick={() => toast.dismiss(t.id)}
        className="flex-shrink-0 text-gray-400 hover:text-gray-500 transition-colors"
      >
        <FiX className="w-4 h-4" />
      </button>
    </div>
  );
};

const showToast = (type: 'success' | 'error' | 'info', title: string, message: string) => {
  toast.custom((t: ToastType & ToastParams) => (
    <CustomToast
      t={t}
      type={type}
      title={title}
      message={message}
    />
  ));
};

// Success Dialog Component
const SuccessDialog = ({ isOpen, message, onClose }: { isOpen: boolean; message: string; onClose: () => void }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div 
        className="bg-white/90 backdrop-blur-md rounded-3xl p-8 w-full max-w-sm mx-4 shadow-2xl border border-white/20 transform transition-all duration-300 relative overflow-hidden"
        style={{
          animation: 'success-dialog-enter 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
        }}
      >
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-purple-50/50" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-100/30 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-purple-100/30 via-transparent to-transparent" />
        
        {/* Animated Rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 animate-success-rings">
          <div className="absolute inset-0 border-2 border-indigo-500/20 rounded-full animate-ring-scale-1" />
          <div className="absolute inset-0 border-2 border-purple-500/20 rounded-full animate-ring-scale-2" />
          <div className="absolute inset-0 border-2 border-indigo-500/20 rounded-full animate-ring-scale-3" />
        </div>
        
        {/* Content */}
        <div className="relative flex flex-col items-center text-center">
          {/* Success Icon with Animation */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4 animate-success-icon shadow-xl shadow-indigo-500/20">
            <FiCheckCircle className="w-10 h-10 text-white" />
          </div>
          
          {/* Message */}
          <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-2">
            Berhasil!
          </h3>
          <p className="text-gray-600 mb-6">
            {message}
          </p>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-xl shadow-indigo-500/20 hover:shadow-2xl hover:shadow-indigo-500/30 transform hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default function BlogPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [newPost, setNewPost] = useState<NewBlogPost>({
    title: '',
    content: '',
    excerpt: '',
    slug: '',
    tags: [],
    published: false,
    imageUrl: ''
  });
  const [newTag, setNewTag] = useState('');
  const [saving, setSaving] = useState(false);
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [isImprovingContent, setIsImprovingContent] = useState(false);

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessDialog(true);
    // Auto close after 3 seconds
    setTimeout(() => {
      setShowSuccessDialog(false);
    }, 3000);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    fetchPosts();
    fetchProjects();
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
      showToast('error', 'Gagal!', 'Terjadi kesalahan saat memuat posts');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string): string => {
    return title
      ? title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '')
      : '';
  };

  const handleAddPost = async () => {
    setSaving(true);
    try {
      if (!newPost.title || !newPost.content) {
        showToast('error', 'Validasi Gagal', 'Mohon isi semua field yang diperlukan');
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
      showSuccess('✨ Blog post berhasil ditambahkan');
      setShowAddModal(false);
      setNewPost({
        title: '',
        content: '',
        excerpt: '',
        slug: '',
        tags: [],
        published: false,
        imageUrl: ''
      });
      fetchPosts();
    } catch (error) {
      console.error('Error adding post:', error);
      showToast('error', 'Gagal!', 'Terjadi kesalahan saat menambahkan post');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePost = async () => {
    if (!editingPost?.id) {
      showToast('error', 'Gagal!', 'ID post tidak ditemukan');
      return;
    }
    setSaving(true);
    try {
      const postRef = doc(db, 'blog', editingPost.id);
      const postData = {
        title: editingPost.title || '',
        content: editingPost.content || '',
        excerpt: editingPost.excerpt || '',
        slug: editingPost.slug || generateSlug(editingPost.title || ''),
        tags: editingPost.tags || [],
        published: editingPost.published,
        imageUrl: editingPost.imageUrl || '',
        updatedAt: new Date()
      };

      await updateDoc(postRef, postData);
      showSuccess('✨ Blog post berhasil diperbarui');
      setEditingPost(null);
      fetchPosts();
    } catch (error) {
      console.error('Error updating post:', error);
      showToast('error', 'Gagal!', 'Terjadi kesalahan saat memperbarui post');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    console.log('Attempting to delete post:', postId);
    if (!postId) {
      showToast('error', 'Gagal!', 'ID post tidak ditemukan');
      return;
    }
    setPostToDelete(postId);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!postToDelete) {
      showToast('error', 'Gagal!', 'ID post tidak ditemukan');
      return;
    }
    setSaving(true);
    try {
      console.log('Deleting post:', postToDelete);
      await deleteDoc(doc(db, 'blog', postToDelete));
      showSuccess('✨ Blog post berhasil dihapus');
      setShowDeleteDialog(false);
      setPostToDelete(null);
      fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      showToast('error', 'Gagal!', 'Terjadi kesalahan saat menghapus post');
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
        tags: (editingPost.tags || []).filter(t => t !== tag)
      });
    } else {
      setNewPost({
        ...newPost,
        tags: (newPost.tags || []).filter(t => t !== tag)
      });
    }
  };

  // Fungsi untuk fetch projects
  const fetchProjects = async () => {
    try {
      const projectsSnapshot = await getDocs(collection(db, 'projects'));
      const projectsData = projectsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProjects(projectsData);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.custom((t: ToastType) => (
        <CustomToast
          t={t}
          type="error"
          title="Gagal!"
          message="Terjadi kesalahan saat memuat projects"
        />
      ));
    }
  };

  // Fungsi untuk generate content
  const generateContent = async (project: any) => {
    try {
      const generatedContent = await generateBlogContent(project);

      // Tambahkan gambar dan link project ke dalam konten
      const projectPreview = project.imageUrl ? 
        `<div class="mb-6">
          <a href="${project.link}" target="_blank" rel="noopener noreferrer" class="block">
            <img src="${project.imageUrl}" alt="${project.title}" class="w-full h-auto rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300" />
            <p class="text-sm text-gray-500 mt-2 text-center">
              <span class="text-indigo-600 hover:text-indigo-800">Lihat ${project.title}</span>
            </p>
          </a>
        </div>
        ${generatedContent.content}
        <div class="mt-6 pt-4 border-t border-gray-200">
          <a href="${project.link}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800">
            <span>Kunjungi ${project.title}</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </a>
        </div>` : 
        `${generatedContent.content}
        <div class="mt-6 pt-4 border-t border-gray-200">
          <a href="${project.link}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800">
            <span>Kunjungi ${project.title}</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </a>
        </div>`;

      setNewPost({
        ...newPost,
        title: generatedContent.title,
        content: projectPreview,
        excerpt: generatedContent.excerpt,
        tags: [...project.technologies],
        imageUrl: project.imageUrl // Simpan URL gambar di blog post
      });

      // Buka modal add post setelah konten di-generate
      setShowAddModal(true);
      
      return true; // Return true jika berhasil
    } catch (error) {
      console.error('Error generating content:', error);
      toast.custom((t: ToastType) => (
        <CustomToast
          t={t}
          type="error"
          title="Gagal!"
          message="Terjadi kesalahan saat generate content"
        />
      ));
      return false; // Return false jika gagal
    }
  };

  // Fungsi untuk improve content
  const improveContent = async (content: string) => {
    try {
      setIsImprovingContent(true);
      const prompt = {
        title: editingPost?.title || newPost.title || '',
        content: content,
        description: editingPost?.excerpt || newPost.excerpt || '',
        technologies: editingPost?.tags || newPost.tags || []
      };

      const result = await generateBlogContent(prompt);
      
      if (result) {
        // Update state dengan konten yang sudah diimprove
        if (editingPost) {
          setEditingPost({
            ...editingPost,
            title: result.title || editingPost.title,
            content: result.content,
            excerpt: result.excerpt || editingPost.excerpt,
            tags: [...new Set([...(editingPost.tags || []), ...(result.suggestedTags || [])])]
          });
        } else {
          setNewPost({
            ...newPost,
            title: result.title || newPost.title,
            content: result.content,
            excerpt: result.excerpt || newPost.excerpt,
            tags: [...new Set([...(newPost.tags || []), ...(result.suggestedTags || [])])]
          });
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error improving content:', error);
      toast.error('Gagal mengembangkan konten');
      return false;
    } finally {
      setIsImprovingContent(false);
    }
  };

  // Project Selector Modal
  const ProjectSelectorModal = () => {
    const [generatingProjectId, setGeneratingProjectId] = useState<string | null>(null);

    const handleProjectClick = async (project: any) => {
      if (generatingProjectId) return;
      
      setGeneratingProjectId(project.id);
      try {
        // Generate content dan tunggu sampai selesai
        const success = await generateContent(project);
        
        // Langsung tutup modal jika berhasil
        if (success) {
          setShowProjectSelector(false);
        }
      } catch (error) {
        console.error('Error generating content:', error);
        toast.custom((t: ToastType) => (
          <CustomToast
            t={t}
            type="error"
            title="Gagal!"
            message="Terjadi kesalahan saat generate content"
          />
        ));
      } finally {
        setGeneratingProjectId(null);
      }
    };

    if (!showProjectSelector) return null;

    return (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[60]">
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 w-full max-w-2xl mx-4 shadow-2xl border border-white/20">
          <h3 className="text-xl font-bold text-gray-900 mb-4 font-plus-jakarta">
            Pilih Project
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto relative">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => !generatingProjectId && handleProjectClick(project)}
                className={`bg-white/50 backdrop-blur-sm rounded-2xl p-4 cursor-pointer hover:bg-white/80 transition-all border border-white/60 group relative ${
                  generatingProjectId ? 'pointer-events-none' : ''
                }`}
              >
                {/* Loading Overlay - Sekarang di dalam card */}
                {generatingProjectId === project.id && (
                  <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-2xl flex items-center justify-center z-[70]">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
                      <p className="text-sm font-medium text-gray-600">Generating...</p>
                    </div>
                  </div>
                )}

                {project.imageUrl && (
                  <div className="aspect-video rounded-xl overflow-hidden mb-3">
                    <img
                      src={project.imageUrl}
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <h4 className="font-semibold text-gray-900 mb-1 font-plus-jakarta">
                  {project.title}
                </h4>
                <p className="text-sm text-gray-500 line-clamp-2 font-inter">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {project.technologies?.slice(0, 3).map((tech: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 text-xs bg-indigo-50 text-indigo-600 rounded-full"
                    >
                      {tech}
                    </span>
                  ))}
                  {project.technologies?.length > 3 && (
                    <span className="px-2 py-0.5 text-xs bg-gray-50 text-gray-600 rounded-full">
                      +{project.technologies.length - 3}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={() => !generatingProjectId && setShowProjectSelector(false)}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
              disabled={generatingProjectId !== null}
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Fungsi untuk memfilter post berdasarkan pencarian
  const filteredPosts = posts.filter(post => {
    const searchLower = searchQuery.toLowerCase();
    return (
      post.title?.toLowerCase().includes(searchLower) ||
      (post.content || '').toLowerCase().includes(searchLower) ||
      (post.excerpt || '').toLowerCase().includes(searchLower) ||
      post.tags?.some(tag => tag.toLowerCase().includes(searchLower))
    );
  });

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
        {isGenerating && <LoadingOverlay message="Generating content..." />}
        <ProjectSelectorModal />

        {/* Header with Search */}
        <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link 
              href="/admin"
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 bg-white/50 hover:bg-white/80 rounded-xl transition-all duration-200"
            >
              <FiArrowLeft size={16} />
            </Link>
            <div className="relative">
              <h1 className="text-2xl font-semibold">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 animate-gradient">
                  Blog Posts
                </span>
                <span className="ml-2 text-sm font-medium text-gray-500">Management</span>
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Kelola semua artikel blog Anda di satu tempat
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 w-full sm:w-auto">
            {/* Modern Searchbar */}
            <div className={`relative flex-1 sm:flex-initial sm:min-w-[300px] ${searchFocused ? 'z-10' : ''}`}>
              <div className={`relative transition-all duration-300 ${
                searchFocused 
                  ? 'bg-white shadow-lg ring-1 ring-purple-200 rounded-2xl' 
                  : 'bg-white/70 rounded-xl'
              }`}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  placeholder="Cari post..."
                  className="w-full bg-transparent pl-12 pr-4 py-3 text-sm text-gray-900 placeholder-gray-500 rounded-xl focus:outline-none"
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <svg
                    className={`w-5 h-5 transition-colors ${
                      searchFocused ? 'text-indigo-600' : 'text-gray-400'
                    }`}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              {searchQuery && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <button
                    onClick={() => setSearchQuery('')}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <FiX className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              )}
            </div>
            
            <button
              onClick={() => setShowAddModal(true)}
              className="text-sm px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md flex items-center gap-2 whitespace-nowrap"
            >
              <FiPlus size={16} />
              <span>Add Post</span>
            </button>
          </div>
        </div>

        {/* Blog Posts List with Search Results */}
        {filteredPosts.length > 0 ? (
          <div className="space-y-4">
            {searchQuery && (
              <p className="text-sm text-gray-600 mb-4">
                Ditemukan {filteredPosts.length} hasil untuk "{searchQuery}"
              </p>
            )}
            {filteredPosts.map((post) => (
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
                <FiBook className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-400 mb-2 font-plus-jakarta">
                Belum Ada Blog Post
              </h3>
              <p className="text-gray-400 mb-6 font-inter leading-relaxed">
                Mulai bagikan pemikiran dan pengalaman Anda dengan membuat blog post pertama Anda.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md text-sm font-medium font-plus-jakarta hover:shadow-lg hover:shadow-indigo-500/25 transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <FiPlus size={16} />
                <span>Buat Post Pertama</span>
              </button>
            </div>
          </div>
        )}

        {/* Add/Edit Modal */}
        {(showAddModal || editingPost) && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-white/90 to-blue-50/80 backdrop-blur-sm rounded-3xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4 shadow-lg border border-white/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                  {editingPost ? 'Edit Post' : 'Add New Post'}
                </h3>
                <div className="flex items-center gap-2">
                  {/* Improve Content Button */}
                  <button
                    onClick={() => {
                      const currentContent = editingPost ? editingPost.content || '' : newPost.content || '';
                      if (currentContent.trim()) {
                        improveContent(currentContent);
                      } else {
                        toast.custom((t: ToastType) => (
                          <CustomToast
                            t={t}
                            type="error"
                            title="Gagal!"
                            message="Tulis konten terlebih dahulu sebelum mengembangkan"
                          />
                        ));
                      }
                    }}
                    disabled={isImprovingContent}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isImprovingContent ? (
                      <>
                        <div className="w-4 h-4 border-2 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
                        <span>Mengembangkan...</span>
                      </>
                    ) : (
                      <>
                        <FiEdit2 className="w-4 h-4" />
                        <span>Improve Content</span>
                      </>
                    )}
                  </button>
                  {!editingPost && (
                    <button
                      onClick={() => setShowProjectSelector(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all"
                    >
                      <FiBook className="w-4 h-4" />
                      <span>Generate from Project</span>
                    </button>
                  )}
                </div>
              </div>

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
                    <Editor
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
                      published: false,
                      imageUrl: ''
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

        {/* Delete Confirmation Dialog */}
        {showDeleteDialog && (
          <div 
            className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50"
            style={{
              animation: 'fadeIn 0.3s ease-out'
            }}
          >
            <div 
              className="bg-gradient-to-br from-white/90 to-red-50/80 backdrop-blur-sm rounded-3xl p-8 w-full max-w-md mx-4 shadow-lg border border-white/50 transform transition-all"
              style={{
                animation: 'modalEnter 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <FiAlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Konfirmasi Hapus
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Apakah Anda yakin ingin menghapus post ini? Tindakan ini tidak dapat dibatalkan.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDeleteDialog(false);
                    setPostToDelete(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100/50"
                >
                  Batal
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-rose-600 rounded-lg hover:from-red-700 hover:to-rose-700 transition-all shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Menghapus...</span>
                    </>
                  ) : (
                    <>
                      <FiTrash2 className="w-4 h-4" />
                      <span>Hapus Post</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Dialog */}
        {showSuccessDialog && (
          <SuccessDialog
            isOpen={showSuccessDialog}
            message={successMessage}
            onClose={() => setShowSuccessDialog(false)}
          />
        )}
      </div>

      <style jsx global>{`
        @keyframes success-dialog-enter {
          0% {
            opacity: 0;
            transform: scale(0.8) translateY(30px) rotate(-2deg);
          }
          60% {
            transform: scale(1.05) translateY(-10px) rotate(1deg);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0) rotate(0);
          }
        }

        @keyframes success-icon {
          0% {
            transform: scale(0) rotate(-45deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.25) rotate(10deg);
          }
          75% {
            transform: scale(0.9) rotate(-5deg);
          }
          100% {
            transform: scale(1) rotate(0);
            opacity: 1;
          }
        }

        @keyframes ring-scale-1 {
          0%, 100% { transform: scale(0.8); opacity: 0; }
          50% { transform: scale(1.1); opacity: 1; }
        }

        @keyframes ring-scale-2 {
          0%, 100% { transform: scale(0.9); opacity: 0; }
          50% { transform: scale(1.2); opacity: 1; }
        }

        @keyframes ring-scale-3 {
          0%, 100% { transform: scale(1); opacity: 0; }
          50% { transform: scale(1.3); opacity: 1; }
        }

        .animate-success-icon {
          animation: success-icon 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
        }

        .animate-ring-scale-1 {
          animation: ring-scale-1 2s ease-in-out infinite;
        }

        .animate-ring-scale-2 {
          animation: ring-scale-2 2s ease-in-out infinite 0.3s;
        }

        .animate-ring-scale-3 {
          animation: ring-scale-3 2s ease-in-out infinite 0.6s;
        }

        .animate-success-rings {
          animation: success-rings 20s linear infinite;
        }

        @keyframes success-rings {
          0% {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          100% {
            transform: translate(-50%, -50%) rotate(360deg);
          }
        }
      `}</style>
    </AnimatedBackground>
  );
}