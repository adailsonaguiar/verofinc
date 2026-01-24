import React, { useEffect, useState } from 'react';
import { accountService } from '../services/accountService';
import { transactionService } from '../services/transactionService';
import { Transaction, CreateTransactionDto, UpdateTransactionDto } from '../types';
import { formatCurrency } from '../utils/transactions';
import { TransactionCard } from '../components/TransactionCard';
import { TransactionModal } from '../components/TransactionModal';
import { Loader2, DollarSign, TrendingUp, TrendingDown, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import api from '../services/api';

export const TransactionsPage: React.FC = () => {
    // Filtros avançados
    // const [filterDescription, setFilterDescription] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [categories, setCategories] = useState<any[]>([]);

    useEffect(() => {
      loadCategories();
    }, []);

    const loadCategories = async () => {
      try {
        const res = await api.get('/categories');
        setCategories(res?.data);
      } catch (err) {
        console.error('Erro ao carregar categorias:', err);
      }
    };
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
        label: format(new Date(m.year, m.month - 1), 'MMMM yyyy')
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
    //   if (filterDescription.trim()) params.description = filterDescription.trim();
      if (filterCategory !== 'all') params.category = filterCategory;
      if (filterStatus !== 'all') params.status = filterStatus;

      // Monta query string
      const query = Object.entries(params)
        .map(([k, v]) => `${k}=${encodeURIComponent(v as string | number)}`)
        .join('&');
      const res = await api.get(`/transactions?${query}`);
      setTransactions(res?.data);
    } catch (err) {
      setError('Failed to load transactions. Please make sure the backend is running.');
      console.error('Error loading transactions:', err);
    } finally {
      setLoading(false);
    }
  };
  // Adiciona método ao transactionService para buscar por mês e conta
  // transactionService.getByMonthAndAccount(year, month, accountId)

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
    if (!confirm(`Are you sure you want to delete "${transaction.description}"?`)) {
      return;
    }

    try {
      await transactionService.delete(transaction._id);
      await loadAvailableMonths();
      await loadMonthTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Failed to delete transaction. Please try again.');
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
  const currentIndex = availableMonths.findIndex(m => m.year === currentYear && m.month === currentMonth);
  const hasPrevious = currentIndex < availableMonths.length - 1;
  const hasNext = currentIndex > 0;

  // Calculate monthly statistics
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading transactions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h3 className="text-red-800 font-semibold mb-2">Error</h3>
          <p className="text-red-600">{error}</p>
          <button
            onClick={loadMonthTransactions}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-mac-bg text-mac-text">
    
      {/* New Transaction Button - Mobile */}
      <div className="lg:hidden fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center w-12 h-12 bg-gradient-to-b from-blue-600 to-blue-800 text-white rounded-full shadow-lg hover:shadow-xl transition-all border border-blue-700"
          aria-label="Nova transação"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* New Transaction Button - Desktop */}
      <div className="hidden lg:block sticky top-0 z-30 bg-mac-bg border-b border-mac-border">
        <div className="mx-auto px-4 py-3 flex justify-end">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-b from-blue-600 to-blue-800 text-white rounded-lg shadow-lg hover:shadow-xl transition-all border border-blue-700"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Nova transação</span>
          </button>
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

        {/* Card de filtros avançados */}
      <div className="w-full px-4 pt-6">
        <div className="mb-6">
          <div className="bg-white rounded-2xl shadow-lg border border-mac-border p-6 flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Conta */}
            <div className="flex flex-col">
              <label htmlFor="account-select" className="text-sm font-medium text-mac-title mb-1">Conta</label>
              <select
                id="account-select"
                value={selectedAccount}
                onChange={e => setSelectedAccount(e.target.value)}
                className="px-4 py-2 rounded-xl border border-mac-border bg-gray-50 text-mac-text shadow focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
              >
                <option value="all" className="font-medium">Todas</option>
                {accounts.map(acc => (
                  <option key={acc._id} value={acc._id} className="font-medium">
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>
            {/* Descrição */}
            {/* <div className="flex flex-col flex-1">
              <label htmlFor="desc-filter" className="text-sm font-medium text-mac-title mb-1">Descrição</label>
              <input
                id="desc-filter"
                type="text"
                value={filterDescription}
                onChange={e => setFilterDescription(e.target.value)}
                placeholder="Buscar por descrição..."
                className="px-4 py-2 rounded-xl border border-mac-border bg-gray-50 text-mac-text shadow focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
              />
            </div> */}
            {/* Categoria */}
            <div className="flex flex-col">
              <label htmlFor="cat-filter" className="text-sm font-medium text-mac-title mb-1">Categoria</label>
              <select
                id="cat-filter"
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="px-4 py-2 rounded-xl border border-mac-border bg-gray-50 text-mac-text shadow focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
              >
                <option value="all">Todas</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>
            {/* Status */}
            <div className="flex flex-col">
              <label htmlFor="status-filter" className="text-sm font-medium text-mac-title mb-1">Status</label>
              <select
                id="status-filter"
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="px-4 py-2 rounded-xl border border-mac-border bg-gray-50 text-mac-text shadow focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
              >
                <option value="all">Todos</option>
                <option value="paid">Pago</option>
                <option value="unpaid">Pendente</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Overall Statistics */}
      <div className="mx-auto px-4 py-6">
        {/* Month Navigation Header */}
        {availableMonths.length > 0 && (
          <div className="bg-mac-card rounded-2xl border border-mac-border mb-6">
            <div className="flex items-center justify-between px-4 py-3">
              <button
                onClick={handlePreviousMonth}
                disabled={!hasPrevious}
                className="p-1 hover:bg-mac-hover rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Mês anterior"
              >
                <ChevronLeft className="w-5 h-5 text-mac-icon" />
              </button>

              <div className="text-center">
                <h2 className="text-lg font-semibold text-mac-title">
                  {currentMonthLabel}
                </h2>
                <p className="text-xs text-mac-muted mt-0.5">
                  {transactions.length} transação(ões)
                </p>
              </div>

              <button
                onClick={handleNextMonth}
                disabled={!hasNext}
                className="p-1 hover:bg-mac-hover rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Próximo mês"
              >
                <ChevronRight className="w-5 h-5 text-mac-icon" />
              </button>
            </div>

            {/* Monthly Summary */}
            <div className="grid grid-cols-3 gap-2 px-4 pb-4">
              <div className="text-center p-2 bg-mac-green rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <TrendingUp className="w-4 h-4 text-green-700" />
                  <span className="text-xs font-medium text-green-800">Receitas</span>
                </div>
                <p className="text-base font-semibold text-green-800">
                  {formatCurrency(totalIncome)}
                </p>
              </div>

              <div className="text-center p-2 bg-mac-red rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <TrendingDown className="w-4 h-4 text-red-700" />
                  <span className="text-xs font-medium text-red-800">Despesas</span>
                </div>
                <p className="text-base font-semibold text-red-800">
                  {formatCurrency(totalExpense)}
                </p>
              </div>

              <div className="text-center p-2 bg-mac-blue rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <DollarSign className="w-4 h-4 text-blue-700" />
                  <span className="text-xs font-medium text-blue-800">Saldo</span>
                </div>
                <p className={`text-base font-semibold ${
                  balance >= 0 ? 'text-blue-800' : 'text-orange-600'
                }`}>
                  {formatCurrency(balance)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Monthly Transactions */}
        <div className="space-y-2">
          {transactions.length > 0 ? (
            transactions.map(transaction => (
              <TransactionCard
                key={transaction._id}
                transaction={transaction}
                onEdit={handleEditTransaction}
                onDelete={handleDeleteTransaction}
              />
            ))
          ) : availableMonths.length === 0 ? (
            <div className="bg-mac-card rounded-2xl border border-mac-border p-10 text-center">
              <DollarSign className="w-12 h-12 text-mac-icon mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-mac-title mb-1">
                Nenhuma transação ainda
              </h3>
              <p className="text-mac-muted">
                Comece adicionando transações para vê-las organizadas por mês
              </p>
            </div>
          ) : (
            <div className="bg-mac-card rounded-2xl border border-mac-border p-10 text-center">
              <DollarSign className="w-12 h-12 text-mac-icon mx-auto mb-2" />
              <p className="text-mac-muted">
                Nenhuma transação para este mês
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
