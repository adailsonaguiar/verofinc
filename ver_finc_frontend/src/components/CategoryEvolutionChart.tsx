import React, { useMemo, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Category, Transaction } from '../types';
import { TrendingDown } from 'lucide-react';

Chart.register(
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler
);


interface CategoryEvolutionChartProps {
  allTransactions: Transaction[];
  categories: Category[];
}

export const CategoryEvolutionChart: React.FC<CategoryEvolutionChartProps> = ({
  allTransactions,
  categories,
}) => {
  const expenseCategories = useMemo(
    () =>
      categories.filter(
        (c) => c.type === 'expense' && c.name !== 'Pagamento de Fatura'
      ),
    [categories]
  );

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    expenseCategories[0]?._id ?? ''
  );

  // Recalcula quando a categoria selecionada muda ou as transações mudam
  const { chartLabels, chartData } = useMemo(() => {
    if (!selectedCategoryId) return { chartLabels: [], chartData: [] };

    const monthlyTotals: Record<string, number> = {};

    allTransactions
      .filter(
        (t) => t.type === 'expense' && t.category?._id === selectedCategoryId
      )
      .forEach((t) => {
        const date = new Date(t.date);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyTotals[key] = (monthlyTotals[key] ?? 0) + t.amount;
      });

    const sortedKeys = Object.keys(monthlyTotals).sort();
    const labels = sortedKeys.map((key) => {
      const [year, month] = key.split('-');
      return `${month}/${year}`;
    });
    const data = sortedKeys.map((key) => monthlyTotals[key]);

    return { chartLabels: labels, chartData: data };
  }, [allTransactions, selectedCategoryId]);

  const selectedCategory = expenseCategories.find(
    (c) => c._id === selectedCategoryId
  );

  const lineData = {
    labels: chartLabels,
    datasets: [
      {
        label: selectedCategory?.name ?? 'Categoria',
        data: chartData,
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99,102,241,0.10)',
        pointBackgroundColor: '#6366f1',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        borderWidth: 2.5,
        fill: true,
        tension: 0.4,
      },
    ],
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 p-8 flex flex-col">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            Evolução por Categoria
          </h2>
          <p className="text-sm text-gray-500 font-medium">
            Gastos mensais da categoria selecionada
          </p>
        </div>

        {/* Category Selector */}
        <div className="flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-indigo-500 shrink-0" />
          <select
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            className="text-sm font-medium bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all outline-none cursor-pointer"
          >
            {expenseCategories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <Line
            data={lineData}
            options={{
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label: (context) => {
                      const value = context.parsed.y ?? 0;
                      return ` ${(value / 100).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}`;
                    },
                  },
                },
              },
              scales: {
                x: {
                  grid: { display: false },
                  ticks: { font: { size: 12 } },
                },
                y: {
                  beginAtZero: true,
                  grid: { color: '#f3f4f6' },
                  ticks: {
                    font: { size: 12 },
                    callback: (value) =>
                      (Number(value) / 100).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }),
                  },
                },
              },
              maintainAspectRatio: false,
              responsive: true,
            }}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingDown className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">Nenhum gasto encontrado</p>
            <p className="text-sm text-gray-400 mt-1">
              Nenhuma transação registrada para esta categoria
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
