import React from 'react';
import { MonthlyTransactions } from '../utils/transactions';
import { TransactionCard } from './TransactionCard';
import { formatCurrency } from '../utils/transactions';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { Transaction } from '../types';

interface MonthlyGroupProps {
  monthData: MonthlyTransactions;
  onEditTransaction?: (transaction: Transaction) => void;
  onDeleteTransaction?: (transaction: Transaction) => void;
}

export const MonthlyGroup: React.FC<MonthlyGroupProps> = ({ monthData, onEditTransaction, onDeleteTransaction }) => {
  const [isExpanded, setIsExpanded] = React.useState(true);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
      {/* Month Header */}
      <div
        className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {monthData.monthLabel}
            </h2>
            <p className="text-primary-100 text-sm">
              {monthData.transactions.length} transaction(s)
            </p>
          </div>
          
          <button className="p-2 hover:bg-primary-800 rounded-lg transition-colors">
            {isExpanded ? (
              <ChevronUp className="w-6 h-6 text-white" />
            ) : (
              <ChevronDown className="w-6 h-6 text-white" />
            )}
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-300" />
              <span className="text-primary-100 text-sm font-medium">Income</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {formatCurrency(monthData.totalIncome)}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-5 h-5 text-red-300" />
              <span className="text-primary-100 text-sm font-medium">Expenses</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {formatCurrency(monthData.totalExpense)}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-5 h-5 text-blue-300" />
              <span className="text-primary-100 text-sm font-medium">Balance</span>
            </div>
            <p
              className={`text-2xl font-bold ${
                monthData.balance >= 0 ? 'text-green-300' : 'text-red-300'
              }`}
            >
              {formatCurrency(monthData.balance)}
            </p>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      {isExpanded && (
        <div className="p-6 space-y-3 bg-gray-50">
          {monthData.transactions.length > 0 ? (
            monthData.transactions.map(transaction => (
              <TransactionCard 
                key={transaction._id} 
                transaction={transaction}
                onEdit={onEditTransaction}
                onDelete={onDeleteTransaction}
              />
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No transactions for this month</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
