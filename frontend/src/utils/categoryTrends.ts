import type { Transaction } from '../types';

export interface CategoryTrend {
  id: string;
  name: string;
  amounts: number[];
  current: number;
  previous: number;
  difference: number;
  percentage: number | null;
  significantIncrease: boolean;
  previousThreeMonthAverage: number;
  increaseVsAverage: number;
  percentageVsAverage: number | null;
}

export function categoryTrends(transactions: Transaction[], year: number, month: number) {
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(year, month - 1 - (5 - index), 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  });
  const totals = new Map<string, { name: string; values: Map<string, number> }>();

  for (const tx of transactions) {
    if (tx.type !== 'expense' || tx.isPayment || tx.isReversal || !tx.category?._id) continue;
    const key = tx.date.slice(0, 7);
    if (!months.includes(key)) continue;
    const id = tx.category._id;
    const row = totals.get(id) ?? { name: tx.category.name, values: new Map<string, number>() };
    row.values.set(key, (row.values.get(key) ?? 0) + tx.amount);
    totals.set(id, row);
  }

  const categories: CategoryTrend[] = [...totals].map(([id, row]) => {
    const amounts = months.map((key) => row.values.get(key) ?? 0);
    const current = amounts[5];
    const previous = amounts[4];
    const difference = current - previous;
    const percentage = previous > 0 ? Math.round(difference / previous * 100) : null;
    const previousThreeMonthTotal = amounts[2] + amounts[3] + amounts[4];
    const previousThreeMonthAverage = previousThreeMonthTotal / 3;
    return {
      id, name: row.name, amounts, current, previous, difference, percentage,
      previousThreeMonthAverage,
      increaseVsAverage: current - previousThreeMonthAverage,
      percentageVsAverage: previousThreeMonthTotal > 0
        ? (current / previousThreeMonthAverage - 1) * 100
        : null,
      // Exige aumento relevante tanto em reais quanto em proporção; sem base,
      // o gasto é novo, não uma variação percentual infinita.
      significantIncrease: difference >= 10000 && (previous === 0 || difference / previous >= 0.3),
    };
  });

  return {
    months,
    categories: categories.sort((a, b) => b.current - a.current || a.name.localeCompare(b.name)),
    increases: categories.filter((item) => item.significantIncrease)
      .sort((a, b) => b.difference - a.difference || a.name.localeCompare(b.name)),
    aboveThreeMonthAverage: categories
      .filter((item) => {
        const previousTotal = item.amounts[2] + item.amounts[3] + item.amounts[4];
        return previousTotal > 0 && item.current * 60 > previousTotal * 21;
      })
      .sort((a, b) => b.increaseVsAverage - a.increaseVsAverage || a.name.localeCompare(b.name)),
  };
}
