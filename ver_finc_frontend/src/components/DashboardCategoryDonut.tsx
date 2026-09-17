import React, { useMemo } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip } from 'chart.js';
import { Category, Transaction } from '../types';
import { SectionTitle } from './SectionTitle';

Chart.register(ArcElement, Tooltip);

const brl = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/** Navy / gold ramp taken from the reference design. */
const CHART_COLORS = [
  '#1f2a4d',
  '#3c4d78',
  '#c99a3b',
  '#93a1c1',
  '#a97d28',
  '#162038',
  '#d9b45a',
  '#e2e6ef',
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
  const { legend, chartData, totalExpense } = useMemo(() => {
    const expenseCategories = categories.filter(
      (c) => c.type === 'expense' && c.name !== 'Pagamento de Fatura'
    );
    const expenseTx = transactions.filter((t) => !t.isPayment && t.type === 'expense');

    const dataByCategory: { [catId: string]: number } = {};
    expenseTx.forEach((t) => {
      if (t.category?._id) {
        dataByCategory[t.category._id] =
          (dataByCategory[t.category._id] || 0) + t.amount;
      }
    });

    const ordered = expenseCategories
      .filter((c) => dataByCategory[c._id])
      .sort((a, b) => dataByCategory[b._id] - dataByCategory[a._id]);

    return {
      legend: ordered.map((c, index) => ({
        name: c.name,
        value: dataByCategory[c._id] / 100,
        color: CHART_COLORS[index % CHART_COLORS.length],
      })),
      chartData: ordered.map((c) => dataByCategory[c._id] / 100),
      totalExpense: expenseTx.reduce((sum, t) => sum + t.amount, 0) / 100,
    };
  }, [categories, transactions]);

  return (
    <>
      <SectionTitle
        title="Gastos por categoria"
        subtitle={currentMonthLabel}
        className="mb-3"
      />

      {chartData.length > 0 ? (
        <>
          <div className="relative" style={{ height: 220 }}>
            <Pie
              data={{
                labels: legend.map((item) => item.name),
                datasets: [
                  {
                    data: chartData,
                    backgroundColor: legend.map((item) => item.color),
                    borderWidth: 0,
                    hoverOffset: 4,
                  },
                ],
              }}
              options={{
                cutout: '62%',
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: '#0e1628',
                    titleFont: { family: 'inherit', size: 13 },
                    bodyFont: { family: 'inherit', size: 13 },
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                      label: (ctx) => ` ${ctx.label}: ${brl(ctx.parsed as number)}`,
                    },
                  },
                },
                maintainAspectRatio: false,
                responsive: true,
              }}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="stat-label">Total</span>
              <span className="num text-xl text-navy-900 mt-1">
                {brl(totalExpense)}
              </span>
            </div>
          </div>

          <div className="mt-4 space-y-1.5">
            {legend.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-sm shrink-0"
                    style={{ background: item.color }}
                  />
                  <span className="text-navy-700 truncate">{item.name}</span>
                </div>
                <span className="num text-navy-800 shrink-0">
                  {brl(item.value)}
                </span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div
          className="flex items-center justify-center text-sm text-navy-500"
          style={{ height: 220 }}
        >
          Sem dados no período
        </div>
      )}
    </>
  );
};
