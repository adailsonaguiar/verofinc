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
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
                    onClick={onClose}
                />
            )}

            {/* Sidebar - Premium Minimalist Design */}
            <aside
                className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-50 transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    } lg:translate-x-0 lg:static lg:z-0 w-64 shadow-sm`}
            >
                <div className="flex flex-col h-full">
                    {/* Header - Minimalist Logo */}
                    <div className="px-6 py-8 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg shadow-indigo-500/25">
                                    <DollarSign className="w-5 h-5 text-white" strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h1 className="text-lg font-bold text-gray-900 tracking-tight">Vero Finc</h1>
                                    <p className="text-xs text-gray-500 font-medium">Financial Control</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                aria-label="Fechar menu"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                    </div>

                    {/* Navigation - Clean & Spaced */}
                    <nav className="flex-1 px-4 py-6">
                        <div className="space-y-1">
                            {menuItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.path;

                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={onClose}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                                            isActive
                                                ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium'
                                        }`}
                                    >
                                        <Icon className={`w-5 h-5 transition-transform duration-200 ${
                                            isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'
                                        } ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} strokeWidth={2} />
                                        <span className="text-sm">{item.label}</span>
                                        {isActive && (
                                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600"></div>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </nav>

                    {/* Footer - Subtle */}
                    <div className="px-6 py-4 border-t border-gray-100">
                        <p className="text-xs text-gray-400 text-center font-medium">
                            © 2026 Vero Finc
                        </p>
                    </div>
                </div>
            </aside>
        </>
    );
};
