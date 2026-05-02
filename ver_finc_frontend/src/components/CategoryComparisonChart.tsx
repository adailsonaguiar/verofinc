import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';
import { Category, Transaction } from '../types';
import { BarChart2 } from 'lucide-react';

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const MONTH_COLORS = ['#6366f1', '#10b981', '#f59e42'];

interface CategoryComparisonChartProps {
  allTransactions: Transaction[];
  categories: Category[];
}

export const CategoryComparisonChart: React.FC<
  CategoryComparisonChartProps
> = ({ allTransactions, categories }) => {
  const { chartLabels, datasets } = useMemo(() => {
    // Collect the last 3 months that have expense data
    const monthSet = new Set<string>();
    allTransactions
      .filter(
        (t) =>
          t.type === 'expense' &&
          !t.isPayment
      )
      .forEach((t) => {
        const date = new Date(t.date);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthSet.add(key);
      });

    const sortedMonths = Array.from(monthSet).sort().slice(-3);
    if (sortedMonths.length === 0) return { chartLabels: [], datasets: [] };

    const expenseCategories = categories.filter(
      (c) => c.type === 'expense' && c.name !== 'Pagamento de Fatura'
    );

    // Build totals per category per month
    const totals: Record<string, Record<string, number>> = {};
    allTransactions
      .filter(
        (t) =>
          t.type === 'expense' &&
          !t.isPayment &&
          t.category?._id &&
          sortedMonths.includes(
            `${new Date(t.date).getFullYear()}-${String(new Date(t.date).getMonth() + 1).padStart(2, '0')}`
          )
      )
      .forEach((t) => {
        const date = new Date(t.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const catId = t.category!._id;
        if (!totals[catId]) totals[catId] = {};
        totals[catId][monthKey] = (totals[catId][monthKey] ?? 0) + t.amount;
      });

    // Only show categories that have data in at least one of the last 3 months
    const activeCategories = expenseCategories.filter((c) => totals[c._id]);
    const labels = activeCategories.map((c) => c.name);

    const monthDatasets = sortedMonths.map((monthKey, i) => {
      const [year, month] = monthKey.split('-');
      return {
        label: `${month}/${year}`,
        data: activeCategories.map((c) => totals[c._id]?.[monthKey] ?? 0),
        backgroundColor: MONTH_COLORS[i] ?? '#94a3b8',
        borderRadius: 6,
        barPercentage: 0.7,
        categoryPercentage: 0.7,
      };
    });

    return { chartLabels: labels, datasets: monthDatasets };
  }, [allTransactions, categories]);

  if (chartLabels.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 flex flex-col">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            Comparativo de Categorias
          </h2>
          <p className="text-sm text-gray-500 font-medium">
            Despesas por categoria nos últimos 3 meses
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart2 className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">
              Nenhuma despesa encontrada
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Adicione transações para visualizar os dados
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 p-8 flex flex-col">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          Comparativo de Categorias
        </h2>
        <p className="text-sm text-gray-500 font-medium">
          Despesas por categoria nos últimos 3 meses
        </p>
      </div>
      <div style={{ height: 380 }}>
        <Bar
          data={{ labels: chartLabels, datasets }}
          options={{
            plugins: {
              legend: {
                display: true,
                position: 'top',
                labels: {
                  font: { size: 13, weight: 'bold' },
                  padding: 16,
                  usePointStyle: true,
                  pointStyle: 'circle',
                },
              },
              tooltip: {
                callbacks: {
                  label: (context) => {
                    const label = context.dataset.label || '';
                    const value = context.parsed.y ?? 0;
                    const formatted = (value / 100).toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    });
                    return `${label}: ${formatted}`;
                  },
                },
              },
            },
            scales: {
              x: {
                grid: { display: false },
                ticks: { font: { size: 11 } },
              },
              y: {
                beginAtZero: true,
                grid: { color: '#f3f4f6' },
                ticks: {
                  font: { size: 11 },
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
        />
      </div>
    </div>
  );
};
