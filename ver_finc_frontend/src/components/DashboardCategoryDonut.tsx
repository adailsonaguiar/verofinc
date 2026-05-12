import React, { useMemo } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';
import { Category, Transaction } from '../types';

Chart.register(ArcElement, Tooltip, Legend);

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const CHART_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
  '#eab308', '#84cc16', '#10b981', '#14b8a6', '#06b6d4',
];

interface DashboardCategoryDonutProps {
  categories: Category[];
  transactions: Transaction[];
  currentMonthLabel: string;
}

export const DashboardCategoryDonut: React.FC<DashboardCategoryDonutProps> = ({
  categories,
  transactions,
  currentMonthLabel,
}) => {
  const { chartLabels, chartData, totalExpense } = useMemo(() => {
    const expenseCategories = categories.filter(
      (c) => c.type === 'expense' && c.name !== 'Pagamento de Fatura'
    );
    const expenseTx = transactions.filter((t) => !t.isPayment && t.type === 'expense');

    const dataByCategory: { [catId: string]: number } = {};
    expenseTx.forEach((t) => {
      if (t.category?._id) {
        dataByCategory[t.category._id] = (dataByCategory[t.category._id] || 0) + t.amount;
      }
    });

    const ordered = expenseCategories
      .filter((c) => dataByCategory[c._id])
      .sort((a, b) => dataByCategory[b._id] - dataByCategory[a._id]);

    return {
      chartLabels: ordered.map((c) => c.name),
      chartData: ordered.map((c) => dataByCategory[c._id]),
      totalExpense: expenseTx.reduce((s, t) => s + t.amount, 0),
    };
  }, [categories, transactions]);

  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
          Por Categoria
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 capitalize">
          Despesas em {currentMonthLabel}
        </p>
      </div>

      {chartData.length > 0 ? (
        <div
          className="flex-1 flex items-center justify-center relative"
          style={{ minHeight: 280 }}
        >
          <Pie
            data={{
              labels: chartLabels,
              datasets: [
                {
                  data: chartData,
                  backgroundColor: CHART_COLORS,
                  borderWidth: 0,
                  hoverOffset: 4,
                },
              ],
            }}
            options={{
              cutout: '75%',
              plugins: {
                legend: { display: false },
                tooltip: {
                  backgroundColor: '#1e293b',
                  titleFont: { family: 'inherit', size: 13 },
                  bodyFont: { family: 'inherit', size: 14, weight: 'bold' },
                  padding: 12,
                  cornerRadius: 12,
                  callbacks: {
                    label: (ctx) =>
                      ` ${ctx.label}: ${fmt.format((ctx.parsed as number) / 100)}`,
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
              {fmt.format(totalExpense / 100)}
            </span>
          </div>
        </div>
      ) : (
        <div
          className="flex-1 flex flex-col items-center justify-center"
          style={{ minHeight: 280 }}
        >
          <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700/50 rounded-full flex items-center justify-center mb-4">
            <PieChartIcon className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Sem dados no período
          </p>
        </div>
      )}
    </>
  );
};

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
