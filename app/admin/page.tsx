'use client';

import { useState, useEffect } from 'react';
import { db, auth, storage } from '../config/firebase';
import { doc, getDoc, setDoc, collection, getDocs, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { FiEdit2, FiPlus, FiGithub, FiLinkedin, FiTwitter, FiInstagram, FiFacebook, FiYoutube, FiGlobe, FiTrash2, FiMail, FiPhone, FiFolder, FiFileText } from 'react-icons/fi';
import { SiTiktok, SiDiscord, SiTelegram, SiWhatsapp, SiMedium, SiBehance, SiDribbble, SiDevdotto, SiHashnode, SiStackoverflow, SiUpwork, SiFiverr, SiFreelancer } from 'react-icons/si';
import toast, { Toaster } from 'react-hot-toast';
import Navbar from '../components/Navbar';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import AnimatedBackground from '../components/AnimatedBackground';
import Image from 'next/image';
import LoadingOverlay from '../components/LoadingOverlay';

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  icon: string;
}

interface Profile {
  name: string;
  title: string;
  bio: string;
  avatar: string;
  skills: string[];
  socialLinks: SocialLink[];
}

interface Project {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  link: string;
  technologies: string[];
}

const SOCIAL_PLATFORMS = [
  {
    category: 'Professional',
    platforms: [
      { 
        id: 'linkedin', 
        name: 'LinkedIn', 
        icon: FiLinkedin,
        placeholder: 'https://linkedin.com/in/username',
        color: '#0077B5'
      },
      { 
        id: 'github', 
        name: 'GitHub', 
        icon: FiGithub,
        placeholder: 'https://github.com/username',
        color: '#333'
      },
      { 
        id: 'stackoverflow', 
        name: 'Stack Overflow', 
        icon: SiStackoverflow,
        placeholder: 'https://stackoverflow.com/users/userid',
        color: '#F48024'
      },
      { 
        id: 'devto', 
        name: 'Dev.to', 
        icon: SiDevdotto,
        placeholder: 'https://dev.to/username',
        color: '#0A0A0A'
      },
      { 
        id: 'hashnode', 
        name: 'Hashnode', 
        icon: SiHashnode,
        placeholder: 'https://hashnode.com/@username',
        color: '#2962FF'
      },
      { 
        id: 'medium', 
        name: 'Medium', 
        icon: SiMedium,
        placeholder: 'https://medium.com/@username',
        color: '#000000'
      }
    ]
  },
  {
    category: 'Freelance',
    platforms: [
      { 
        id: 'upwork', 
        name: 'Upwork', 
        icon: SiUpwork,
        placeholder: 'https://www.upwork.com/freelancers/~id',
        color: '#14A800'
      },
      { 
        id: 'fiverr', 
        name: 'Fiverr', 
        icon: SiFiverr,
        placeholder: 'https://www.fiverr.com/username',
        color: '#1DBF73'
      },
      { 
        id: 'freelancer', 
        name: 'Freelancer', 
        icon: SiFreelancer,
        placeholder: 'https://www.freelancer.com/u/username',
        color: '#29B2FE'
      }
    ]
  },
  {
    category: 'Design',
    platforms: [
      { 
        id: 'behance', 
        name: 'Behance', 
        icon: SiBehance,
        placeholder: 'https://behance.net/username',
        color: '#1769FF'
      },
      { 
        id: 'dribbble', 
        name: 'Dribbble', 
        icon: SiDribbble,
        placeholder: 'https://dribbble.com/username',
        color: '#EA4C89'
      }
    ]
  },
  {
    category: 'Social Media',
    platforms: [
      { 
        id: 'twitter', 
        name: 'Twitter', 
        icon: FiTwitter,
        placeholder: 'https://twitter.com/username',
        color: '#1DA1F2'
      },
      { 
        id: 'instagram', 
        name: 'Instagram', 
        icon: FiInstagram,
        placeholder: 'https://instagram.com/username',
        color: '#E4405F'
      },
      { 
        id: 'facebook', 
        name: 'Facebook', 
        icon: FiFacebook,
        placeholder: 'https://facebook.com/username',
        color: '#1877F2'
      },
      { 
        id: 'youtube', 
        name: 'YouTube', 
        icon: FiYoutube,
        placeholder: 'https://youtube.com/@username',
        color: '#FF0000'
      },
      { 
        id: 'tiktok', 
        name: 'TikTok', 
        icon: SiTiktok,
        placeholder: 'https://tiktok.com/@username',
        color: '#000000'
      }
    ]
  },
  {
    category: 'Messaging',
    platforms: [
      { 
        id: 'discord', 
        name: 'Discord', 
        icon: SiDiscord,
        placeholder: 'https://discord.gg/invite-code',
        color: '#5865F2'
      },
      { 
        id: 'telegram', 
        name: 'Telegram', 
        icon: SiTelegram,
        placeholder: 'https://t.me/username',
        color: '#26A5E4'
      },
      { 
        id: 'whatsapp', 
        name: 'WhatsApp', 
        icon: SiWhatsapp,
        placeholder: 'https://wa.me/phonenumber',
        color: '#25D366'
      }
    ]
  },
  {
    category: 'Contact',
    platforms: [
      { 
        id: 'email', 
        name: 'Email', 
        icon: FiMail,
        placeholder: 'mailto:your@email.com',
        color: '#EA4335'
      },
      { 
        id: 'phone', 
        name: 'Phone', 
        icon: FiPhone,
        placeholder: 'tel:+1234567890',
        color: '#34A853'
      },
      { 
        id: 'website', 
        name: 'Website', 
        icon: FiGlobe,
        placeholder: 'https://your-website.com',
        color: '#4285F4'
      }
    ]
  }
];

// Loading component
const LoadingScreen = () => (
  <AnimatedBackground>
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="relative w-24 h-24">
        {/* Outer ring */}
        <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
        
        {/* Spinning gradient ring */}
        <div className="absolute inset-0 border-4 border-transparent border-t-indigo-600 rounded-full animate-spin"></div>
        
        {/* Inner gradient circles */}
        <div className="absolute inset-4 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute inset-6 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full opacity-40 animate-pulse delay-150"></div>
      </div>
      <p className="mt-8 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 font-medium animate-pulse">
        Loading...
      </p>
    </div>
  </AnimatedBackground>
);

export default function EditProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile>({
    name: '',
    title: '',
    bio: '',
    avatar: '',
    skills: [],
    socialLinks: [],
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState<string | null>(null);
  const [newSkill, setNewSkill] = useState('');
  const [saving, setSaving] = useState(false);
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [socialUrls, setSocialUrls] = useState<{[key: string]: string}>({});
  const [modalStep, setModalStep] = useState<'select' | 'urls'>('select');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch profile
        const profileDoc = await getDoc(doc(db, 'profile', user.uid));
        if (profileDoc.exists()) {
          setProfile(profileDoc.data() as Profile);
        }

        // Fetch projects
        const projectsSnapshot = await getDocs(collection(db, 'projects'));
        const projectsData = projectsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Project[];
        setProjects(projectsData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Error loading data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, authLoading, router]);

  const handleProfileUpdate = async (field: string, value: any) => {
    setSaving(true);
    try {
      const profileRef = doc(db, 'profile', 'main');
      const profileDoc = await getDoc(profileRef);

      if (!profileDoc.exists()) {
        // Jika dokumen belum ada, buat baru
        await setDoc(profileRef, {
          [field]: value,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      } else {
        // Jika sudah ada, update
        await updateDoc(profileRef, {
          [field]: value,
          updatedAt: new Date()
        });
      }
      
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (section: string) => {
    setSaving(true);
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('No user logged in');

      await setDoc(doc(db, 'profile', userId), profile, { merge: true });
      toast.success('Saved successfully');
      setEditMode(null);
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Error saving changes');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !profile.skills.includes(newSkill.trim())) {
      setProfile(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleSelectPlatforms = () => {
    if (selectedPlatforms.length === 0) {
      toast.error('Please select at least one platform');
      return;
    }
    
    // Inisialisasi state URL untuk platform yang dipilih
    const initialUrls: {[key: string]: string} = {};
    selectedPlatforms.forEach(platformId => {
      initialUrls[platformId] = '';
    });
    setSocialUrls(initialUrls);
    
    setModalStep('urls');
  };

  const handleAddSocialLinks = () => {
    // Validasi URL tidak boleh kosong
    const emptyUrls = Object.entries(socialUrls).filter(([_, url]) => !url.trim());
    if (emptyUrls.length > 0) {
      toast.error('Please fill all URLs');
      return;
    }

    // Buat social links baru
    const newLinks: SocialLink[] = selectedPlatforms.map(platformId => {
      const platform = SOCIAL_PLATFORMS
        .flatMap(category => category.platforms)
        .find(p => p.id === platformId)!;
      return {
        id: platformId,
        platform: platform.name,
        url: socialUrls[platformId].trim(),
        icon: platformId
      };
    });

    // Update profile dengan social links baru
    setProfile(prev => ({
      ...prev,
      socialLinks: [...prev.socialLinks, ...newLinks]
    }));

    // Reset state modal
    setSelectedPlatforms([]);
    setSocialUrls({});
    setModalStep('select');
    setShowSocialModal(false);
    handleSave('social');
  };

  const handleRemoveSocialLink = (id: string) => {
    setProfile(prev => ({
      ...prev,
      socialLinks: prev.socialLinks.filter(link => link.id !== id)
    }));
    handleSave('social');
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('No user logged in');

      // Ambil data profil terbaru untuk mendapatkan path file lama
      const profileDoc = await getDoc(doc(db, 'profile', userId));
      const currentProfile = profileDoc.data();

      // Hapus file lama dari storage jika ada
      if (currentProfile?.avatarPath) {
        try {
          const oldAvatarRef = ref(storage, currentProfile.avatarPath);
          await deleteObject(oldAvatarRef);
        } catch (deleteError) {
          console.error('Error deleting old avatar:', deleteError);
          // Lanjutkan proses meskipun gagal menghapus file lama
        }
      }

      // Generate nama file yang unik untuk file baru
      const fileName = `avatars/${userId}_${Date.now()}_${file.name}`;
      const storageRef = ref(storage, fileName);
      
      // Upload file baru ke storage
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      // Update profile dengan URL avatar baru
      const updatedProfile = {
        ...profile,
        avatar: downloadURL,
        avatarPath: fileName
      };

      await setDoc(doc(db, 'profile', userId), updatedProfile, { merge: true });
      setProfile(updatedProfile);
      toast.success('Avatar updated successfully');
    } catch (error) {
      console.error('Error updating avatar:', error);
      toast.error('Error updating avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAvatar = async () => {
    setUploading(true);
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('No user logged in');

      // Ambil data profil terbaru
      const profileDoc = await getDoc(doc(db, 'profile', userId));
      const currentProfile = profileDoc.data();
      
      // Hapus file dari storage jika ada path
      if (currentProfile?.avatarPath) {
        const avatarRef = ref(storage, currentProfile.avatarPath);
        await deleteObject(avatarRef);
      }

      // Update profile tanpa avatar
      const updatedProfile = {
        ...profile,
        avatar: '',
        avatarPath: ''
      };

      await setDoc(doc(db, 'profile', userId), updatedProfile, { merge: true });
      setProfile(updatedProfile);
      toast.success('Avatar deleted successfully');
    } catch (error) {
      console.error('Error deleting avatar:', error);
      toast.error('Error deleting avatar');
    } finally {
      setUploading(false);
    }
  };

  if (authLoading || loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return null;
  }

  return (
    <AnimatedBackground>
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
        <Toaster position="top-center" />

        {/* Hero Section */}
        <section className="relative bg-white/80 backdrop-blur-sm rounded-3xl p-6 sm:p-8 mb-6 shadow-md border border-white/60">
          {uploading && <LoadingOverlay message="Processing profile..." />}
          <div className="flex flex-col items-center gap-6 sm:gap-8">
            {/* Avatar */}
            <div className="relative">
              {/* Outer ring dengan gradient */}
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full blur"></div>
              
              {/* Inner container */}
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-gradient-to-br from-white to-gray-100 ring-2 ring-white shadow-xl">
                {profile.avatar ? (
                  <Image
                    src={profile.avatar}
                    alt="Profile"
                    fill
                    className="object-cover hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 transition-colors hover:text-gray-400">
                    <FiPlus size={32} />
                  </div>
                )}
              </div>
              
              {/* Edit & Delete Buttons */}
              <div className="absolute -bottom-2 right-0 flex gap-2 transition-opacity">
                <label className={`p-2 bg-white rounded-full shadow-lg cursor-pointer hover:bg-gray-50 hover:scale-110 transition-all ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                    disabled={uploading}
                  />
                  <FiEdit2 size={16} className="text-gray-600" />
                </label>
                {profile.avatar && (
                  <button
                    onClick={handleDeleteAvatar}
                    disabled={uploading}
                    className={`p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 hover:scale-110 transition-all ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <FiTrash2 size={16} className="text-red-500" />
                  </button>
                )}
              </div>
            </div>

            {/* Basic Info */}
            <div className="w-full text-center space-y-2">
              <input
                type="text"
                value={profile.name}
                onChange={e => setProfile({...profile, name: e.target.value})}
                onBlur={() => handleSave('basic')}
                className="block w-full text-2xl sm:text-3xl font-medium border-0 focus:ring-0 focus:outline-none bg-transparent text-center text-gray-900 placeholder-gray-300 hover:bg-gray-50/50 transition-colors rounded-lg"
                placeholder="Your Name"
              />
              <input
                type="text"
                value={profile.title}
                onChange={e => setProfile({...profile, title: e.target.value})}
                onBlur={() => handleSave('basic')}
                className="block w-full text-base sm:text-lg text-gray-900 border-0 focus:ring-0 focus:outline-none bg-transparent text-center placeholder-gray-300 hover:bg-gray-50/50 transition-colors rounded-lg"
                placeholder="Professional Title"
              />
            </div>
          </div>
        </section>

        {/* Bio Section */}
        <section className="relative bg-gradient-to-br from-white/80 to-blue-50/30 backdrop-blur-sm rounded-3xl p-6 sm:p-8 mb-6 shadow-md border border-white/60">
          {saving && editMode === 'bio' && <LoadingOverlay message="Saving changes..." />}
          <h2 className="text-lg sm:text-xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-4">About Me</h2>
          <textarea
            value={profile.bio}
            onChange={e => setProfile({...profile, bio: e.target.value})}
            onBlur={() => handleSave('bio')}
            rows={4}
            className="block w-full text-base text-gray-900 border-0 focus:ring-0 focus:outline-none bg-transparent resize-none placeholder-gray-300 hover:bg-gray-50/50 transition-colors rounded-lg"
            placeholder="Write something about yourself..."
          />
        </section>

        {/* Skills Section */}
        <section className="relative bg-gradient-to-br from-white/80 to-purple-50/30 backdrop-blur-sm rounded-3xl p-6 sm:p-8 mb-6 shadow-md border border-white/60">
          {saving && editMode === 'skills' && <LoadingOverlay message="Saving changes..." />}
          <h2 className="text-lg sm:text-xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 mb-6">Skills & Technologies</h2>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gradient-to-r from-indigo-50 to-purple-50 text-gray-700 hover:from-indigo-100 hover:to-purple-100 transition-all group border border-white/60"
                >
                  {skill}
                  <button
                    onClick={() => {
                      handleRemoveSkill(skill);
                      handleSave('skills');
                    }}
                    className="ml-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSkill}
                onChange={e => setNewSkill(e.target.value)}
                onKeyPress={e => {
                  if (e.key === 'Enter') {
                    handleAddSkill();
                    handleSave('skills');
                  }
                }}
                className="flex-1 text-sm text-gray-900 border-0 bg-gradient-to-r from-white/70 to-purple-50/50 rounded-full px-4 py-2 focus:ring-0 focus:outline-none placeholder-gray-400 hover:from-white hover:to-purple-100/50 transition-all border border-white/50"
                placeholder="Add a skill..."
              />
              <button
                onClick={() => {
                  handleAddSkill();
                  handleSave('skills');
                }}
                className="text-sm px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full hover:from-indigo-700 hover:to-purple-700 transition-all shadow-sm hover:shadow-md"
              >
                Add
              </button>
            </div>
          </div>
        </section>

        {/* Social Links */}
        <section className="relative bg-gradient-to-br from-white/80 to-blue-50/30 backdrop-blur-sm rounded-3xl p-6 sm:p-8 mb-6 shadow-md border border-white/60">
          {saving && editMode === 'social' && <LoadingOverlay message="Saving changes..." />}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg sm:text-xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Social Links</h2>
            <button
              onClick={() => setShowSocialModal(true)}
              className="text-sm px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full hover:from-indigo-700 hover:to-purple-700 transition-all shadow-sm hover:shadow-md flex items-center gap-2"
            >
              <FiPlus size={16} />
              <span>Add Link</span>
            </button>
          </div>
          
          <div className="space-y-4">
            {profile.socialLinks.map((link) => {
              const platform = SOCIAL_PLATFORMS
                .flatMap(category => category.platforms)
                .find(p => p.id === link.id);
              const Icon = platform?.icon || FiGlobe;
              
              return (
                <div key={link.id} className="flex items-center gap-3 group hover:bg-gray-50/50 rounded-lg p-2 transition-all">
                  <Icon 
                    className="flex-shrink-0 text-gray-400 group-hover:text-gray-600 transition-colors" 
                    size={20}
                  />
                  <input
                    type="url"
                    value={link.url}
                    onChange={(e) => {
                      const updatedLinks = profile.socialLinks.map(l =>
                        l.id === link.id ? { ...l, url: e.target.value } : l
                      );
                      setProfile(prev => ({ ...prev, socialLinks: updatedLinks }));
                    }}
                    onBlur={() => handleSave('social')}
                    className="flex-1 text-sm text-gray-900 border-0 focus:ring-0 focus:outline-none bg-transparent placeholder-gray-300"
                    placeholder={platform?.placeholder}
                  />
                  <button
                    onClick={() => handleRemoveSocialLink(link.id)}
                    className="opacity-0 group-hover:opacity-100 transition-all p-1 hover:text-red-500"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              );
            })}
            {profile.socialLinks.length === 0 && (
              <div className="text-center py-6">
                <p className="text-gray-400 text-sm">No social links added yet</p>
              </div>
            )}
          </div>
        </section>

        {/* Management Links */}
        <section className="bg-gradient-to-br from-white/80 to-purple-50/30 backdrop-blur-sm rounded-3xl p-6 sm:p-8 mb-6 shadow-md border border-white/60">
          <h2 className="text-lg sm:text-xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 mb-6">Content Management</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/admin/projects" prefetch>
              <div className="bg-gradient-to-r from-indigo-100/50 to-purple-100/50 rounded-2xl p-6 border border-white/60 shadow-md transition-all">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl text-white">
                    <FiFolder size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Projects</h3>
                    <p className="text-sm text-gray-600">Manage your featured projects</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/admin/blog" prefetch>
              <div className="bg-gradient-to-r from-indigo-100/50 to-purple-100/50 rounded-2xl p-6 border border-white/60 shadow-md transition-all">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl text-white">
                    <FiFileText size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Blog</h3>
                    <p className="text-sm text-gray-600">Manage your blog posts</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </section>
      </div>

      {/* Modal */}
      {showSocialModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50">
          <div className="relative bg-gradient-to-br from-white/90 to-blue-50/80 backdrop-blur-sm rounded-3xl p-6 w-full max-w-xl max-h-[80vh] overflow-y-auto mx-4 shadow-lg border border-white/50">
            {saving && <LoadingOverlay message="Adding social links..." />}
            <h3 className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-blue-900 to-purple-600 mb-4">
              {modalStep === 'select' ? 'Select Social Platforms' : 'Add Social Links'}
            </h3>

            {modalStep === 'select' ? (
              <>
                <div className="space-y-6">
                  {SOCIAL_PLATFORMS.map(category => {
                    const availablePlatforms = category.platforms.filter(platform => 
                      !profile.socialLinks.some(link => link.id === platform.id)
                    );

                    if (availablePlatforms.length === 0) return null;

                    return (
                      <div key={category.category}>
                        <h4 className="text-sm font-medium text-gray-600 mb-3">
                          {category.category}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {availablePlatforms.map(platform => {
                            const Icon = platform.icon;
                            const isSelected = selectedPlatforms.includes(platform.id);
                            return (
                              <label 
                                key={platform.id}
                                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                                  isSelected ? 'bg-gray-50' : 'hover:bg-gray-50'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedPlatforms(prev => [...prev, platform.id]);
                                    } else {
                                      setSelectedPlatforms(prev => 
                                        prev.filter(id => id !== platform.id)
                                      );
                                    }
                                  }}
                                  className="rounded-full border-gray-300 text-gray-900 focus:ring-gray-900"
                                />
                                <div className="flex items-center gap-2">
                                  <Icon size={18} style={{ color: platform.color }} />
                                  <span className="text-sm text-gray-700">{platform.name}</span>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowSocialModal(false);
                      setSelectedPlatforms([]);
                    }}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSelectPlatforms}
                    className="text-sm px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full hover:from-indigo-700 hover:to-purple-700 transition-all shadow-sm hover:shadow-md"
                  >
                    Next
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-4">
                  {selectedPlatforms.map(platformId => {
                    const platform = SOCIAL_PLATFORMS
                      .flatMap(category => category.platforms)
                      .find(p => p.id === platformId)!;
                    const Icon = platform.icon;
                    return (
                      <div key={platformId}>
                        <label className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <Icon size={16} style={{ color: platform.color }} />
                          <span>{platform.name}</span>
                        </label>
                        <input
                          type="url"
                          value={socialUrls[platformId]}
                          onChange={(e) => setSocialUrls(prev => ({
                            ...prev,
                            [platformId]: e.target.value
                          }))}
                          className="w-full text-sm text-gray-900 border-0 bg-gray-50 rounded-lg px-4 py-2 focus:ring-0 focus:outline-none"
                          placeholder={platform.placeholder}
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => setModalStep('select')}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleAddSocialLinks}
                    className="text-sm px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full hover:from-indigo-700 hover:to-purple-700 transition-all shadow-sm hover:shadow-md"
                  >
                    Add Links
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </AnimatedBackground>
  );
} 