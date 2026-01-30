import React, { useEffect, useState } from 'react';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';
import { categoryService } from '../services/categoryService';
import { transactionService } from '../services/transactionService';
import { accountService } from '../services/accountService';
import { Category, Transaction } from '../types';
import { Loader2, BarChart, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

// Registrar elementos necessários do Chart.js
Chart.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

export const DashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [checkingAccounts, setCheckingAccounts] = useState<any[]>([]);

  // Agrupar transações por mês e calcular receitas e despesas mensais
  const monthlyMap: { [key: string]: { income: number; expense: number } } = {};
  transactions.forEach((t) => {
    const date = new Date(t.date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!monthlyMap[key]) {
      monthlyMap[key] = { income: 0, expense: 0 };
    }
    if (t.type === 'income') monthlyMap[key].income += t.amount;
    if (t.type === 'expense') monthlyMap[key].expense += t.amount;
  });

  // Ordenar meses e pegar os últimos 6 meses
  const sortedMonths = Object.keys(monthlyMap).sort();
  const lastMonths = sortedMonths.slice(-6);

  const barData = {
    labels: lastMonths.map((key) => {
      const [year, month] = key.split('-');
      return `${month}/${year}`;
    }),
    datasets: [
      {
        label: 'Receitas',
        data: lastMonths.map((key) => monthlyMap[key].income),
        backgroundColor: '#10b981',
        borderRadius: 8,
        barPercentage: 0.5,
        categoryPercentage: 0.5,
      },
      {
        label: 'Despesas',
        data: lastMonths.map((key) => monthlyMap[key].expense),
        backgroundColor: '#f43f5e',
        borderRadius: 8,
        barPercentage: 0.5,
        categoryPercentage: 0.5,
      },
    ],
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [catData, txData, checkingData] = await Promise.all([
        categoryService.getAll(),
        transactionService.getAll(),
        accountService.getByType('checking'),
      ]);
      setCategories(catData);
      setTransactions(txData);
      setCheckingAccounts(checkingData);
    } catch (err) {
      setError('Erro ao carregar dados do dashboard.');
    } finally {
      setLoading(false);
    }
  };

  // Filtra apenas categorias de despesa
  const expenseCategories = categories.filter(c => c.type === 'expense');
  // Filtra apenas despesas
  const expenseTx = transactions.filter(t => t.type === 'expense');
  // Soma por categoria de despesa
  const dataByCategory: { [catId: string]: number } = {};
  expenseTx.forEach(t => {
    if (t.category && t.category._id) {
      dataByCategory[t.category._id] = (dataByCategory[t.category._id] || 0) + t.amount;
    }
  });

  const chartLabels = expenseCategories
    .filter(c => dataByCategory[c._id])
    .map(c => c.name);
  const chartData = expenseCategories
    .filter(c => dataByCategory[c._id])
    .map(c => dataByCategory[c._id]);
  const chartColors = [
    '#2563eb', '#1d4ed8', '#0ea5e9', '#f59e42', '#f43f5e', '#10b981', '#a21caf', '#fbbf24', '#6366f1', '#e11d48',
  ];

  const totalCheckingBalance = checkingAccounts.reduce(
    (sum, acc) => sum + (acc.initialBalance || 0),
    0
  );

  // Calcular totais de receitas e despesas
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
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Carregando dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h3 className="text-red-800 font-semibold mb-2">Erro</h3>
          <p className="text-red-600">{error}</p>
          <button
            onClick={loadData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-gradient-to-br from-gray-50 via-white to-gray-50 text-gray-900">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-500 font-medium">Visão geral das suas finanças</p>
        </div>

        {/* Overall Statistics */}
        <div className="mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Entradas */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Entradas</span>
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {(totalIncome / 100).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </p>
            </div>

            {/* Saídas */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Saídas</span>
                <TrendingDown className="w-4 h-4 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {(totalExpense / 100).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </p>
            </div>

            {/* Saldo */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Saldo</span>
                <DollarSign className="w-4 h-4 text-blue-600" />
              </div>
              <p className={`text-2xl font-bold ${
                balance >= 0 ? 'text-gray-900' : 'text-red-600'
              }`}>
                {(balance / 100).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Total Balance Section */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Saldo total em contas correntes</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {(totalCheckingBalance / 100).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </p>
            </div>
            <div className="text-xs text-gray-400">{checkingAccounts.length} conta(s)</div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Card: Evolução de Receitas e Despesas */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 p-8 h-[480px] flex flex-col">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Evolução Mensal</h2>
              <p className="text-sm text-gray-500 font-medium">Receitas e despesas dos últimos meses</p>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <Bar
                data={barData}
                options={{
                  plugins: {
                    legend: { 
                      display: true, 
                      position: 'top',
                      labels: {
                        font: { size: 13, weight: 'bold' },
                        padding: 16,
                        usePointStyle: true,
                        pointStyle: 'circle'
                      }
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          const label = context.dataset.label || '';
                          const value = context.parsed.y || 0;
                          const formatted = (value / 100).toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          });
                          return `${label}: ${formatted}`;
                        }
                      }
                    }
                  },
                  scales: {
                    x: {
                      grid: { display: false },
                      ticks: { font: { size: 12, weight: 'normal' } },
                    },
                    y: {
                      beginAtZero: true,
                      grid: { color: '#f3f4f6' },
                      ticks: { 
                        font: { size: 12, weight: 'normal' },
                        callback: function(value) {
                          return (Number(value) / 100).toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          });
                        }
                      },
                    },
                  },
                  maintainAspectRatio: false,
                  responsive: true,
                }}
                style={{ width: '100%', height: '100%' }}
                redraw={true}
              />
            </div>
          </div>

          {/* Card: Despesas por Categoria */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 p-8 h-[480px] flex flex-col">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Despesas por Categoria</h2>
              <p className="text-sm text-gray-500 font-medium">Distribuição das suas despesas</p>
            </div>
            {chartData.length > 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <Pie
                  data={{
                    labels: chartLabels,
                    datasets: [
                      {
                        data: chartData,
                        backgroundColor: chartColors,
                        borderWidth: 0,
                      },
                    ],
                  }}
                  options={{
                    plugins: {
                      legend: {
                        display: true,
                        position: 'bottom' as const,
                        labels: {
                          font: { size: 12, weight: 'bold' },
                          padding: 16,
                          usePointStyle: true,
                          pointStyle: 'circle'
                        }
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const formatted = (value / 100).toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            });
                            return `${label}: ${formatted}`;
                          }
                        }
                      }
                    },
                    maintainAspectRatio: false,
                    responsive: true,
                  }}
                  style={{ width: '100%', height: '100%' }}
                  redraw={true}
                />
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BarChart className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">Nenhuma despesa encontrada</p>
                  <p className="text-sm text-gray-400 mt-1">Adicione transações para visualizar os dados</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
