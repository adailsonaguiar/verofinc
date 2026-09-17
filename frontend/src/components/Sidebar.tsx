import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  DollarSign,
  FolderOpen,
  X,
  CreditCard,
  Banknote,
  BarChart,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const menuItems = [
    { path: '/', icon: BarChart, label: 'Visão Geral' },
    { path: '/transactions', icon: DollarSign, label: 'Transações' },
    { path: '/accounts', icon: Banknote, label: 'Contas Correntes' },
    { path: '/credit-cards', icon: CreditCard, label: 'Cartões de Crédito' },
    { path: '/categories', icon: FolderOpen, label: 'Categorias' },
  ];

  const initial = (user?.name || user?.email || 'V').charAt(0).toUpperCase();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed md:sticky top-0 left-0 h-full md:h-screen z-40 w-64 shrink-0 bg-navy-900 text-white flex flex-col transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <div className="flex flex-col h-full min-h-0">
          {/* Brand */}
          <div className="px-5 py-6 border-b border-white/10">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-display text-2xl tracking-wide">
                  Vero Finc
                </div>
                <div className="text-xs text-navy-200 tracking-widest uppercase mt-1">
                  Controle Financeiro
                </div>
              </div>
              <button
                onClick={onClose}
                className="md:hidden p-2 text-navy-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Fechar menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-3 space-y-1 flex-1 overflow-y-auto min-h-0">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={`nav-link ${isActive ? 'active' : ''}`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gold-500 text-navy-900 grid place-items-center font-semibold shrink-0">
                {initial}
              </div>
              <div className="text-sm min-w-0 flex-1">
                <div className="font-medium truncate">
                  {user?.name || user?.email || 'Cliente'}
                </div>
                <div className="text-xs text-navy-200">Cliente Premium</div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-navy-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors shrink-0"
                title="Sair"
                aria-label="Sair"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
