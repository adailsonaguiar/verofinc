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

const CATEGORY_COLORS = [
  '#d7f36b',
  '#7790d5',
  '#ca7251',
  '#9cc16d',
  '#a98fd0',
  '#e58b6a',
  '#93a1c1',
  '#cb777b',
  '#ca9a5a',
  '#8298d6',
];

const monthKey = (date: string) => {
  const parsed = new Date(date);
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(
    2,
    '0'
  )}`;
};

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

  const categoryColors = useMemo(() => {
    const colors: Record<string, string> = {};
    expenseCategories.forEach((category, index) => {
      colors[category._id] =
        CATEGORY_COLORS[index % CATEGORY_COLORS.length];
    });
    return colors;
  }, [expenseCategories]);

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(() =>
    expenseCategories[0] ? [expenseCategories[0]._id] : []
  );

  const selectedCategories = useMemo(
    () =>
      expenseCategories.filter((category) =>
        selectedCategoryIds.includes(category._id)
      ),
    [expenseCategories, selectedCategoryIds]
  );

  const toggleCategory = (categoryId: string) => {
    setSelectedCategoryIds((current) =>
      current.includes(categoryId)
        ? current.filter((id) => id !== categoryId)
        : [...current, categoryId]
    );
  };

  const selectAllCategories = () => {
    setSelectedCategoryIds(expenseCategories.map((category) => category._id));
  };

  const allCategoriesSelected =
    expenseCategories.length > 0 &&
    expenseCategories.every((category) =>
      selectedCategoryIds.includes(category._id)
    );

  const { chartLabels, datasets } = useMemo(() => {
    if (selectedCategories.length === 0) {
      return { chartLabels: [] as string[], datasets: [] };
    }

    const monthlyTotalsByCategory: Record<string, Record<string, number>> = {};
    const monthKeys = new Set<string>();

    selectedCategories.forEach((category) => {
      monthlyTotalsByCategory[category._id] = {};
    });

    allTransactions
      .filter(
        (t) =>
          t.type === 'expense' &&
          t.category?._id &&
          selectedCategoryIds.includes(t.category._id)
      )
      .forEach((t) => {
        const key = monthKey(t.date);
        const categoryTotals = monthlyTotalsByCategory[t.category._id];
        if (!categoryTotals) return;
        monthKeys.add(key);
        categoryTotals[key] = (categoryTotals[key] ?? 0) + t.amount / 100;
      });

    const sortedKeys = Array.from(monthKeys).sort();

    return {
      chartLabels: sortedKeys.map((key) => {
        const [year, month] = key.split('-');
        return `${month}/${year}`;
      }),
      datasets: selectedCategories.map((category) => {
        const color =
          categoryColors[category._id] ??
          CATEGORY_COLORS[0];
        return {
          label: category.name,
          data: sortedKeys.map(
            (key) => monthlyTotalsByCategory[category._id]?.[key] ?? 0
          ),
          borderColor: color,
          backgroundColor: color,
          pointBackgroundColor: color,
          pointBorderColor: '#121214',
          pointBorderWidth: 2,
          pointRadius: 3.5,
          pointHoverRadius: 6,
          borderWidth: 2,
          fill: false,
          tension: 0.35,
        };
      }),
    };
  }, [
    allTransactions,
    categoryColors,
    selectedCategories,
    selectedCategoryIds,
  ]);

  const hasChartData =
    datasets.length > 0 && chartLabels.length > 0;

  const emptyMessage =
    expenseCategories.length === 0
      ? 'Nenhuma categoria de despesa cadastrada'
      : selectedCategories.length === 0
        ? 'Selecione ao menos uma categoria'
        : 'Nenhum gasto registrado para as categorias selecionadas';

  return (
    <div className="card p-5">
      <SectionTitle
        title="Evolução por categoria"
        subtitle="Gastos mensais das categorias selecionadas"
        className="mb-4"
      />

      {expenseCategories.length > 0 && (
        <div
          className="mb-4 flex flex-wrap gap-2"
          role="group"
          aria-label="Selecionar categorias para o gráfico"
        >
          <button
            type="button"
            onClick={selectAllCategories}
            disabled={allCategoriesSelected}
            className="chip border border-gold-400/60 bg-gold-400/10 text-gold-600 transition-colors duration-150 hover:bg-gold-400/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Selecionar todas
          </button>
          {expenseCategories.map((category) => {
            const isSelected = selectedCategoryIds.includes(category._id);
            return (
              <button
                key={category._id}
                type="button"
                onClick={() => toggleCategory(category._id)}
                aria-pressed={isSelected}
                className={`chip border transition-colors duration-150 ${
                  isSelected
                    ? 'border-gold-400 bg-gold-400/15 text-gold-600'
                    : 'border-bone-border bg-[#171719] text-navy-500 hover:border-navy-200 hover:text-navy-800'
                }`}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: categoryColors[category._id] }}
                  aria-hidden="true"
                />
                {category.name}
              </button>
            );
          })}
        </div>
      )}

      {hasChartData ? (
        <div style={{ height: 300 }}>
          <Line
            data={{ labels: chartLabels, datasets }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              interaction: { mode: 'index', intersect: false },
              plugins: {
                legend: {
                  display: datasets.length > 1,
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
                    font: { family: 'inherit', size: 12 },
                  },
                },
                y: {
                  beginAtZero: true,
                  grid: { color: '#242427' },
                  border: { display: false },
                  ticks: {
                    color: '#77777d',
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
          {emptyMessage}
        </div>
      )}
    </div>
  );
};
