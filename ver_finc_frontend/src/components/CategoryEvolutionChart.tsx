import React, { useMemo, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Filler,
} from 'chart.js';
import { Category, Transaction } from '../types';
import { SectionTitle } from './SectionTitle';

Chart.register(
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Filler
);

const brl = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

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

  const { chartLabels, chartData } = useMemo(() => {
    if (!selectedCategoryId) return { chartLabels: [], chartData: [] };

    const monthlyTotals: Record<string, number> = {};
    allTransactions
      .filter((t) => t.type === 'expense' && t.category?._id === selectedCategoryId)
      .forEach((t) => {
        const date = new Date(t.date);
        const key = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, '0')}`;
        monthlyTotals[key] = (monthlyTotals[key] ?? 0) + t.amount / 100;
      });

    const sortedKeys = Object.keys(monthlyTotals).sort();

    return {
      chartLabels: sortedKeys.map((key) => {
        const [year, month] = key.split('-');
        return `${month}/${year}`;
      }),
      chartData: sortedKeys.map((key) => monthlyTotals[key]),
    };
  }, [allTransactions, selectedCategoryId]);

  const selectedCategory = expenseCategories.find(
    (c) => c._id === selectedCategoryId
  );

  return (
    <div className="card p-5">
      <SectionTitle
        title="Evolução por categoria"
        subtitle="Gastos mensais da categoria selecionada"
        className="mb-4"
        action={
          <select
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            className="input !w-auto !py-2 text-sm"
          >
            {expenseCategories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
        }
      />

      {chartData.length > 0 ? (
        <div style={{ height: 300 }}>
          <Line
            data={{
              labels: chartLabels,
              datasets: [
                {
                  label: selectedCategory?.name ?? 'Categoria',
                  data: chartData,
                  borderColor: '#1f2a4d',
                  backgroundColor: 'rgba(31, 42, 77, 0.10)',
                  pointBackgroundColor: '#1f2a4d',
                  pointBorderColor: '#fff',
                  pointBorderWidth: 2,
                  pointRadius: 4,
                  pointHoverRadius: 6,
                  borderWidth: 2,
                  fill: true,
                  tension: 0.4,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: {
                  backgroundColor: '#0e1628',
                  padding: 12,
                  cornerRadius: 8,
                  callbacks: {
                    label: (ctx) => ` ${brl(ctx.parsed.y ?? 0)}`,
                  },
                },
              },
              scales: {
                x: {
                  grid: { display: false },
                  border: { display: false },
                  ticks: {
                    color: '#93a1c1',
                    font: { family: 'inherit', size: 12 },
                  },
                },
                y: {
                  beginAtZero: true,
                  grid: { color: '#eeece3' },
                  border: { display: false },
                  ticks: {
                    color: '#93a1c1',
                    font: { family: 'inherit', size: 12 },
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
          style={{ height: 300 }}
        >
          Nenhum gasto registrado para esta categoria
        </div>
      )}
    </div>
  );
};
