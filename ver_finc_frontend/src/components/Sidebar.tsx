import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { DollarSign, FolderOpen, X, CreditCard, Banknote, BarChart} from 'lucide-react';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
    const location = useLocation();

    const menuItems = [
        { path: '/', icon: BarChart, label: 'Dashboard' },
        { path: '/transactions', icon: DollarSign, label: 'Transações' },
        { path: '/accounts', icon: Banknote, label: 'Contas Correntes' },
        { path: '/credit-cards', icon: CreditCard, label: 'Cartões de Crédito' },
        { path: '/categories', icon: FolderOpen, label: 'Categorias' },
    ];

    return (
        <>
            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 h-full bg-gradient-to-b from-blue-600 to-blue-800 text-white z-50 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    } lg:translate-x-0 lg:static lg:z-0 w-60 border-r border-blue-700 shadow-lg`}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="px-5 py-4 border-b border-blue-700/60">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-white/20 rounded-lg">
                                    <DollarSign className="w-5 h-5 text-white" />
                                </div>
                                <h1 className="text-lg font-semibold tracking-tight text-white">Vero Finc</h1>
                            </div>
                            <button
                                onClick={onClose}
                                className="lg:hidden p-2 hover:bg-white/10 rounded transition-colors"
                                aria-label="Fechar menu"
                            >
                                <X className="w-5 h-5 text-white" />
                            </button>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-3 py-4">
                        <ul className="space-y-1">
                            {menuItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.path;

                                return (
                                    <li key={item.path}>
                                        <Link
                                            to={item.path}
                                            onClick={onClose}
                                            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm font-medium ${isActive
                                                    ? 'bg-white/20 text-white border border-white/30'
                                                    : 'hover:bg-white/10 text-white border border-transparent'
                                                }`}
                                        >
                                            <Icon className={`w-4 h-4 text-white`} />
                                            <span>{item.label}</span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>

                    {/* Footer */}
                    <div className="px-5 py-4 border-t border-blue-700/60">
                        <p className="text-xs text-white/70 text-center">
                            © 2026 Vero Finc
                        </p>
                    </div>
                </div>
            </aside>
        </>
    );
};
