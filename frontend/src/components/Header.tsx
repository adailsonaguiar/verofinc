import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Menu, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { MAIN_NAV } from '../navigation';

interface HeaderProps {
  onMenuClick: () => void;
}

/**
 * nivo topbar: brand, orbit navigation (desktop), and a set of quiet actions
 * (search, notifications, profile). The hamburger opens the full-options menu.
 */
export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const term = query.trim();
    navigate(
      term ? `/transactions?q=${encodeURIComponent(term)}` : '/transactions'
    );
    setQuery('');
    setSearchOpen(false);
  };

  const initial = (user?.name || user?.email || 'n').charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 border-b border-bone-border bg-bone/85 backdrop-blur">
      <div className="mx-auto flex h-[76px] max-w-[1280px] items-center gap-3 px-4 md:px-[50px]">
        <button
          onClick={onMenuClick}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-navy-500 transition-colors hover:bg-navy-100 hover:text-navy-900"
          aria-label="Abrir menu"
        >
          <Menu className="h-[18px] w-[18px]" />
        </button>

        <button
          onClick={() => navigate('/')}
          className="flex shrink-0 items-center gap-2.5 text-[22px] font-bold tracking-[-0.06em] text-navy-900"
          aria-label="nivo"
        >
          <span className="grid h-[25px] w-[25px] place-items-center rounded-lg bg-gold-400 text-[15px] text-[#141414]">
            ✦
          </span>
          <span>nivo</span>
        </button>

        <nav
          className="mx-auto hidden items-center gap-1 rounded-[15px] border border-bone-border bg-[#131315] p-1.5 lg:flex"
          aria-label="Navegação principal"
        >
          {MAIN_NAV.map((item, index) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-2 rounded-[10px] px-3.5 py-2.5 text-[11px] transition-colors ${
                  isActive
                    ? 'bg-gold-400 text-[#171916] shadow-glow'
                    : 'text-navy-500 hover:text-gold-400'
                }`}
              >
                <span
                  className={`text-[9px] font-semibold tabular-nums ${
                    isActive ? 'text-[#526027]' : 'text-navy-300'
                  }`}
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          {searchOpen ? (
            <form
              onSubmit={handleSearch}
              className="flex items-center gap-2 rounded-lg border border-navy-200 bg-[#171719] px-3 py-2"
            >
              <Search className="h-4 w-4 shrink-0 text-navy-300" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onBlur={() => !query && setSearchOpen(false)}
                className="w-40 bg-transparent text-sm text-navy-900 outline-none placeholder:text-navy-300"
                placeholder="Buscar…"
              />
            </form>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden h-9 w-9 items-center justify-center rounded-lg text-navy-500 transition-colors hover:bg-navy-100 hover:text-navy-900 sm:flex"
              aria-label="Buscar"
            >
              <Search className="h-[18px] w-[18px]" />
            </button>
          )}

          <button
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-navy-500 transition-colors hover:bg-navy-100 hover:text-navy-900"
            title="Notificações (em breve)"
            aria-label="Notificações"
          >
            <Bell className="h-[18px] w-[18px]" />
            <i className="absolute right-[7px] top-[7px] h-[5px] w-[5px] rounded-full bg-gold-400" />
          </button>

          <button
            onClick={onMenuClick}
            className="ml-1 flex items-center gap-1.5 rounded-lg p-1 text-navy-500 transition-colors hover:text-navy-900"
            aria-label="Perfil"
          >
            <span className="grid h-[27px] w-[27px] place-items-center rounded-lg bg-[#ca7251] text-[10px] font-bold text-[#211512]">
              {initial}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
