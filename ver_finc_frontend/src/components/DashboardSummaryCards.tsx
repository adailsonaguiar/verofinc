import React from 'react';
import { DollarSign, ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react';

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

interface DashboardSummaryCardsProps {
  balance: number;
  totalIncome: number;
  totalExpense: number;
  totalCheckingBalance: number;
  checkingAccountsCount: number;
  currentMonthLabel: string;
}

export const DashboardSummaryCards: React.FC<DashboardSummaryCardsProps> = ({
  balance,
  totalIncome,
  totalExpense,
  totalCheckingBalance,
  checkingAccountsCount,
  currentMonthLabel,
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {/* Balance */}
    <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-indigo-800 dark:from-indigo-600 dark:to-indigo-900 text-white rounded-3xl p-6 shadow-lg shadow-indigo-200/50 dark:shadow-none hover:-translate-y-1 transition-transform duration-300 group">
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity" />
      <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl" />
      <div className="relative z-10 flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-indigo-100 uppercase tracking-wider">
          Saldo do Mês
        </span>
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
          <DollarSign className="w-4 h-4 text-white" />
        </div>
      </div>
      <p className="relative z-10 text-3xl font-extrabold tracking-tight">
        {fmt.format(balance / 100)}
      </p>
      <p className="relative z-10 text-sm text-indigo-200 mt-2 font-medium capitalize">
        Referente a {currentMonthLabel}
      </p>
    </div>

    {/* Income */}
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700/60 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Receitas
        </span>
        <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
          <ArrowUpRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-800 dark:text-white">
        {fmt.format(totalIncome / 100)}
      </p>
    </div>

    {/* Expense */}
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700/60 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Despesas
        </span>
        <div className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center">
          <ArrowDownRight className="w-4 h-4 text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform" />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-800 dark:text-white">
        {fmt.format(totalExpense / 100)}
      </p>
    </div>

    {/* Accounts */}
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700/60 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Contas
        </span>
        <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
          <Wallet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-800 dark:text-white">
        {fmt.format(totalCheckingBalance / 100)}
      </p>
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-medium">
        Total em {checkingAccountsCount} conta(s)
      </p>
    </div>
  </div>
);
