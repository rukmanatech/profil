'use client';

import { useState, useEffect, useRef } from 'react';
import { db, storage } from '@/app/config/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FiPlus, FiTrash2, FiEdit2, FiLink, FiArrowLeft, FiCamera, FiUpload, FiFolder } from 'react-icons/fi';
import toast, { Toaster } from 'react-hot-toast';
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

export default function ProjectsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
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
  const [saving, setSaving] = useState(false);

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
      toast.error('Error loading projects');
    }
  };

  const handleAddProject = async () => {
    try {
      if (!newProject.title || !newProject.description) {
        toast.error('Please fill in all required fields');
        return;
      }

      const projectData = {
        ...newProject,
        createdAt: new Date(),
      };

      await addDoc(collection(db, 'projects'), projectData);
      toast.success('Project added successfully');
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
      toast.error('Error adding project');
    }
  };

  const handleUpdateProject = async () => {
    if (!editingProject?.id) return;

    try {
      const { id, ...projectData } = editingProject;
      await updateDoc(doc(db, 'projects', id), projectData);
      toast.success('Project updated successfully');
      setEditingProject(null);
      fetchProjects();
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Error updating project');
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      await deleteDoc(doc(db, 'projects', projectId));
      toast.success('Project deleted successfully');
      fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Error deleting project');
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
      const storageRef = ref(storage, `projects/${file.name}-${Date.now()}`);
      await uploadBytes(storageRef, file);
      const imageUrl = await getDownloadURL(storageRef);
      
      if (editingProject) {
        setEditingProject({ ...editingProject, imageUrl });
      } else {
        setNewProject({ ...newProject, imageUrl });
      }
      
      toast.success('Image uploaded successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Error uploading image');
    }
  };

  const generateScreenshot = async (url: string) => {
    if (!url) {
      toast.error('URL proyek diperlukan');
      return;
    }

    try {
      setUploading(true);
      const accessKey = process.env.NEXT_PUBLIC_APIFLASH_KEY;
      
      if (!accessKey) {
        toast.error('API key tidak ditemukan');
        return;
      }

      // Validasi URL
      try {
        new URL(url);
      } catch (e) {
        toast.error('URL tidak valid');
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

      const imageUrl = URL.createObjectURL(blob);
      
      if (editingProject) {
        setEditingProject({ ...editingProject, imageUrl });
      } else {
        setNewProject({ ...newProject, imageUrl });
      }
      
      toast.success('Screenshot berhasil dibuat!');
    } catch (error: any) {
      console.error('Screenshot error:', error.message);
      toast.error(error.message || 'Gagal membuat screenshot');
    } finally {
      setUploading(false);
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
        <Toaster position="top-center" />

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
                        onClick={() => handleDeleteProject(project.id)}
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
                          onClick={() => {
                            if (editingProject) {
                              setEditingProject({ ...editingProject, imageUrl: '' });
                            } else {
                              setNewProject({ ...newProject, imageUrl: '' });
                            }
                          }}
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
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md"
                      >
                        <FiUpload size={16} />
                        <span>Upload Image</span>
                      </button>
                      <button
                        onClick={() => {
                          const url = editingProject ? editingProject.link : newProject.link;
                          if (!url) {
                            toast.error('Please enter project URL first');
                            return;
                          }
                          generateScreenshot(url);
                        }}
                        disabled={uploading}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg transition-all shadow-md ${uploading ? 'opacity-50 cursor-not-allowed' : 'hover:from-indigo-700 hover:to-purple-700'}`}
                        title="Generate screenshot from project URL"
                      >
                        {uploading ? (
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
                  onClick={() => {
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
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  onClick={editingProject ? handleUpdateProject : handleAddProject}
                  className="text-sm px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md"
                >
                  {editingProject ? 'Update' : 'Add'} Project
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AnimatedBackground>
  );
} 