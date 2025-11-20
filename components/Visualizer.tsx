import React from 'react';

interface VisualizerProps {
  userVolume: number;
  aiVolume: number;
  status: string;
}

export const Visualizer: React.FC<VisualizerProps> = ({ userVolume, aiVolume, status }) => {
  const isActive = status === 'ACTIVE';
  
  // Dynamic sizes based on volume
  const userSize = 80 + (userVolume * 100);
  const aiSize = 80 + (aiVolume * 150);

  return (
    <div className="relative h-64 w-full flex items-center justify-center space-x-12">
      {/* User Orb */}
      <div className="flex flex-col items-center space-y-4">
        <div className="relative flex items-center justify-center">
            <div 
                className={`rounded-full bg-blue-500/30 transition-all duration-100 ease-out blur-md absolute`}
                style={{ width: `${userSize}px`, height: `${userSize}px` }}
            />
            <div 
                className={`relative z-10 w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg border-2 border-blue-300 transition-transform duration-100`}
                style={{ transform: `scale(${1 + userVolume * 0.2})` }}
            >
                 <span className="text-2xl">👤</span>
            </div>
        </div>
        <span className="text-blue-200 font-medium text-sm uppercase tracking-wider">You</span>
      </div>

      {/* Connection Line */}
      <div className="w-24 h-1 bg-slate-700 relative overflow-hidden rounded-full">
         {isActive && (
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400 to-transparent w-1/2 animate-[shimmer_1.5s_infinite_linear]"></div>
         )}
      </div>

      {/* AI Orb */}
      <div className="flex flex-col items-center space-y-4">
        <div className="relative flex items-center justify-center">
             <div 
                className={`rounded-full bg-emerald-500/30 transition-all duration-100 ease-out blur-md absolute`}
                style={{ width: `${aiSize}px`, height: `${aiSize}px` }}
            />
            <div 
                className={`relative z-10 w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg border-2 border-emerald-300 transition-transform duration-100`}
                style={{ transform: `scale(${1 + aiVolume * 0.3})` }}
            >
                 <span className="text-2xl">🤖</span>
            </div>
        </div>
        <span className="text-emerald-200 font-medium text-sm uppercase tracking-wider">Gemini AI</span>
      </div>
      
      <style>{`
        @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
};