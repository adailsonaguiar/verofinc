import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Menu, Plus, Search } from 'lucide-react';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Visão Geral',
  '/transactions': 'Transações',
  '/accounts': 'Contas Correntes',
  '/credit-cards': 'Cartões de Crédito',
  '/categories': 'Categorias',
};

interface HeaderProps {
  onMenuClick: () => void;
}

/**
 * Single sticky header for every breakpoint: page title in Playfair,
 * global search, notifications and the primary "Nova transação" action.
 */
export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const title = PAGE_TITLES[location.pathname] ?? 'Vero Finc';

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const term = query.trim();
    navigate(
      term ? `/transactions?q=${encodeURIComponent(term)}` : '/transactions'
    );
  };

  const handleNewTransaction = () => navigate('/transactions?new=1');

  return (
    <header className="sticky top-0 z-20 bg-bone/80 backdrop-blur border-b border-bone-border">
      <div className="flex items-center gap-3 px-4 md:px-8 py-3">
        <button
          className="md:hidden btn btn-ghost !p-2"
          onClick={onMenuClick}
          aria-label="Abrir menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        <h1 className="font-display text-xl md:text-2xl text-navy-900">
          {title}
        </h1>

        <div className="ml-auto flex items-center gap-2">
          <form
            onSubmit={handleSearch}
            className="hidden md:flex items-center gap-2 px-3 py-2 bg-white border border-bone-border rounded-lg w-72"
          >
            <Search className="w-4 h-4 text-navy-300 shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-transparent outline-none text-sm flex-1 text-navy-900 placeholder:text-navy-300"
              placeholder="Buscar transações, contas..."
            />
          </form>

          <button
            className="btn btn-ghost !p-2"
            title="Notificações (em breve)"
            aria-label="Notificações"
          >
            <Bell className="w-4 h-4" />
          </button>

          <button
            className="btn btn-primary hidden sm:inline-flex"
            onClick={handleNewTransaction}
          >
            <Plus className="w-4 h-4" />
            Nova transação
          </button>
        </div>
      </div>
    </header>
  );
};
