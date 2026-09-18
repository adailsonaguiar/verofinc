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
import { SectionTitle } from './SectionTitle';

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const MONTH_COLORS = ['#d7f36b', '#ca7251', '#7790d5'];

const brl = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface CategoryComparisonChartProps {
  allTransactions: Transaction[];
  categories: Category[];
}

export const CategoryComparisonChart: React.FC<
  CategoryComparisonChartProps
> = ({ allTransactions, categories }) => {
  const { chartLabels, datasets } = useMemo(() => {
    const monthSet = new Set<string>();
    allTransactions
      .filter((t) => t.type === 'expense' && !t.isPayment)
      .forEach((t) => {
        const date = new Date(t.date);
        monthSet.add(
          `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        );
      });

    const sortedMonths = Array.from(monthSet).sort().slice(-3);
    if (sortedMonths.length === 0) return { chartLabels: [], datasets: [] };

    const expenseCategories = categories.filter(
      (c) => c.type === 'expense' && c.name !== 'Pagamento de Fatura'
    );

    const totals: Record<string, Record<string, number>> = {};
    allTransactions
      .filter(
        (t) =>
          t.type === 'expense' &&
          !t.isPayment &&
          t.category?._id &&
          sortedMonths.includes(
            `${new Date(t.date).getFullYear()}-${String(
              new Date(t.date).getMonth() + 1
            ).padStart(2, '0')}`
          )
      )
      .forEach((t) => {
        const date = new Date(t.date);
        const monthKey = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, '0')}`;
        const catId = t.category?._id ?? '';
        if (!totals[catId]) totals[catId] = {};
        totals[catId][monthKey] =
          (totals[catId][monthKey] ?? 0) + t.amount / 100;
      });

    const activeCategories = expenseCategories.filter((c) => totals[c._id]);

    return {
      chartLabels: activeCategories.map((c) => c.name),
      datasets: sortedMonths.map((monthKey, index) => {
        const [year, month] = monthKey.split('-');
        return {
          label: `${month}/${year}`,
          data: activeCategories.map((c) => totals[c._id]?.[monthKey] ?? 0),
          backgroundColor: MONTH_COLORS[index] ?? '#93a1c1',
          borderRadius: 6,
          barPercentage: 0.7,
          categoryPercentage: 0.7,
        };
      }),
    };
  }, [allTransactions, categories]);

  return (
    <div className="card p-5">
      <SectionTitle
        title="Comparativo de categorias"
        subtitle="Despesas por categoria nos últimos 3 meses"
        className="mb-4"
      />

      {chartLabels.length > 0 ? (
        <div style={{ height: 320 }}>
          <Bar
            data={{ labels: chartLabels, datasets }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: true,
                  position: 'top',
                  align: 'end',
                  labels: {
                    color: '#929198',
                    font: { family: 'inherit', size: 12 },
                    usePointStyle: true,
                    boxWidth: 8,
                  },
                },
                tooltip: {
                  backgroundColor: '#171719',
                  borderColor: '#2a2a2e',
                  borderWidth: 1,
                  padding: 12,
                  cornerRadius: 8,
                  callbacks: {
                    label: (ctx) =>
                      ` ${ctx.dataset.label}: ${brl(ctx.parsed.y ?? 0)}`,
                  },
                },
              },
              scales: {
                x: {
                  grid: { display: false },
                  border: { display: false },
                  ticks: {
                    color: '#77777d',
                    font: { family: 'inherit', size: 11 },
                  },
                },
                y: {
                  beginAtZero: true,
                  grid: { color: '#242427' },
                  border: { display: false },
                  ticks: {
                    color: '#77777d',
                    font: { family: 'inherit', size: 11 },
                    callback: (value) => brl(Number(value)),
                  },
                },
              },
            }}
          />
        </div>
      ) : (
        <div
          className="flex items-center justify-center text-sm text-navy-500"
          style={{ height: 320 }}
        >
          Nenhuma despesa encontrada
        </div>
      )}
    </div>
  );
};
