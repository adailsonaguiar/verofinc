import React, { useState, useRef, useEffect } from 'react';
import { Transaction } from '../types';
import { formatCurrency, formatDate } from '../utils/transactions';
import { ArrowUpCircle, ArrowDownCircle, Calendar, Tag, MoreVertical, Pencil, Trash2 } from 'lucide-react';

interface TransactionCardProps {
  transaction: Transaction;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transaction: Transaction) => void;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({ transaction, onEdit, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isIncome = transaction.type === 'income';
  const isPaid = transaction.status === 'paid';

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 p-5 hover:border-indigo-200 hover:shadow-lg transition-all duration-200 group ${
        !isPaid ? 'opacity-70 hover:opacity-100' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          <div
            className={`p-3 rounded-xl shadow-sm ${
              isIncome 
                ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600' 
                : 'bg-gradient-to-br from-rose-50 to-rose-100 text-rose-600'
            }`}
          >
            {isIncome ? (
              <ArrowUpCircle className="w-5 h-5" strokeWidth={2} />
            ) : (
              <ArrowDownCircle className="w-5 h-5" strokeWidth={2} />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate mb-2">
              {transaction.description}
            </h3>
            
            <div className="flex flex-wrap gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-gray-500">
                <Calendar className="w-3.5 h-3.5" />
                <span className="font-medium">{formatDate(transaction.date)}</span>
              </div>
              
              {transaction.category && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg">
                  <Tag className="w-3.5 h-3.5" />
                  <span className="font-medium">{transaction.category.name}</span>
                </div>
              )}
              
              {!isPaid && (
                <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-lg font-semibold">
                  Pendente
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="text-right flex flex-col items-end gap-2">
          <p
            className={`text-lg font-bold tracking-tight ${
              isIncome ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {isIncome ? '+' : '-'} {formatCurrency(transaction.amount)}
          </p>
          {(onEdit || onDelete) && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
                title="Opções"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 z-10 animate-in fade-in slide-in-from-top-2 duration-200">
                  {onEdit && (
                    <button
                      onClick={() => {
                        onEdit(transaction);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2.5 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                      <span className="font-medium">Editar</span>
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => {
                        onDelete(transaction);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="font-medium">Excluir</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
