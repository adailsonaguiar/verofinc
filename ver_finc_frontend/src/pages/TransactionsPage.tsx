import React, { useEffect, useState } from 'react';
import { accountService } from '../services/accountService';
import { transactionService } from '../services/transactionService';
import { Transaction, CreateTransactionDto, UpdateTransactionDto } from '../types';
import { formatCurrency } from '../utils/transactions';
import { TransactionCard } from '../components/TransactionCard';
import { TransactionModal } from '../components/TransactionModal';
import { Loader2, TrendingUp, TrendingDown, Plus, ChevronLeft, ChevronRight, Filter, Search, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '../services/api';

export const TransactionsPage: React.FC = () => {
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [categories, setCategories] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<string>('all');
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
    const [availableMonths, setAvailableMonths] = useState<{year: number, month: number, label: string}[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

    useEffect(() => {
        loadCategories();
        loadAvailableMonths();
        loadAccounts();
    }, []);

    const loadAccounts = async () => {
        try {
            const data = await accountService.getByType('checking');
            setAccounts(data);
        } catch (err) {
            console.error('Erro ao carregar contas correntes:', err);
        }
    };

    const loadCategories = async () => {
        try {
            const res = await api.get('/categories');
            setCategories(res?.data);
        } catch (err) {
            console.error('Erro ao carregar categorias:', err);
        }
    };

    useEffect(() => {
        if (currentYear && currentMonth) {
            loadMonthTransactions();
        }
    }, [currentYear, currentMonth, selectedAccount, filterCategory, filterStatus]);

    const loadAvailableMonths = async () => {
        try {
            const months = await transactionService.getAvailableMonths();
            const formattedMonths = months.map(m => ({
                year: m.year,
                month: m.month,
                label: format(new Date(m.year, m.month - 1), 'MMMM yyyy', { locale: ptBR })
            }));
            setAvailableMonths(formattedMonths);
        } catch (err) {
            console.error('Error loading available months:', err);
        }
    };

    const loadMonthTransactions = async () => {
        try {
            setLoading(true);
            setError(null);
            let params: any = {
                year: currentYear,
                month: currentMonth
            };
            if (selectedAccount !== 'all') params.account = selectedAccount;
            if (filterCategory !== 'all') params.category = filterCategory;
            if (filterStatus !== 'all') params.status = filterStatus;

            const query = Object.entries(params)
                .map(([k, v]) => `${k}=${encodeURIComponent(v as string | number)}`)
                .join('&');
            const res = await api.get(`/transactions?${query}`);
            setTransactions(res?.data);
        } catch (err) {
            setError('Falha ao carregar transações. Verifique se o backend está rodando.');
            console.error('Error loading transactions:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTransaction = async (data: CreateTransactionDto) => {
        await transactionService.create(data);
        await loadAvailableMonths();
        await loadMonthTransactions();
    };

    const handleUpdateTransaction = async (data: UpdateTransactionDto) => {
        if (!editingTransaction) return;
        await transactionService.update(editingTransaction._id, data);
        await loadAvailableMonths();
        await loadMonthTransactions();
    };

    const handleEditTransaction = (transaction: Transaction) => {
        setEditingTransaction(transaction);
        setIsModalOpen(true);
    };

    const handleDeleteTransaction = async (transaction: Transaction) => {
        if (!confirm(`Deseja realmente excluir "${transaction.description}"?`)) {
            return;
        }

        try {
            await transactionService.delete(transaction._id);
            await loadAvailableMonths();
            await loadMonthTransactions();
        } catch (error) {
            console.error('Error deleting transaction:', error);
            alert('Falha ao excluir transação.');
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingTransaction(null);
    };

    const handlePreviousMonth = () => {
        const currentIndex = availableMonths.findIndex(m => m.year === currentYear && m.month === currentMonth);
        if (currentIndex < availableMonths.length - 1) {
            const prevMonth = availableMonths[currentIndex + 1];
            setCurrentYear(prevMonth.year);
            setCurrentMonth(prevMonth.month);
        }
    };

    const handleNextMonth = () => {
        const currentIndex = availableMonths.findIndex(m => m.year === currentYear && m.month === currentMonth);
        if (currentIndex > 0) {
            const nextMonth = availableMonths[currentIndex - 1];
            setCurrentYear(nextMonth.year);
            setCurrentMonth(nextMonth.month);
        }
    };

    const currentMonthLabel = availableMonths.find(m => m.year === currentYear && m.month === currentMonth)?.label || '';
    const currentIndexMonth = availableMonths.findIndex(m => m.year === currentYear && m.month === currentMonth);
    const hasPrevious = currentIndexMonth < availableMonths.length - 1;
    const hasNext = currentIndexMonth > 0;

    const CREDIT_CARD_PAYMENT_CATEGORY_ID = '699f0d49c0a92c8334e60765';
    const transactionsForTotals = transactions.filter(
        t => t.category?._id !== CREDIT_CARD_PAYMENT_CATEGORY_ID
    );

    const totalIncome = transactionsForTotals
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactionsForTotals
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpense;

    if (loading && transactions.length === 0) {
        return (
          <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-900">
            <div className="flex flex-col items-center">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
              <p className="text-slate-500 dark:text-slate-400 font-medium">Carregando transações...</p>
            </div>
          </div>
        );
    }

    return (
        <div className="flex-1 overflow-auto bg-[#F8FAFC] dark:bg-[#0F172A] transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                
                {/* Header Page */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Transações</h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Controle detalhado de cada movimentação.</p>
                    </div>

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                    >
                        <Plus className="w-5 h-5" strokeWidth={3} />
                        <span>Nova Transação</span>
                    </button>
                </div>

                {/* Filters & Statistics Summary */}
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                    
                    {/* Filter Card */}
                    <div className="xl:col-span-3 bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700/60 shadow-sm space-y-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Filter className="w-4 h-4 text-indigo-500" />
                            <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Filtros</span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                            <div className="space-y-2">
                                <label className="text-[13px] font-bold text-slate-500 dark:text-slate-400 ml-1">Conta Corrente</label>
                                <select
                                    value={selectedAccount}
                                    onChange={e => setSelectedAccount(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none font-semibold text-sm appearance-none"
                                >
                                    <option value="all">Todas as Contas</option>
                                    {accounts.map(acc => (
                                        <option key={acc._id} value={acc._id}>{acc.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[13px] font-bold text-slate-500 dark:text-slate-400 ml-1">Categoria</label>
                                <select
                                    value={filterCategory}
                                    onChange={e => setFilterCategory(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none font-semibold text-sm appearance-none"
                                >
                                    <option value="all">Todas Categorias</option>
                                    {categories.map(cat => (
                                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[13px] font-bold text-slate-500 dark:text-slate-400 ml-1">Status</label>
                                <select
                                    value={filterStatus}
                                    onChange={e => setFilterStatus(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none font-semibold text-sm appearance-none"
                                >
                                    <option value="all">Todos</option>
                                    <option value="paid">Pago / Recebido</option>
                                    <option value="unpaid">Pendente</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Month Selector Mini-Card */}
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700/60 shadow-sm flex flex-col justify-center gap-4">
                        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-2 rounded-2xl border border-slate-100 dark:border-slate-700">
                            <button
                                onClick={handlePreviousMonth}
                                disabled={!hasPrevious}
                                className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all disabled:opacity-20 text-slate-600 dark:text-slate-300 shadow-sm"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <span className="text-sm font-extrabold text-slate-900 dark:text-white capitalize truncate px-2">
                                {currentMonthLabel}
                            </span>
                            <button
                                onClick={handleNextMonth}
                                disabled={!hasNext}
                                className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all disabled:opacity-20 text-slate-600 dark:text-slate-300 shadow-sm"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex items-center justify-between px-2">
                             <span className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Total Itens</span>
                             <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-md">{transactions.length}</span>
                        </div>
                    </div>
                </div>

                {/* Monthly Quick Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-100 dark:border-slate-700/60 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                             <TrendingUp className="w-6 h-6" />
                        </div>
                        <div>
                             <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Receitas</p>
                             <p className="text-xl font-extrabold text-slate-900 dark:text-white">{formatCurrency(totalIncome)}</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-100 dark:border-slate-700/60 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
                             <TrendingDown className="w-6 h-6" />
                        </div>
                        <div>
                             <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Despesas</p>
                             <p className="text-xl font-extrabold text-slate-900 dark:text-white">{formatCurrency(totalExpense)}</p>
                        </div>
                    </div>
                    <div className={`bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-100 dark:border-slate-700/60 shadow-sm flex items-center gap-4 border-l-4 ${balance >= 0 ? 'border-l-indigo-500' : 'border-l-rose-500'}`}>
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${balance >= 0 ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                             <Activity className="w-6 h-6" />
                        </div>
                        <div>
                             <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Saldo</p>
                             <p className={`text-xl font-extrabold ${balance >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'}`}>
                                {formatCurrency(balance)}
                             </p>
                        </div>
                    </div>
                </div>

                {/* Transactions List */}
                <div className="space-y-4">
                    {transactions.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4">
                            {transactions.map(transaction => (
                                <TransactionCard
                                    key={transaction._id}
                                    transaction={transaction}
                                    onEdit={handleEditTransaction}
                                    onDelete={handleDeleteTransaction}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-700/60 p-16 text-center shadow-sm">
                            <div className="w-24 h-24 bg-slate-50 dark:bg-slate-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Search className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                                Nenhuma transação encontrada
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto font-medium leading-relaxed">
                                Tente ajustar seus filtros ou mude o mês selecionado para encontrar o que procura.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Transaction Modal */}
            <TransactionModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={(data) => editingTransaction ? handleUpdateTransaction(data as UpdateTransactionDto) : handleCreateTransaction(data as CreateTransactionDto)}
                initialData={editingTransaction || undefined}
                isEditing={!!editingTransaction}
            />
        </div>
    );
};
