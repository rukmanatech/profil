'use client';

interface AnimatedBackgroundProps {
  children: React.ReactNode;
}

export default function AnimatedBackground({ children }: AnimatedBackgroundProps) {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 animate-gradient-move"></div>
      <div className="fixed inset-0">
        <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-white/40 to-transparent blur-3xl"></div>
        <div className="absolute left-0 top-0 bottom-0 w-[500px] bg-gradient-to-r from-blue-100/50 to-transparent blur-3xl"></div>
        <div className="absolute right-0 top-0 bottom-0 w-[500px] bg-gradient-to-l from-purple-100/50 to-transparent blur-3xl"></div>
        <div className="absolute bottom-0 left-0 right-0 h-[500px] bg-gradient-to-t from-white/40 to-transparent blur-3xl"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_50%,rgba(255,255,255,0.4),transparent)] blur-2xl"></div>
        <div className="absolute inset-0 bg-grid-white bg-grid opacity-[0.02]"></div>
      </div>
      <div className="relative">
        {children}
      </div>
    </div>
  );
} 