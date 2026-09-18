import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { X, LogOut, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ALL_NAV } from '../navigation';

interface MenuProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Full-options menu: every page plus the signed-in profile and logout. */
export const Menu: React.FC<MenuProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const initial = (user?.name || user?.email || 'n').charAt(0).toUpperCase();

  const handleLogout = () => {
    logout();
    onClose();
    navigate('/login', { replace: true });
  };

  const go = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-[300px] max-w-[85vw] flex-col border-r border-bone-border bg-[#0f0f11] transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Menu"
      >
        <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-bone-divider px-5">
          <div className="flex items-center gap-2.5 text-[20px] font-bold tracking-[-0.06em] text-navy-900">
            <span className="grid h-[25px] w-[25px] place-items-center rounded-lg bg-gold-400 text-[15px] text-[#141414]">
              ✦
            </span>
            nivo
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-navy-500 transition-colors hover:bg-navy-100 hover:text-navy-900"
            aria-label="Fechar menu"
          >
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-navy-300">
            Navegação
          </p>
          <div className="space-y-1">
            {ALL_NAV.map((item, index) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => go(item.path)}
                  className={`flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm transition-colors ${
                    isActive
                      ? 'bg-gold-400 font-semibold text-[#171916]'
                      : 'text-navy-700 hover:bg-navy-100 hover:text-navy-900'
                  }`}
                >
                  <span
                    className={`text-[9px] font-semibold tabular-nums ${
                      isActive ? 'text-[#526027]' : 'text-navy-300'
                    }`}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        <div className="shrink-0 border-t border-bone-divider p-4">
          <div className="flex items-center gap-3 rounded-xl border border-bone-border bg-[#121214] p-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#ca7251] text-sm font-bold text-[#211512]">
              {initial}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-navy-900">
                {user?.name || user?.email || 'Cliente'}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-navy-500">
                <Sparkles className="h-3 w-3 text-gold-400" />
                Finanças pessoais
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-navy-200 px-3 py-2.5 text-sm text-navy-700 transition-colors hover:bg-navy-100 hover:text-navy-900"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </aside>
    </>
  );
};
