import React, { useEffect, useState } from 'react';
import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart,
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from 'chart.js';
import { categoryService } from '../services/categoryService';
import { transactionService } from '../services/transactionService';
import { accountService } from '../services/accountService';
import { Category, Transaction } from '../types';
import {
  Loader2,
  TrendingUp,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Activity,
} from 'lucide-react';
import { CategoryEvolutionChart } from '../components/CategoryEvolutionChart';
import { CategoryComparisonChart } from '../components/CategoryComparisonChart';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Registrar elementos necessários do Chart.js
Chart.register(
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
);

const CREDIT_CARD_PAYMENT_CATEGORY_ID = '699f0d49c0a92c8334e60765';

export const DashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [checkingAccounts, setCheckingAccounts] = useState<any[]>([]);

  // Seletor de mês
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
    if (currentYear && currentMonth) {
      loadMonthTransactions();
    }
  }, [currentYear, currentMonth]);

  const loadAvailableMonths = async () => {
    try {
      const months = await transactionService.getAvailableMonths();
      const formatted = months.map((m) => ({
        year: m.year,
        month: m.month,
        label: format(new Date(m.year, m.month - 1), 'MMMM yyyy', {
          locale: ptBR,
        }),
      }));
      setAvailableMonths(formatted);
    } catch (err) {
      console.error('Erro ao carregar meses disponíveis:', err);
    }
  };

  const loadCategories = async () => {
    try {
      const catData = await categoryService.getAll();
      setCategories(catData);
    } catch (err) {
      console.error('Erro ao carregar categorias:', err);
    }
  };

  const loadCheckingAccounts = async () => {
    try {
      const checkingData = await accountService.getByType('checking');
      setCheckingAccounts(checkingData);
    } catch (err) {
      console.error('Erro ao carregar contas correntes:', err);
    }
  };

  const loadAllTransactions = async () => {
    try {
      const all = await transactionService.getAll();
      // O backend pode não retorná-las ordenadas exatamente como queremos para a UI
      const sorted = [...all].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setAllTransactions(sorted);
    } catch (err) {
      console.error('Erro ao carregar todas as transações:', err);
    }
  };

  const loadMonthTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const txData = await transactionService.getByMonth(
        currentYear,
        currentMonth
      );
      setTransactions(txData);
    } catch (err) {
      setError('Erro ao carregar dados do dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const loadData = () => loadMonthTransactions();

  // Navegação de meses
  const currentIndex = availableMonths.findIndex(
    (m) => m.year === currentYear && m.month === currentMonth
  );
  const hasPrevious = currentIndex < availableMonths.length - 1;
  const hasNext = currentIndex > 0;
  const currentMonthLabel =
    availableMonths.find(
      (m) => m.year === currentYear && m.month === currentMonth
    )?.label ||
    format(new Date(currentYear, currentMonth - 1), 'MMMM yyyy', {
      locale: ptBR,
    });

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

  // Processamento de dados
  const monthlyMap: { [key: string]: { income: number; expense: number } } = {};
  allTransactions
    .filter((t) => t.category?._id !== CREDIT_CARD_PAYMENT_CATEGORY_ID)
    .forEach((t) => {
      // Divide a string da data UTC "YYYY-MM-DD" e usa diretamente o ano e mês para evitar recuo no fuso horário
      const [year, month] = t.date.split('T')[0].split('-');
      const key = `${year}-${month}`;
      if (!monthlyMap[key]) monthlyMap[key] = { income: 0, expense: 0 };
      if (t.type === 'income') monthlyMap[key].income += t.amount;
      if (t.type === 'expense') monthlyMap[key].expense += t.amount;
    });

  const sortedMonths = Object.keys(monthlyMap).sort();
  const lastMonths = sortedMonths.slice(-6);

  const barData = {
    labels: lastMonths.map((key) => {
      const [year, month] = key.split('-');
      return `${month}/${year.slice(2)}`;
    }),
    datasets: [
      {
        label: 'Receitas',
        data: lastMonths.map((key) => monthlyMap[key].income),
        backgroundColor: '#10b981', // emerald-500
        borderRadius: 6,
        barPercentage: 0.6,
        categoryPercentage: 0.6,
      },
      {
        label: 'Despesas',
        data: lastMonths.map((key) => monthlyMap[key].expense),
        backgroundColor: '#f43f5e', // rose-500
        borderRadius: 6,
        barPercentage: 0.6,
        categoryPercentage: 0.6,
      },
    ],
  };

  const transactionsForTotals = transactions.filter(
    (t) => t.category?._id !== CREDIT_CARD_PAYMENT_CATEGORY_ID
  );

  const expenseCategories = categories.filter(
    (c) => c.type === 'expense' && c._id !== CREDIT_CARD_PAYMENT_CATEGORY_ID
  );
  const expenseTx = transactionsForTotals.filter((t) => t.type === 'expense');

  const dataByCategory: { [catId: string]: number } = {};
  expenseTx.forEach((t) => {
    if (t.category && t.category._id) {
      dataByCategory[t.category._id] =
        (dataByCategory[t.category._id] || 0) + t.amount;
    }
  });

  const orderedCategories = expenseCategories
    .filter((c) => dataByCategory[c._id])
    .sort((a, b) => dataByCategory[b._id] - dataByCategory[a._id]);

  const chartLabels = orderedCategories.map((c) => c.name);
  const chartData = orderedCategories.map((c) => dataByCategory[c._id]);
  const chartColors = [
    '#6366f1',
    '#8b5cf6',
    '#ec4899',
    '#f43f5e',
    '#f97316',
    '#eab308',
    '#84cc16',
    '#10b981',
    '#14b8a6',
    '#06b6d4',
  ];

  const totalCheckingBalance = checkingAccounts.reduce(
    (sum, acc) => sum + (acc.initialBalance || 0),
    0
  );
  const totalIncome = transactionsForTotals
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactionsForTotals
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

  // Transações mais recentes globais (últimas 5)
  const recentGlobalTransactions = allTransactions.slice(0, 5);

  const CurrencyFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

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
            onClick={loadData}
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
        {/* Superior Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Visão Geral
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Acompanhe seus resultados e atinja suas metas.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 bg-white dark:bg-slate-800 p-1.5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60">
            <button
              onClick={handlePreviousMonth}
              disabled={!hasPrevious}
              className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-slate-600 dark:text-slate-300"
              title="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 px-3">
              <Calendar className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
              <span className="min-w-[120px] text-center text-sm font-bold text-slate-800 dark:text-slate-200 capitalize tracking-wide">
                {currentMonthLabel}
              </span>
            </div>
            <button
              onClick={handleNextMonth}
              disabled={!hasNext}
              className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-slate-600 dark:text-slate-300"
              title="Próximo mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Feature Cards Grid (Overview) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Main Balance Card */}
          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-indigo-800 dark:from-indigo-600 dark:to-indigo-900 text-white rounded-3xl p-6 shadow-lg shadow-indigo-200/50 dark:shadow-none hover:-translate-y-1 transition-transform duration-300 group">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity"></div>
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>

            <div className="relative z-10 flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-indigo-100 uppercase tracking-wider">
                Saldo do Mês
              </span>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                <DollarSign className="w-4 h-4 text-white" />
              </div>
            </div>
            <p className="relative z-10 text-3xl font-extrabold tracking-tight">
              {CurrencyFormatter.format(balance / 100)}
            </p>
            <p className="relative z-10 text-sm text-indigo-200 mt-2 font-medium capitalize">
              Referente a {currentMonthLabel}
            </p>
          </div>

          {/* Income Card */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700/60 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Receitas
              </span>
              <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">
              {CurrencyFormatter.format(totalIncome / 100)}
            </p>
            <div className="mt-2 flex items-center gap-1.5 hidden">
              {/* Espaço para indicador de evolução % futuro */}
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                +12% vs último mês
              </span>
            </div>
          </div>

          {/* Expense Card */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700/60 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Despesas
              </span>
              <div className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center">
                <ArrowDownRight className="w-4 h-4 text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">
              {CurrencyFormatter.format(totalExpense / 100)}
            </p>
          </div>

          {/* Accounts Summary Card */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700/60 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Contas
              </span>
              <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">
              {CurrencyFormatter.format(totalCheckingBalance / 100)}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-medium">
              Total em {checkingAccounts.length} conta(s)
            </p>
          </div>
        </div>

        {/* Main Content Area: Charts & Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-700/60 shadow-sm flex flex-col min-h-[420px]">
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Histórico Mensal
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Comparativo de receitas e despesas.
                </p>
              </div>
            </div>
            <div className="flex-1 w-full flex items-center justify-center">
              <Bar
                data={barData}
                options={{
                  plugins: {
                    legend: {
                      display: true,
                      position: 'top',
                      labels: {
                        font: { family: 'inherit', size: 13, weight: 600 },
                        color: '#64748b', // slate-500
                        usePointStyle: true,
                        boxWidth: 8,
                      },
                    },
                    tooltip: {
                      backgroundColor: '#1e293b', // slate-800
                      titleFont: { family: 'inherit', size: 13 },
                      bodyFont: { family: 'inherit', size: 14, weight: 'bold' },
                      padding: 12,
                      cornerRadius: 12,
                      callbacks: {
                        label: function (context) {
                          const value = context.parsed.y ?? 0;
                          return ` ${context.dataset.label}: ${CurrencyFormatter.format(value / 100)}`;
                        },
                      },
                    },
                  },
                  scales: {
                    x: {
                      grid: { display: false },
                      border: { display: false },
                      ticks: {
                        font: { family: 'inherit', size: 12 },
                        color: '#94a3b8',
                      },
                    },
                    y: {
                      beginAtZero: true,
                      grid: { color: '#f1f5f9', tickColor: 'transparent' }, // slate-100
                      border: { display: false, dash: [4, 4] },
                      ticks: {
                        font: { family: 'inherit', size: 12 },
                        color: '#94a3b8',
                        padding: 12,
                        callback: function (value) {
                          const num = Number(value) / 100;
                          return num >= 1000
                            ? `R$ ${(num / 1000).toFixed(0)}k`
                            : `R$ ${num}`;
                        },
                      },
                    },
                  },
                  maintainAspectRatio: false,
                  responsive: true,
                }}
              />
            </div>
          </div>

          {/* Recent Transactions List */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700/60 shadow-sm flex flex-col min-h-[420px]">
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Mais Recentes
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Últimas movimentações.
                </p>
              </div>
            </div>

            {recentGlobalTransactions.length > 0 ? (
              <div className="flex-1 flex flex-col gap-5 overflow-y-auto pr-1">
                {recentGlobalTransactions.map((tx) => (
                  <div
                    key={tx._id}
                    className="flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                          tx.type === 'income'
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {tx.type === 'income' ? (
                          <ArrowUpRight className="w-5 h-5" />
                        ) : (
                          <ArrowDownRight className="w-5 h-5" />
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate max-w-[120px] sm:max-w-[180px]">
                          {tx.description}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                          {tx.category?.name || 'Sem categoria'} •{' '}
                          {format(
                            new Date(tx.date.split('T')[0] + 'T12:00:00'),
                            'dd MMM',
                            { locale: ptBR }
                          )}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`text-sm font-bold whitespace-nowrap ${
                        tx.type === 'income'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}
                      {CurrencyFormatter.format(tx.amount / 100)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700/50 rounded-full flex items-center justify-center mb-4">
                  <Activity className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-600 dark:text-slate-300 font-medium">
                  Nenhuma transação
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  Sua lista está vazia.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Despesas por Categoria */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-700/60 shadow-sm flex flex-col min-h-[420px]">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                Por Categoria
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 capitalize">
                Despesas em {currentMonthLabel}
              </p>
            </div>
            {chartData.length > 0 ? (
              <div className="flex-1 flex items-center justify-center relative">
                <Pie
                  data={{
                    labels: chartLabels,
                    datasets: [
                      {
                        data: chartData,
                        backgroundColor: chartColors,
                        borderWidth: 0,
                        hoverOffset: 4,
                      },
                    ],
                  }}
                  options={{
                    cutout: '75%', // Donut style
                    plugins: {
                      legend: { display: false }, // we use a custom or just rely on tooltip for cleaner look
                      tooltip: {
                        backgroundColor: '#1e293b',
                        titleFont: { family: 'inherit', size: 13 },
                        bodyFont: {
                          family: 'inherit',
                          size: 14,
                          weight: 'bold',
                        },
                        padding: 12,
                        cornerRadius: 12,
                        callbacks: {
                          label: function (context) {
                            const value = (context.parsed as number) ?? 0;
                            return ` ${context.label}: ${CurrencyFormatter.format(value / 100)}`;
                          },
                        },
                      },
                    },
                    maintainAspectRatio: false,
                    responsive: true,
                  }}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-6">
                    Total
                  </span>
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">
                    {CurrencyFormatter.format(totalExpense / 100)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700/50 rounded-full flex items-center justify-center mb-4">
                  <PieChartIcon className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-medium">
                  Sem dados no período
                </p>
              </div>
            )}
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

// Fallback manual icon for pie chart empty state inside pie card
const PieChartIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
    <path d="M22 12A10 10 0 0 0 12 2v10z" />
  </svg>
);
