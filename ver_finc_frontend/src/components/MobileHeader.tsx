import React from 'react';
import { Menu, DollarSign } from 'lucide-react';

interface MobileHeaderProps {
  onMenuClick: () => void;
  title: string;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ onMenuClick, title }) => {
  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 bg-white shadow-md z-30 border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={onMenuClick}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6 text-gray-700" />
        </button>

        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary-600" />
          <h1 className="text-lg font-bold text-gray-900">{title}</h1>
        </div>

        <div className="w-10" /> {/* Spacer for alignment */}
      </div>
    </header>
  );
};
