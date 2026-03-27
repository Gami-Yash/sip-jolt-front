import React from 'react';
import { FlaskConical, AlertTriangle } from 'lucide-react';

const TestModeBanner = ({ userName = 'Unknown User' }) => {
  const isDev = import.meta.env.DEV || import.meta.env.MODE !== 'production';
  
  if (!isDev) return null;
  
  const getEnvironment = () => {
    if (import.meta.env.MODE === 'development') return 'DEV';
    if (import.meta.env.MODE === 'staging') return 'STAGING';
    return 'DEV';
  };
  
  const env = getEnvironment();

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-red-600 text-white py-1.5 px-4 flex items-center justify-center gap-3 text-sm font-medium shadow-lg">
      <FlaskConical className="w-4 h-4 animate-pulse" />
      <span>TEST MODE</span>
      <span className="hidden sm:inline">—</span>
      <span className="hidden sm:inline">Current User: {userName}</span>
      <span className="px-2 py-0.5 bg-white/20 rounded text-xs font-bold">{env}</span>
      <AlertTriangle className="w-4 h-4 ml-2 hidden md:block" />
      <span className="hidden md:inline text-xs opacity-80">Data may be reset</span>
    </div>
  );
};

export default TestModeBanner;
