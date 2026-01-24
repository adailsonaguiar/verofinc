import React from 'react';
import { Menu, DollarSign } from 'lucide-react';

interface MobileHeaderProps {
  onMenuClick: () => void;
  title: string;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ onMenuClick, title }) => {
  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md shadow-sm z-30 border-b border-gray-100">
      <div className="flex items-center justify-between px-4 py-4">
        <button
          onClick={onMenuClick}
          className="p-2.5 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition-all duration-200"
          aria-label="Menu"
        >
          <Menu className="w-5 h-5 text-gray-700" strokeWidth={2} />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg shadow-sm">
            <DollarSign className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-base font-bold text-gray-900 tracking-tight">{title}</h1>
        </div>

        <div className="w-10" /> {/* Spacer for alignment */}
      </div>
    </header>
  );
};
