import React, { useEffect, useState } from 'react';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';
import { categoryService } from '../services/categoryService';
import { transactionService } from '../services/transactionService';
import { Category, Transaction } from '../types';
import { Loader2 } from 'lucide-react';

// Registrar elementos necessários do Chart.js
Chart.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

export const DashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

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
      const [catData, txData] = await Promise.all([
        categoryService.getAll(),
        transactionService.getAll(),
      ]);
      setCategories(catData);
      setTransactions(txData);
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
    <div className="flex-1 overflow-auto bg-gray-50 text-gray-900">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        <h1 className="text-2xl font-bold mb-6">Dashboard de Despesas</h1>

        {/* Card: Evolução de Receitas e Despesas */}
        <div className="bg-white rounded-xl shadow p-6 h-[420px] md:h-[480px] flex flex-col">
          <h2 className="text-lg font-semibold mb-4">Evolução de Receitas e Despesas (últimos meses)</h2>
          <div className="flex-1 flex items-center justify-center">
            <Bar
              data={barData}
              options={{
                plugins: {
                  legend: { display: true, position: 'top' },
                },
                scales: {
                  x: {
                    grid: { display: false },
                    title: { display: false },
                  },
                  y: {
                    beginAtZero: true,
                    grid: { color: '#e5e7eb' },
                    title: { display: false },
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
        <div className="bg-white rounded-xl shadow p-6 h-[420px] md:h-[480px] flex flex-col">
          <h2 className="text-lg font-semibold mb-4">Despesas por Categoria</h2>
          {chartData.length > 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <Pie
                data={{
                  labels: chartLabels,
                  datasets: [
                    {
                      data: chartData,
                      backgroundColor: chartColors,
                      borderWidth: 1,
                    },
                  ],
                }}
                options={{
                  plugins: {
                    legend: {
                      display: true,
                      position: 'bottom' as const,
                    },
                  },
                  maintainAspectRatio: false,
                  responsive: true,
                }}
                style={{ width: '100%', height: '100%' }}
                redraw={true}
              />
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhuma despesa encontrada para exibir o gráfico.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
