import React, { useEffect, useState } from 'react';
import { categoryService } from '../services/categoryService';
import { transactionService } from '../services/transactionService';
import { accountService } from '../services/accountService';
import { Category, Transaction } from '../types';
import { Loader2, Activity } from 'lucide-react';
import { CategoryEvolutionChart } from '../components/CategoryEvolutionChart';
import { CategoryComparisonChart } from '../components/CategoryComparisonChart';
import { DashboardHeader } from '../components/DashboardHeader';
import { DashboardSummaryCards } from '../components/DashboardSummaryCards';
import { DashboardMonthlyHistory } from '../components/DashboardMonthlyHistory';
import { DashboardRecentTransactions } from '../components/DashboardRecentTransactions';
import { DashboardCategoryDonut } from '../components/DashboardCategoryDonut';
import { DailySpendingChart } from '../components/DailySpendingChart';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const DashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [checkingAccounts, setCheckingAccounts] = useState<any[]>([]);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [availableMonths, setAvailableMonths] = useState<
    { year: number; month: number; label: string }[]
  >([]);

  useEffect(() => {
    loadAvailableMonths();
    loadCheckingAccounts();
    loadCategories();
    loadAllTransactions();
  }, []);

  useEffect(() => {
    if (currentYear && currentMonth) loadMonthTransactions();
  }, [currentYear, currentMonth]);

  const loadAvailableMonths = async () => {
    try {
      const months = await transactionService.getAvailableMonths();
      setAvailableMonths(
        months.map((m) => ({
          year: m.year,
          month: m.month,
          label: format(new Date(m.year, m.month - 1), 'MMMM yyyy', { locale: ptBR }),
        }))
      );
    } catch (err) {
      console.error('Erro ao carregar meses disponíveis:', err);
    }
  };

  const loadCategories = async () => {
    try {
      setCategories(await categoryService.getAll());
    } catch (err) {
      console.error('Erro ao carregar categorias:', err);
    }
  };

  const loadCheckingAccounts = async () => {
    try {
      setCheckingAccounts(await accountService.getByType('checking'));
    } catch (err) {
      console.error('Erro ao carregar contas correntes:', err);
    }
  };

  const loadAllTransactions = async () => {
    try {
      const all = await transactionService.getLastMonths(6);
      setAllTransactions(
        [...all].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      );
    } catch (err) {
      console.error('Erro ao carregar transações:', err);
    }
  };

  const loadMonthTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      setTransactions(await transactionService.getByMonth(currentYear, currentMonth));
    } catch (err) {
      setError('Erro ao carregar dados do dashboard.');
    } finally {
      setLoading(false);
    }
  };

  // Month navigation
  const currentIndex = availableMonths.findIndex(
    (m) => m.year === currentYear && m.month === currentMonth
  );
  const hasPrevious = currentIndex < availableMonths.length - 1;
  const hasNext = currentIndex > 0;
  const currentMonthLabel =
    availableMonths.find((m) => m.year === currentYear && m.month === currentMonth)?.label ||
    format(new Date(currentYear, currentMonth - 1), 'MMMM yyyy', { locale: ptBR });

  const handlePreviousMonth = () => {
    if (hasPrevious) {
      const prev = availableMonths[currentIndex + 1];
      setCurrentYear(prev.year);
      setCurrentMonth(prev.month);
    }
  };

  const handleNextMonth = () => {
    if (hasNext) {
      const next = availableMonths[currentIndex - 1];
      setCurrentYear(next.year);
      setCurrentMonth(next.month);
    }
  };

  // Computed values
  const transactionsForTotals = transactions.filter((t) => !t.isPayment);
  const totalIncome = transactionsForTotals
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactionsForTotals
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;
  const totalCheckingBalance = checkingAccounts.reduce(
    (s, acc) => s + (acc.initialBalance || 0),
    0
  );
  const recentGlobalTransactions = allTransactions.slice(0, 5);

  if (loading && allTransactions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl flex flex-col items-center">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600 dark:text-indigo-400 mb-4" />
          <p className="text-slate-600 dark:text-slate-300 font-medium">
            Buscando suas finanças...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="bg-white dark:bg-slate-800 border border-red-100 dark:border-red-900 rounded-3xl p-8 max-w-md shadow-xl">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-4">
            <Activity className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Ops, algo deu errado
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">{error}</p>
          <button
            onClick={loadMonthTransactions}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-[#F8FAFC] dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <DashboardHeader
          currentMonthLabel={currentMonthLabel}
          hasPrevious={hasPrevious}
          hasNext={hasNext}
          onPreviousMonth={handlePreviousMonth}
          onNextMonth={handleNextMonth}
        />

        <DashboardSummaryCards
          balance={balance}
          totalIncome={totalIncome}
          totalExpense={totalExpense}
          totalCheckingBalance={totalCheckingBalance}
          checkingAccountsCount={checkingAccounts.length}
          currentMonthLabel={currentMonthLabel}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-700/60 shadow-sm flex flex-col min-h-[420px]">
            <DashboardMonthlyHistory allTransactions={allTransactions} />
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700/60 shadow-sm flex flex-col min-h-[420px]">
            <DashboardRecentTransactions transactions={recentGlobalTransactions} />
          </div>
        </div>

        <DailySpendingChart
          transactions={transactionsForTotals}
          year={currentYear}
          month={currentMonth}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-700/60 shadow-sm flex flex-col min-h-[420px]">
            <DashboardCategoryDonut
              categories={categories}
              transactions={transactions}
              currentMonthLabel={currentMonthLabel}
            />
          </div>
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700/60 shadow-sm overflow-hidden">
              <CategoryEvolutionChart
                allTransactions={allTransactions}
                categories={categories}
              />
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700/60 shadow-sm overflow-hidden">
              <CategoryComparisonChart
                allTransactions={allTransactions}
                categories={categories}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
