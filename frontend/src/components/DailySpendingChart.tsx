import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
} from 'chart.js';
import { getDaysInMonth, getDay } from 'date-fns';
import { Transaction } from '../types';
import { SectionTitle } from './SectionTitle';

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip);

const brl = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

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
  const { labels, expenseData, weekendFlags, insights } = useMemo(() => {
    const daysCount = getDaysInMonth(new Date(year, month - 1));
    const labels: string[] = [];
    const expenseData: number[] = [];
    const weekendFlags: boolean[] = [];

    for (let day = 1; day <= daysCount; day++) {
      const date = new Date(year, month - 1, day);
      const dow = getDay(date); // 0 = Sunday, 6 = Saturday
      const isWeekend = dow === 0 || dow === 6;
      weekendFlags.push(isWeekend);
      labels.push(String(day));

      const dayStr = `${year}-${String(month).padStart(2, '0')}-${String(
        day
      ).padStart(2, '0')}`;
      const dayTxs = transactions.filter((t) => t.date.split('T')[0] === dayStr);

      expenseData.push(
        dayTxs
          .filter((t) => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0) / 100
      );
    }

    const maxExpenseIdx = expenseData.indexOf(Math.max(...expenseData));
    const totalExpense = expenseData.reduce((sum, value) => sum + value, 0);
    const weekendExpenseTotal = expenseData.reduce(
      (sum, value, index) => sum + (weekendFlags[index] ? value : 0),
      0
    );

    return {
      labels,
      expenseData,
      weekendFlags,
      insights: {
        peakDay: maxExpenseIdx + 1,
        peakAmount: expenseData[maxExpenseIdx] ?? 0,
        averagePerDay: totalExpense / daysCount,
        weekendPct:
          totalExpense > 0 ? (weekendExpenseTotal / totalExpense) * 100 : 0,
      },
    };
  }, [transactions, year, month]);

  const hasData = expenseData.some((value) => value > 0);

  return (
    <>
      <SectionTitle
        title="Gastos por dia"
        subtitle="Distribuição diária das despesas do mês"
        className="mb-4"
      />

      {hasData ? (
        <>
          <div style={{ height: 240 }}>
            <Bar
              data={{
                labels,
                datasets: [
                  {
                    label: 'Despesas',
                    data: expenseData,
                    backgroundColor: weekendFlags.map((isWeekend) =>
                      isWeekend ? '#ca7251' : '#d7f36b'
                    ),
                    borderRadius: 4,
                    barPercentage: 0.8,
                    categoryPercentage: 0.9,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: '#171719',
                    borderColor: '#2a2a2e',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                      title: (items) => `Dia ${items[0].label}`,
                      label: (ctx) => ` ${brl(ctx.parsed.y ?? 0)}`,
                    },
                  },
                },
                scales: {
                  x: {
                    grid: { display: false },
                    border: { display: false },
                    ticks: {
                      color: '#77777d',
                      font: { family: 'inherit', size: 10 },
                      maxRotation: 0,
                    },
                  },
                  y: {
                    beginAtZero: true,
                    grid: { color: '#242427' },
                    border: { display: false },
                    ticks: {
                      color: '#77777d',
                      font: { family: 'inherit', size: 11 },
                      callback: (value) => {
                        const n = Number(value);
                        return n >= 1000
                          ? `R$ ${(n / 1000).toFixed(0)}k`
                          : `R$ ${n}`;
                      },
                    },
                  },
                },
              }}
            />
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-bone-divider">
            <div>
              <div className="stat-label">Dia pico</div>
              <div className="num text-base text-navy-900 mt-1">
                {brl(insights.peakAmount)}
              </div>
              <div className="text-xs text-navy-500 mt-0.5">
                no dia {insights.peakDay}
              </div>
            </div>
            <div>
              <div className="stat-label">Média/dia</div>
              <div className="num text-base text-navy-900 mt-1">
                {brl(insights.averagePerDay)}
              </div>
              <div className="text-xs text-navy-500 mt-0.5">média do mês</div>
            </div>
            <div>
              <div className="stat-label">Fim de semana</div>
              <div className="num text-base text-navy-900 mt-1">
                {insights.weekendPct.toFixed(0)}%
              </div>
              <div className="text-xs text-navy-500 mt-0.5">dos gastos</div>
            </div>
          </div>
        </>
      ) : (
        <div
          className="flex items-center justify-center text-sm text-navy-500"
          style={{ height: 240 }}
        >
          Sem movimentações no período
        </div>
      )}
    </>
  );
};
