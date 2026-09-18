import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu as MenuIcon } from 'lucide-react';
import { MAIN_NAV } from '../navigation';

interface BottomBarProps {
  onMenuClick: () => void;
}

/** Mobile bottom bar: primary pages plus a button that opens the full menu. */
export const BottomBar: React.FC<BottomBarProps> = ({ onMenuClick }) => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 flex items-stretch justify-around border-t border-bone-border bg-[#0f0f11]/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      aria-label="Navegação inferior"
    >
      {MAIN_NAV.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] transition-colors ${
              isActive ? 'text-gold-400' : 'text-navy-500'
            }`}
          >
            <span
              className={`grid h-8 w-12 place-items-center rounded-lg transition-colors ${
                isActive ? 'bg-gold-400 text-[#171916]' : ''
              }`}
            >
              <Icon className="h-[18px] w-[18px]" />
            </span>
            <span className={isActive ? 'font-semibold' : ''}>{item.label}</span>
          </button>
        );
      })}

      <button
        onClick={onMenuClick}
        className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] text-navy-500 transition-colors"
      >
        <span className="grid h-8 w-12 place-items-center rounded-lg">
          <MenuIcon className="h-[18px] w-[18px]" />
        </span>
        <span>Menu</span>
      </button>
    </nav>
  );
};
