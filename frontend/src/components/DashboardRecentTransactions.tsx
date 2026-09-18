import React from 'react';
import { ArrowDown, ArrowUp, Activity } from 'lucide-react';
import { Transaction } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SectionTitle } from './SectionTitle';
import { EmptyState } from './EmptyState';

const brl = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface DashboardRecentTransactionsProps {
  transactions: Transaction[];
}

export const DashboardRecentTransactions: React.FC<
  DashboardRecentTransactionsProps
> = ({ transactions }) => (
  <>
    <SectionTitle
      title="Mais recentes"
      subtitle="Últimas movimentações"
      className="mb-3"
    />

    {transactions.length > 0 ? (
      <div className="divide-classic -mx-1">
        {transactions.map((tx) => {
          const isIncome = tx.type === 'income';
          return (
            <div key={tx._id} className="flex items-center gap-3 px-1 py-3">
              <span
                className={`w-8 h-8 rounded-lg grid place-items-center shrink-0 ${
                  isIncome
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-rose-100 text-rose-700'
                }`}
              >
                {isIncome ? (
                  <ArrowDown className="w-4 h-4" />
                ) : (
                  <ArrowUp className="w-4 h-4" />
                )}
              </span>

              <div className="flex-1 min-w-0">
                <div className="text-sm text-navy-900 truncate">
                  {tx.description}
                </div>
                <div className="text-xs text-navy-500 mt-0.5 truncate">
                  {tx.category?.name || 'Sem categoria'} ·{' '}
                  {format(new Date(`${tx.date.split('T')[0]}T12:00:00`), 'dd/MM/yyyy', {
                    locale: ptBR,
                  })}
                </div>
              </div>

              <div
                className={`num text-sm shrink-0 ${
                  isIncome ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {isIncome ? '+' : '-'}
                {brl(tx.amount / 100)}
              </div>
            </div>
          );
        })}
      </div>
    ) : (
      <EmptyState
        icon={<Activity className="w-5 h-5" />}
        title="Nenhuma transação"
        description="Sua lista está vazia."
      />
    )}
  </>
);
