import React, { useState } from 'react';
import { InterviewConfig, InterviewStatus } from './types';
import { useLiveInterview } from './hooks/useLiveInterview';
import { SetupForm } from './components/SetupForm';
import { Visualizer } from './components/Visualizer';
import { Transcript } from './components/Transcript';
import { Mic, MicOff, PhoneOff, RotateCcw, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [config, setConfig] = useState<InterviewConfig | null>(null);
  const [muted, setMuted] = useState(false);
  
  const { 
    status, 
    transcripts, 
    error, 
    volumeLevels, 
    connect, 
    disconnect 
  } = useLiveInterview();

  const handleStart = (newConfig: InterviewConfig) => {
    setConfig(newConfig);
    connect(newConfig);
  };

  const handleReset = () => {
    disconnect();
    setConfig(null);
  };

  const toggleMute = () => {
    // In a real implementation, this would toggle MediaStream track enabled state
    // For this demo, we just toggle visual state as the hook handles raw stream
    setMuted(!muted);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-emerald-400 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                 <span className="text-white font-bold text-lg">M</span>
             </div>
             <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                MockMate
             </h1>
          </div>
          {status === InterviewStatus.ACTIVE && (
             <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-xs font-medium text-emerald-400">Live Session</span>
             </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-6 flex flex-col">
        
        {status === InterviewStatus.IDLE || status === InterviewStatus.SETUP || status === InterviewStatus.COMPLETED ? (
           <div className="flex-1 flex flex-col items-center justify-center animate-fadeIn">
              {status === InterviewStatus.COMPLETED && (
                  <div className="mb-8 p-4 bg-slate-800/50 border border-slate-700 rounded-lg text-center">
                      <h3 className="text-lg font-semibold text-emerald-400 mb-2">Session Completed</h3>
                      <p className="text-slate-400 text-sm">Great job! Review your transcript below or start a new session.</p>
                  </div>
              )}
              <SetupForm onStart={handleStart} />
              
              {transcripts.length > 0 && status === InterviewStatus.COMPLETED && (
                 <div className="w-full mt-12 bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden max-w-3xl">
                    <div className="bg-slate-950/30 px-6 py-4 border-b border-slate-700">
                        <h3 className="font-semibold">Previous Session Transcript</h3>
                    </div>
                    <div className="h-96 overflow-y-auto p-4 scrollbar-hide">
                        <Transcript items={transcripts} />
                    </div>
                 </div>
              )}
           </div>
        ) : (
          <div className="flex-1 flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
            
            {/* Left Panel: Visuals & Controls */}
            <div className="flex-1 flex flex-col bg-slate-800/40 rounded-3xl border border-slate-700 overflow-hidden relative">
                {/* Error Banner */}
                {status === InterviewStatus.ERROR && (
                    <div className="absolute top-0 left-0 right-0 bg-red-500/90 text-white px-4 py-2 flex items-center justify-center gap-2 z-50 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                        <button onClick={handleReset} className="underline ml-2">Try Again</button>
                    </div>
                )}
                
                {/* Connecting State */}
                {status === InterviewStatus.CONNECTING && (
                    <div className="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center z-40 backdrop-blur-sm">
                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-blue-300 font-medium">Connecting to Gemini Live...</p>
                    </div>
                )}

                {/* Config Info */}
                <div className="absolute top-6 left-6 z-10">
                    <h2 className="text-2xl font-bold text-white">{config?.role}</h2>
                    <p className="text-slate-400 text-sm">{config?.focusArea}</p>
                </div>

                {/* Visualizer Area */}
                <div className="flex-1 flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800/50 via-slate-900 to-slate-900"></div>
                    <Visualizer 
                        userVolume={muted ? 0 : volumeLevels.user} 
                        aiVolume={volumeLevels.ai} 
                        status={status} 
                    />
                </div>

                {/* Controls Bar */}
                <div className="h-24 bg-slate-900/50 backdrop-blur-md border-t border-slate-700 flex items-center justify-center gap-6">
                    <button 
                        onClick={toggleMute}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${muted ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
                    >
                        {muted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                    </button>
                    
                    <button 
                        onClick={disconnect}
                        className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-500/30 transform hover:scale-105 transition-all"
                    >
                        <PhoneOff className="w-8 h-8" />
                    </button>
                </div>
            </div>

            {/* Right Panel: Transcript */}
            <div className="hidden lg:flex w-96 flex-col bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden shadow-xl">
                <div className="p-4 border-b border-slate-700 bg-slate-850 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-200">Live Transcript</h3>
                    <span className="text-xs px-2 py-1 bg-slate-700 rounded text-slate-400">Auto-scroll</span>
                </div>
                <div className="flex-1 overflow-y-auto scrollbar-hide bg-slate-900/50">
                    <Transcript items={transcripts} />
                </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;