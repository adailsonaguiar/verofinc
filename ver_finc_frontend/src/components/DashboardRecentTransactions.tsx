import React from 'react';
import { ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { Transaction } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

interface DashboardRecentTransactionsProps {
  transactions: Transaction[];
}

export const DashboardRecentTransactions: React.FC<DashboardRecentTransactionsProps> = ({
  transactions,
}) => (
  <>
    <div className="mb-6">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white">Mais Recentes</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
        Últimas movimentações.
      </p>
    </div>

    {transactions.length > 0 ? (
      <div className="flex-1 flex flex-col gap-5 overflow-y-auto pr-1">
        {transactions.map((tx) => (
          <div key={tx._id} className="flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                  tx.type === 'income'
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
                }`}
              >
                {tx.type === 'income' ? (
                  <ArrowUpRight className="w-5 h-5" />
                ) : (
                  <ArrowDownRight className="w-5 h-5" />
                )}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate max-w-[120px] sm:max-w-[180px]">
                  {tx.description}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  {tx.category?.name || 'Sem categoria'} •{' '}
                  {format(
                    new Date(tx.date.split('T')[0] + 'T12:00:00'),
                    'dd MMM',
                    { locale: ptBR }
                  )}
                </p>
              </div>
            </div>
            <div
              className={`text-sm font-bold whitespace-nowrap ${
                tx.type === 'income'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-900 dark:text-white'
              }`}
            >
              {tx.type === 'income' ? '+' : '-'}
              {fmt.format(tx.amount / 100)}
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700/50 rounded-full flex items-center justify-center mb-4">
          <Activity className="w-8 h-8 text-slate-400" />
        </div>
        <p className="text-slate-600 dark:text-slate-300 font-medium">Nenhuma transação</p>
        <p className="text-sm text-slate-400 mt-1">Sua lista está vazia.</p>
      </div>
    )}
  </>
);
