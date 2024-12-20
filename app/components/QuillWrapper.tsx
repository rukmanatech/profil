'use client';

import { useEffect, useState, useRef } from 'react';
import { storage } from '@/app/config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import toast from 'react-hot-toast';

interface QuillWrapperProps {
  value: string;
  onChange: (value: string) => void;
}

export default function QuillWrapper({ value, onChange }: QuillWrapperProps) {
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleImageUpload = async (file: File) => {
    try {
      setUploading(true);
      const storageRef = ref(storage, `blog-images/${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      const imageUrl = await getDownloadURL(storageRef);
      
      // Menambahkan URL gambar ke konten
      const imageMarkdown = `\n![${file.name}](${imageUrl})\n`;
      onChange(value + imageMarkdown);
      toast.success('Gambar berhasil diunggah!');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Gagal mengunggah gambar');
    } finally {
      setUploading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="bg-white rounded-lg h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg">
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
          <div className="flex gap-2">
            <button className="p-1 hover:bg-gray-200 rounded" title="Bold">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
                <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
              </svg>
            </button>
            <button className="p-1 hover:bg-gray-200 rounded" title="Italic">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="4" x2="10" y2="4"></line>
                <line x1="14" y1="20" x2="5" y2="20"></line>
                <line x1="15" y1="4" x2="9" y2="20"></line>
              </svg>
            </button>
            <button 
              className="p-1 hover:bg-gray-200 rounded relative" 
              title="Upload Image"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-indigo-600"></div>
                </div>
              )}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleImageUpload(file);
                }
              }}
            />
          </div>
        </div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-64 p-4 text-gray-900 focus:outline-none resize-none"
          placeholder="Write your content here..."
        />
      </div>
      <div className="mt-1 text-xs text-gray-400 italic">
        Tip: Format teks dengan **tebal**, *miring*, [link](url)
      </div>
    </div>
  );
} 