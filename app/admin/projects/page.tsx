'use client';

import { useState, useEffect, useRef } from 'react';
import { db, storage } from '@/app/config/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { FiPlus, FiTrash2, FiEdit2, FiLink, FiArrowLeft, FiCamera, FiUpload, FiFolder, FiAlertCircle, FiCheck, FiX, FiInfo, FiCheckCircle } from 'react-icons/fi';
import toast, { Toaster, Toast as ToastType } from 'react-hot-toast';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import AnimatedBackground from '@/app/components/AnimatedBackground';
import LoadingOverlay from '@/app/components/LoadingOverlay';

interface Project {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  link: string;
  technologies: string[];
  featured: boolean;
  isNewRelease: boolean;
  isUpdate: boolean;
  createdAt: any;
}

// Custom Toast Component
const CustomToast = ({ t, title, message, type }: { 
  t: ToastType; 
  title: string; 
  message: string; 
  type: 'success' | 'error' | 'info';
}) => {
  const colors = {
    success: 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200/50',
    error: 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200/50',
    info: 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200/50'
  };

  const iconColors = {
    success: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white',
    error: 'bg-gradient-to-r from-red-500 to-rose-500 text-white',
    info: 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
  };

  const Icon = type === 'success' ? FiCheck : type === 'error' ? FiX : FiInfo;

  return (
    <div
      className={`${t.visible ? 'animate-toast-enter' : 'animate-toast-leave'} 
        ${colors[type]} border backdrop-blur-sm rounded-2xl px-4 py-3 shadow-lg shadow-black/5 
        max-w-md w-full pointer-events-auto flex items-start gap-3 relative overflow-hidden`}
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

// Success Dialog Component
const SuccessDialog = ({ message, isOpen, onClose }: { message: string; isOpen: boolean; onClose: () => void }) => {
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
            className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium rounded-2xl 
              hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-xl shadow-indigo-500/20
              hover:shadow-2xl hover:shadow-indigo-500/30 transform hover:-translate-y-0.5 active:translate-y-0
              focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default function ProjectsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [newProject, setNewProject] = useState<Partial<Project>>({
    title: '',
    description: '',
    imageUrl: '',
    link: '',
    technologies: [],
    featured: false,
    isNewRelease: false,
    isUpdate: false
  });
  const [newTech, setNewTech] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [screenshotLoading, setScreenshotLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    fetchProjects();
  }, [user, authLoading, router]);

  const fetchProjects = async () => {
    try {
      const projectsSnapshot = await getDocs(collection(db, 'projects'));
      const projectsData = projectsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Project[];
      setProjects(projectsData.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis()));
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.custom((t) => (
        <CustomToast
          t={t}
          type="error"
          title="Gagal!"
          message="Terjadi kesalahan saat memuat projects"
        />
      ));
    }
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessDialog(true);
    // Auto close after 3 seconds
    setTimeout(() => {
      setShowSuccessDialog(false);
    }, 3000);
  };

  const handleAddProject = async () => {
    try {
      setSaving(true);
      if (!newProject.title || !newProject.description) {
        toast.custom((t) => (
          <CustomToast
            t={t}
            type="error"
            title="Validasi Gagal"
            message="Mohon isi semua field yang diperlukan"
          />
        ));
        return;
      }

      const projectData = {
        ...newProject,
        createdAt: new Date(),
      };

      await addDoc(collection(db, 'projects'), projectData);
      showSuccess('Project berhasil ditambahkan');
      setShowAddModal(false);
      setNewProject({
        title: '',
        description: '',
        imageUrl: '',
        link: '',
        technologies: [],
        featured: false,
        isNewRelease: false,
        isUpdate: false
      });
      fetchProjects();
    } catch (error) {
      console.error('Error adding project:', error);
      toast.custom((t) => (
        <CustomToast
          t={t}
          type="error"
          title="Gagal!"
          message="Terjadi kesalahan saat menambahkan project"
        />
      ));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateProject = async () => {
    if (!editingProject?.id) return;

    try {
      setSaving(true);
      const { id, ...projectData } = editingProject;
      await updateDoc(doc(db, 'projects', id), projectData);
      showSuccess('Project berhasil diperbarui');
      setEditingProject(null);
      fetchProjects();
    } catch (error) {
      console.error('Error updating project:', error);
      toast.custom((t) => (
        <CustomToast
          t={t}
          type="error"
          title="Gagal!"
          message="Terjadi kesalahan saat memperbarui project"
        />
      ));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProject = async (project: Project) => {
    setProjectToDelete(project);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!projectToDelete) return;

    try {
      setDeleteLoading(true);
      if (projectToDelete.imageUrl) {
        await deleteImage(projectToDelete.imageUrl);
      }
      await deleteDoc(doc(db, 'projects', projectToDelete.id));
      showSuccess('Project berhasil dihapus');
      setShowDeleteDialog(false);
      setProjectToDelete(null);
      fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.custom((t) => (
        <CustomToast
          t={t}
          type="error"
          title="Gagal!"
          message="Terjadi kesalahan saat menghapus project"
        />
      ));
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleAddTech = (isEditing: boolean) => {
    if (!newTech.trim()) return;

    if (isEditing && editingProject) {
      setEditingProject({
        ...editingProject,
        technologies: [...editingProject.technologies, newTech.trim()]
      });
    } else {
      setNewProject({
        ...newProject,
        technologies: [...(newProject.technologies || []), newTech.trim()]
      });
    }
    setNewTech('');
  };

  const handleRemoveTech = (tech: string, isEditing: boolean) => {
    if (isEditing && editingProject) {
      setEditingProject({
        ...editingProject,
        technologies: editingProject.technologies.filter(t => t !== tech)
      });
    } else {
      setNewProject({
        ...newProject,
        technologies: (newProject.technologies || []).filter(t => t !== tech)
      });
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      setUploading(true);
      // Hapus gambar lama jika ada
      const currentImageUrl = editingProject ? editingProject.imageUrl : newProject.imageUrl;
      if (currentImageUrl) {
        await deleteImage(currentImageUrl);
      }

      const storageRef = ref(storage, `projects/${file.name}-${Date.now()}`);
      await uploadBytes(storageRef, file);
      const imageUrl = await getDownloadURL(storageRef);
      
      if (editingProject) {
        setEditingProject({ ...editingProject, imageUrl });
      } else {
        setNewProject({ ...newProject, imageUrl });
      }
      
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.custom((t) => (
        <CustomToast
          t={t}
          type="error"
          title="Gagal!"
          message="Terjadi kesalahan saat mengunggah gambar"
        />
      ));
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (imageUrl: string) => {
    try {
      if (!imageUrl) return;

      // Hanya hapus jika URL adalah Firebase Storage URL
      if (imageUrl.includes('firebasestorage.googleapis.com')) {
        // Extract path from Firebase Storage URL
        const urlObj = new URL(imageUrl);
        const pathFromUrl = urlObj.pathname.split('/o/')[1];
        if (!pathFromUrl) return;
        
        // Decode URI component untuk mendapatkan path yang benar
        const decodedPath = decodeURIComponent(pathFromUrl.split('?')[0]);
        const storageRef = ref(storage, decodedPath);
        
        await deleteObject(storageRef);
        console.log('Image deleted successfully:', decodedPath);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Gagal menghapus gambar');
    }
  };

  const handleRemoveImage = async (isEditing: boolean) => {
    try {
      const currentImageUrl = isEditing ? editingProject?.imageUrl : newProject.imageUrl;
      
      if (currentImageUrl) {
        await deleteImage(currentImageUrl);
        
        if (isEditing && editingProject) {
          setEditingProject({ ...editingProject, imageUrl: '' });
        } else {
          setNewProject({ ...newProject, imageUrl: '' });
        }
      }
    } catch (error) {
      console.error('Error removing image:', error);
      toast.custom((t) => (
        <CustomToast
          t={t}
          type="error"
          title="Gagal!"
          message="Terjadi kesalahan saat menghapus gambar"
        />
      ));
    }
  };

  const generateScreenshot = async (url: string) => {
    if (!url) {
      toast.custom((t) => (
        <CustomToast
          t={t}
          type="error"
          title="Validasi Gagal"
          message="URL proyek diperlukan"
        />
      ));
      return;
    }

    try {
      setScreenshotLoading(true);
      const accessKey = process.env.NEXT_PUBLIC_APIFLASH_KEY;
      
      if (!accessKey) {
        toast.custom((t) => (
          <CustomToast
            t={t}
            type="error"
            title="Konfigurasi Error"
            message="API key tidak ditemukan"
          />
        ));
        return;
      }

      // Hapus screenshot lama jika ada
      const currentImageUrl = editingProject ? editingProject.imageUrl : newProject.imageUrl;
      if (currentImageUrl) {
        await deleteImage(currentImageUrl);
      }

      // Validasi URL
      try {
        new URL(url);
      } catch (e) {
        toast.custom((t) => (
          <CustomToast
            t={t}
            type="error"
            title="Validasi Gagal"
            message="URL tidak valid"
          />
        ));
        return;
      }

      // Gunakan APIFlash untuk screenshot
      const apiUrl = 'https://api.apiflash.com/v1/urltoimage';
      const params = new URLSearchParams({
        access_key: accessKey,
        url: url,
        format: 'jpeg',
        quality: '100',
        width: '1920',
        height: '1080',
        fresh: 'true',
        response_type: 'json'
      });

      const response = await fetch(`${apiUrl}?${params.toString()}`, {
        method: 'GET'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let message = 'Gagal mengambil screenshot';

        switch (response.status) {
          case 401:
            message = 'API key tidak valid';
            break;
          case 402:
            message = 'Batas penggunaan API telah tercapai';
            break;
          case 422:
            message = 'Parameter tidak valid';
            break;
          default:
            message = errorData.message || `Error: ${response.status}`;
        }

        throw new Error(message);
      }

      const data = await response.json();
      
      if (!data.url) {
        throw new Error('Tidak ada URL screenshot yang diterima');
      }

      // Download gambar dari URL yang diberikan
      const imageResponse = await fetch(data.url);
      if (!imageResponse.ok) {
        throw new Error('Gagal mengunduh gambar screenshot');
      }

      const blob = await imageResponse.blob();
      if (blob.size === 0) {
        throw new Error('Gambar kosong');
      }

      // Upload ke Firebase Storage
      const filename = `screenshots/${Date.now()}_${url.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`;
      const storageRef = ref(storage, filename);
      
      // Upload blob ke Firebase Storage
      await uploadBytes(storageRef, blob);
      
      // Dapatkan URL download
      const imageUrl = await getDownloadURL(storageRef);
      
      if (editingProject) {
        setEditingProject({ ...editingProject, imageUrl });
      } else {
        setNewProject({ ...newProject, imageUrl });
      }
      
    } catch (error: any) {
      console.error('Screenshot error:', error.message);
      toast.custom((t) => (
        <CustomToast
          t={t}
          type="error"
          title="Gagal!"
          message={error.message || 'Gagal membuat screenshot'}
        />
      ));
    } finally {
      setScreenshotLoading(false);
    }
  };

  const handleCancelForm = async () => {
    try {
      // Hapus gambar jika ada sebelum menutup form
      const imageUrl = editingProject ? editingProject.imageUrl : newProject.imageUrl;
      if (imageUrl) {
        await deleteImage(imageUrl);
      }

      // Reset form
      setShowAddModal(false);
      setEditingProject(null);
      setNewProject({
        title: '',
        description: '',
        imageUrl: '',
        link: '',
        technologies: [],
        featured: false,
        isNewRelease: false,
        isUpdate: false
      });
    } catch (error) {
      console.error('Error cleaning up:', error);
      toast.custom((t) => (
        <CustomToast
          t={t}
          type="error"
          title="Peringatan"
          message="Terjadi kesalahan saat membersihkan data"
        />
      ));
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <AnimatedBackground>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 4000,
            custom: {
              duration: 5000,
            },
          }}
        />

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
              Projects
            </h1>
          </div>
          <button
            onClick={() => {
              setShowAddModal(true);
              setEditingProject(null);
              setNewProject({
                title: '',
                description: '',
                imageUrl: '',
                link: '',
                technologies: [],
                featured: false,
                isNewRelease: false,
                isUpdate: false
              });
            }}
            className="text-sm px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md flex items-center gap-2"
          >
            <FiPlus size={16} />
            <span>Add Project</span>
          </button>
        </div>

        {/* Projects Grid */}
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-gradient-to-r from-white/80 to-purple-50/30 backdrop-blur-sm rounded-2xl overflow-hidden shadow-md border border-white/60"
              >
                <div className="aspect-video bg-gradient-to-br from-indigo-100/50 to-purple-100/50 relative">
                  {project.imageUrl ? (
                    <img
                      src={project.imageUrl}
                      alt={project.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-indigo-300">
                      <FiPlus size={32} />
                    </div>
                  )}
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {project.title}
                        </h3>
                        {project.isNewRelease && (
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                            New
                          </span>
                        )}
                        {project.isUpdate && (
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            Update
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingProject(project)}
                        className="p-1.5 text-gray-600 hover:text-indigo-600 transition-colors"
                      >
                        <FiEdit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteProject(project)}
                        className="p-1.5 text-gray-600 hover:text-red-500 transition-colors"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {project.description}
                  </p>
                  {project.link && (
                    <a
                      href={project.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5"
                    >
                      <FiLink size={14} />
                      <span>View Project</span>
                    </a>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {project.technologies?.map((tech, index) => (
                      <span
                        key={index}
                        className="px-2.5 py-1 text-xs bg-gradient-to-r from-indigo-50 to-purple-50 text-gray-600 rounded-full border border-white/60"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="bg-gradient-to-r from-white/80 to-purple-50/30 backdrop-blur-sm rounded-3xl p-8 text-center max-w-md w-full border border-white/60 shadow-md">
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FiFolder className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                No Projects Yet
              </h3>
              <p className="text-gray-600 mb-6">
                Start showcasing your work by adding your first project. Click the button below to get started.
              </p>
              <button
                onClick={() => {
                  setShowAddModal(true);
                  setEditingProject(null);
                  setNewProject({
                    title: '',
                    description: '',
                    imageUrl: '',
                    link: '',
                    technologies: [],
                    featured: false,
                    isNewRelease: false,
                    isUpdate: false
                  });
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md text-sm"
              >
                <FiPlus size={16} />
                <span>Add Your First Project</span>
              </button>
            </div>
          </div>
        )}

        {/* Add/Edit Modal */}
        {(showAddModal || editingProject) && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-white/90 to-blue-50/80 backdrop-blur-sm rounded-3xl p-6 w-full max-w-xl max-h-[80vh] overflow-y-auto mx-4 shadow-lg border border-white/50">
              <h3 className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-4">
                {editingProject ? 'Edit Project' : 'Add New Project'}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={editingProject ? editingProject.title : newProject.title}
                    onChange={(e) => {
                      if (editingProject) {
                        setEditingProject({ ...editingProject, title: e.target.value });
                      } else {
                        setNewProject({ ...newProject, title: e.target.value });
                      }
                    }}
                    className="w-full text-sm text-gray-900 border-0 bg-white/50 rounded-lg px-4 py-2.5 focus:ring-0 focus:outline-none"
                    placeholder="Project title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={editingProject ? editingProject.description : newProject.description}
                    onChange={(e) => {
                      if (editingProject) {
                        setEditingProject({ ...editingProject, description: e.target.value });
                      } else {
                        setNewProject({ ...newProject, description: e.target.value });
                      }
                    }}
                    rows={4}
                    className="w-full text-sm text-gray-900 border-0 bg-white/50 rounded-lg px-4 py-2.5 focus:ring-0 focus:outline-none"
                    placeholder="Project description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project URL
                  </label>
                  <input
                    type="url"
                    value={editingProject ? editingProject.link : newProject.link}
                    onChange={(e) => {
                      if (editingProject) {
                        setEditingProject({ ...editingProject, link: e.target.value });
                      } else {
                        setNewProject({ ...newProject, link: e.target.value });
                      }
                    }}
                    className="w-full text-sm text-gray-900 border-0 bg-white/50 rounded-lg px-4 py-2.5 focus:ring-0 focus:outline-none"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Image
                  </label>
                  <div className="space-y-3">
                    {/* Preview Image */}
                    {(editingProject?.imageUrl || newProject.imageUrl) && (
                      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={editingProject?.imageUrl || newProject.imageUrl}
                          alt="Project preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => handleRemoveImage(!!editingProject)}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    )}
                    
                    {/* Upload and Screenshot Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg transition-all shadow-md ${uploading ? 'opacity-50 cursor-not-allowed' : 'hover:from-indigo-700 hover:to-purple-700'}`}
                      >
                        {uploading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <FiUpload size={16} />
                            <span>Upload Image</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          const url = editingProject ? editingProject.link : newProject.link;
                          if (!url) {
                            toast.custom((t) => (
                              <CustomToast
                                t={t}
                                type="error"
                                title="Validasi Gagal"
                                message="URL proyek diperlukan"
                              />
                            ));
                            return;
                          }
                          generateScreenshot(url);
                        }}
                        disabled={screenshotLoading}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg transition-all shadow-md ${screenshotLoading ? 'opacity-50 cursor-not-allowed' : 'hover:from-indigo-700 hover:to-purple-700'}`}
                        title="Generate screenshot from project URL"
                      >
                        {screenshotLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <FiCamera size={16} />
                            <span>Take Screenshot</span>
                          </>
                        )}
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleImageUpload(file);
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Technologies
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(editingProject ? editingProject.technologies : newProject.technologies)?.map((tech, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-gradient-to-r from-indigo-50 to-purple-50 text-gray-700 border border-white/60"
                      >
                        {tech}
                        <button
                          onClick={() => handleRemoveTech(tech, !!editingProject)}
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
                      value={newTech}
                      onChange={(e) => setNewTech(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTech(!!editingProject);
                        }
                      }}
                      className="flex-1 text-sm text-gray-900 border-0 bg-white/50 rounded-lg px-4 py-2.5 focus:ring-0 focus:outline-none"
                      placeholder="Add technology..."
                    />
                    <button
                      onClick={() => handleAddTech(!!editingProject)}
                      className="px-4 py-2 text-sm bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="featured"
                      checked={editingProject ? editingProject.featured : newProject.featured}
                      onChange={(e) => {
                        if (editingProject) {
                          setEditingProject({ ...editingProject, featured: e.target.checked });
                        } else {
                          setNewProject({ ...newProject, featured: e.target.checked });
                        }
                      }}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="featured" className="text-sm text-gray-700">
                      Featured project
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="newRelease"
                      checked={editingProject ? editingProject.isNewRelease : newProject.isNewRelease}
                      onChange={(e) => {
                        if (editingProject) {
                          setEditingProject({ 
                            ...editingProject, 
                            isNewRelease: e.target.checked,
                            // Jika New Release dicentang, Update harus false
                            isUpdate: e.target.checked ? false : editingProject.isUpdate 
                          });
                        } else {
                          setNewProject({ 
                            ...newProject, 
                            isNewRelease: e.target.checked,
                            // Jika New Release dicentang, Update harus false
                            isUpdate: e.target.checked ? false : newProject.isUpdate 
                          });
                        }
                      }}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="newRelease" className="text-sm text-gray-700">
                      New Release
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="update"
                      checked={editingProject ? editingProject.isUpdate : newProject.isUpdate}
                      onChange={(e) => {
                        if (editingProject) {
                          setEditingProject({ 
                            ...editingProject, 
                            isUpdate: e.target.checked,
                            // Jika Update dicentang, New Release harus false
                            isNewRelease: e.target.checked ? false : editingProject.isNewRelease 
                          });
                        } else {
                          setNewProject({ 
                            ...newProject, 
                            isUpdate: e.target.checked,
                            // Jika Update dicentang, New Release harus false
                            isNewRelease: e.target.checked ? false : newProject.isNewRelease 
                          });
                        }
                      }}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="update" className="text-sm text-gray-700">
                      Update
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={handleCancelForm}
                  disabled={saving}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={editingProject ? handleUpdateProject : handleAddProject}
                  disabled={saving}
                  className={`text-sm px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full transition-all shadow-md flex items-center gap-2 ${saving ? 'opacity-50 cursor-not-allowed' : 'hover:from-indigo-700 hover:to-purple-700'}`}
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{editingProject ? 'Updating...' : 'Adding...'}</span>
                    </>
                  ) : (
                    <>
                      <span>{editingProject ? 'Update' : 'Add'} Project</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {showDeleteDialog && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div 
              className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl border border-gray-100 transform transition-all duration-200 ease-out"
              style={{
                animation: 'dialog-enter 0.3s ease-out'
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
                    Apakah Anda yakin ingin menghapus project "{projectToDelete?.title}"? Tindakan ini tidak dapat dibatalkan.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDeleteDialog(false);
                    setProjectToDelete(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleteLoading}
                  className={`px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 ${deleteLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {deleteLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Menghapus...</span>
                    </>
                  ) : (
                    <>
                      <FiTrash2 className="w-4 h-4" />
                      <span>Hapus Project</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Dialog */}
        <SuccessDialog
          isOpen={showSuccessDialog}
          message={successMessage}
          onClose={() => setShowSuccessDialog(false)}
        />
      </div>

      <style jsx global>{`
        @keyframes dialog-enter {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes toast-enter {
          0% {
            opacity: 0;
            transform: translateY(-16px) scale(0.9);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes toast-leave {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-16px) scale(0.9);
          }
        }

        @keyframes shine {
          0% {
            transform: translateX(-100%) rotate(-45deg);
          }
          50%, 100% {
            transform: translateX(100%) rotate(-45deg);
          }
        }

        .animate-toast-enter {
          animation: toast-enter 0.35s ease-out forwards;
        }

        .animate-toast-leave {
          animation: toast-leave 0.35s ease-in forwards;
        }

        .animate-shine {
          animation: shine 2s infinite linear;
        }

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