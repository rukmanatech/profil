'use client';

interface LoadingOverlayProps {
  message?: string;
}

export default function LoadingOverlay({ message = 'Loading...' }: LoadingOverlayProps) {
  return (
    <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex flex-col items-center justify-center z-50">
      <div className="relative w-16 h-16">
        {/* Outer ring */}
        <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
        
        {/* Spinning gradient ring */}
        <div className="absolute inset-0 border-4 border-transparent border-t-indigo-600 rounded-full animate-spin"></div>
        
        {/* Inner gradient circles */}
        <div className="absolute inset-3 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute inset-4 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full opacity-40 animate-pulse delay-150"></div>
      </div>
      <p className="mt-4 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 font-medium animate-pulse text-sm">
        {message}
      </p>
    </div>
  );
} 