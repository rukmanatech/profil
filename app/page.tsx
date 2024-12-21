'use client';

import { useState, useEffect } from 'react';
import { db } from './config/firebase';
import { doc, getDoc, getDocs, collection } from 'firebase/firestore';
import Link from 'next/link';
import Image from 'next/image';
import { FiGithub, FiLinkedin, FiTwitter, FiInstagram, FiFacebook, FiYoutube, FiGlobe, FiMail, FiPhone, FiExternalLink } from 'react-icons/fi';
import { SiTiktok, SiDiscord, SiTelegram, SiWhatsapp, SiMedium, SiBehance, SiDribbble, SiDevdotto, SiHashnode, SiStackoverflow, SiUpwork, SiFiverr, SiFreelancer } from 'react-icons/si';
import AnimatedBackground from './components/AnimatedBackground';
import DOMPurify from 'isomorphic-dompurify';

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  icon: string;
}

interface Profile {
  id?: string;
  name: string;
  title: string;
  bio: string;
  avatar: string;
  avatarPath: string;
  skills: string[];
  socialLinks: SocialLink[];
  createdAt: Date;
  updatedAt: Date;
}

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
  createdAt?: any;
  updatedAt?: any;
}

interface Post {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  link?: string;
  createdAt: any;
}

const SOCIAL_ICONS: { [key: string]: any } = {
  github: FiGithub,
  linkedin: FiLinkedin,
  twitter: FiTwitter,
  instagram: FiInstagram,
  facebook: FiFacebook,
  youtube: FiYoutube,
  tiktok: SiTiktok,
  discord: SiDiscord,
  telegram: SiTelegram,
  whatsapp: SiWhatsapp,
  medium: SiMedium,
  behance: SiBehance,
  dribbble: SiDribbble,
  devto: SiDevdotto,
  hashnode: SiHashnode,
  stackoverflow: SiStackoverflow,
  upwork: SiUpwork,
  fiverr: SiFiverr,
  freelancer: SiFreelancer,
  website: FiGlobe,
  email: FiMail,
  phone: FiPhone,
};

// Fungsi untuk membersihkan HTML dan mengambil teks saja
const stripHtml = (html: string) => {
  const clean = DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
  return clean.substring(0, 200) + (clean.length > 200 ? '...' : '');
};

export default function Home() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        // Fetch profile
        const profileDoc = await getDoc(doc(db, 'profile', 'Qm8iFttChLWD1wLbSCLmnLxl2HS2'));
        
        if (profileDoc.exists()) {
          const data = profileDoc.data();
          setProfile({
            id: profileDoc.id,
            name: data.name,
            title: data.title,
            bio: data.bio,
            avatar: data.avatar,
            avatarPath: data.avatarPath,
            skills: data.skills || [],
            socialLinks: data.socialLinks || [],
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date()
          });
        }

        // Fetch projects
        const projectsSnapshot = await getDocs(collection(db, 'projects'));
        const projectsData = projectsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Project[];
        setProjects(projectsData);

        // Fetch blog posts
        const blogSnapshot = await getDocs(collection(db, 'blog'));
        const blogData = blogSnapshot.docs.map(doc => {
          const data = doc.data();
          console.log('Blog data:', data); // Debugging
          return {
            id: doc.id,
            title: data.title,
            content: data.content,
            imageUrl: data.imageUrl,
            link: data.slug ? `/blog/${data.slug}` : data.link, // Menggunakan slug jika ada
            createdAt: data.createdAt
          };
        }) as Post[];
        setPosts(blogData);

      } catch (error: any) {
        console.error('Error fetching data:', error);
        setError(error.message || 'Terjadi kesalahan saat mengambil data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-transparent border-t-indigo-600 rounded-full animate-spin"></div>
          <div className="absolute inset-4 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute inset-6 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full opacity-40 animate-pulse delay-150"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-white/80 rounded-xl shadow-sm border border-white/60">
          <h2 className="text-2xl font-semibold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <AnimatedBackground>
      <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <section className="max-w-4xl mx-auto mb-16 text-center">
          <div className="relative w-32 h-32 sm:w-40 sm:h-40 mx-auto mb-8">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full blur"></div>
            <div className="relative rounded-full overflow-hidden ring-2 ring-white shadow-xl w-full h-full">
              {profile.avatar ? (
                <Image
                  src={profile.avatar}
                  alt={profile.name}
                  width={160}
                  height={160}
                  className="object-cover w-full h-full"
                  priority
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                  <span className="text-4xl font-medium text-indigo-300">
                    {profile.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 mb-4">
            {profile.name}
          </h1>
          <p className="text-xl sm:text-2xl font-medium tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-6">
            {profile.title}
          </p>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            {profile.bio}
          </p>
        </section>

        {/* Social Links */}
        {profile.socialLinks && profile.socialLinks.length > 0 && (
          <section className="max-w-2xl mx-auto mb-16">
            <div className="flex flex-wrap justify-center gap-3">
              {profile.socialLinks.map((link) => {
                const Icon = SOCIAL_ICONS[link.id] || FiGlobe;
                return (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 hover:bg-white shadow-sm hover:shadow-md border border-white/60 transition-all text-gray-600 hover:text-gray-900"
                  >
                    <Icon size={18} />
                    <span className="text-sm font-medium">{link.platform}</span>
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {/* Skills */}
        {profile.skills && profile.skills.length > 0 && (
          <section className="max-w-4xl mx-auto mb-16">
            <h2 className="text-2xl font-semibold tracking-tight text-center text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-8">
              Skills & Technologies
            </h2>
            <div className="flex flex-wrap justify-center gap-3">
              {profile.skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-indigo-50 to-purple-50 text-gray-700 border border-white/60"
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Projects Section */}
        {projects.length > 0 && (
          <section className="max-w-6xl mx-auto mb-16">
            <h2 className="text-2xl font-semibold tracking-tight text-center text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-8">
              Projects
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <div key={project.id} className="bg-white/80 rounded-xl shadow-sm hover:shadow-md transition-all p-4 border border-white/60 flex flex-col">
                  <div className="relative">
                    {project.imageUrl && (
                      <div className="relative h-48 mb-4 rounded-lg overflow-hidden">
                        <Image
                          src={project.imageUrl}
                          alt={project.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col flex-grow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                          {project.title}
                        </h3>
                        <div className="flex gap-1.5">
                          {project.isNewRelease && (
                            <span className="px-2 py-0.5 text-xs font-semibold bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full shadow-sm">
                              New
                            </span>
                          )}
                          {project.isUpdate && (
                            <span className="px-2 py-0.5 text-xs font-semibold bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full shadow-sm">
                              Update
                            </span>
                          )}
                        </div>
                      </div>
                      {project.updatedAt && (
                        <span className="text-xs text-indigo-500">
                          {new Date(project.updatedAt.toDate()).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mt-2 mb-4 text-sm">{project.description}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.technologies.map((tech, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs font-medium bg-gradient-to-r from-indigo-50 to-purple-50 rounded-full text-indigo-600"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                    <div className="mt-auto flex justify-end">
                      {project.link && (
                        <a
                          href={project.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full hover:from-indigo-700 hover:to-purple-700 transition-all shadow-sm hover:shadow-md"
                        >
                          View Project <FiExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Blog Posts Section */}
        {posts.length > 0 && (
          <section className="max-w-4xl mx-auto mb-16">
            <h2 className="text-2xl font-semibold tracking-tight text-center text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-8">
              Blog Posts
            </h2>
            <div className="space-y-6">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="group bg-white/80 rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden border border-white/60 cursor-pointer transform hover:-translate-y-1"
                  onClick={() => {
                    console.log('Clicking post:', post); // Debugging
                    if (post.link) {
                      if (post.link.startsWith('/')) {
                        // Internal link
                        window.location.href = post.link;
                      } else {
                        // External link
                        window.open(post.link, '_blank', 'noopener,noreferrer');
                      }
                    } else {
                      console.log('No link available for this post'); // Debugging
                    }
                  }}
                  role="link"
                  tabIndex={0}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && post.link) {
                      if (post.link.startsWith('/')) {
                        window.location.href = post.link;
                      } else {
                        window.open(post.link, '_blank', 'noopener,noreferrer');
                      }
                    }
                  }}
                >
                  <div className="flex flex-col md:flex-row h-full">
                    {post.imageUrl && (
                      <div className="relative w-full md:w-48 h-48 overflow-hidden">
                        <Image
                          src={post.imageUrl}
                          alt={post.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    )}
                    <div className="p-6 flex flex-col flex-grow">
                      <h3 className="text-xl font-semibold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 group-hover:from-indigo-500 group-hover:to-purple-500">
                        {post.title}
                      </h3>
                      <p className="text-gray-600 mb-4 flex-grow line-clamp-3">{stripHtml(post.content)}</p>
                      <div className="flex items-center justify-between mt-auto">
                        <div className="text-sm text-indigo-500">
                          {new Date(post.createdAt.toDate()).toLocaleDateString('id-ID', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                        {post.link && (
                          <span className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full group-hover:from-indigo-700 group-hover:to-purple-700 transition-all shadow-sm group-hover:shadow-md">
                            Baca Selengkapnya <FiExternalLink className="w-4 h-4" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>
    </AnimatedBackground>
  );
}

