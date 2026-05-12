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
import { Transaction } from '../types';

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

interface DashboardMonthlyHistoryProps {
  allTransactions: Transaction[];
}

export const DashboardMonthlyHistory: React.FC<DashboardMonthlyHistoryProps> = ({
  allTransactions,
}) => {
  const barData = useMemo(() => {
    const monthlyMap: { [key: string]: { income: number; expense: number } } = {};

    allTransactions
      .filter((t) => !t.isPayment)
      .forEach((t) => {
        const [year, month] = t.date.split('T')[0].split('-');
        const key = `${year}-${month}`;
        if (!monthlyMap[key]) monthlyMap[key] = { income: 0, expense: 0 };
        if (t.type === 'income') monthlyMap[key].income += t.amount;
        if (t.type === 'expense') monthlyMap[key].expense += t.amount;
      });

    const lastMonths = Object.keys(monthlyMap).sort().slice(-6);

    return {
      labels: lastMonths.map((key) => {
        const [year, month] = key.split('-');
        return `${month}/${year.slice(2)}`;
      }),
      datasets: [
        {
          label: 'Receitas',
          data: lastMonths.map((key) => monthlyMap[key].income),
          backgroundColor: '#10b981',
          borderRadius: 6,
          barPercentage: 0.6,
          categoryPercentage: 0.6,
        },
        {
          label: 'Despesas',
          data: lastMonths.map((key) => monthlyMap[key].expense),
          backgroundColor: '#f43f5e',
          borderRadius: 6,
          barPercentage: 0.6,
          categoryPercentage: 0.6,
        },
      ],
    };
  }, [allTransactions]);

  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Histórico Mensal
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Comparativo de receitas e despesas.
        </p>
      </div>
      <div className="flex-1 w-full" style={{ minHeight: 320 }}>
        <Bar
          data={barData}
          options={{
            plugins: {
              legend: {
                display: true,
                position: 'top',
                labels: {
                  font: { family: 'inherit', size: 13, weight: 600 },
                  color: '#64748b',
                  usePointStyle: true,
                  boxWidth: 8,
                },
              },
              tooltip: {
                backgroundColor: '#1e293b',
                titleFont: { family: 'inherit', size: 13 },
                bodyFont: { family: 'inherit', size: 14, weight: 'bold' },
                padding: 12,
                cornerRadius: 12,
                callbacks: {
                  label: (ctx) =>
                    ` ${ctx.dataset.label}: ${fmt.format((ctx.parsed.y ?? 0) / 100)}`,
                },
              },
            },
            scales: {
              x: {
                grid: { display: false },
                border: { display: false },
                ticks: { font: { family: 'inherit', size: 12 }, color: '#94a3b8' },
              },
              y: {
                beginAtZero: true,
                grid: { color: '#f1f5f9', tickColor: 'transparent' },
                border: { display: false, dash: [4, 4] },
                ticks: {
                  font: { family: 'inherit', size: 12 },
                  color: '#94a3b8',
                  padding: 12,
                  callback: (v) => {
                    const n = Number(v) / 100;
                    return n >= 1000 ? `R$ ${(n / 1000).toFixed(0)}k` : `R$ ${n}`;
                  },
                },
              },
            },
            maintainAspectRatio: false,
            responsive: true,
          }}
        />
      </div>
    </>
  );
};
