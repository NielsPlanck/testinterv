import React, { useState } from 'react';
import { InterviewConfig } from '../types';
import { Briefcase, Code, Cpu, Mic } from 'lucide-react';

interface SetupFormProps {
  onStart: (config: InterviewConfig) => void;
}

export const SetupForm: React.FC<SetupFormProps> = ({ onStart }) => {
  const [role, setRole] = useState('Frontend Engineer');
  const [experience, setExperience] = useState('Mid-Level');
  const [focus, setFocus] = useState('System Design');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart({
      role: role,
      experienceLevel: experience,
      focusArea: focus
    });
  };

  return (
    <div className="w-full max-w-md mx-auto bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mic className="w-8 h-8 text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-white">Interview Setup</h2>
        <p className="text-slate-400 mt-2">Configure your AI interviewer</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
            <Briefcase className="w-4 h-4" /> Target Role
          </label>
          <select 
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          >
            <option>Frontend Engineer</option>
            <option>Backend Engineer</option>
            <option>Full Stack Developer</option>
            <option>Product Manager</option>
            <option>Data Scientist</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
            <Code className="w-4 h-4" /> Experience Level
          </label>
          <select 
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          >
            <option>Junior (0-2 years)</option>
            <option>Mid-Level (2-5 years)</option>
            <option>Senior (5+ years)</option>
            <option>Staff/Principal</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
            <Cpu className="w-4 h-4" /> Focus Area
          </label>
          <input 
            type="text"
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            placeholder="e.g., React Hooks, System Design, Algorithms"
            className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-500"
          />
        </div>

        <button 
          type="submit"
          className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-4 rounded-xl shadow-lg transform transition-all hover:scale-[1.02] active:scale-[0.98] mt-4"
        >
          Start Interview Session
        </button>
      </form>
    </div>
  );
};