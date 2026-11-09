import React, { useMemo } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import {
  BarElement, CategoryScale, Chart, Filler, Legend, LineElement,
  LinearScale, PointElement, Tooltip,
} from 'chart.js';
import type { Transaction } from '../types';
import { categoryTrends } from '../utils/categoryTrends';
import { formatCurrency } from '../utils/transactions';

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, LineElement, PointElement, Filler);

const colors = ['#d7f36b', '#7790d5', '#e58b6a', '#a98fd0'];
const brl = (value: number) => formatCurrency(value * 100);

interface DashboardCategoryTrendsProps {
  transactions: Transaction[];
  year: number;
  month: number;
}

export const DashboardCategoryTrends: React.FC<DashboardCategoryTrendsProps> = ({ transactions, year, month }) => {
  const { months, categories, increases } = useMemo(
    () => categoryTrends(transactions, year, month), [transactions, year, month]
  );
  const comparison = categories.filter((item) => item.current > 0 || item.previous > 0)
    .sort((a, b) => Math.max(b.current, b.previous) - Math.max(a.current, a.previous))
    .slice(0, 8);
  const evolution = categories.filter((item) => item.amounts.some(Boolean)).slice(0, 4);
  const monthName = (key: string) => {
    const [y, m] = key.split('-');
    return new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit' }).format(new Date(Number(y), Number(m) - 1, 1));
  };
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#b4b3b8', usePointStyle: true, boxWidth: 8 } },
      tooltip: {
        backgroundColor: '#171719', borderColor: '#3a3a3f', borderWidth: 1,
      },
    },
  };

  return (
    <section aria-labelledby="category-trends-heading" className="space-y-4">
      <div>
        <h2 id="category-trends-heading" className="font-display text-xl text-navy-900">Para onde foram os gastos?</h2>
        <p className="mt-1 text-sm text-navy-500">Compare categorias entre meses. Compras no cartão entram na data da despesa, sem repetir o pagamento da fatura.</p>
      </div>
      {categories.length === 0 ? (
        <div className="card p-6 text-sm text-navy-700">Ainda não há despesas registradas nos últimos seis meses para comparar.</div>
      ) : (
        <>
          <div className="grid gap-4 xl:grid-cols-2">
            <div className="card min-w-0 p-5 md:p-6">
              <h3 className="font-display text-lg">Mês a mês por categoria</h3>
              <p className="mt-1 text-xs text-navy-500">Até 8 categorias com maior gasto no mês selecionado ou anterior</p>
              {comparison.length ? (
                <div className="mt-5" style={{ height: Math.max(280, comparison.length * 38 + 90) }} role="img" aria-label="Gráfico de barras comparando despesas por categoria entre o mês selecionado e o anterior">
                  <Bar
                    data={{
                      labels: comparison.map((item) => item.name),
                      datasets: [
                        { label: monthName(months[4]), data: comparison.map((item) => item.previous / 100), backgroundColor: '#7790d5', borderRadius: 3 },
                        { label: monthName(months[5]), data: comparison.map((item) => item.current / 100), backgroundColor: '#d7f36b', borderRadius: 3 },
                      ],
                    }}
                    options={{
                      ...chartOptions,
                      indexAxis: 'y',
                      plugins: { ...chartOptions.plugins, tooltip: {
                        ...chartOptions.plugins.tooltip,
                        callbacks: { label: (context) => ` ${context.dataset.label}: ${brl(context.parsed.x ?? 0)}` },
                      } },
                      scales: {
                        x: { beginAtZero: true, grid: { color: '#242427' }, ticks: { color: '#b4b3b8', callback: (value) => brl(Number(value)) } },
                        y: { grid: { display: false }, ticks: { color: '#b4b3b8', callback: (_, index) => comparison[index]?.name.slice(0, 16) ?? '' } },
                      },
                    }}
                  />
                </div>
              ) : <p className="mt-6 text-sm text-navy-500">Sem gastos nos dois meses comparados.</p>}
            </div>
            <div className="card min-w-0 p-5 md:p-6">
              <h3 className="font-display text-lg">Evolução em seis meses</h3>
              <p className="mt-1 text-xs text-navy-500">Quatro categorias com maiores gastos no mês selecionado</p>
              <div className="mt-5 h-[320px]" role="img" aria-label="Gráfico de linhas com gastos mensais das quatro principais categorias nos últimos seis meses">
                <Line
                  data={{
                    labels: months.map(monthName),
                    datasets: evolution.map((item, index) => ({
                      label: item.name, data: item.amounts.map((amount) => amount / 100),
                      borderColor: colors[index], backgroundColor: colors[index],
                      pointBackgroundColor: colors[index], borderWidth: 2, pointRadius: 3,
                      tension: 0.2, fill: false,
                    })),
                  }}
                  options={{
                    ...chartOptions,
                    interaction: { mode: 'index', intersect: false },
                    plugins: { ...chartOptions.plugins, tooltip: {
                      ...chartOptions.plugins.tooltip,
                      callbacks: { label: (context) => ` ${context.dataset.label}: ${brl(context.parsed.y ?? 0)}` },
                    } },
                    scales: {
                      x: { grid: { display: false }, ticks: { color: '#b4b3b8' } },
                      y: { beginAtZero: true, grid: { color: '#242427' }, ticks: { color: '#b4b3b8', callback: (value) => brl(Number(value)) } },
                    },
                  }}
                />
              </div>
            </div>
          </div>
          <div className="card p-5 md:p-6">
            <h3 className="font-display text-lg">Onde os gastos mais cresceram</h3>
            <p className="mt-1 text-xs text-navy-500">Comparação com o mês anterior · aumento de pelo menos R$ 100 e 30%, ou gasto novo de R$ 100</p>
            {increases.length ? (
              <ul className="mt-4 divide-y divide-bone-divider">
                {increases.slice(0, 5).map((item) => (
                  <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                    <span className="font-medium text-navy-900">{item.name}</span>
                    <span className="num text-navy-700">{formatCurrency(item.previous)} → {formatCurrency(item.current)} <strong className="text-rose-700">+{formatCurrency(item.difference)}{item.percentage == null ? ' · gasto novo' : ` · +${item.percentage}%`}</strong></span>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-4 text-sm text-navy-700">Nenhuma categoria teve aumento expressivo em relação ao mês anterior.</p>}
            {year === new Date().getFullYear() && month === new Date().getMonth() + 1 && (
              <p className="mt-3 text-xs text-navy-500">O mês atual ainda está em andamento; a comparação com o mês anterior completo pode mudar.</p>
            )}
          </div>
          <div className="sr-only">
            <table>
              <caption>Despesas mensais por categoria, em reais</caption>
              <thead><tr><th>Categoria</th>{months.map((key) => <th key={key}>{monthName(key)}</th>)}</tr></thead>
              <tbody>{categories.map((item) => <tr key={item.id}><th>{item.name}</th>{item.amounts.map((amount, index) => <td key={months[index]}>{formatCurrency(amount)}</td>)}</tr>)}</tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
};
