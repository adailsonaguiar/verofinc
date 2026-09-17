import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from 'chart.js';
import type { ScriptableContext } from 'chart.js';
import { Transaction } from '../types';
import { SectionTitle } from './SectionTitle';
import { Chip } from './Chip';

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

const MONTH_LABELS = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

const brl = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/** Vertical fade used by the reference design (navy for inflow, gold for outflow). */
const areaGradient =
  (rgb: string, alpha: number) =>
  (context: ScriptableContext<'line'>) => {
    const { ctx, chartArea } = context.chart;
    if (!chartArea) return `rgba(${rgb}, ${alpha})`;
    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    gradient.addColorStop(0, `rgba(${rgb}, ${alpha})`);
    gradient.addColorStop(1, `rgba(${rgb}, 0)`);
    return gradient;
  };

interface CashFlowChartProps {
  allTransactions: Transaction[];
}

export const CashFlowChart: React.FC<CashFlowChartProps> = ({
  allTransactions,
}) => {
  const { labels, income, expense } = useMemo(() => {
    const monthly: Record<string, { income: number; expense: number }> = {};

    allTransactions
      .filter((t) => !t.isPayment)
      .forEach((t) => {
        const [year, month] = t.date.split('T')[0].split('-');
        const key = `${year}-${month}`;
        if (!monthly[key]) monthly[key] = { income: 0, expense: 0 };
        if (t.type === 'income') monthly[key].income += t.amount / 100;
        if (t.type === 'expense') monthly[key].expense += t.amount / 100;
      });

    const keys = Object.keys(monthly).sort().slice(-7);

    return {
      labels: keys.map((key) => MONTH_LABELS[Number(key.split('-')[1]) - 1]),
      income: keys.map((key) => monthly[key].income),
      expense: keys.map((key) => monthly[key].expense),
    };
  }, [allTransactions]);

  return (
    <>
      <SectionTitle
        title="Fluxo de caixa"
        subtitle="Últimos 7 meses"
        className="mb-4"
        action={
          <div className="flex gap-2">
            <Chip tone="navy">Entradas</Chip>
            <Chip tone="gold">Saídas</Chip>
          </div>
        }
      />

      {labels.length > 0 ? (
        <div style={{ height: 280 }}>
          <Line
            data={{
              labels,
              datasets: [
                {
                  label: 'Entradas',
                  data: income,
                  borderColor: '#1f2a4d',
                  backgroundColor: areaGradient('31, 42, 77', 0.35),
                  borderWidth: 2,
                  fill: true,
                  tension: 0.35,
                  pointRadius: 0,
                  pointHoverRadius: 4,
                },
                {
                  label: 'Saídas',
                  data: expense,
                  borderColor: '#c99a3b',
                  backgroundColor: areaGradient('201, 154, 59', 0.35),
                  borderWidth: 2,
                  fill: true,
                  tension: 0.35,
                  pointRadius: 0,
                  pointHoverRadius: 4,
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
                  titleFont: { family: 'inherit', size: 13 },
                  bodyFont: { family: 'inherit', size: 13 },
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
                    callback: (value) => {
                      const n = Number(value);
                      return n >= 1000 ? `R$ ${(n / 1000).toFixed(0)}k` : `R$ ${n}`;
                    },
                  },
                },
              },
            }}
          />
        </div>
      ) : (
        <div
          className="flex items-center justify-center text-sm text-navy-500"
          style={{ height: 280 }}
        >
          Sem movimentações no período
        </div>
      )}
    </>
  );
};
