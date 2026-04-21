import React from 'react';
import { Menu, DollarSign } from 'lucide-react';

interface MobileHeaderProps {
  onMenuClick: () => void;
  title: string;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  onMenuClick,
  title,
}) => {
  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl z-30 border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
      <div className="flex items-center justify-between px-5 py-4">
        <button
          onClick={onMenuClick}
          className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 rounded-2xl transition-all duration-200 text-slate-600 dark:text-slate-300"
          aria-label="Menu"
        >
          <Menu className="w-5.5 h-5.5" strokeWidth={2.5} />
        </button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl shadow-md shadow-indigo-500/20">
            <DollarSign className="w-4.5 h-4.5 text-white" strokeWidth={3} />
          </div>
          <h1 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
            {title}
          </h1>
        </div>
        <div className="w-10" /> {/* Spacer for alignment */}
      </div>
    </header>
  );
};
