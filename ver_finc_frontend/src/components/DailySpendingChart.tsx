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
import { getDaysInMonth, getDay } from 'date-fns';
import { Zap, TrendingDown, CalendarDays } from 'lucide-react';
import { Transaction } from '../types';

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

interface DailySpendingChartProps {
  transactions: Transaction[];
  year: number;
  month: number;
}

export const DailySpendingChart: React.FC<DailySpendingChartProps> = ({
  transactions,
  year,
  month,
}) => {
  const { labels, expenseData, incomeData, weekendFlags, insights } = useMemo(() => {
    const daysCount = getDaysInMonth(new Date(year, month - 1));
    const labels: string[] = [];
    const expenseData: number[] = [];
    const incomeData: number[] = [];
    const weekendFlags: boolean[] = [];

    for (let day = 1; day <= daysCount; day++) {
      const date = new Date(year, month - 1, day);
      const dow = getDay(date); // 0=Sun, 6=Sat
      const isWeekend = dow === 0 || dow === 6;
      weekendFlags.push(isWeekend);
      labels.push(String(day));

      const dayStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayTxs = transactions.filter(
        (t) => t.date.split('T')[0] === dayStr
      );

      expenseData.push(
        dayTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
      );
      incomeData.push(
        dayTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
      );
    }

    const maxExpenseIdx = expenseData.indexOf(Math.max(...expenseData));
    const totalExpense = expenseData.reduce((s, v) => s + v, 0);
    const weekendExpenseTotal = expenseData.reduce(
      (s, v, i) => s + (weekendFlags[i] ? v : 0),
      0
    );

    return {
      labels,
      expenseData,
      incomeData,
      weekendFlags,
      insights: {
        peakDay: maxExpenseIdx + 1,
        peakAmount: expenseData[maxExpenseIdx] ?? 0,
        avgDaily: totalExpense / daysCount,
        weekendPct: totalExpense > 0 ? (weekendExpenseTotal / totalExpense) * 100 : 0,
      },
    };
  }, [transactions, year, month]);

  const maxExpense = Math.max(...expenseData, 1);
  const hasData = expenseData.some((v) => v > 0) || incomeData.some((v) => v > 0);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Despesas',
        data: expenseData,
        // Intensity-based coloring: weekends use deeper rose, weekdays lighter rose
        backgroundColor: expenseData.map((v, i) => {
          const alpha = 0.3 + (v / maxExpense) * 0.7;
          return weekendFlags[i]
            ? `rgba(244, 63, 94, ${alpha})`     // rose-500 for weekends
            : `rgba(251, 113, 133, ${alpha})`;  // rose-400 for weekdays
        }),
        borderRadius: 4,
        barPercentage: 0.75,
        categoryPercentage: 0.85,
      },
      {
        label: 'Receitas',
        data: incomeData,
        backgroundColor: incomeData.map((v) =>
          v > 0 ? 'rgba(16, 185, 129, 0.75)' : 'rgba(16, 185, 129, 0)'
        ),
        borderRadius: 4,
        barPercentage: 0.75,
        categoryPercentage: 0.85,
      },
    ],
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-700/60 shadow-sm">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Gastos por Dia do Mês
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Distribuição diária — fins de semana em vermelho mais intenso.
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500 shrink-0">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-rose-500 inline-block" />
            fim de semana
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-rose-300 inline-block" />
            dia útil
          </span>
        </div>
      </div>

      {hasData ? (
        <>
          <div style={{ height: 200 }} className="w-full">
            <Bar
              data={chartData}
              options={{
                plugins: {
                  legend: {
                    display: true,
                    position: 'top',
                    labels: {
                      font: { family: 'inherit', size: 12, weight: 600 },
                      color: '#64748b',
                      usePointStyle: true,
                      boxWidth: 8,
                      filter: (item) => item.text !== 'Receitas' || incomeData.some((v) => v > 0),
                    },
                  },
                  tooltip: {
                    backgroundColor: '#1e293b',
                    titleFont: { family: 'inherit', size: 12 },
                    bodyFont: { family: 'inherit', size: 13, weight: 'bold' },
                    padding: 10,
                    cornerRadius: 10,
                    callbacks: {
                      title: (items) =>
                        `Dia ${items[0].label} — ${
                          weekendFlags[Number(items[0].label) - 1]
                            ? 'Fim de semana'
                            : 'Dia útil'
                        }`,
                      label: (ctx) =>
                        ` ${ctx.dataset.label}: ${fmt.format((ctx.parsed.y ?? 0) / 100)}`,
                    },
                  },
                },
                scales: {
                  x: {
                    grid: { display: false },
                    border: { display: false },
                    ticks: {
                      font: { family: 'inherit', size: 10 },
                      color: '#94a3b8',
                      maxRotation: 0,
                    },
                  },
                  y: {
                    beginAtZero: true,
                    grid: { color: '#f1f5f9' },
                    border: { display: false },
                    ticks: {
                      font: { family: 'inherit', size: 11 },
                      color: '#94a3b8',
                      padding: 8,
                      callback: (v) => {
                        const n = Number(v) / 100;
                        return n >= 1000 ? `R$${(n / 1000).toFixed(0)}k` : `R$${n}`;
                      },
                    },
                  },
                },
                maintainAspectRatio: false,
                responsive: true,
              }}
            />
          </div>

          {/* Insights */}
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="bg-rose-50 dark:bg-rose-500/10 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-rose-500" />
                <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wide">
                  Dia Pico
                </span>
              </div>
              <p className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                {fmt.format(insights.peakAmount / 100)}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                no dia {insights.peakDay}
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-500/10 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                  Média/dia
                </span>
              </div>
              <p className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                {fmt.format(insights.avgDaily / 100)}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                média diária
              </p>
            </div>

            <div className="bg-amber-50 dark:bg-amber-500/10 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <CalendarDays className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                  Fim Semana
                </span>
              </div>
              <p className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                {insights.weekendPct.toFixed(0)}%
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                dos gastos totais
              </p>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center text-center py-16">
          <CalendarDays className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Sem movimentações no período
          </p>
        </div>
      )}
    </div>
  );
};
