import React, { useMemo } from 'react';
import { getDaysInMonth } from 'date-fns';
import { Transaction } from '../types';
import { SectionTitle } from './SectionTitle';
import { Chip } from './Chip';

const brl = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface DashboardInsightsProps {
  /** Transactions of the selected month. */
  transactions: Transaction[];
  /** Last months of transactions, used for the month-over-month comparison. */
  allTransactions: Transaction[];
  year: number;
  month: number;
}

export const DashboardInsights: React.FC<DashboardInsightsProps> = ({
  transactions,
  allTransactions,
  year,
  month,
}) => {
  const insights = useMemo(() => {
    const inMonth = transactions.filter((t) => !t.isPayment);

    const income = inMonth
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = inMonth
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const previous = new Date(year, month - 2, 1);
    const previousKey = `${previous.getFullYear()}-${String(
      previous.getMonth() + 1
    ).padStart(2, '0')}`;
    const previousIncome = allTransactions
      .filter(
        (t) =>
          !t.isPayment &&
          t.type === 'income' &&
          t.date.split('T')[0].startsWith(previousKey)
      )
      .reduce((sum, t) => sum + t.amount, 0);

    const incomeDelta =
      previousIncome > 0 ? ((income - previousIncome) / previousIncome) * 100 : null;

    const byCategory: Record<string, number> = {};
    inMonth
      .filter((t) => t.type === 'expense' && t.category?._id)
      .forEach((t) => {
        byCategory[t.category._id] = (byCategory[t.category._id] ?? 0) + t.amount;
      });

    const topEntry = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];
    const topCategory = topEntry
      ? inMonth.find((t) => t.category?._id === topEntry[0])?.category?.name ?? null
      : null;
    const topShare = topEntry && expense > 0 ? (topEntry[1] / expense) * 100 : null;

    const pending = transactions.filter(
      (t) => t.type === 'expense' && t.status === 'unpaid'
    ).length;

    const days = getDaysInMonth(new Date(year, month - 1));
    const averagePerDay = days > 0 ? expense / days / 100 : 0;

    return {
      incomeDelta,
      topCategory,
      topShare,
      pending,
      averagePerDay,
      hasData: inMonth.length > 0,
    };
  }, [transactions, allTransactions, year, month]);

  if (!insights.hasData) {
    return (
      <>
        <SectionTitle title="Insights" subtitle="Leitura rápida do período" className="mb-3" />
        <p className="text-sm text-navy-500">
          Sem movimentações para gerar insights neste mês.
        </p>
      </>
    );
  }

  return (
    <>
      <SectionTitle
        title="Insights"
        subtitle="Leitura rápida do período"
        className="mb-3"
      />

      <ul className="space-y-3 text-sm text-navy-700">
        {insights.incomeDelta !== null && (
          <li className="flex items-start gap-3">
            <Chip tone={insights.incomeDelta >= 0 ? 'emerald' : 'rose'}>
              {insights.incomeDelta >= 0 ? '+' : ''}
              {insights.incomeDelta.toFixed(0)}%
            </Chip>
            <span>
              Suas receitas {insights.incomeDelta >= 0 ? 'cresceram' : 'recuaram'}{' '}
              frente ao mês anterior.
            </span>
          </li>
        )}

        {insights.topShare !== null && insights.topCategory && (
          <li className="flex items-start gap-3">
            <Chip tone={insights.topShare >= 30 ? 'rose' : 'gold'}>
              {insights.topShare >= 30 ? 'Atenção' : 'Concentração'}
            </Chip>
            <span>
              <strong className="font-medium">{insights.topCategory}</strong> representa{' '}
              {insights.topShare.toFixed(0)}% dos gastos do mês.
            </span>
          </li>
        )}

        <li className="flex items-start gap-3">
          <Chip tone={insights.pending > 0 ? 'amber' : 'emerald'}>
            {insights.pending > 0 ? `${insights.pending} pendente(s)` : 'Em dia'}
          </Chip>
          <span>
            {insights.pending > 0
              ? 'Existem despesas ainda não pagas neste mês.'
              : 'Todas as despesas do mês estão quitadas.'}
          </span>
        </li>

        <li className="flex items-start gap-3">
          <Chip tone="navy">Média</Chip>
          <span>
            Gasto médio de{' '}
            <span className="num text-navy-900">{brl(insights.averagePerDay)}</span> por
            dia no mês.
          </span>
        </li>
      </ul>
    </>
  );
};
