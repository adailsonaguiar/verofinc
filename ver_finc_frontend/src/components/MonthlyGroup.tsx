import React from 'react';
import { MonthlyTransactions } from '../utils/transactions';
import { TransactionCard } from './TransactionCard';
import { formatCurrency } from '../utils/transactions';
import {
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Wallet,
} from 'lucide-react';
import { Transaction } from '../types';

interface MonthlyGroupProps {
  monthData: MonthlyTransactions;
  onEditTransaction?: (transaction: Transaction) => void;
  onDeleteTransaction?: (transaction: Transaction) => void;
}

export const MonthlyGroup: React.FC<MonthlyGroupProps> = ({
  monthData,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(true);

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-all duration-200">
      {/* Month Header */}
      <div
        className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-6 cursor-pointer hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {monthData.monthLabel}
            </h2>
            <p className="text-indigo-100 text-sm font-medium">
              {monthData.transactions.length} transação(ões)
            </p>
          </div>

          <button className="p-2.5 hover:bg-white/10 rounded-xl transition-colors">
            {isExpanded ? (
              <ChevronUp className="w-6 h-6 text-white" strokeWidth={2} />
            ) : (
              <ChevronDown className="w-6 h-6 text-white" strokeWidth={2} />
            )}
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2.5 mb-2">
              <TrendingUp
                className="w-5 h-5 text-emerald-200"
                strokeWidth={2}
              />
              <span className="text-white/90 text-sm font-semibold">
                Receitas
              </span>
            </div>
            <p className="text-2xl font-bold text-white tracking-tight">
              {formatCurrency(monthData.totalIncome)}
            </p>
          </div>

          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2.5 mb-2">
              <TrendingDown className="w-5 h-5 text-rose-200" strokeWidth={2} />
              <span className="text-white/90 text-sm font-semibold">
                Despesas
              </span>
            </div>
            <p className="text-2xl font-bold text-white tracking-tight">
              {formatCurrency(monthData.totalExpense)}
            </p>
          </div>

          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2.5 mb-2">
              <Wallet className="w-5 h-5 text-blue-200" strokeWidth={2} />
              <span className="text-white/90 text-sm font-semibold">Saldo</span>
            </div>
            <p
              className={`text-2xl font-bold tracking-tight ${
                monthData.balance >= 0 ? 'text-emerald-200' : 'text-rose-200'
              }`}
            >
              {formatCurrency(monthData.balance)}
            </p>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      {isExpanded && (
        <div className="p-6 space-y-3 bg-gradient-to-br from-gray-50 to-white">
          {monthData.transactions.length > 0 ? (
            monthData.transactions.map((transaction) => (
              <TransactionCard
                key={transaction._id}
                transaction={transaction}
                onEdit={onEditTransaction}
                onDelete={onDeleteTransaction}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">
                Nenhuma transação neste mês
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
