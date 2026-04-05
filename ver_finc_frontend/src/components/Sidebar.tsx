import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { DollarSign, FolderOpen, X, CreditCard, Banknote, BarChart, Activity} from 'lucide-react';

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
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
                    onClick={onClose}
                />
            )}

            {/* Sidebar - Premium Minimalist Design */}
            <aside
                className={`fixed top-0 left-0 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    } lg:translate-x-0 lg:static lg:z-0 w-72 shadow-sm`}
            >
                <div className="flex flex-col h-full">
                    {/* Header - Minimalist Logo */}
                    <div className="px-8 py-10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3.5">
                                <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl shadow-lg shadow-indigo-500/20">
                                    <DollarSign className="w-6 h-6 text-white" strokeWidth={2.5} />
                                </div>
                                <div className="leading-tight">
                                    <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Vero Finc</h1>
                                    <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">Premium Finance</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                                aria-label="Fechar menu"
                            >
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                    </div>

                    {/* Navigation - Clean & Spaced */}
                    <nav className="flex-1 px-4 space-y-1.5">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;

                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={onClose}
                                    className={`flex items-center gap-3.5 px-5 py-3.5 rounded-2xl transition-all duration-300 group relative ${isActive
                                            ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold'
                                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white font-semibold'
                                        }`}
                                >
                                    <Icon className={`w-5 h-5 transition-all duration-300 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'
                                        } ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} strokeWidth={isActive ? 2.5 : 2} />
                                    <span className="text-[15px]">{item.label}</span>
                                    
                                    {isActive && (
                                        <div className="absolute left-0 w-1.5 h-6 bg-indigo-600 dark:bg-indigo-400 rounded-r-full"></div>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Pro/Info Card - Aesthetic Improvement */}
                    <div className="px-6 py-6 mt-auto">
                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-800 rounded-3xl p-5 border border-slate-200/50 dark:border-slate-700/50">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm">
                                    <Activity className="w-4 h-4 text-indigo-500" />
                                </div>
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Visão Geral</span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                                Organize suas finanças de forma simples e segura todos os dias.
                            </p>
                        </div>
                    </div>

                    {/* Footer - Subtle */}
                    <div className="px-8 py-6">
                        <p className="text-[10px] text-slate-400 dark:text-slate-600 font-bold uppercase tracking-widest">
                            © 2026 Vero Finc Solution
                        </p>
                    </div>
                </div>
            </aside>
        </>
    );
};
